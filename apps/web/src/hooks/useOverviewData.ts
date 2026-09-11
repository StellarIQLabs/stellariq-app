'use client';

import { useEffect, useState } from 'react';
import type { Market, Pool } from '@stellariq/types';
import { ApiError, fetchTopMarkets, fetchTopPools } from '@/lib/api';

export interface OverviewData {
  markets: Market[];
  pools: Pool[];
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

    Promise.all([fetchTopMarkets(5, signal), fetchTopPools(5, signal)])
      .then(([markets, pools]) => {
        if (!signal.aborted) {
          setState({ data: { markets, pools }, loading: false, error: null });
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
