import type {
  AggregatedMarket,
  Asset,
  AssetWithMarket,
  Market,
  OhlcvCandle,
  Pool,
  Price,
  Protocol,
  Quote,
  RoutesResponse,
  Swap,
  Timeframe,
} from '@stellariq/types';

/** Typed SDK error carrying the API envelope and retry advice. */
export class StellarIQError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(status: number, code: string, message: string, retryable: boolean) {
    super(message);
    this.name = 'StellarIQError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export interface ClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

export interface PageOptions {
  page?: number;
  limit?: number;
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

export interface Series {
  metric: 'volume' | 'liquidity';
  timeframe: string;
  points: SeriesPoint[];
}

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(header: string | null, attempt: number): number {
  const seconds = header ? Number(header) : Number.NaN;
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  return 250 * 2 ** attempt;
}

/**
 * Typed REST client for the StellarIQ API (PRD §17, §27 SDK): every endpoint
 * wrapped with timeouts, retries on 429/5xx honoring `Retry-After`, and
 * typed errors — so wallets and bots consume market data in a few lines.
 */
export class StellarIQClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? DEFAULT_RETRIES;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    let attempt = 0;
    for (;;) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      let res: Response;
      try {
        res = await this.fetchImpl(url.toString(), {
          headers: {
            accept: 'application/json',
            ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
          },
          signal: controller.signal,
        });
      } catch (err: unknown) {
        clearTimeout(timer);
        if (attempt >= this.maxRetries) {
          throw new StellarIQError(0, 'Network Error', `Request failed: ${messageOf(err)}`, false);
        }
        await sleep(250 * 2 ** attempt);
        attempt += 1;
        continue;
      } finally {
        clearTimeout(timer);
      }
      if (res.ok) {
        return (await res.json()) as T;
      }
      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < this.maxRetries) {
        await sleep(retryAfterMs(res.headers.get('retry-after'), attempt));
        attempt += 1;
        continue;
      }
      const envelope = await res.json().catch(() => null);
      const code = typeof envelope?.error === 'string' ? envelope.error : 'Request Error';
      const message =
        typeof envelope?.message === 'string' ? envelope.message : `Request failed: ${res.status}`;
      throw new StellarIQError(res.status, code, message, retryable);
    }
  }

  health(): Promise<{ status: string; version: string; uptime: number }> {
    return this.request('/health');
  }

  ready(): Promise<{ status: string; version: string; checks: { data: string; assets: number } }> {
    return this.request('/ready');
  }

  listAssets(
    options?: { search?: string; verified?: boolean } & PageOptions,
  ): Promise<Paged<Asset>> {
    return this.request('/v1/assets', {
      search: options?.search,
      verified: options?.verified,
      page: options?.page,
      limit: options?.limit,
    });
  }

  getAsset(asset: string): Promise<AssetWithMarket> {
    return this.request(`/v1/assets/${encodeURIComponent(asset)}`);
  }

  getPrice(asset: string): Promise<Price> {
    return this.request(`/v1/prices/${encodeURIComponent(asset)}`);
  }

  getPriceHistory(asset: string, timeframe?: Timeframe): Promise<OhlcvCandle[]> {
    return this.request(`/v1/prices/${encodeURIComponent(asset)}/history`, { timeframe });
  }

  listMarkets(
    options?: { protocol?: Protocol; sort?: 'volume' | 'liquidity' | 'change' } & PageOptions,
  ): Promise<Paged<Market>> {
    return this.request('/v1/markets', {
      protocol: options?.protocol,
      sort: options?.sort,
      page: options?.page,
      limit: options?.limit,
    });
  }

  getMarket(pair: string): Promise<AggregatedMarket> {
    return this.request(`/v1/markets/${encodeURIComponent(pair)}`);
  }

  listPools(
    options?: { protocol?: Protocol; sort?: 'tvl' | 'volume' } & PageOptions,
  ): Promise<Paged<Pool>> {
    return this.request('/v1/pools', {
      protocol: options?.protocol,
      sort: options?.sort,
      page: options?.page,
      limit: options?.limit,
    });
  }

  getPool(pool: string): Promise<Pool> {
    return this.request(`/v1/pools/${encodeURIComponent(pool)}`);
  }

  listSwaps(
    options?: { asset?: string; pool?: string; protocol?: Protocol } & PageOptions,
  ): Promise<Paged<Swap>> {
    return this.request('/v1/swaps', {
      asset: options?.asset,
      pool: options?.pool,
      protocol: options?.protocol,
      page: options?.page,
      limit: options?.limit,
    });
  }

  recentSwaps(options?: { asset?: string; protocol?: Protocol; limit?: number }): Promise<Swap[]> {
    return this.request('/v1/swaps/recent', {
      asset: options?.asset,
      protocol: options?.protocol,
      limit: options?.limit,
    });
  }

  getQuote(from: string, to: string, amount: number): Promise<Quote> {
    return this.request('/v1/quote', { from, to, amount });
  }

  getRoutes(from: string, to: string, amount: number): Promise<RoutesResponse> {
    return this.request('/v1/routes', { from, to, amount });
  }

  getVolume(timeframe?: Timeframe): Promise<Series> {
    return this.request('/v1/analytics/volume', { timeframe });
  }

  getLiquidity(asset?: string, timeframe?: Timeframe): Promise<Series> {
    return this.request('/v1/analytics/liquidity', { asset, timeframe });
  }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
