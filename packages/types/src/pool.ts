import type { Protocol } from './common.js';

/**
 * Liquidity pool with analytics (PRD §12, pool entity PRD §24).
 */
export interface Pool {
  id: string;
  protocol: Protocol;
  tokenA: string;
  tokenB: string;
  reserveA: number;
  reserveB: number;
  tvl: number;
  /** Swap fee as a fraction, e.g. 0.003 for 0.30%. */
  fee: number;
  volume24h?: number;
  /** volume24h / tvl — capital efficiency. */
  volumeTvlRatio?: number;
  /** Fractional change over 7 days, e.g. 0.34 for +34%. */
  liquidityChange7d?: number;
  tradeCount24h?: number;
  /** Estimated price impact fraction for a reference trade size. */
  estimatedPriceImpact?: number;
}
