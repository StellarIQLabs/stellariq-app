'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, Spinner, Stat } from '@stellariq/ui';
import type { AggregatedMarket, OhlcvCandle, Swap, Timeframe } from '@stellariq/types';
import { ApiError, fetchMarket, fetchPriceHistory, fetchRecentSwaps } from '@/lib/api';
import { formatChange, formatCount, formatPrice, formatTime, formatUsd } from '@/lib/format';
import { MarketPriceChart } from '@/components/charts/MarketPriceChart';
import { MarketHistoryCharts } from '@/components/charts/MarketHistoryCharts';

function pairAssets(pair: string): [string, string] {
  const [base = '', quote = ''] = pair.split('/');
  return [base, quote];
}

/**
 * Market detail shell (PRD §20): price header, timeframe tabs and sections
 * for chart, volume, liquidity and trades. Dedicated chart and trades
 * components take over these sections in later tasks.
 */
export function MarketDetail({ pair }: { pair: string }) {
  const [market, setMarket] = useState<AggregatedMarket | null>(null);
  const [candles, setCandles] = useState<OhlcvCandle[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const [base, quote] = pairAssets(pair);
    setLoading(true);
    Promise.all([
      fetchMarket(pair, signal),
      fetchPriceHistory(base || pair, timeframe, signal),
      fetchRecentSwaps(50, signal),
    ])
      .then(([fetchedMarket, history, recent]) => {
        if (!signal.aborted) {
          setMarket(fetchedMarket);
          setCandles(history);
          setSwaps(
            recent.filter(
              (s) =>
                (s.inputAsset === base && s.outputAsset === quote) ||
                (s.inputAsset === quote && s.outputAsset === base),
            ),
          );
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!signal.aborted) {
          setError(
            err instanceof ApiError
              ? `API error ${err.status}: is the StellarIQ API running?`
              : 'Network error: could not reach the StellarIQ API.',
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [pair, timeframe]);

  if (loading) {
    return <Spinner label={`Loading ${pair}…`} />;
  }

  if (error !== null || market === null) {
    return (
      <Card title="Market unavailable">
        <p className="text-sm text-negative">{error ?? 'Unexpected empty response.'}</p>
      </Card>
    );
  }

  const change = market.priceChange24h ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <h1 className="font-mono text-3xl font-bold">{market.id}</h1>
        <p className="font-mono text-2xl">{formatPrice(market.price)}</p>
        <Badge tone={change >= 0 ? 'positive' : 'negative'}>
          {formatChange(market.priceChange24h)}
        </Badge>
      </header>

      <section aria-label="Market metrics" className="grid gap-4 md:grid-cols-4">
        <Stat label="Volume 24h" value={formatUsd(market.volume24h)} />
        <Stat label="Liquidity" value={formatUsd(market.liquidity)} />
        <Stat label="Trades 24h" value={formatCount(market.trades24h)} />
        <Stat
          label="Spread"
          value={market.spread !== undefined ? `${(market.spread * 100).toFixed(2)}%` : '—'}
        />
      </section>

      <MarketPriceChart
        pair={market.id}
        candles={candles}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <MarketHistoryCharts
        pair={market.id}
        baseAsset={market.baseAsset}
        candles={candles}
        timeframe={timeframe}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Liquidity by source">
          {market.sources.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No protocol sources reported.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {market.sources.map((source) => (
                <li
                  key={`${source.protocol}:${source.poolId}`}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <Badge tone="accent">{source.protocol}</Badge>
                  <span className="font-mono text-xs text-muted">{source.poolId}</span>
                  <span className="ml-auto font-mono">{formatUsd(source.liquidity)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent trades">
          {swaps.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No recent trades for this pair.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {swaps.slice(0, 10).map((swap) => (
                <li key={swap.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="font-mono">
                    {formatCount(swap.inputAmount)} {swap.inputAsset} →{' '}
                    {formatCount(swap.outputAmount)} {swap.outputAsset}
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted">
                    {formatTime(swap.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
