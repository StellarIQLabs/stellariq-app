import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useQuote } from './useQuote.js';

const QUOTE = {
  from: 'XLM',
  to: 'USDC',
  inputAmount: 10000,
  outputAmount: 2370.42,
  priceImpact: 0.0018,
  fees: 7.35,
  routeId: 'C',
};

function mockFetchOnce(payload: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(),
      json: async () => payload,
    })),
  );
}

describe('useQuote', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('debounces the request and resolves the quote', async () => {
    mockFetchOnce(QUOTE);
    const { result, rerender } = renderHook(({ request }) => useQuote(request), {
      initialProps: { request: null as { from: string; to: string; amount: number } | null },
    });
    expect(result.current.quote).toBeNull();
    expect(result.current.loading).toBe(false);

    rerender({ request: { from: 'XLM', to: 'USDC', amount: 10000 } });
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.quote).toEqual(QUOTE);
    expect(result.current.loading).toBe(false);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('ignores stale responses from superseded requests', async () => {
    let resolveFirst!: (value: unknown) => void;
    const first = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('amount=1')
        ? { ok: true, status: 200, headers: new Headers(), json: async () => QUOTE }
        : { ok: true, status: 200, headers: new Headers(), json: async () => first },
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result, rerender } = renderHook(({ request }) => useQuote(request), {
      initialProps: { request: { from: 'XLM', to: 'USDC', amount: 2 } },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    rerender({ request: { from: 'XLM', to: 'USDC', amount: 1 } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.quote).toEqual(QUOTE);
    await act(async () => {
      resolveFirst({ ...QUOTE, outputAmount: 1 });
    });
    expect(result.current.quote).toEqual(QUOTE);
  });

  it('surfaces API errors', async () => {
    mockFetchOnce({ error: 'Not Found', message: 'No route', statusCode: 404 }, 404);
    const { result } = renderHook(() => useQuote({ from: 'NOPE', to: 'USDC', amount: 10 }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.error).toMatch(/Quote failed/);
    expect(result.current.loading).toBe(false);
  });
});
