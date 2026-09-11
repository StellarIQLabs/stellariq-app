'use client';

import { useEffect, useRef, useState } from 'react';
import type { Quote } from '@stellariq/types';
import { ApiError, fetchQuote, type QuoteRequest } from '@/lib/api';

const DEBOUNCE_MS = 400;

export interface QuoteState {
  quote: Quote | null;
  /** True while the first request for the current input is in flight. */
  loading: boolean;
  /** True while refetching with a previous quote still displayed (stale). */
  refreshing: boolean;
  error: string | null;
}

/**
 * Debounced quote flow for `GET /v1/quote`: waits for input to settle,
 * aborts superseded requests, keeps the last good quote visible while
 * refreshing, and surfaces loading and error states.
 */
export function useQuote(request: QuoteRequest | null): QuoteState {
  const [state, setState] = useState<QuoteState>({
    quote: null,
    loading: false,
    refreshing: false,
    error: null,
  });
  const requestId = useRef(0);

  useEffect(() => {
    if (request === null) {
      requestId.current += 1;
      setState({ quote: null, loading: false, refreshing: false, error: null });
      return;
    }

    const controller = new AbortController();
    const id = (requestId.current += 1);
    const timer = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        loading: prev.quote === null,
        refreshing: prev.quote !== null,
        error: null,
      }));
      fetchQuote(request, controller.signal)
        .then((quote) => {
          if (requestId.current === id && !controller.signal.aborted) {
            setState({ quote, loading: false, refreshing: false, error: null });
          }
        })
        .catch((err: unknown) => {
          if (requestId.current === id && !controller.signal.aborted) {
            setState((prev) => ({
              ...prev,
              loading: false,
              refreshing: false,
              error:
                err instanceof ApiError
                  ? `Quote failed (API ${err.status}): is the StellarIQ API running?`
                  : 'Quote failed (network error).',
            }));
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Deps use request fields (not the object identity) so identical
    // resubmits settle instead of refetching.
  }, [request?.from, request?.to, request?.amount]);

  return state;
}
