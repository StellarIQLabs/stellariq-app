import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KeyStore } from './keys.js';

describe('KeyStore', () => {
  it('issues verifiable per-tier keys', () => {
    const store = new KeyStore('test-salt');
    for (const tier of ['free', 'developer', 'pro', 'enterprise'] as const) {
      const { key, record } = store.issue(`${tier}-bot`, tier);
      assert.ok(key.startsWith('siq_'));
      assert.equal(store.verify(key)?.tier, tier);
      assert.equal(store.verify(key)?.name, `${tier}-bot`);
      assert.equal(record.revokedAt, null);
    }
  });

  it('rejects unknown keys and revoked keys', () => {
    const store = new KeyStore('test-salt');
    assert.equal(store.verify('siq_bogus'), null);
    const { key, record } = store.issue('temp', 'free');
    assert.ok(store.verify(key));
    assert.equal(store.revoke(record.id), true);
    assert.equal(store.verify(key), null);
    assert.equal(store.revoke(record.id), false);
  });

  it('isolates hashes by salt', () => {
    const first = new KeyStore('salt-a');
    const second = new KeyStore('salt-b');
    const { key } = first.issue('bot', 'pro');
    assert.equal(second.verify(key), null);
  });

  it('seeds documented dev keys only when asked', () => {
    const store = new KeyStore('test-salt');
    assert.equal(store.list().length, 0);
    const seeded = store.seedDevKeys();
    assert.equal(seeded.length, 2);
    assert.equal(store.list().length, 2);
  });
});
