'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Badge, Card, Spinner } from '@stellariq/ui';
import type { Pool } from '@stellariq/types';
import { formatUsd } from '@/lib/format';

export interface TopPoolsTableProps {
  pools: Pool[];
  loading?: boolean;
  error?: string | null;
}

interface PoolGroup {
  pair: string;
  totalTvl: number;
  pools: Pool[];
}

/**
 * Top pools with aggregated TVL by token-pair set and per-protocol breakdown
 * (PRD §12). Pool rows link to pool detail.
 */
export function TopPoolsTable({ pools, loading = false, error = null }: TopPoolsTableProps) {
  const groups = useMemo<PoolGroup[]>(() => {
    const byPair = new Map<string, Pool[]>();
    for (const pool of pools) {
      const pair = `${pool.tokenA}/${pool.tokenB}`;
      const list = byPair.get(pair) ?? [];
      list.push(pool);
      byPair.set(pair, list);
    }
    return [...byPair.entries()]
      .map(([pair, list]) => ({
        pair,
        totalTvl: list.reduce((sum, p) => sum + p.tvl, 0),
        pools: [...list].sort((a, b) => b.tvl - a.tvl),
      }))
      .sort((a, b) => b.totalTvl - a.totalTvl)
      .slice(0, 5);
  }, [pools]);

  return (
    <Card
      title="Top pools"
      action={
        <Link href="/pools" className="text-sm text-accent hover:underline">
          View all
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Loading pools…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : groups.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No pools indexed yet.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {groups.map((group) => (
            <li key={group.pair}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-semibold">{group.pair}</p>
                <p className="font-mono text-sm text-muted">{formatUsd(group.totalTvl)} total</p>
              </div>
              <ul className="divide-y divide-border/50 rounded-md border border-border/50">
                {group.pools.map((pool) => (
                  <li
                    key={pool.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-raised/40"
                  >
                    <Badge tone="accent">{pool.protocol}</Badge>
                    <Link
                      href={`/pools/${encodeURIComponent(pool.id)}`}
                      className="font-mono text-accent hover:underline"
                    >
                      {pool.id}
                    </Link>
                    <span className="ml-auto font-mono">{formatUsd(pool.tvl)}</span>
                    <span className="hidden font-mono text-xs text-muted sm:inline">
                      {formatUsd(pool.volume24h)} vol
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
