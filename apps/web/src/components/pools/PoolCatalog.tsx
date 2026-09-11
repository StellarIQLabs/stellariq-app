'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, Spinner, Table } from '@stellariq/ui';
import type { Pool } from '@stellariq/types';
import { ApiError, fetchPools } from '@/lib/api';
import { formatUsd } from '@/lib/format';

const PAGE_SIZE = 20;
const PROTOCOLS = ['stellar-dex', 'soroswap', 'phoenix', 'aqua'] as const;
type SortOption = 'tvl' | 'volume';

/**
 * Pool catalog (PRD §12): protocol, token pair, TVL, volume and fee with
 * protocol filter and pagination.
 */
export function PoolCatalog() {
  const [protocol, setProtocol] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('tvl');
  const [page, setPage] = useState(1);
  const [pools, setPools] = useState<Pool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchPools(
      { ...(protocol ? { protocol } : {}), sort, page, limit: PAGE_SIZE },
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setPools(result.data);
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
    <Card title={`Pools (${total})`}>
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
            <option value="tvl">TVL</option>
            <option value="volume">Volume</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Spinner label="Loading pools…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'pool',
                header: 'Pool',
                render: (p) => (
                  <Link
                    href={`/pools/${encodeURIComponent(p.id)}`}
                    className="font-mono font-semibold text-accent hover:underline"
                  >
                    {p.tokenA}/{p.tokenB}
                  </Link>
                ),
              },
              {
                key: 'protocol',
                header: 'Protocol',
                render: (p) => <Badge tone="accent">{p.protocol}</Badge>,
              },
              {
                key: 'tvl',
                header: 'TVL',
                align: 'right',
                render: (p) => <span className="font-mono">{formatUsd(p.tvl)}</span>,
              },
              {
                key: 'volume',
                header: 'Volume 24h',
                align: 'right',
                render: (p) => <span className="font-mono">{formatUsd(p.volume24h)}</span>,
              },
              {
                key: 'fee',
                header: 'Fee',
                align: 'right',
                render: (p) => <span className="font-mono">{(p.fee * 100).toFixed(2)}%</span>,
              },
            ]}
            rows={pools}
            keyOf={(p) => p.id}
            emptyMessage="No pools match this filter."
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
