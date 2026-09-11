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
 * subscriptions over JSON `{ action, channel }` messages, pushing
 * `{ type: "price_update", pair, price, timestamp }` events with heartbeat.
 * Trades and liquidity topics stream in the subscriptions task.
 */
export async function registerWsGateway(app: FastifyInstance, source: DataSource): Promise<void> {
  await app.register(fastifyWebsocket);

  app.get('/ws', { websocket: true }, (socket) => {
    const subscriptions = new Set<string>();

    const pushPrice = (channel: string): void => {
      const split = splitChannel(channel);
      if (!split || split.topic !== 'price') {
        return;
      }
      const market = source.getMarket(split.pair);
      if (market?.price === undefined) {
        return;
      }
      send(socket, {
        type: 'price_update',
        pair: split.pair,
        price: market.price,
        timestamp: Math.floor(Date.now() / 1000),
      });
    };

    const ticker = setInterval(() => {
      for (const channel of subscriptions) {
        pushPrice(channel);
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
      if (message.action !== 'subscribe' && message.action !== 'unsubscribe') {
        send(socket, { type: 'error', message: 'Unknown action. Use subscribe|unsubscribe.' });
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
        pushPrice(message.channel);
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
