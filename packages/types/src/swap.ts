import type { Protocol } from './common.js';

/**
 * A single observed swap / trade (PRD §16, swap entity PRD §24).
 */
export interface Swap {
  id: string;
  transactionHash: string;
  protocol: Protocol;
  pool: string;
  user: string;
  inputAsset: string;
  outputAsset: string;
  inputAmount: number;
  outputAmount: number;
  /** Unix seconds. */
  timestamp: number;
  /** Flags whale activity for the large-swaps feed (PRD §16). */
  isLarge?: boolean;
}
