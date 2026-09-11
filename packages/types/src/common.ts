/** Shared primitives: protocols, timeframes, pagination and API envelopes. */

/** Liquidity sources indexed by StellarIQ (PRD §25 MVP protocol coverage). */
export type Protocol = 'stellar-dex' | 'soroswap' | 'phoenix' | 'aqua';

/** All supported protocols, for filters and validation. */
export const PROTOCOLS: readonly Protocol[] = [
  'stellar-dex',
  'soroswap',
  'phoenix',
  'aqua',
] as const;

/** Chart / analytics timeframes (PRD §11). */
export type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M';

export const TIMEFRAMES: readonly Timeframe[] = ['1H', '4H', '1D', '1W', '1M'] as const;

/** Asset verification status in the normalized registry. */
export type VerificationStatus = 'verified' | 'unverified' | 'suspicious';

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

/** OHLCV candle for price/volume history charts. */
export interface OhlcvCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Real-time channel event shapes (PRD §18 WebSocket API). */
export type WsChannel = `${string}:${'price' | 'trades' | 'liquidity'}`;

export interface WsEvent<TType extends string = string, TPayload = unknown> {
  type: TType;
  timestamp: number;
  payload: TPayload;
}

export interface PriceUpdatePayload {
  pair: string;
  price: number;
}
