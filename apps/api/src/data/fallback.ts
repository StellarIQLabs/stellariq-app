import type {
  AggregatedMarket,
  Asset,
  AssetWithMarket,
  Market,
  OhlcvCandle,
  Pool,
  Price,
  Protocol,
  Swap,
  Timeframe,
} from '@stellariq/types';
import type { DataSource, ListOptions, Paged, SeriesPoint } from './source.js';

/**
 * Wraps a primary DataSource (the remote data service) with a fallback (the
 * built-in dataset). Every call tries the primary; if it throws - the free-tier
 * data service is still waking, or briefly unreachable - the call transparently
 * falls back so the API never returns an error to the client. Failures are
 * logged at most once a minute to avoid noise during a cold start.
 */
export class FallbackDataSource implements DataSource {
  private lastWarn = 0;

  constructor(
    private readonly primary: DataSource,
    private readonly fallback: DataSource,
  ) {}

  private async attempt<T>(
    method: string,
    primaryCall: () => T | Promise<T>,
    fallbackCall: () => T | Promise<T>,
  ): Promise<T> {
    try {
      return await primaryCall();
    } catch (error) {
      const now = Date.now();
      if (now - this.lastWarn > 60_000) {
        this.lastWarn = now;
        console.warn(
          `data service unavailable (${method}); serving fallback data: ${String(error)}`,
        );
      }
      return await fallbackCall();
    }
  }

  listAssets(
    opts: { search?: string; verifiedOnly?: boolean } & ListOptions,
  ): Promise<Paged<Asset>> {
    return this.attempt(
      'listAssets',
      () => this.primary.listAssets(opts),
      () => this.fallback.listAssets(opts),
    );
  }
  getAsset(id: string): Promise<AssetWithMarket | null> {
    return this.attempt(
      'getAsset',
      () => this.primary.getAsset(id),
      () => this.fallback.getAsset(id),
    );
  }
  listMarkets(
    opts: { protocol?: Protocol; sort: 'volume' | 'liquidity' | 'change' } & ListOptions,
  ): Promise<Paged<Market>> {
    return this.attempt(
      'listMarkets',
      () => this.primary.listMarkets(opts),
      () => this.fallback.listMarkets(opts),
    );
  }
  getMarket(pair: string): Promise<AggregatedMarket | null> {
    return this.attempt(
      'getMarket',
      () => this.primary.getMarket(pair),
      () => this.fallback.getMarket(pair),
    );
  }
  listPools(
    opts: { protocol?: Protocol; sort: 'tvl' | 'volume' } & ListOptions,
  ): Promise<Paged<Pool>> {
    return this.attempt(
      'listPools',
      () => this.primary.listPools(opts),
      () => this.fallback.listPools(opts),
    );
  }
  getPool(id: string): Promise<Pool | null> {
    return this.attempt(
      'getPool',
      () => this.primary.getPool(id),
      () => this.fallback.getPool(id),
    );
  }
  listSwaps(
    opts: { asset?: string; pool?: string; protocol?: Protocol } & ListOptions,
  ): Promise<Paged<Swap>> {
    return this.attempt(
      'listSwaps',
      () => this.primary.listSwaps(opts),
      () => this.fallback.listSwaps(opts),
    );
  }
  recentSwaps(limit: number, filters?: { asset?: string; protocol?: Protocol }): Promise<Swap[]> {
    return this.attempt(
      'recentSwaps',
      () => this.primary.recentSwaps(limit, filters),
      () => this.fallback.recentSwaps(limit, filters),
    );
  }
  swapsTotal(): Promise<number> {
    return this.attempt(
      'swapsTotal',
      () => this.primary.swapsTotal(),
      () => this.fallback.swapsTotal(),
    );
  }
  getPrice(asset: string): Promise<Price | null> {
    return this.attempt(
      'getPrice',
      () => this.primary.getPrice(asset),
      () => this.fallback.getPrice(asset),
    );
  }
  priceHistory(asset: string, timeframe: Timeframe): Promise<OhlcvCandle[]> {
    return this.attempt(
      'priceHistory',
      () => this.primary.priceHistory(asset, timeframe),
      () => this.fallback.priceHistory(asset, timeframe),
    );
  }
  volumeSeries(timeframe: Timeframe): Promise<SeriesPoint[]> {
    return this.attempt(
      'volumeSeries',
      () => this.primary.volumeSeries(timeframe),
      () => this.fallback.volumeSeries(timeframe),
    );
  }
  liquiditySeries(asset: string | undefined, timeframe: Timeframe): Promise<SeriesPoint[]> {
    return this.attempt(
      'liquiditySeries',
      () => this.primary.liquiditySeries(asset, timeframe),
      () => this.fallback.liquiditySeries(asset, timeframe),
    );
  }
  poolReserves(
    assetA: string,
    assetB: string,
  ): Promise<
    { poolId: string; protocol: Protocol; reserveA: number; reserveB: number; fee: number }[]
  > {
    return this.attempt(
      'poolReserves',
      () => this.primary.poolReserves(assetA, assetB),
      () => this.fallback.poolReserves(assetA, assetB),
    );
  }
}
