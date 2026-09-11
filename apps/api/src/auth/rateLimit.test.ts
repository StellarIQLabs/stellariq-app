import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRateStore, RATE_WINDOW_S, TIER_LIMITS } from './rateLimit.js';

describe('rate limiting', () => {
  it('defines ascending budgets per tier', () => {
    assert.ok(TIER_LIMITS.free < TIER_LIMITS.developer);
    assert.ok(TIER_LIMITS.developer < TIER_LIMITS.pro);
    assert.ok(TIER_LIMITS.pro < TIER_LIMITS.enterprise);
    assert.equal(TIER_LIMITS.free, 60);
  });

  it('counts hits per bucket with a 60s ttl', async () => {
    const store = new MemoryRateStore();
    const first = await store.hit('ip:1:1');
    assert.deepEqual(first, { count: 1, ttl: RATE_WINDOW_S });
    const second = await store.hit('ip:1:1');
    assert.equal(second.count, 2);
    assert.ok(second.ttl <= RATE_WINDOW_S && second.ttl > 0);
    const other = await store.hit('ip:2:1');
    assert.equal(other.count, 1);
    await store.close();
  });
});
