'use client';

import { useEffect, useState } from 'react';
import { Stat } from '@stellariq/ui';
import { ApiError, fetchLiquiditySeries, fetchSwapsTotal, fetchVolumeSeries } from '@/lib/api';
import { formatCount, formatUsd } from '@/lib/format';

interface CardState {
  value: string;
  change?: number | undefined;
  loading: boolean;
  error: string | null;
}

const initial: CardState = { value: '—', loading: true, error: null };

function seriesChange(first: number | undefined, last: number | undefined): number | undefined {
  if (first === undefined || last === undefined || first === 0) {
    return undefined;
  }
  return ((last - first) / first) * 100;
}

/**
 * Network summary cards — 24h volume, TVL and indexed swap count — wired to
 * the analytics API with per-card loading and error states.
 */
export function SummaryStatCards() {
  const [volume, setVolume] = useState<CardState>(initial);
  const [tvl, setTvl] = useState<CardState>(initial);
  const [trades, setTrades] = useState<CardState>(initial);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetchVolumeSeries(signal)
      .then((series) => {
        if (signal.aborted) {
          return;
        }
        const total = series.points.reduce((sum, p) => sum + p.value, 0);
        const first = series.points[0]?.value;
        const last = series.points[series.points.length - 1]?.value;
        setVolume({
          value: formatUsd(total),
          change: seriesChange(first, last),
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!signal.aborted) {
          setVolume({ value: '—', loading: false, error: failureMessage(err) });
        }
      });

    fetchLiquiditySeries(signal)
      .then((series) => {
        if (signal.aborted) {
          return;
        }
        const last = series.points[series.points.length - 1]?.value;
        const first = series.points[0]?.value;
        setTvl({
          value: formatUsd(last),
          change: seriesChange(first, last),
          loading: false,
          error: last === undefined ? 'No liquidity points returned.' : null,
        });
      })
      .catch((err: unknown) => {
        if (!signal.aborted) {
          setTvl({ value: '—', loading: false, error: failureMessage(err) });
        }
      });

    fetchSwapsTotal(signal)
      .then((total) => {
        if (!signal.aborted) {
          setTrades({ value: formatCount(total), loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!signal.aborted) {
          setTrades({ value: '—', loading: false, error: failureMessage(err) });
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <section aria-label="Network totals" className="grid gap-4 md:grid-cols-3">
      <Stat
        label="Volume 24h"
        value={volume.value}
        {...(volume.change !== undefined ? { change: volume.change } : {})}
        loading={volume.loading}
        {...(volume.error !== null ? { error: volume.error } : {})}
        hint="Across all indexed Stellar markets"
      />
      <Stat
        label="Total value locked"
        value={tvl.value}
        {...(tvl.change !== undefined ? { change: tvl.change } : {})}
        loading={tvl.loading}
        {...(tvl.error !== null ? { error: tvl.error } : {})}
        hint="Across all indexed pools"
      />
      <Stat
        label="Swaps indexed"
        value={trades.value}
        loading={trades.loading}
        {...(trades.error !== null ? { error: trades.error } : {})}
        hint="Trade count across protocols"
      />
    </section>
  );
}

function failureMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return `API error ${err.status}: is the StellarIQ API running?`;
  }
  return 'Network error: could not reach the StellarIQ API.';
}
