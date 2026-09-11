import type { Protocol } from './common.js';

/**
 * Evaluated execution routes (PRD §14 route optimization). The engine ranks
 * by net output, not lowest advertised fee.
 */
export type RouteKind = 'direct' | 'multi-hop' | 'split';

export interface RouteStep {
  protocol: Protocol;
  poolId: string;
  inputAsset: string;
  outputAsset: string;
}

export interface SwapRoute {
  id: string;
  kind: RouteKind;
  outputAmount: number;
  /** Fractional price impact, e.g. 0.0018 for 0.18%. */
  priceImpact: number;
  networkFee: number;
  protocolFee: number;
  steps: RouteStep[];
  isBest: boolean;
}

/** Best execution for a given input (PRD §13 swap intelligence). */
export interface Quote {
  from: string;
  to: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fees: number;
  routeId: string;
}

/** Every evaluated route ranked by net output (PRD §14). */
export interface RoutesResponse {
  from: string;
  to: string;
  inputAmount: number;
  routes: SwapRoute[];
  bestRouteId: string;
}
