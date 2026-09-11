import { describe, expect, it } from 'vitest';
import type { SwapRoute } from '@stellariq/types';
import { ContractNotDeployedError, StubRouterClient, poolToContractId } from './contracts.js';

const DIRECT_ROUTE: SwapRoute = {
  id: 'A',
  kind: 'direct',
  outputAmount: 2367.91,
  priceImpact: 0.0018,
  networkFee: 0.24,
  protocolFee: 7.11,
  steps: [
    { protocol: 'soroswap', poolId: 'xlm-usdc-soroswap', inputAsset: 'XLM', outputAsset: 'USDC' },
  ],
  isBest: true,
};

const SPLIT_ROUTE: SwapRoute = {
  ...DIRECT_ROUTE,
  id: 'C',
  kind: 'split',
  steps: [
    ...DIRECT_ROUTE.steps,
    { protocol: 'phoenix', poolId: 'xlm-usdc-phoenix', inputAsset: 'XLM', outputAsset: 'USDC' },
  ],
};

describe('router stubs', () => {
  it('maps direct routes to a single full-weight leg', () => {
    const legs = new StubRouterClient('CAAA').toLegs(DIRECT_ROUTE);
    expect(legs).toHaveLength(1);
    expect(legs[0]).toMatchObject({ poolContractId: 'xlm-usdc-soroswap', shareBps: 10000 });
  });

  it('splits legs evenly and keeps 10000 bps total', () => {
    const legs = new StubRouterClient('CAAA').toLegs(SPLIT_ROUTE);
    expect(legs).toHaveLength(2);
    expect(legs.reduce((sum, leg) => sum + leg.shareBps, 0)).toBe(10000);
  });

  it('resolves pool ids 1:1 until the registry ships', () => {
    expect(poolToContractId('xlm-usdc-soroswap')).toBe('xlm-usdc-soroswap');
  });

  it('guards invocation building behind deployment', () => {
    const stub = new StubRouterClient();
    expect(stub.contractId()).toBeNull();
    expect(() =>
      stub.buildInvocation({
        route: DIRECT_ROUTE,
        user: 'GUSER',
        amountIn: '100',
        minAmountOut: '90',
        deadline: 1,
      }),
    ).toThrow(ContractNotDeployedError);
  });

  it('builds split invocations against the configured router', () => {
    const invocation = new StubRouterClient('CAAA').buildInvocation({
      route: SPLIT_ROUTE,
      user: 'GUSER',
      amountIn: '100',
      minAmountOut: '90',
      deadline: 1,
    });
    expect(invocation).toMatchObject({ contractId: 'CAAA', method: 'swap_exact_in_split' });
    expect(invocation.args.legs).toHaveLength(2);
  });
});
