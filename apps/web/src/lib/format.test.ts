import { describe, expect, it } from 'vitest';
import { formatChange, formatCount, formatPrice, formatTime, formatUsd } from './format.js';

describe('format', () => {
  it('formats compact USD values', () => {
    expect(formatUsd(12_800_000)).toMatch(/\$12\.80M/);
    expect(formatUsd(undefined)).toBe('—');
  });

  it('formats prices with adaptive precision', () => {
    expect(formatPrice(0.2374)).toContain('0.2374');
    expect(formatPrice(undefined)).toBe('—');
  });

  it('formats signed percentage changes', () => {
    expect(formatChange(2.14)).toBe('+2.14%');
    expect(formatChange(-1.2)).toBe('-1.20%');
    expect(formatChange(undefined)).toBe('—');
  });

  it('formats compact counts', () => {
    expect(formatCount(84291)).toMatch(/84\.29K/);
    expect(formatCount(undefined)).toBe('—');
  });

  it('formats unix timestamps as local time', () => {
    expect(formatTime(1789060000)).toMatch(/Sep 10/);
  });
});
