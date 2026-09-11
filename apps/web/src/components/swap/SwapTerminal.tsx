'use client';

import { useState } from 'react';
import { Button } from '@stellariq/ui';
import { SwapForm, type SwapRequest } from './SwapForm';
import { BestExecutionCard } from './BestExecutionCard';
import { RouteComparison } from './RouteComparison';
import { RouteBreakdown } from './RouteBreakdown';
import { SwapReviewModal } from './SwapReviewModal';
import { useQuote } from '@/hooks/useQuote';
import { useRoutes } from '@/hooks/useRoutes';
import { useWallet } from '@/hooks/useWallet';

/**
 * Swap terminal (PRD §13–15): quote → route selection → review modal →
 * unsigned transaction → wallet sign → confirmation.
 */
export function SwapTerminal() {
  const [request, setRequest] = useState<SwapRequest | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { quote, loading, refreshing, error } = useQuote(request);
  const { routes, loading: routesLoading, error: routesError } = useRoutes(request);
  const { publicKey } = useWallet();

  const bestRouteId = routes?.bestRouteId ?? null;
  const selectedRoute =
    routes?.routes.find((r) => r.id === (selectedRouteId ?? bestRouteId ?? '')) ?? null;
  const canReview = request !== null && quote !== null && selectedRoute !== null;

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
        {canReview && (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setReviewOpen(true)} disabled={publicKey === null}>
              Review swap
            </Button>
            {publicKey === null && (
              <p className="text-center text-xs text-muted">
                Connect a wallet to review and sign the swap.
              </p>
            )}
          </div>
        )}
      </div>
      {reviewOpen && request && quote && selectedRoute && publicKey && (
        <SwapReviewModal
          request={request}
          quote={quote}
          route={selectedRoute}
          userPublicKey={publicKey}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}
