import type { Market, Pool, Swap } from '@stellariq/types';
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
