import type { VerificationStatus } from './common.js';

/**
 * Normalized asset in the StellarIQ registry (PRD §9, asset entity PRD §24).
 * Native XLM has `issuer: null`; issued assets carry their issuer address.
 */
export interface Asset {
  /** Canonical id, e.g. `XLM` or `USDC:issuer-address`. */
  id: string;
  code: string;
  issuer: string | null;
  name: string;
  decimals: number;
  verificationStatus: VerificationStatus;
  createdAt: string;
  /** Current aggregated price in USD, when available. */
  price?: number;
  volume24h?: number;
  liquidity?: number;
}

/** Asset with market context for catalog and detail pages. */
export interface AssetWithMarket extends Asset {
  priceChange24h?: number;
  markets?: string[];
}
