'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Table } from '@stellariq/ui';
import type { Market } from '@stellariq/types';
import { ApiError, fetchMarkets } from '@/lib/api';
import { formatChange, formatPrice, formatUsd } from '@/lib/format';

const PAGE_SIZE = 20;
const PROTOCOLS = ['stellar-dex', 'soroswap', 'phoenix', 'aqua'] as const;
type SortOption = 'volume' | 'liquidity' | 'change';

/**
 * Market catalog (PRD §11): base/quote markets with price, 24h change and
 * liquidity, sorted by volume, with protocol filter and pagination.
 */
export function MarketCatalog() {
  const [protocol, setProtocol] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('volume');
  const [page, setPage] = useState(1);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchMarkets(
      { ...(protocol ? { protocol } : {}), sort, page, limit: PAGE_SIZE },
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setMarkets(result.data);
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
  }, [protocol, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card title={`Markets (${total})`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          Protocol
          <select
            value={protocol}
            onChange={(e) => {
              setProtocol(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
          >
            <option value="">All protocols</option>
            {PROTOCOLS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          Sort by
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              setPage(1);
            }}
            className="rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
          >
            <option value="volume">Volume</option>
            <option value="liquidity">Liquidity</option>
            <option value="change">24h change</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Spinner label="Loading markets…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'pair',
                header: 'Pair',
                render: (m) => (
                  <Link
                    href={`/markets/${encodeURIComponent(m.id)}`}
                    className="font-mono font-semibold text-accent hover:underline"
                  >
                    {m.id}
                  </Link>
                ),
              },
              {
                key: 'protocol',
                header: 'Protocol',
                render: (m) => <span className="font-mono text-xs text-muted">{m.protocol}</span>,
              },
              {
                key: 'price',
                header: 'Price',
                align: 'right',
                render: (m) => <span className="font-mono">{formatPrice(m.price)}</span>,
              },
              {
                key: 'change',
                header: '24h',
                align: 'right',
                render: (m) => (
                  <span
                    className={
                      m.priceChange24h !== undefined && m.priceChange24h < 0
                        ? 'text-negative'
                        : 'text-positive'
                    }
                  >
                    {formatChange(m.priceChange24h)}
                  </span>
                ),
              },
              {
                key: 'volume',
                header: 'Volume 24h',
                align: 'right',
                render: (m) => <span className="font-mono">{formatUsd(m.volume24h)}</span>,
              },
              {
                key: 'liquidity',
                header: 'Liquidity',
                align: 'right',
                render: (m) => <span className="font-mono">{formatUsd(m.liquidity)}</span>,
              },
            ]}
            rows={markets}
            keyOf={(m) => `${m.protocol}:${m.id}`}
            emptyMessage="No markets match this filter."
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
