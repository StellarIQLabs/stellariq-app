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

const DEFAULT_TIMEOUT_MS = 15_000;

interface RemoteDataSourceOptions {
  baseUrl: string;
  timeoutMs?: number;
}

async function get<T>(url: string, timeoutMs: number): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    throw new Error(`Remote data source ${res.status} ${res.statusText}: ${url}`);
  }
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    (e): e is [string, string | number | boolean] => e[1] !== undefined,
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

/**
 * DataSource backed by the upstream data API (DATA_API_URL). Each method maps
 * to the corresponding REST endpoint; on network or upstream errors the methods
 * throw so the caller can decide whether to degrade or propagate.
 */
export class RemoteDataSource implements DataSource {
  private readonly base: string;
  private readonly timeoutMs: number;

  constructor(opts: RemoteDataSourceOptions) {
    this.base = opts.baseUrl.replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private url(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    return `${this.base}${path}${params ? qs(params) : ''}`;
  }

  // ── Assets ────────────────────────────────────────────────────────────

  async listAssets(
    opts: { search?: string; verifiedOnly?: boolean } & ListOptions,
  ): Promise<Paged<Asset>> {
    return get<Paged<Asset>>(
      this.url('/v1/assets', {
        search: opts.search,
        verified: opts.verifiedOnly ?? undefined,
        page: opts.page,
        limit: opts.limit,
      }),
      this.timeoutMs,
    );
  }

  async getAsset(id: string): Promise<AssetWithMarket | null> {
    try {
      return await get<AssetWithMarket>(
        this.url(`/v1/assets/${encodeURIComponent(id)}`),
        this.timeoutMs,
      );
    } catch {
      return null;
    }
  }

  // ── Markets ───────────────────────────────────────────────────────────

  async listMarkets(
    opts: { protocol?: Protocol; sort: 'volume' | 'liquidity' | 'change' } & ListOptions,
  ): Promise<Paged<Market>> {
    return get<Paged<Market>>(
      this.url('/v1/markets', {
        protocol: opts.protocol,
        sort: opts.sort,
        page: opts.page,
        limit: opts.limit,
      }),
      this.timeoutMs,
    );
  }

  async getMarket(pair: string): Promise<AggregatedMarket | null> {
    try {
      return await get<AggregatedMarket>(
        this.url(`/v1/markets/${encodeURIComponent(pair)}`),
        this.timeoutMs,
      );
    } catch {
      return null;
    }
  }

  // ── Pools ─────────────────────────────────────────────────────────────

  async listPools(
    opts: { protocol?: Protocol; sort: 'tvl' | 'volume' } & ListOptions,
  ): Promise<Paged<Pool>> {
    return get<Paged<Pool>>(
      this.url('/v1/pools', {
        protocol: opts.protocol,
        sort: opts.sort,
        page: opts.page,
        limit: opts.limit,
      }),
      this.timeoutMs,
    );
  }

  async getPool(id: string): Promise<Pool | null> {
    try {
      return await get<Pool>(this.url(`/v1/pools/${encodeURIComponent(id)}`), this.timeoutMs);
    } catch {
      return null;
    }
  }

  // ── Swaps ─────────────────────────────────────────────────────────────

  async listSwaps(
    opts: { asset?: string; pool?: string; protocol?: Protocol } & ListOptions,
  ): Promise<Paged<Swap>> {
    return get<Paged<Swap>>(
      this.url('/v1/swaps', {
        asset: opts.asset,
        pool: opts.pool,
        protocol: opts.protocol,
        page: opts.page,
        limit: opts.limit,
      }),
      this.timeoutMs,
    );
  }

  async recentSwaps(
    limit: number,
    filters?: { asset?: string; protocol?: Protocol },
  ): Promise<Swap[]> {
    return get<Swap[]>(
      this.url('/v1/swaps/recent', {
        limit,
        asset: filters?.asset,
        protocol: filters?.protocol,
      }),
      this.timeoutMs,
    );
  }

  async swapsTotal(): Promise<number> {
    const res = await get<{ total: number }>(
      this.url('/v1/swaps', { page: 1, limit: 1 }),
      this.timeoutMs,
    );
    return res.total;
  }

  // ── Prices ────────────────────────────────────────────────────────────

  async getPrice(asset: string): Promise<Price | null> {
    try {
      return await get<Price>(this.url(`/v1/prices/${encodeURIComponent(asset)}`), this.timeoutMs);
    } catch {
      return null;
    }
  }

  async priceHistory(asset: string, timeframe: Timeframe): Promise<OhlcvCandle[]> {
    return get<OhlcvCandle[]>(
      this.url(`/v1/prices/${encodeURIComponent(asset)}/history`, { timeframe }),
      this.timeoutMs,
    );
  }

  // ── Analytics ─────────────────────────────────────────────────────────

  async volumeSeries(timeframe: Timeframe): Promise<SeriesPoint[]> {
    return get<SeriesPoint[]>(this.url('/v1/analytics/volume', { timeframe }), this.timeoutMs);
  }

  async liquiditySeries(asset: string | undefined, timeframe: Timeframe): Promise<SeriesPoint[]> {
    return get<SeriesPoint[]>(
      this.url('/v1/analytics/liquidity', { asset, timeframe }),
      this.timeoutMs,
    );
  }

  // ── Routing ───────────────────────────────────────────────────────────

  async poolReserves(
    assetA: string,
    assetB: string,
  ): Promise<
    { poolId: string; protocol: Protocol; reserveA: number; reserveB: number; fee: number }[]
  > {
    return get(this.url('/v1/routes', { from: assetA, to: assetB }), this.timeoutMs);
  }
}
