'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, Spinner, Stat } from '@stellariq/ui';
import type { Pool } from '@stellariq/types';
import { ApiError, fetchPool } from '@/lib/api';
import { formatCount, formatUsd } from '@/lib/format';

function liquidityNote(change: number | undefined): string {
  if (change === undefined) {
    return 'Seven-day liquidity history is not available for this pool yet.';
  }
  const pct = (change * 100).toFixed(1);
  return change >= 0
    ? `Liquidity increased ${pct}% over the past 7 days.`
    : `Liquidity decreased ${Math.abs(Number(pct))}% over the past 7 days.`;
}

/**
 * Pool detail (PRD §12 metrics): reserves, TVL, fees, volume/TVL ratio, trade
 * count and estimated price impact, plus the 7-day liquidity note.
 */
export function PoolDetail({ poolId }: { poolId: string }) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchPool(poolId, controller.signal)
      .then((fetched) => {
        if (!controller.signal.aborted) {
          setPool(fetched);
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
  }, [poolId]);

  if (loading) {
    return <Spinner label={`Loading pool ${poolId}…`} />;
  }

  if (error !== null || pool === null) {
    return (
      <Card title="Pool unavailable">
        <p className="text-sm text-negative">{error ?? 'Unexpected empty response.'}</p>
      </Card>
    );
  }

  const totalReserves = pool.reserveA + pool.reserveB;
  const shareA = totalReserves > 0 ? (pool.reserveA / totalReserves) * 100 : 50;
  const feeRevenue = (pool.volume24h ?? 0) * pool.fee;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-bold">
          {pool.tokenA}/{pool.tokenB}
        </h1>
        <Badge tone="accent">{pool.protocol}</Badge>
      </header>

      <section aria-label="Pool metrics" className="grid gap-4 md:grid-cols-3">
        <Stat label="Total value locked" value={formatUsd(pool.tvl)} />
        <Stat label="Volume 24h" value={formatUsd(pool.volume24h)} />
        <Stat
          label="Volume / TVL"
          value={pool.volumeTvlRatio !== undefined ? pool.volumeTvlRatio.toFixed(3) : '—'}
          hint="Capital efficiency"
        />
        <Stat label="Fee tier" value={`${(pool.fee * 100).toFixed(2)}%`} />
        <Stat label="Est. fees 24h" value={formatUsd(feeRevenue)} hint="Volume × fee tier" />
        <Stat label="Trades 24h" value={formatCount(pool.tradeCount24h)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Reserves">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-surface-raised"
            role="img"
            aria-label={`${pool.tokenA} ${shareA.toFixed(1)} percent, ${pool.tokenB} ${(100 - shareA).toFixed(1)} percent`}
          >
            <div className="bg-accent" style={{ width: `${shareA}%` }} />
            <div className="bg-positive" style={{ width: `${100 - shareA}%` }} />
          </div>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-mono text-muted">{pool.tokenA}</dt>
              <dd className="font-mono">{formatCount(pool.reserveA)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-mono text-muted">{pool.tokenB}</dt>
              <dd className="font-mono">{formatCount(pool.reserveB)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Price impact">
          <p className="font-mono text-3xl font-semibold">
            {pool.estimatedPriceImpact !== undefined
              ? `${(pool.estimatedPriceImpact * 100).toFixed(2)}%`
              : '—'}
          </p>
          <p className="mt-2 text-sm text-muted">
            Estimated impact for a reference trade against current reserves. Larger trades move this
            pool&apos;s price more.
          </p>
        </Card>
      </div>

      <Card title="Liquidity trend">
        <p className="text-sm">{liquidityNote(pool.liquidityChange7d)}</p>
      </Card>
    </div>
  );
}
