import NodeWebSocket from 'ws';
import type { Swap } from '@stellariq/types';

export type WsTopic = 'price' | 'trades' | 'liquidity';
export type WsChannel = `${string}:${WsTopic}`;

export interface PriceUpdate {
  type: 'price_update';
  pair: string;
  price: number;
  timestamp: number;
}

export interface TradeUpdate {
  type: 'trade_update';
  pair: string;
  swap: Swap;
  timestamp: number;
}

export interface LiquidityUpdate {
  type: 'liquidity_update';
  pair: string;
  liquidity: number;
  timestamp: number;
}

export type WsEvent = PriceUpdate | TradeUpdate | LiquidityUpdate;
export type WsHandler = (event: WsEvent) => void;
export type Unsubscribe = () => void;

/** Minimal surface shared by the `ws` package and DOM WebSockets. */
export interface SocketLike {
  send(data: string): void;
  close(): void;
  onopen: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: ((event?: unknown) => void) | null;
  onerror: ((event?: unknown) => void) | null;
}

export type SocketCtor = new (url: string) => SocketLike;

export interface SocketOptions {
  wsUrl: string;
  /** Browser callers pass the native WebSocket; Node defaults to `ws`. */
  socketImpl?: SocketCtor;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  maxReconnectAttempts?: number;
  pingMs?: number;
  onError?: (message: string) => void;
}

const DEFAULT_RECONNECT_BASE_MS = 500;
const DEFAULT_RECONNECT_MAX_MS = 30000;
const DEFAULT_PING_MS = 20000;

/**
 * Typed WebSocket client (PRD §18): `subscribe("XLM/USDC:price", handler)`
 * with channel multiplexing, application ping/pong, and auto-reconnect that
 * replays every active subscription.
 */
export class StellarIQSocket {
  private readonly url: string;
  private readonly ctor: SocketCtor;
  private readonly reconnectBaseMs: number;
  private readonly reconnectMaxMs: number;
  private readonly maxReconnectAttempts: number;
  private readonly pingMs: number;
  private readonly onError: (message: string) => void;

  private readonly handlers = new Map<string, Set<WsHandler>>();
  private socket: SocketLike | null = null;
  private manualClose = false;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: SocketOptions) {
    this.url = options.wsUrl;
    const globalImpl = (globalThis as { WebSocket?: SocketCtor }).WebSocket;
    this.ctor = options.socketImpl ?? globalImpl ?? (NodeWebSocket as unknown as SocketCtor);
    this.reconnectBaseMs = options.reconnectBaseMs ?? DEFAULT_RECONNECT_BASE_MS;
    this.reconnectMaxMs = options.reconnectMaxMs ?? DEFAULT_RECONNECT_MAX_MS;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? Number.POSITIVE_INFINITY;
    this.pingMs = options.pingMs ?? DEFAULT_PING_MS;
    this.onError = options.onError ?? (() => undefined);
  }

  /** Active subscription count (useful for tests and diagnostics). */
  get subscriptionCount(): number {
    return this.handlers.size;
  }

  async subscribe(channel: WsChannel, handler: WsHandler): Promise<Unsubscribe> {
    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set();
      this.handlers.set(channel, set);
    }
    set.add(handler);
    await this.ensureConnected();
    this.send({ action: 'subscribe', channel });
    return () => {
      const current = this.handlers.get(channel);
      current?.delete(handler);
      if (current && current.size === 0) {
        this.handlers.delete(channel);
        this.send({ action: 'unsubscribe', channel });
      }
    };
  }

  /** Closes the connection and stops all reconnect timers. */
  stop(): void {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  private async ensureConnected(): Promise<void> {
    if (this.socket) {
      return;
    }
    this.manualClose = false;
    await this.connect();
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new this.ctor(this.url);
      socket.onopen = () => {
        settled = true;
        this.socket = socket;
        this.attempts = 0;
        for (const channel of this.handlers.keys()) {
          this.send({ action: 'subscribe', channel });
        }
        if (this.pingTimer) {
          clearInterval(this.pingTimer);
        }
        this.pingTimer = setInterval(() => {
          this.send({ action: 'ping' });
        }, this.pingMs);
        resolve();
      };
      socket.onmessage = (event: { data: unknown }) => {
        this.route(String(event.data));
      };
      socket.onerror = () => {
        if (!settled) {
          settled = true;
          reject(new Error(`WebSocket connection failed: ${this.url}`));
        }
      };
      socket.onclose = () => {
        if (this.pingTimer) {
          clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (this.socket === socket) {
          this.socket = null;
        }
        if (!settled) {
          settled = true;
          reject(new Error(`WebSocket connection failed: ${this.url}`));
          return;
        }
        this.scheduleReconnect();
      };
    });
  }

  private scheduleReconnect(): void {
    if (this.manualClose || this.handlers.size === 0) {
      return;
    }
    if (this.attempts >= this.maxReconnectAttempts) {
      this.onError('WebSocket reconnect budget exhausted.');
      return;
    }
    const delay = Math.min(this.reconnectBaseMs * 2 ** this.attempts, this.reconnectMaxMs);
    this.attempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }

  private send(payload: unknown): void {
    try {
      this.socket?.send(JSON.stringify(payload));
    } catch {
      // Reconnect replay covers failed sends.
    }
  }

  private route(raw: string): void {
    let event: { type?: unknown; pair?: unknown };
    try {
      event = JSON.parse(raw) as { type?: unknown; pair?: unknown };
    } catch {
      return;
    }
    if (event.type === 'pong' || event.type === 'subscribed' || event.type === 'unsubscribed') {
      return;
    }
    if (event.type === 'error') {
      this.onError(typeof raw === 'string' ? raw : 'WebSocket error event.');
      return;
    }
    if (typeof event.pair !== 'string') {
      return;
    }
    const topic =
      event.type === 'price_update'
        ? 'price'
        : event.type === 'trade_update'
          ? 'trades'
          : event.type === 'liquidity_update'
            ? 'liquidity'
            : null;
    if (!topic) {
      return;
    }
    const set = this.handlers.get(`${event.pair}:${topic}`);
    if (set) {
      for (const handler of set) {
        handler(event as WsEvent);
      }
    }
  }
}
