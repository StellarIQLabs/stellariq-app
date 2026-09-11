'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Table } from '@stellariq/ui';
import type { Market } from '@stellariq/types';
import { formatChange, formatPrice, formatUsd } from '@/lib/format';

type SortKey = 'price' | 'change' | 'volume' | 'liquidity';

export interface TopMarketsTableProps {
  markets: Market[];
  loading?: boolean;
  error?: string | null;
}

function sortValue(market: Market, key: SortKey): number {
  switch (key) {
    case 'price':
      return market.price ?? Number.NEGATIVE_INFINITY;
    case 'change':
      return market.priceChange24h ?? Number.NEGATIVE_INFINITY;
    case 'volume':
      return market.volume24h ?? Number.NEGATIVE_INFINITY;
    case 'liquidity':
      return market.liquidity ?? Number.NEGATIVE_INFINITY;
  }
}

/**
 * Sortable top-markets table (XLM/USDC style pairs) with price, 24h change,
 * volume and liquidity. Rows link to market detail.
 */
export function TopMarketsTable({ markets, loading = false, error = null }: TopMarketsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const sorted = [...markets].sort((a, b) => sortValue(a, sortKey) - sortValue(b, sortKey));
    return sortDir === 'asc' ? sorted : sorted.reverse();
  }, [markets, sortKey, sortDir]);

  function handleSort(key: string): void {
    const next = key as SortKey;
    if (next === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(next);
      setSortDir('desc');
    }
  }

  return (
    <Card
      title="Top markets"
      action={
        <Link href="/markets" className="text-sm text-accent hover:underline">
          View all
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Loading markets…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : (
        <Table
          columns={[
            {
              key: 'pair',
              header: 'Pair',
              render: (m) => (
                <Link
                  href={`/markets/${encodeURIComponent(m.id)}`}
                  className="font-mono text-accent hover:underline"
                >
                  {m.id}
                </Link>
              ),
            },
            {
              key: 'price',
              header: 'Price',
              align: 'right',
              sortable: true,
              render: (m) => <span className="font-mono">{formatPrice(m.price)}</span>,
            },
            {
              key: 'change',
              header: '24h',
              align: 'right',
              sortable: true,
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
              header: 'Volume',
              align: 'right',
              sortable: true,
              render: (m) => <span className="font-mono">{formatUsd(m.volume24h)}</span>,
            },
            {
              key: 'liquidity',
              header: 'Liquidity',
              align: 'right',
              sortable: true,
              render: (m) => <span className="font-mono">{formatUsd(m.liquidity)}</span>,
            },
          ]}
          rows={rows}
          keyOf={(m) => m.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          emptyMessage="No markets indexed yet."
        />
      )}
    </Card>
  );
}
