'use client';

import { useState } from 'react';
import { SwapForm, type SwapRequest } from './SwapForm';
import { BestExecutionCard } from './BestExecutionCard';
import { RouteComparison } from './RouteComparison';
import { useQuote } from '@/hooks/useQuote';

/**
 * Swap terminal (PRD §13–15): input form wired to quote and route endpoints
 * with best execution and route comparison. Wallet signing composes into the
 * result column in later swap tasks.
 */
export function SwapTerminal() {
  const [request, setRequest] = useState<SwapRequest | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
  const { quote, loading, refreshing, error } = useQuote(request);

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
          request={request}
          {...(selectedRouteId !== undefined ? { selectedRouteId } : {})}
          onSelect={setSelectedRouteId}
        />
      </div>
    </div>
  );
}
