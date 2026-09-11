'use client';

import { useEffect, useState } from 'react';
import type { Market, Pool, Swap } from '@stellariq/types';
import { ApiError, fetchRecentSwaps, fetchTopMarkets, fetchTopPools } from '@/lib/api';

export interface OverviewData {
  markets: Market[];
  pools: Pool[];
  swaps: Swap[];
}

export interface OverviewState {
  data: OverviewData | null;
  loading: boolean;
  error: string | null;
}

/** Loads every overview section in parallel with abort-safe cleanup. */
export function useOverviewData(): OverviewState {
  const [state, setState] = useState<OverviewState>({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState({ data: null, loading: true, error: null });

    Promise.all([
      fetchTopMarkets(5, signal),
      fetchTopPools(5, signal),
      fetchRecentSwaps(10, signal),
    ])
      .then(([markets, pools, swaps]) => {
        if (!signal.aborted) {
          setState({ data: { markets, pools, swaps }, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (signal.aborted) {
          return;
        }
        const message =
          err instanceof ApiError
            ? `API error ${err.status}: check that the StellarIQ API is reachable.`
            : 'Network error: could not reach the StellarIQ API.';
        setState({ data: null, loading: false, error: message });
      });

    return () => controller.abort();
  }, []);

  return state;
}
