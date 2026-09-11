import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../../apps/api/dist/app.js';
import { MockDataSource } from '../../../apps/api/dist/data/mock.js';
import { StellarIQSocket, type WsEvent } from './socket.js';

const PORT = 14010;

async function startServer() {
  const app = await buildApp({
    env: {
      host: '127.0.0.1',
      port: PORT,
      logLevel: 'silent',
      dataApiUrl: null,
      apiKeySalt: 's',
      adminToken: null,
      seedDevKeys: false,
      redisUrl: null,
    },
    source: new MockDataSource(),
  });
  await app.listen({ host: '127.0.0.1', port: PORT });
  return app;
}

async function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('timed out waiting for socket events');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

describe('StellarIQSocket', () => {
  it('streams price events and unsubscribes', async () => {
    const app = await startServer();
    const socket = new StellarIQSocket({ wsUrl: `ws://127.0.0.1:${PORT}/ws` });
    const events: WsEvent[] = [];
    const unsubscribe = await socket.subscribe('XLM/USDC:price', (event) => {
      events.push(event);
    });
    await waitFor(() => events.length > 0);
    assert.equal(events[0]?.type, 'price_update');
    assert.equal(socket.subscriptionCount, 1);
    unsubscribe();
    assert.equal(socket.subscriptionCount, 0);
    socket.stop();
    await app.close();
  });

  it('reconnects and replays subscriptions after a restart', async () => {
    let app = await startServer();
    const socket = new StellarIQSocket({
      wsUrl: `ws://127.0.0.1:${PORT}/ws`,
      reconnectBaseMs: 100,
    });
    const prices: number[] = [];
    await socket.subscribe('XLM/USDC:price', (event) => {
      if (event.type === 'price_update') {
        prices.push(event.price);
      }
    });
    await waitFor(() => prices.length > 0);
    const before = prices.length;

    await app.close();
    await new Promise((resolve) => setTimeout(resolve, 300));
    app = await startServer();
    await waitFor(() => prices.length > before, 15000);

    socket.stop();
    await app.close();
  });
});
