import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StellarIQClient, StellarIQError, backoffWithJitter } from './client.js';

function jsonResponse(payload: unknown, status = 200, retryAfter?: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(retryAfter ? { 'retry-after': retryAfter } : {}),
    json: async () => payload,
  } as Response;
}

describe('StellarIQClient', () => {
  it('builds urls, sends the api key and parses pages', async () => {
    const seen: string[] = [];
    const headers: Record<string, string>[] = [];
    const client = new StellarIQClient({
      baseUrl: 'http://api.test/',
      apiKey: 'siq_test',
      maxRetries: 0,
      fetchImpl: (async (url: string, init?: { headers?: Record<string, string> }) => {
        seen.push(url);
        headers.push(init?.headers ?? {});
        return jsonResponse({ data: [{ id: 'XLM/USDC' }], page: 1, limit: 2, total: 6 });
      }) as typeof fetch,
    });
    const page = await client.listMarkets({ limit: 2 });
    assert.equal(page.total, 6);
    assert.ok(seen[0]?.includes('/v1/markets?'));
    assert.ok(seen[0]?.includes('limit=2'));
    assert.equal(headers[0]?.['x-api-key'], 'siq_test');
  });

  it('retries 429s honoring Retry-After then succeeds', async () => {
    let calls = 0;
    const client = new StellarIQClient({
      baseUrl: 'http://api.test',
      maxRetries: 2,
      fetchImpl: (async () => {
        calls += 1;
        return calls === 1
          ? jsonResponse({ error: 'Too Many Requests', message: 'slow', statusCode: 429 }, 429, '0')
          : jsonResponse({ status: 'ok', version: '0.1.0', uptime: 1 });
      }) as typeof fetch,
    });
    const health = await client.health();
    assert.equal(health.status, 'ok');
    assert.equal(calls, 2);
  });

  it('throws typed errors with envelope details', async () => {
    const client = new StellarIQClient({
      baseUrl: 'http://api.test',
      maxRetries: 0,
      fetchImpl: (async () =>
        jsonResponse(
          { error: 'Not Found', message: 'Unknown asset "NOPE".', statusCode: 404 },
          404,
        )) as typeof fetch,
    });
    await assert.rejects(client.getAsset('NOPE'), (err: unknown) => {
      assert.ok(err instanceof StellarIQError);
      assert.equal(err.status, 404);
      assert.equal(err.code, 'Not Found');
      assert.equal(err.retryable, false);
      return true;
    });
  });

  it('wraps network failures as non-retryable status-0 errors', async () => {
    const client = new StellarIQClient({
      baseUrl: 'http://api.test',
      maxRetries: 0,
      fetchImpl: (async () => {
        throw new Error('socket hang up');
      }) as typeof fetch,
    });
    await assert.rejects(client.ready(), (err: unknown) => {
      assert.ok(err instanceof StellarIQError);
      assert.equal(err.status, 0);
      return true;
    });
  });

  it('calculates exponential backoff within jitter bounds', () => {
    const delay = backoffWithJitter(2, 100, 1000);
    assert.ok(delay >= 0 && delay <= 400);
  });
});
