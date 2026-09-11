import type { Protocol, Quote, RoutesResponse, SwapRoute } from '@stellariq/types';
import type { DataSource } from '../data/source.js';

export interface PoolReserve {
  poolId: string;
  protocol: Protocol;
  reserveA: number;
  reserveB: number;
  fee: number;
}

const NETWORK_FEE_RATE = 0.0001;
const INTERMEDIARIES = ['USDC', 'XLM', 'EURC'];

/** Constant-product output for amountIn against (reserveIn, reserveOut). */
function constantProductOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  fee: number,
): number {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
    return 0;
  }
  const effective = amountIn * (1 - fee);
  return (reserveOut * effective) / (reserveIn + effective);
}

function networkFee(output: number): number {
  return output * NETWORK_FEE_RATE;
}

function toRoute(
  id: string,
  kind: SwapRoute['kind'],
  outputAmount: number,
  priceImpact: number,
  networkFeeValue: number,
  protocolFee: number,
  steps: SwapRoute['steps'],
): SwapRoute {
  return {
    id,
    kind,
    outputAmount,
    priceImpact: Math.max(0, priceImpact),
    networkFee: networkFeeValue,
    protocolFee,
    steps,
    isBest: false,
  };
}

function impactOf(output: number, amountIn: number, midPrice: number): number {
  const ideal = amountIn * midPrice;
  if (ideal <= 0) {
    return 0;
  }
  return Math.max(0, 1 - output / ideal);
}

/**
 * In-app routing engine.
 *
 * TODO(data): the stellariq-data routing-engine owns production route
 * discovery (multi-protocol, split optimization, arbitrage). This engine
 * implements the same contract (rank by net output) over local reserves so
 * the API is functional standalone.
 */
export function evaluateRoutes(
  source: DataSource,
  from: string,
  to: string,
  amount: number,
): SwapRoute[] {
  const direct = source.poolReserves(from, to);
  const routes: SwapRoute[] = [];

  // Route A — best direct pool.
  let bestDirect: PoolReserve | null = null;
  let bestDirectOut = 0;
  for (const pool of direct) {
    const out = constantProductOut(amount, pool.reserveA, pool.reserveB, pool.fee);
    if (out > bestDirectOut) {
      bestDirectOut = out;
      bestDirect = pool;
    }
  }
  const directMid =
    bestDirect && bestDirect.reserveA > 0 ? bestDirect.reserveB / bestDirect.reserveA : 0;
  if (bestDirect) {
    const protocolFee = bestDirectOut * bestDirect.fee;
    routes.push(
      toRoute(
        'A',
        'direct',
        bestDirectOut,
        impactOf(bestDirectOut, amount, directMid),
        networkFee(bestDirectOut),
        protocolFee,
        [
          {
            protocol: bestDirect.protocol,
            poolId: bestDirect.poolId,
            inputAsset: from,
            outputAsset: to,
          },
        ],
      ),
    );
  }

  // Route B — best two-hop path through an intermediary asset.
  let bestHop: { mid: string; first: PoolReserve; second: PoolReserve; out: number } | null = null;
  for (const mid of INTERMEDIARIES) {
    if (mid === from || mid === to) {
      continue;
    }
    for (const first of source.poolReserves(from, mid)) {
      const midAmount = constantProductOut(amount, first.reserveA, first.reserveB, first.fee);
      if (midAmount <= 0) {
        continue;
      }
      for (const second of source.poolReserves(mid, to)) {
        const out = constantProductOut(midAmount, second.reserveA, second.reserveB, second.fee);
        if (bestHop === null || out > bestHop.out) {
          bestHop = { mid, first, second, out };
        }
      }
    }
  }
  if (bestHop) {
    const firstMid = bestHop.first.reserveB / bestHop.first.reserveA;
    const secondMid = bestHop.second.reserveB / bestHop.second.reserveA;
    const protocolFee = bestHop.out * (bestHop.first.fee + bestHop.second.fee);
    routes.push(
      toRoute(
        'B',
        'multi-hop',
        bestHop.out,
        impactOf(bestHop.out, amount, firstMid * secondMid),
        networkFee(bestHop.out),
        protocolFee,
        [
          {
            protocol: bestHop.first.protocol,
            poolId: bestHop.first.poolId,
            inputAsset: from,
            outputAsset: bestHop.mid,
          },
          {
            protocol: bestHop.second.protocol,
            poolId: bestHop.second.poolId,
            inputAsset: bestHop.mid,
            outputAsset: to,
          },
        ],
      ),
    );
  }

  // Route C — split across the two best direct pools.
  const ranked = [...direct]
    .map((pool) => ({
      pool,
      out: constantProductOut(amount / 2, pool.reserveA, pool.reserveB, pool.fee),
    }))
    .sort((a, b) => b.out - a.out);
  if (ranked.length >= 2 && ranked[0] && ranked[1]) {
    const [first, second] = [ranked[0], ranked[1]] as [
      { pool: PoolReserve; out: number },
      { pool: PoolReserve; out: number },
    ];
    const combined = first.out + second.out;
    const protocolFee = first.out * first.pool.fee + second.out * second.pool.fee;
    routes.push(
      toRoute(
        'C',
        'split',
        combined,
        impactOf(combined, amount, directMid),
        networkFee(combined),
        protocolFee,
        [
          {
            protocol: first.pool.protocol,
            poolId: first.pool.poolId,
            inputAsset: from,
            outputAsset: to,
          },
          {
            protocol: second.pool.protocol,
            poolId: second.pool.poolId,
            inputAsset: from,
            outputAsset: to,
          },
        ],
      ),
    );
  }

  // Rank by net output — never by headline fee alone (PRD §14).
  const net = (r: SwapRoute): number => r.outputAmount - r.networkFee - r.protocolFee;
  routes.sort((a, b) => net(b) - net(a));
  const winner = routes[0];
  if (winner) {
    winner.isBest = true;
  }
  return routes;
}

export function toRoutesResponse(
  from: string,
  to: string,
  amount: number,
  routes: SwapRoute[],
): RoutesResponse {
  const best = routes.find((r) => r.isBest) ?? routes[0];
  return {
    from,
    to,
    inputAmount: amount,
    routes,
    bestRouteId: best ? best.id : '',
  };
}

/** Best execution for a given input, derived from the ranked routes. */
export function toQuote(
  from: string,
  to: string,
  amount: number,
  routes: SwapRoute[],
): Quote | null {
  const best = routes.find((r) => r.isBest) ?? routes[0];
  if (!best) {
    return null;
  }
  return {
    from,
    to,
    inputAmount: amount,
    outputAmount: best.outputAmount,
    priceImpact: best.priceImpact,
    fees: best.networkFee + best.protocolFee,
    routeId: best.id,
  };
}
