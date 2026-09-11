import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInPlace, sanitizeString } from './security.js';

describe('input sanitization', () => {
  it('strips control characters, trims and caps length', () => {
    assert.equal(sanitizeString('  abc  '), 'abc');
    assert.equal(sanitizeString(`x${'y'.repeat(2000)}`).length, 1024);
    assert.equal(sanitizeString('XLM/USDC'), 'XLM/USDC');
  });

  it('sanitizes nested query objects in place', () => {
    const query: Record<string, unknown> = {
      search: '  xlm\n',
      page: '1',
      nested: { q: 'a\0b' },
      list: ['x\r', 42],
    };
    sanitizeInPlace(query);
    assert.deepEqual(query, { search: 'xlm', page: '1', nested: { q: 'ab' }, list: ['x', 42] });
  });

  it('drops prototype pollution keys', () => {
    const body: Record<string, unknown> = JSON.parse(
      '{"__proto__":{"polluted":true},"name":"x"}',
    ) as Record<string, unknown>;
    sanitizeInPlace(body);
    assert.equal(({} as Record<string, unknown>)['polluted'], undefined);
    assert.equal(body['name'], 'x');
  });
});
