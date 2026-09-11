'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, Spinner, Table } from '@stellariq/ui';
import type { Asset } from '@stellariq/types';
import { ApiError, fetchAssets } from '@/lib/api';
import { formatPrice, formatUsd } from '@/lib/format';

const PAGE_SIZE = 20;

function shortIssuer(issuer: string | null): string {
  if (issuer === null) {
    return 'Native';
  }
  return issuer.length > 12 ? `${issuer.slice(0, 4)}…${issuer.slice(-4)}` : issuer;
}

function verificationTone(
  status: Asset['verificationStatus'],
): 'positive' | 'warning' | 'negative' {
  switch (status) {
    case 'verified':
      return 'positive';
    case 'unverified':
      return 'warning';
    case 'suspicious':
      return 'negative';
  }
}

/**
 * Searchable, filterable asset catalog (PRD §9): code, issuer, verification
 * badge and current price, with pagination and full loading/error states.
 */
export function AssetCatalog() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchAssets({ search: debouncedQuery, verifiedOnly, page, limit: PAGE_SIZE }, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setAssets(result.data);
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
  }, [debouncedQuery, verifiedOnly, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card title={`Assets (${total})`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or issuer…"
          aria-label="Search assets"
          className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none sm:max-w-xs"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => {
              setVerifiedOnly(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-[#5b8cff]"
          />
          Verified only
        </label>
      </div>

      {loading ? (
        <Spinner label="Loading assets…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : (
        <>
          <Table
            columns={[
              {
                key: 'code',
                header: 'Asset',
                render: (a) => (
                  <Link
                    href={`/assets/${encodeURIComponent(a.id)}`}
                    className="font-mono font-semibold text-accent hover:underline"
                  >
                    {a.code}
                  </Link>
                ),
              },
              {
                key: 'issuer',
                header: 'Issuer',
                render: (a) => (
                  <span
                    className="font-mono text-xs text-muted"
                    title={a.issuer ?? 'Stellar native asset'}
                  >
                    {shortIssuer(a.issuer)}
                  </span>
                ),
              },
              {
                key: 'verification',
                header: 'Status',
                render: (a) => (
                  <Badge tone={verificationTone(a.verificationStatus)}>
                    {a.verificationStatus}
                  </Badge>
                ),
              },
              {
                key: 'price',
                header: 'Price',
                align: 'right',
                render: (a) => <span className="font-mono">{formatPrice(a.price)}</span>,
              },
              {
                key: 'volume',
                header: 'Volume 24h',
                align: 'right',
                render: (a) => <span className="font-mono">{formatUsd(a.volume24h)}</span>,
              },
            ]}
            rows={assets}
            keyOf={(a) => a.id}
            emptyMessage={
              debouncedQuery ? `No assets match "${debouncedQuery}".` : 'No assets indexed yet.'
            }
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
