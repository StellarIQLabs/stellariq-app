'use client';

import { useState } from 'react';
import { Card, Spinner } from '@stellariq/ui';
import { clsx } from 'clsx';
import { SwapForm, type SwapRequest } from './SwapForm';
import { useQuote } from '@/hooks/useQuote';

/**
 * Swap terminal (PRD §13–15): input form wired to `GET /v1/quote` with
 * debounced requests, loading, error and stale-quote handling. Best
 * execution, route comparison and wallet signing compose into the result
 * panel in later swap tasks.
 */
export function SwapTerminal() {
  const [request, setRequest] = useState<SwapRequest | null>(null);
  const { quote, loading, refreshing, error } = useQuote(request);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <SwapForm onSubmit={setRequest} pending={loading || refreshing} />
      <Card title="Best execution">
        {request === null ? (
          <p className="py-4 text-center text-sm text-muted">
            Enter an amount and request a quote to compare execution routes.
          </p>
        ) : loading ? (
          <Spinner label="Fetching best quote…" />
        ) : error !== null ? (
          <p className="py-4 text-center text-sm text-negative">{error}</p>
        ) : quote !== null ? (
          <div className={clsx(refreshing && 'opacity-60 transition-opacity')}>
            <p className="text-center font-mono text-2xl font-semibold">
              {quote.outputAmount.toLocaleString()} {quote.to}
            </p>
            <p className="mt-2 text-center font-mono text-xs text-muted">
              {quote.inputAmount.toLocaleString()} {quote.from} · impact{' '}
              {(quote.priceImpact * 100).toFixed(2)}%{refreshing && ' · refreshing…'}
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
