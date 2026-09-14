import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileKeyPersistence } from './fileStore.js';
import { KeyStore } from './keys.js';

describe('FileKeyPersistence', () => {
  it('round-trips records through a JSON file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'keys-'));
    const path = join(dir, 'keys.json');
    const persistence = new FileKeyPersistence(path);

    const store = new KeyStore('salt', persistence);
    const { key } = store.issue('bot-1', 'pro');

    const raw = JSON.parse(readFileSync(path, 'utf-8')) as unknown[];
    assert.equal(raw.length, 1);
    assert.equal((raw[0] as { name: string }).name, 'bot-1');
    assert.equal(store.verify(key)?.tier, 'pro');

    rmSync(dir, { recursive: true });
  });

  it('loads existing records on construction', () => {
    const dir = mkdtempSync(join(tmpdir(), 'keys-'));
    const path = join(dir, 'keys.json');

    const first = new KeyStore('salt', new FileKeyPersistence(path));
    first.issue('persist-me', 'developer');

    const second = new KeyStore('salt', new FileKeyPersistence(path));
    assert.equal(second.list().length, 1);
    assert.equal(second.list()[0]?.name, 'persist-me');

    rmSync(dir, { recursive: true });
  });

  it('persists revocations', () => {
    const dir = mkdtempSync(join(tmpdir(), 'keys-'));
    const path = join(dir, 'keys.json');

    const first = new KeyStore('salt', new FileKeyPersistence(path));
    const { key, record } = first.issue('revoke-me', 'free');
    first.revoke(record.id);

    const second = new KeyStore('salt', new FileKeyPersistence(path));
    assert.equal(second.verify(key), null);
    const listed = second.list();
    assert.equal(listed.length, 1);
    assert.ok(listed[0]?.revokedAt !== null);

    rmSync(dir, { recursive: true });
  });

  it('returns empty array when file does not exist', () => {
    const persistence = new FileKeyPersistence('/tmp/nonexistent-keys-test.json');
    assert.deepEqual(persistence.load(), []);
  });
});
