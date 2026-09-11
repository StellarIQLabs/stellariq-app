'use client';

import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { Card, EmptyState, Spinner } from '@stellariq/ui';
import type { OhlcvCandle, Timeframe } from '@stellariq/types';

export const CHART_TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M'];

export interface MarketPriceChartProps {
  pair: string;
  candles: OhlcvCandle[];
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  loading?: boolean;
}

/**
 * OHLCV candlestick chart (PRD §11 metrics) with 1H/4H/1D/1W/1M timeframe
 * switcher and an empty state when the pair has no history.
 */
export function MarketPriceChart({
  pair,
  candles,
  timeframe,
  onTimeframeChange,
  loading = false,
}: MarketPriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const chart = createChart(container, {
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
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      borderVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    seriesRef.current?.setData(
      candles.map((c) => ({
        time: c.timestamp as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles, pair]);

  return (
    <Card
      title="Price"
      action={
        <div className="flex gap-1" role="tablist" aria-label="Timeframe">
          {CHART_TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={tf === timeframe}
              onClick={() => onTimeframeChange(tf)}
              className={
                tf === timeframe
                  ? 'rounded bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent'
                  : 'rounded px-2.5 py-1 text-xs font-medium text-muted hover:text-text'
              }
            >
              {tf}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <Spinner label={`Loading ${timeframe} price history…`} />
      ) : candles.length === 0 ? (
        <EmptyState
          title="No price history for this range"
          hint="Try another timeframe — newly indexed pairs may not have history yet."
        />
      ) : (
        <div
          ref={containerRef}
          className="h-80 w-full"
          role="img"
          aria-label={`${pair} OHLCV price chart (${timeframe})`}
        />
      )}
    </Card>
  );
}
