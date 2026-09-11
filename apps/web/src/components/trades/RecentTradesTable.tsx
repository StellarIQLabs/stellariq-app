'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, Spinner, Table } from '@stellariq/ui';
import type { Swap } from '@stellariq/types';
import { ApiError, fetchSwaps } from '@/lib/api';
import { formatCount, formatTime } from '@/lib/format';

export interface RecentTradesTableProps {
  /** Exact pair filter, e.g. `XLM/USDC`. Narrows the asset query client-side. */
  pair?: string;
  /** Pool id filter for pool-scoped trade lists. */
  pool?: string;
  title?: string;
  pageSize?: number;
}

function short(value: string): string {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function matchesPair(swap: Swap, base: string, quote: string): boolean {
  return (
    (swap.inputAsset === base && swap.outputAsset === quote) ||
    (swap.inputAsset === quote && swap.outputAsset === base)
  );
}

/**
 * Paginated recent-trades table (PRD §11 metrics): hash, user, input/output
 * amounts and time for a market pair or a pool.
 */
export function RecentTradesTable({
  pair,
  pool,
  title = 'Recent trades',
  pageSize = 10,
}: RecentTradesTableProps) {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [base = '', quote = ''] = pair?.split('/') ?? [];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchSwaps(
      {
        ...(base ? { asset: base } : {}),
        ...(pool ? { pool } : {}),
        page,
        limit: pageSize,
      },
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setSwaps(pair ? result.data.filter((s) => matchesPair(s, base, quote)) : result.data);
          setTotal(result.total);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof ApiError
              ? `API error ${err.status}: is the StellarIQ API running?`
              : 'Network error: could not reach the StellarIQ API.',
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [base, quote, pair, pool, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card title={`${title} (${total})`}>
      {loading ? (
        <Spinner label="Loading trades…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'hash',
                header: 'Hash',
                render: (s) => (
                  <span className="font-mono text-xs" title={s.transactionHash}>
                    {short(s.transactionHash)}
                  </span>
                ),
              },
              {
                key: 'user',
                header: 'User',
                render: (s) => (
                  <span className="font-mono text-xs" title={s.user}>
                    {short(s.user)}
                  </span>
                ),
              },
              {
                key: 'in',
                header: 'In',
                align: 'right',
                render: (s) => (
                  <span className="font-mono">
                    {formatCount(s.inputAmount)} {s.inputAsset}
                  </span>
                ),
              },
              {
                key: 'out',
                header: 'Out',
                align: 'right',
                render: (s) => (
                  <span className="font-mono">
                    {formatCount(s.outputAmount)} {s.outputAsset}
                  </span>
                ),
              },
              {
                key: 'protocol',
                header: 'Protocol',
                render: (s) => <Badge tone="neutral">{s.protocol}</Badge>,
              },
              {
                key: 'time',
                header: 'Time',
                align: 'right',
                render: (s) => (
                  <span className="font-mono text-xs text-muted">{formatTime(s.timestamp)}</span>
                ),
              },
            ]}
            rows={swaps}
            keyOf={(s) => s.id}
            emptyMessage="No trades found for this filter."
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:border-accent disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:border-accent disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
