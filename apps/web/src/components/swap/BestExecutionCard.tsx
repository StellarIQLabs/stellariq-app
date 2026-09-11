'use client';

import { Badge, Card, Spinner } from '@stellariq/ui';
import { clsx } from 'clsx';
import type { Quote } from '@stellariq/types';

export interface BestExecutionCardProps {
  quote: Quote | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  idle: boolean;
}

/** Formats the fee field: fractional values are rates, larger ones are absolute. */
function formatFees(fees: number, asset: string): string {
  if (fees < 1) {
    return `${(fees * 100).toFixed(2)}%`;
  }
  return `${fees.toLocaleString()} ${asset}`;
}

/**
 * Primary result card (PRD §13): recommended output amount with price impact
 * and fees. Route selection and signing compose around it in later tasks.
 */
export function BestExecutionCard({
  quote,
  loading,
  refreshing,
  error,
  idle,
}: BestExecutionCardProps) {
  return (
    <Card
      title="Best execution"
      action={
        quote !== null && !loading && error === null ? (
          <Badge tone="positive">Best net output</Badge>
        ) : undefined
      }
    >
      {idle ? (
        <p className="py-4 text-center text-sm text-muted">
          Enter an amount and request a quote to compare execution routes.
        </p>
      ) : loading ? (
        <Spinner label="Fetching best quote…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : quote !== null ? (
        <div className={clsx(refreshing && 'opacity-60 transition-opacity')}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {quote.inputAmount.toLocaleString()} {quote.from} ↓
          </p>
          <p className="mt-1 font-mono text-3xl font-bold">
            {quote.outputAmount.toLocaleString()} {quote.to}
          </p>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Price impact</dt>
              <dd className="font-mono">{(quote.priceImpact * 100).toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Fees</dt>
              <dd className="font-mono">{formatFees(quote.fees, quote.to)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Route</dt>
              <dd className="font-mono">{quote.routeId}</dd>
            </div>
          </dl>
          {refreshing && (
            <p className="mt-3 text-center font-mono text-xs text-muted">Refreshing…</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
