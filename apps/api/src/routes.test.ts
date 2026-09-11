import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { MockDataSource } from './data/mock.js';
import type { ApiEnv } from './env.js';

const BASE_ENV: ApiEnv = {
  host: '127.0.0.1',
  port: 4000,
  logLevel: 'silent',
  dataApiUrl: null,
  apiKeySalt: 'test-salt',
  adminToken: null,
  seedDevKeys: false,
  redisUrl: null,
};

async function makeApp(env: ApiEnv = BASE_ENV): Promise<FastifyInstance> {
  return buildApp({ env, source: new MockDataSource() });
}

describe('api routes', () => {
  it('serves health and readiness probes', async () => {
    const app = await makeApp();
    const health = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(health.statusCode, 200);
    const ready = await app.inject({ method: 'GET', url: '/ready' });
    assert.equal(ready.statusCode, 200);
    await app.close();
  });

  it('lists and fetches assets with validation envelopes', async () => {
    const app = await makeApp();
    const list = await app.inject({ method: 'GET', url: '/v1/assets?limit=2' });
    assert.equal(list.statusCode, 200);
    const page = list.json() as { data: unknown[]; total: number };
    assert.equal(page.data.length, 2);
    assert.ok(page.total >= 2);

    const bad = await app.inject({ method: 'GET', url: '/v1/assets?limit=999' });
    assert.equal(bad.statusCode, 400);
    assert.equal((bad.json() as { error: string }).error, 'Bad Request');

    const one = await app.inject({ method: 'GET', url: '/v1/assets/XLM' });
    assert.equal(one.statusCode, 200);

    const missing = await app.inject({ method: 'GET', url: '/v1/assets/NOPE' });
    assert.equal(missing.statusCode, 404);
    await app.close();
  });

  it('serves prices, markets, pools, swaps, quote, routes and analytics', async () => {
    const app = await makeApp();
    const urls = [
      '/v1/prices/XLM',
      '/v1/prices/XLM/history?timeframe=1H',
      '/v1/markets',
      '/v1/markets/XLM%2FUSDC',
      '/v1/pools',
      '/v1/pools/xlm-usdc-soroswap',
      '/v1/swaps?limit=2',
      '/v1/swaps/recent?limit=2',
      '/v1/quote?from=XLM&to=USDC&amount=100',
      '/v1/routes?from=XLM&to=USDC&amount=100',
      '/v1/analytics/volume',
      '/v1/analytics/liquidity?asset=XLM',
      '/openapi.json',
      '/docs',
    ];
    for (const url of urls) {
      const res = await app.inject({ method: 'GET', url });
      assert.equal(res.statusCode, 200, url);
    }
    await app.close();
  });

  it('rejects invalid api keys and guards issuance', async () => {
    const app = await makeApp();
    const bogus = await app.inject({
      method: 'GET',
      url: '/v1/assets',
      headers: { 'x-api-key': 'siq_bogus' },
    });
    assert.equal(bogus.statusCode, 401);

    const issue = await app.inject({
      method: 'POST',
      url: '/v1/keys',
      payload: { name: 'bot', tier: 'pro' },
    });
    assert.equal(issue.statusCode, 403);
    await app.close();

    const admin = await makeApp({ ...BASE_ENV, adminToken: 'secret' });
    const issued = await admin.inject({
      method: 'POST',
      url: '/v1/keys',
      headers: { 'x-admin-token': 'secret' },
      payload: { name: 'bot', tier: 'pro' },
    });
    assert.equal(issued.statusCode, 201);
    const key = (issued.json() as { key: string }).key;
    const authed = await admin.inject({
      method: 'GET',
      url: '/v1/assets',
      headers: { 'x-api-key': key },
    });
    assert.equal(authed.statusCode, 200);
    assert.equal(authed.headers['x-ratelimit-limit'], '6000');
    await admin.close();
  });

  it('rate-limits anonymous callers with 429 and Retry-After', async () => {
    const app = await makeApp();
    let last = 0;
    let retryAfter: string | undefined;
    for (let i = 0; i < 62; i++) {
      const res = await app.inject({ method: 'GET', url: '/v1/assets' });
      last = res.statusCode;
      if (res.statusCode === 429) {
        retryAfter = res.headers['retry-after'] as string | undefined;
        const body = res.json() as { error: string };
        assert.equal(body.error, 'Too Many Requests');
      }
    }
    assert.equal(last, 429);
    assert.ok(retryAfter);
    await app.close();
  });
});
