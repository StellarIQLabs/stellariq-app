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

/**
 * Read seam between the API and the data layer.
 *
 * TODO(data): the stellariq-data repo owns indexing, pricing and routing.
 * Until its API is available, `MockDataSource` serves deterministic seed data
 * through this interface; route handlers only depend on `DataSource`, so the
 * swap is a one-line change in `app.ts`.
 */
export interface ListOptions {
  page: number;
  limit: number;
}

export interface Paged<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface SeriesPoint {
  timestamp: number;
  value: number;
}

export interface DataSource {
  listAssets(
    opts: { search?: string; verifiedOnly?: boolean } & ListOptions,
  ): Paged<Asset> | Promise<Paged<Asset>>;
  getAsset(id: string): AssetWithMarket | null | Promise<AssetWithMarket | null>;
  listMarkets(
    opts: { protocol?: Protocol; sort: 'volume' | 'liquidity' | 'change' } & ListOptions,
  ): Paged<Market> | Promise<Paged<Market>>;
  getMarket(pair: string): AggregatedMarket | null | Promise<AggregatedMarket | null>;
  listPools(
    opts: { protocol?: Protocol; sort: 'tvl' | 'volume' } & ListOptions,
  ): Paged<Pool> | Promise<Paged<Pool>>;
  getPool(id: string): Pool | null | Promise<Pool | null>;
  listSwaps(
    opts: { asset?: string; pool?: string; protocol?: Protocol } & ListOptions,
  ): Paged<Swap> | Promise<Paged<Swap>>;
  recentSwaps(
    limit: number,
    filters?: { asset?: string; protocol?: Protocol },
  ): Swap[] | Promise<Swap[]>;
  swapsTotal(): number | Promise<number>;
  getPrice(asset: string): Price | null | Promise<Price | null>;
  priceHistory(asset: string, timeframe: Timeframe): OhlcvCandle[] | Promise<OhlcvCandle[]>;
  volumeSeries(timeframe: Timeframe): SeriesPoint[] | Promise<SeriesPoint[]>;
  liquiditySeries(
    asset: string | undefined,
    timeframe: Timeframe,
  ): SeriesPoint[] | Promise<SeriesPoint[]>;
  /** Null when either side is unknown — the quote task turns this into 404s. */
  poolReserves(
    assetA: string,
    assetB: string,
  ):
    | { poolId: string; protocol: Protocol; reserveA: number; reserveB: number; fee: number }[]
    | Promise<
        { poolId: string; protocol: Protocol; reserveA: number; reserveB: number; fee: number }[]
      >;
}
