'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AreaSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { Card, EmptyState, Spinner } from '@stellariq/ui';
import type { OhlcvCandle, Timeframe } from '@stellariq/types';
import { ApiError, fetchLiquiditySeries } from '@/lib/api';

export interface MarketHistoryChartsProps {
  pair: string;
  baseAsset: string;
  candles: OhlcvCandle[];
  timeframe: Timeframe;
  loading?: boolean;
}

function createThemedChart(container: HTMLElement): IChartApi {
  return createChart(container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#8b93b0',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    grid: {
      vertLines: { color: 'rgba(36, 48, 86, 0.5)' },
      horzLines: { color: 'rgba(36, 48, 86, 0.5)' },
    },
    timeScale: { timeVisible: true, secondsVisible: false },
  });
}

function rangeChange(first: number | undefined, last: number | undefined): string {
  if (first === undefined || last === undefined || first === 0) {
    return '—';
  }
  const pct = ((last - first) / first) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}% over range`;
}

/**
 * Secondary market charts (PRD §12 historical analytics): historical volume
 * bars and TVL-change area under the price chart.
 */
export function MarketHistoryCharts({
  pair,
  baseAsset,
  candles,
  timeframe,
  loading = false,
}: MarketHistoryChartsProps) {
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const liquidityRef = useRef<HTMLDivElement | null>(null);
  const [liquidity, setLiquidity] = useState<{ timestamp: number; value: number }[]>([]);
  const [liquidityLoading, setLiquidityLoading] = useState(true);
  const [liquidityError, setLiquidityError] = useState<string | null>(null);

  useEffect(() => {
    const container = volumeRef.current;
    if (!container || candles.length === 0) {
      return;
    }
    const chart = createThemedChart(container);
    const series: ISeriesApi<'Histogram'> = chart.addSeries(HistogramSeries, {
      color: '#5b8cff',
      priceFormat: { type: 'volume' },
    });
    series.setData(
      candles.map((c) => ({
        time: c.timestamp as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
      })),
    );
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [candles, pair]);

  useEffect(() => {
    const controller = new AbortController();
    setLiquidityLoading(true);
    fetchLiquiditySeries({ asset: baseAsset, signal: controller.signal })
      .then((series) => {
        if (!controller.signal.aborted) {
          setLiquidity(series.points);
          setLiquidityError(null);
          setLiquidityLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setLiquidity([]);
          setLiquidityError(
            err instanceof ApiError
              ? `Liquidity history unavailable (API ${err.status}).`
              : 'Liquidity history unavailable (network error).',
          );
          setLiquidityLoading(false);
        }
      });
    return () => controller.abort();
  }, [baseAsset, timeframe]);

  useEffect(() => {
    const container = liquidityRef.current;
    if (!container || liquidity.length === 0) {
      return;
    }
    const chart = createThemedChart(container);
    const series: ISeriesApi<'Area'> = chart.addSeries(AreaSeries, {
      lineColor: '#5b8cff',
      topColor: 'rgba(91, 140, 255, 0.4)',
      bottomColor: 'rgba(91, 140, 255, 0.02)',
    });
    series.setData(liquidity.map((p) => ({ time: p.timestamp as UTCTimestamp, value: p.value })));
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [liquidity, pair]);

  const firstLiquidity = liquidity[0]?.value;
  const lastLiquidity = liquidity[liquidity.length - 1]?.value;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title={`Volume (${timeframe})`}>
        {loading ? (
          <Spinner label="Loading volume history…" />
        ) : candles.length === 0 ? (
          <EmptyState
            title="No volume history for this range"
            hint="Try another timeframe — newly indexed pairs may not have history yet."
          />
        ) : (
          <div
            ref={volumeRef}
            className="h-56 w-full"
            role="img"
            aria-label={`${pair} volume history (${timeframe})`}
          />
        )}
      </Card>
      <Card
        title={`Liquidity (${timeframe})`}
        action={
          <span className="font-mono text-xs text-muted">
            {rangeChange(firstLiquidity, lastLiquidity)}
          </span>
        }
      >
        {liquidityLoading ? (
          <Spinner label="Loading liquidity history…" />
        ) : liquidityError !== null ? (
          <p className="py-4 text-center text-sm text-negative">{liquidityError}</p>
        ) : liquidity.length === 0 ? (
          <EmptyState
            title="No liquidity history for this range"
            hint="Try another timeframe — newly indexed pairs may not have history yet."
          />
        ) : (
          <div
            ref={liquidityRef}
            className="h-56 w-full"
            role="img"
            aria-label={`${pair} liquidity history (${timeframe})`}
          />
        )}
      </Card>
    </div>
  );
}
