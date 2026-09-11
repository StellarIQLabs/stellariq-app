/**
 * Standardized price output (PRD §10, price entity PRD §24).
 */
export interface Price {
  asset: string;
  price: number;
  currency: string;
  /** Unix seconds. */
  timestamp: number;
  /** Number of sources aggregated. */
  sources: number;
  /** Aggregator confidence in [0, 1]. */
  confidence: number;
}

/** One raw contributor to an aggregated price. */
export interface PriceSource {
  asset: string;
  price: number;
  source: string;
  timestamp: number;
  confidence: number;
}
