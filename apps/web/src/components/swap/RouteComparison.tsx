'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, Spinner } from '@stellariq/ui';
import { clsx } from 'clsx';
import type { RouteKind, RoutesResponse, SwapRoute } from '@stellariq/types';

export interface RouteComparisonProps {
  routes: RoutesResponse | null;
  loading: boolean;
  error: string | null;
  visible: boolean;
  selectedRouteId?: string;
  onSelect?: (routeId: string) => void;
}

const KIND_LABELS: Record<RouteKind, string> = {
  direct: 'Direct',
  'multi-hop': 'Multi-hop',
  split: 'Split across pools',
};

function routePath(route: SwapRoute): string {
  const first = route.steps[0];
  if (!first) {
    return '';
  }
  return [first.inputAsset, ...route.steps.map((s) => s.outputAsset)].join(' → ');
}

/**
 * Route comparison (PRD §14): Route A direct, Route B multi-hop, Route C
 * split with output amounts, highlighting the best net output (PRD §14 core
 * requirement). Selection feeds the breakdown and signing steps.
 */
export function RouteComparison({
  routes,
  loading,
  error,
  visible,
  selectedRouteId,
  onSelect,
}: RouteComparisonProps) {
  const [internalSelection, setInternalSelection] = useState<string | null>(null);

  const bestId = routes?.bestRouteId ?? null;
  const selected = selectedRouteId ?? internalSelection ?? bestId;

  useEffect(() => {
    if (bestId !== null && internalSelection === null) {
      setInternalSelection(bestId);
    }
  }, [bestId, internalSelection]);

  useEffect(() => {
    setInternalSelection(null);
  }, [routes?.from, routes?.to, routes?.inputAmount]);

  if (!visible) {
    return null;
  }

  return (
    <Card title="Compare routes">
      {loading && routes === null ? (
        <Spinner label="Evaluating routes…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : routes === null || routes.routes.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No routes evaluated for this input.</p>
      ) : (
        <ul className="flex flex-col gap-3" role="radiogroup" aria-label="Execution routes">
          {routes.routes.map((route) => {
            const isBest = route.id === routes.bestRouteId;
            const isSelected = route.id === selected;
            return (
              <li key={route.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setInternalSelection(route.id);
                    onSelect?.(route.id);
                  }}
                  className={clsx(
                    'w-full rounded-lg border p-4 text-left transition-colors',
                    isSelected
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">Route {route.id}</span>
                    <span className="text-xs text-muted">{KIND_LABELS[route.kind]}</span>
                    {isBest && <Badge tone="positive">Best net output</Badge>}
                  </div>
                  <p className="mt-2 font-mono text-xl font-semibold">
                    {route.outputAmount.toLocaleString()} {routes.to}
                  </p>
                  {routePath(route) !== '' && (
                    <p className="mt-1 font-mono text-xs text-muted">{routePath(route)}</p>
                  )}
                  <p className="mt-1 font-mono text-xs text-muted">
                    Impact {(route.priceImpact * 100).toFixed(2)}% · Fees{' '}
                    {(route.networkFee + route.protocolFee).toLocaleString()}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
