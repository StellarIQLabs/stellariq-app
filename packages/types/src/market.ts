import type { Protocol } from './common.js';

/**
 * A tradeable base/quote pair aggregated across protocols (PRD §11,
 * market entity PRD §24).
 */
export interface Market {
  /** Canonical pair id, e.g. `XLM/USDC`. */
  id: string;
  baseAsset: string;
  quoteAsset: string;
  protocol: Protocol;
  poolId: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  trades24h?: number;
  spread?: number;
}

/** Per-protocol breakdown row inside an aggregated pair view. */
export interface MarketSource {
  protocol: Protocol;
  poolId: string;
  price: number;
  liquidity: number;
  volume24h: number;
}

/** Aggregated pair view: one pair across every protocol (PRD §16 spread signal). */
export interface AggregatedMarket extends Omit<Market, 'protocol' | 'poolId'> {
  sources: MarketSource[];
}
