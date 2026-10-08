import { describe, expect, it } from 'vitest';
import { daysLeft, formatAmount, toStroops, tokenSymbol } from './donations';

describe('donation helpers', () => {
  it('converts decimal amounts to stroops', () => {
    expect(toStroops('10')).toBe(100_000_000n);
    expect(toStroops('2.5')).toBe(25_000_000n);
    expect(toStroops('0.0000001')).toBe(1n);
  });

  it('rejects malformed amounts', () => {
    expect(() => toStroops('-1')).toThrow();
    expect(() => toStroops('1.12345678')).toThrow();
    expect(() => toStroops('abc')).toThrow();
  });

  it('formats amounts and token symbols', () => {
    expect(formatAmount('1500.5')).toBe('1,500.5 XLM');
    expect(tokenSymbol('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC')).toBe('XLM');
  });

  it('counts whole days left and never goes negative', () => {
    const now = Date.UTC(2026, 0, 1);
    expect(daysLeft(new Date(now + 36 * 3_600_000).toISOString(), now)).toBe(2);
    expect(daysLeft(new Date(now - 1000).toISOString(), now)).toBe(0);
  });
});
