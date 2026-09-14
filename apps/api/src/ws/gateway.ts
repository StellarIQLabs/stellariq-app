import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import type { DataSource } from '../data/source.js';

const CHANNEL_PATTERN = /^[^:/]+\/[^:/]+:(price|trades|liquidity)$/;
const PRICE_TICK_MS = 5000;
const HEARTBEAT_MS = 30000;

interface ClientMessage {
  action?: unknown;
  channel?: unknown;
}

function splitChannel(channel: string): { pair: string; topic: string } | null {
  const match = CHANNEL_PATTERN.exec(channel);
  if (!match) {
    return null;
  }
  const [pair = '', topic = ''] = channel.split(':');
  return { pair, topic };
}

function send(socket: { send: (data: string) => void }, payload: unknown): void {
  socket.send(JSON.stringify(payload));
}

/**
 * WebSocket gateway (PRD §18): `socket.subscribe("XLM/USDC:price")` style
 * subscriptions over JSON `{ action, channel }` messages. Price, trades and
 * liquidity topics stream on a shared ticker; protocol ping plus an
 * application-level ping/pong keep load-balanced connections alive, and every
 * close clears its timers so clients can reconnect cleanly.
 */
export async function registerWsGateway(app: FastifyInstance, source: DataSource): Promise<void> {
  await app.register(fastifyWebsocket);

  app.get('/ws', { websocket: true }, (socket) => {
    const subscriptions = new Set<string>();

    const pushUpdate = async (channel: string): Promise<void> => {
      const split = splitChannel(channel);
      if (!split) {
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      if (split.topic === 'price') {
        const market = await source.getMarket(split.pair);
        if (market?.price === undefined) {
          return;
        }
        send(socket, {
          type: 'price_update',
          pair: split.pair,
          price: market.price,
          timestamp: now,
        });
        return;
      }
      if (split.topic === 'trades') {
        const [base = '', quote = ''] = split.pair.split('/');
        const latest = (await source.recentSwaps(10)).find(
          (s) =>
            (s.inputAsset === base && s.outputAsset === quote) ||
            (s.inputAsset === quote && s.outputAsset === base),
        );
        if (!latest) {
          return;
        }
        send(socket, { type: 'trade_update', pair: split.pair, swap: latest, timestamp: now });
        return;
      }
      const market = await source.getMarket(split.pair);
      if (market?.liquidity === undefined) {
        return;
      }
      send(socket, {
        type: 'liquidity_update',
        pair: split.pair,
        liquidity: market.liquidity,
        timestamp: now,
      });
    };

    const ticker = setInterval(() => {
      for (const channel of subscriptions) {
        pushUpdate(channel);
      }
    }, PRICE_TICK_MS);

    const heartbeat = setInterval(() => {
      const raw = socket as unknown as { ping?: () => void };
      raw.ping?.();
    }, HEARTBEAT_MS);

    socket.on('message', (raw: unknown) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(String(raw)) as ClientMessage;
      } catch {
        send(socket, { type: 'error', message: 'Message must be JSON.' });
        return;
      }
      if (message.action === 'ping') {
        send(socket, { type: 'pong', timestamp: Math.floor(Date.now() / 1000) });
        return;
      }
      if (message.action !== 'subscribe' && message.action !== 'unsubscribe') {
        send(socket, { type: 'error', message: 'Unknown action. Use subscribe|unsubscribe|ping.' });
        return;
      }
      if (typeof message.channel !== 'string' || splitChannel(message.channel) === null) {
        send(socket, {
          type: 'error',
          message: 'Channel must look like PAIR:topic, e.g. XLM/USDC:price.',
        });
        return;
      }
      if (message.action === 'subscribe') {
        subscriptions.add(message.channel);
        send(socket, { type: 'subscribed', channel: message.channel });
        pushUpdate(message.channel);
      } else {
        subscriptions.delete(message.channel);
        send(socket, { type: 'unsubscribed', channel: message.channel });
      }
    });

    socket.on('close', () => {
      clearInterval(ticker);
      clearInterval(heartbeat);
    });

    socket.on('error', (err: unknown) => {
      app.log.error(err, 'websocket error');
    });
  });
}
