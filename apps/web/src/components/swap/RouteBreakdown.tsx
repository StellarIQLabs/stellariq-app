'use client';

import { Badge, Card } from '@stellariq/ui';
import type { SwapRoute } from '@stellariq/types';

export interface RouteBreakdownProps {
  route: SwapRoute | null;
  bestRouteId: string | null;
  outputAsset: string;
}

function impactTone(impact: number): 'positive' | 'warning' | 'negative' {
  if (impact < 0.001) {
    return 'positive';
  }
  if (impact < 0.01) {
    return 'warning';
  }
  return 'negative';
}

/**
 * Per-route price impact and fee breakdown with an explainer for why the
 * winning route is best on net output rather than headline fees.
 */
export function RouteBreakdown({ route, bestRouteId, outputAsset }: RouteBreakdownProps) {
  if (route === null) {
    return null;
  }
  const isBest = route.id === bestRouteId;
  const totalFees = route.networkFee + route.protocolFee;
  const netOutput = route.outputAmount - totalFees;

  return (
    <Card
      title={`Route ${route.id} breakdown`}
      action={isBest ? <Badge tone="positive">Selected best</Badge> : undefined}
    >
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Price impact</dt>
          <dd>
            <Badge tone={impactTone(route.priceImpact)}>
              {(route.priceImpact * 100).toFixed(2)}%
            </Badge>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Network fee</dt>
          <dd className="font-mono">
            {route.networkFee.toLocaleString()} {outputAsset}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Protocol fee</dt>
          <dd className="font-mono">
            {route.protocolFee.toLocaleString()} {outputAsset}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-2">
          <dt className="text-muted">Net output</dt>
          <dd className="font-mono font-semibold">
            {netOutput.toLocaleString()} {outputAsset}
          </dd>
        </div>
      </dl>

      <details className="group mt-4 rounded-md border border-border/60 p-3 text-sm">
        <summary
          className="cursor-pointer text-accent hover:underline"
          title="The routing engine optimizes for net output, not the lowest advertised fee"
        >
          Why {isBest ? 'this route wins' : 'this route loses'}?
        </summary>
        <p className="mt-2 text-muted">
          Gross output {route.outputAmount.toLocaleString()} minus {totalFees.toLocaleString()} in
          fees leaves {netOutput.toLocaleString()} {outputAsset} after{' '}
          {(route.priceImpact * 100).toFixed(2)}% price impact. The engine recommends the route with
          the highest net output — a lower fee can still lose when impact or gross output differs.
        </p>
      </details>
    </Card>
  );
}
