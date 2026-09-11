import type { SwapRoute } from '@stellariq/types';

/** A single leg of a router invocation: pool contract + hop assets. */
export interface RouterLeg {
  poolContractId: string;
  inputAsset: string;
  outputAsset: string;
  /** Share of the input routed through this leg, in basis points (10000 = all). */
  shareBps: number;
}

/** Contract call the wallet will sign: router + method + ordered args. */
export interface RouterInvocation {
  contractId: string;
  method: 'swap_exact_in' | 'swap_exact_in_split';
  args: {
    user: string;
    amountIn: string;
    minAmountOut: string;
    legs: RouterLeg[];
    deadline: number;
  };
}

export class ContractNotDeployedError extends Error {
  constructor() {
    super('Swap router contract is not deployed on this network yet.');
    this.name = 'ContractNotDeployedError';
  }
}

/**
 * Swap-router interaction surface the frontend calls to build transactions.
 * Implementations map an evaluated `SwapRoute` to contract legs; signing and
 * submission stay in the wallet layer, which never sees private keys.
 */
export interface RouterClient {
  /** Router contract id, or null when undeployed on this network. */
  contractId(): string | null;
  /**
   * Maps a route to ordered router legs. Split routes fan out across legs by
   * output share; direct and multi-hop routes map one leg per step.
   */
  toLegs(route: SwapRoute): RouterLeg[];
  /**
   * Builds the invocation the wallet signs. Throws
   * ContractNotDeployedError when no contract id is configured.
   */
  buildInvocation(input: {
    route: SwapRoute;
    user: string;
    amountIn: string;
    minAmountOut: string;
    deadline: number;
  }): RouterInvocation;
}

/** Pool ids resolve 1:1 to pool contract ids until the registry ships. */
export function poolToContractId(poolId: string): string {
  return poolId;
}

/** Stub router: pure leg mapping with a deployment guard. */
export class StubRouterClient implements RouterClient {
  private readonly routerId: string | null;

  constructor(routerId?: string) {
    this.routerId = routerId ?? null;
  }

  contractId(): string | null {
    return this.routerId;
  }

  toLegs(route: SwapRoute): RouterLeg[] {
    if (route.kind === 'split' && route.steps.length > 0) {
      // The quote API ranks splits by combined output without per-pool
      // shares, so legs split the input evenly until shares ship upstream.
      const each = Math.floor(10000 / route.steps.length);
      return route.steps.map((step, i) => ({
        poolContractId: poolToContractId(step.poolId),
        inputAsset: step.inputAsset,
        outputAsset: step.outputAsset,
        shareBps: i === 0 ? 10000 - each * (route.steps.length - 1) : each,
      }));
    }
    return route.steps.map((step) => ({
      poolContractId: poolToContractId(step.poolId),
      inputAsset: step.inputAsset,
      outputAsset: step.outputAsset,
      shareBps: 10000,
    }));
  }

  buildInvocation(input: {
    route: SwapRoute;
    user: string;
    amountIn: string;
    minAmountOut: string;
    deadline: number;
  }): RouterInvocation {
    const contractId = this.contractId();
    if (!contractId) {
      throw new ContractNotDeployedError();
    }
    const legs = this.toLegs(input.route);
    return {
      contractId,
      method: input.route.kind === 'split' ? 'swap_exact_in_split' : 'swap_exact_in',
      args: {
        user: input.user,
        amountIn: input.amountIn,
        minAmountOut: input.minAmountOut,
        legs,
        deadline: input.deadline,
      },
    };
  }
}
