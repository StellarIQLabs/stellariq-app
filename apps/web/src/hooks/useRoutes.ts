'use client';

import { useEffect, useRef, useState } from 'react';
import type { RoutesResponse } from '@stellariq/types';
import { ApiError, fetchRoutes, type QuoteRequest } from '@/lib/api';

const DEBOUNCE_MS = 400;

export interface RoutesState {
  routes: RoutesResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Route-comparison flow for `GET /v1/routes`: debounced, abort-safe, with
 * stale-response guards mirroring the quote flow.
 */
export function useRoutes(request: QuoteRequest | null): RoutesState {
  const [state, setState] = useState<RoutesState>({ routes: null, loading: false, error: null });
  const requestId = useRef(0);

  useEffect(() => {
    if (request === null) {
      requestId.current += 1;
      setState({ routes: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const id = (requestId.current += 1);
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      fetchRoutes(request, controller.signal)
        .then((routes) => {
          if (requestId.current === id && !controller.signal.aborted) {
            setState({ routes, loading: false, error: null });
          }
        })
        .catch((err: unknown) => {
          if (requestId.current === id && !controller.signal.aborted) {
            setState((prev) => ({
              ...prev,
              loading: false,
              error:
                err instanceof ApiError
                  ? `Route comparison failed (API ${err.status}).`
                  : 'Route comparison failed (network error).',
            }));
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request?.from, request?.to, request?.amount]);

  return state;
}
