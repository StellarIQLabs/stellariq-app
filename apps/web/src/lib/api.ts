import type {
  AggregatedMarket,
  Asset,
  AssetWithMarket,
  Market,
  OhlcvCandle,
  Pool,
  Quote,
  RoutesResponse,
  Swap,
} from '@stellariq/types';
import { getWebEnv } from './env';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const base = getWebEnv().apiBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    headers: { accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `StellarIQ API request failed: ${res.status} ${path}`);
  }
  return (await res.json()) as T;
}

function asArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) {
    return json as T[];
  }
  if (typeof json === 'object' && json !== null && 'data' in json) {
    const data = (json as { data: unknown }).data;
    if (Array.isArray(data)) {
      return data as T[];
    }
  }
  return [];
}

/** Top markets ordered by volume (PRD §11 market analytics). */
export function fetchTopMarkets(limit = 5, signal?: AbortSignal): Promise<Market[]> {
  return request<unknown>(`/v1/markets?sort=volume&limit=${limit}`, signal).then(asArray<Market>);
}

/** Top pools ordered by TVL (PRD §12 pool intelligence). */
export function fetchTopPools(limit = 5, signal?: AbortSignal): Promise<Pool[]> {
  return request<unknown>(`/v1/pools?sort=tvl&limit=${limit}`, signal).then(asArray<Pool>);
}

/** Most recent swaps for the whale-activity feed (PRD §16 large swap). */
export function fetchRecentSwaps(limit = 10, signal?: AbortSignal): Promise<Swap[]> {
  return request<unknown>(`/v1/swaps/recent?limit=${limit}`, signal).then(asArray<Swap>);
}

export interface AnalyticsPoint {
  timestamp: number;
  value: number;
}

export interface AnalyticsSeries {
  metric: 'volume' | 'liquidity';
  timeframe: string;
  points: AnalyticsPoint[];
}

/** 24h volume series for the network totals (PRD §17 analytics). */
export function fetchVolumeSeries(signal?: AbortSignal): Promise<AnalyticsSeries> {
  return request<AnalyticsSeries>('/v1/analytics/volume?timeframe=1D', signal);
}

/** Liquidity series; the latest point is current TVL (PRD §17 analytics). */
export function fetchLiquiditySeries(
  options: { asset?: string; signal?: AbortSignal } = {},
): Promise<AnalyticsSeries> {
  const params = new URLSearchParams({ timeframe: '1D' });
  if (options.asset) {
    params.set('asset', options.asset);
  }
  return request<AnalyticsSeries>(`/v1/analytics/liquidity?${params.toString()}`, options.signal);
}

export interface SwapsPage {
  data: Swap[];
  page: number;
  limit: number;
  total: number;
}

/** Total indexed swap count via a minimal page fetch (PRD §17 swaps). */
export function fetchSwapsTotal(signal?: AbortSignal): Promise<number> {
  return request<SwapsPage>('/v1/swaps?page=1&limit=1', signal).then((page) => page.total);
}

export interface SwapFilters {
  asset?: string;
  pool?: string;
  protocol?: string;
  page?: number;
  limit?: number;
}

/** Paginated swaps filtered by asset, pool or protocol (PRD §17 swaps). */
export function fetchSwaps(filters: SwapFilters, signal?: AbortSignal): Promise<SwapsPage> {
  const params = new URLSearchParams();
  if (filters.asset) {
    params.set('asset', filters.asset);
  }
  if (filters.pool) {
    params.set('pool', filters.pool);
  }
  if (filters.protocol) {
    params.set('protocol', filters.protocol);
  }
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return request<SwapsPage>(`/v1/swaps?${params.toString()}`, signal);
}

export interface PoolFilters {
  protocol?: string;
  sort?: 'tvl' | 'volume';
  page?: number;
  limit?: number;
}

export interface PoolPage {
  data: Pool[];
  page: number;
  limit: number;
  total: number;
}

/** Paginated pool catalog with protocol filter (PRD §17 pools). */
export function fetchPools(filters: PoolFilters, signal?: AbortSignal): Promise<PoolPage> {
  const params = new URLSearchParams();
  if (filters.protocol) {
    params.set('protocol', filters.protocol);
  }
  params.set('sort', filters.sort ?? 'tvl');
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return request<PoolPage>(`/v1/pools?${params.toString()}`, signal);
}

/** Single pool with analytics (PRD §17 pools). */
export function fetchPool(pool: string, signal?: AbortSignal): Promise<Pool> {
  return request<Pool>(`/v1/pools/${encodeURIComponent(pool)}`, signal);
}

export interface AssetFilters {
  search?: string;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface AssetPage {
  data: Asset[];
  page: number;
  limit: number;
  total: number;
}

/** Searchable, filterable asset registry page (PRD §17 assets). */
export function fetchAssets(filters: AssetFilters, signal?: AbortSignal): Promise<AssetPage> {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.verifiedOnly === true) {
    params.set('verified', 'true');
  }
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return request<AssetPage>(`/v1/assets?${params.toString()}`, signal);
}

/** Single asset with market context (PRD §17 assets). */
export function fetchAsset(asset: string, signal?: AbortSignal): Promise<AssetWithMarket> {
  return request<AssetWithMarket>(`/v1/assets/${encodeURIComponent(asset)}`, signal);
}

export interface MarketFilters {
  protocol?: string;
  sort?: 'volume' | 'liquidity' | 'change';
  page?: number;
  limit?: number;
}

export interface MarketPage {
  data: Market[];
  page: number;
  limit: number;
  total: number;
}

/** Paginated base/quote market catalog (PRD §17 markets). */
export function fetchMarkets(filters: MarketFilters, signal?: AbortSignal): Promise<MarketPage> {
  const params = new URLSearchParams();
  if (filters.protocol) {
    params.set('protocol', filters.protocol);
  }
  params.set('sort', filters.sort ?? 'volume');
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return request<MarketPage>(`/v1/markets?${params.toString()}`, signal);
}

/** Aggregated pair view across protocols (PRD §17 markets). */
export function fetchMarket(pair: string, signal?: AbortSignal): Promise<AggregatedMarket> {
  return request<AggregatedMarket>(`/v1/markets/${encodeURIComponent(pair)}`, signal);
}

/** OHLCV price history for charts (PRD §17 prices). */
export function fetchPriceHistory(
  asset: string,
  timeframe = '1D',
  signal?: AbortSignal,
): Promise<OhlcvCandle[]> {
  const params = new URLSearchParams({ timeframe });
  return request<unknown>(
    `/v1/prices/${encodeURIComponent(asset)}/history?${params.toString()}`,
    signal,
  ).then(asArray<OhlcvCandle>);
}

export interface QuoteRequest {
  from: string;
  to: string;
  amount: number;
}

/** Best execution for a given input (PRD §17 quotes). */
export function fetchQuote(req: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  const params = new URLSearchParams({
    from: req.from,
    to: req.to,
    amount: String(req.amount),
  });
  return request<Quote>(`/v1/quote?${params.toString()}`, signal);
}

/** Every evaluated route ranked by net output (PRD §17 routes). */
export function fetchRoutes(req: QuoteRequest, signal?: AbortSignal): Promise<RoutesResponse> {
  const params = new URLSearchParams({
    from: req.from,
    to: req.to,
    amount: String(req.amount),
  });
  return request<RoutesResponse>(`/v1/routes?${params.toString()}`, signal);
}
