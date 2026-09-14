import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MockDataSource } from '../data/mock.js';
import { evaluateRoutes, toQuote, toRoutesResponse } from './routing.js';

const source = new MockDataSource();

describe('routing engine', () => {
  it('evaluates direct, multi-hop and split routes for XLM/USDC', async () => {
    const routes = await evaluateRoutes(source, 'XLM', 'USDC', 10000);
    const kinds = new Set(routes.map((r) => r.kind));
    assert.ok(routes.length >= 2);
    assert.ok(kinds.has('direct'));
    assert.ok(routes.some((r) => r.isBest));
  });

  it('ranks by net output, not headline fee', async () => {
    const routes = await evaluateRoutes(source, 'XLM', 'USDC', 10000);
    const net = (r: { outputAmount: number; networkFee: number; protocolFee: number }): number =>
      r.outputAmount - r.networkFee - r.protocolFee;
    for (let i = 1; i < routes.length; i++) {
      const prev = routes[i - 1];
      const current = routes[i];
      assert.ok(prev && current && net(prev) >= net(current));
    }
    assert.equal(routes.find((r) => r.isBest)?.id, routes[0]?.id);
  });

  it('finds a multi-hop path where no direct pool exists', async () => {
    const routes = await evaluateRoutes(source, 'XLM', 'EURC', 500);
    assert.ok(routes.length > 0);
    assert.ok(routes.every((r) => r.outputAmount > 0));
    assert.ok(routes.every((r) => r.priceImpact >= 0));
  });

  it('returns no routes for unknown assets', async () => {
    assert.deepEqual(await evaluateRoutes(source, 'NOPE', 'USDC', 10), []);
    assert.equal(toQuote('NOPE', 'USDC', 10, []), null);
  });

  it('builds quote and routes responses from ranked routes', async () => {
    const routes = await evaluateRoutes(source, 'XLM', 'USDC', 10000);
    const quote = toQuote('XLM', 'USDC', 10000, routes);
    assert.ok(quote);
    assert.equal(quote?.routeId, routes.find((r) => r.isBest)?.id);
    const response = toRoutesResponse('XLM', 'USDC', 10000, routes);
    assert.equal(response.bestRouteId, quote?.routeId);
    assert.equal(response.routes.length, routes.length);
  });
});
