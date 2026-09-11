'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, PriceChart, Spinner, Stat } from '@stellariq/ui';
import type { AssetWithMarket, OhlcvCandle, Timeframe } from '@stellariq/types';
import { ApiError, fetchAsset, fetchPriceHistory } from '@/lib/api';
import { formatPrice, formatUsd } from '@/lib/format';

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W', '1M'];

function verificationTone(
  status: AssetWithMarket['verificationStatus'],
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
 * Single-asset intelligence (PRD §9 requirements): metadata, issuer info,
 * price, 24h volume, liquidity and supported markets.
 */
export function AssetDetail({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<AssetWithMarket | null>(null);
  const [candles, setCandles] = useState<OhlcvCandle[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    Promise.all([fetchAsset(assetId, signal), fetchPriceHistory(assetId, timeframe, signal)])
      .then(([fetchedAsset, history]) => {
        if (!signal.aborted) {
          setAsset(fetchedAsset);
          setCandles(history);
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
  }, [assetId, timeframe]);

  if (loading) {
    return <Spinner label={`Loading ${assetId}…`} />;
  }

  if (error !== null || asset === null) {
    return (
      <Card title="Asset unavailable">
        <p className="text-sm text-negative">{error ?? 'Unexpected empty response.'}</p>
      </Card>
    );
  }

  const points = candles.map((c) => ({ timestamp: c.timestamp, value: c.close }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-bold">{asset.code}</h1>
        <Badge tone={verificationTone(asset.verificationStatus)}>{asset.verificationStatus}</Badge>
        <p className="w-full text-sm text-muted">{asset.name}</p>
      </header>

      <section aria-label="Market snapshot" className="grid gap-4 md:grid-cols-4">
        <Stat label="Price (USD)" value={formatPrice(asset.price)} change={asset.priceChange24h} />
        <Stat label="Volume 24h" value={formatUsd(asset.volume24h)} />
        <Stat label="Liquidity" value={formatUsd(asset.liquidity)} />
        <Stat label="Decimals" value={String(asset.decimals)} />
      </section>

      <Card title="Price history">
        <PriceChart
          data={points}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf as Timeframe)}
          timeframes={[...TIMEFRAMES]}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Issuer">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Issuer</dt>
              <dd className="break-all text-right font-mono text-xs">
                {asset.issuer ?? 'Native asset (no issuer)'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Indexed</dt>
              <dd className="font-mono text-xs">
                {new Date(asset.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Supported markets">
          {!asset.markets || asset.markets.length === 0 ? (
            <p className="py-2 text-sm text-muted">No markets reference this asset yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {asset.markets.map((pair) => (
                <li key={pair}>
                  <Link
                    href={`/markets/${encodeURIComponent(pair)}`}
                    className="inline-block rounded-full border border-border px-3 py-1 font-mono text-xs hover:border-accent hover:text-accent"
                  >
                    {pair}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
