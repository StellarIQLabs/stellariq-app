'use client';

import { useState } from 'react';
import { SwapForm, type SwapRequest } from './SwapForm';
import { BestExecutionCard } from './BestExecutionCard';
import { RouteComparison } from './RouteComparison';
import { RouteBreakdown } from './RouteBreakdown';
import { useQuote } from '@/hooks/useQuote';
import { useRoutes } from '@/hooks/useRoutes';

/**
 * Swap terminal (PRD §13–15): input form wired to quote and route endpoints
 * with best execution, route comparison and per-route impact/fee breakdown.
 * Wallet signing composes into the result column in later swap tasks.
 */
export function SwapTerminal() {
  const [request, setRequest] = useState<SwapRequest | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
  const { quote, loading, refreshing, error } = useQuote(request);
  const { routes, loading: routesLoading, error: routesError } = useRoutes(request);

  const bestRouteId = routes?.bestRouteId ?? null;
  const selectedRoute =
    routes?.routes.find((r) => r.id === (selectedRouteId ?? bestRouteId ?? '')) ?? null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <SwapForm onSubmit={setRequest} pending={loading || refreshing} />
      <div className="flex flex-col gap-6">
        <BestExecutionCard
          quote={quote}
          loading={loading}
          refreshing={refreshing}
          error={error}
          idle={request === null}
        />
        <RouteComparison
          routes={routes}
          loading={routesLoading}
          error={routesError}
          visible={request !== null}
          {...(selectedRouteId !== undefined ? { selectedRouteId } : {})}
          onSelect={setSelectedRouteId}
        />
        {request !== null && routes !== null && (
          <RouteBreakdown
            route={selectedRoute}
            bestRouteId={bestRouteId}
            outputAsset={request.to}
          />
        )}
      </div>
    </div>
  );
}
