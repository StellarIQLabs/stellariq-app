'use client';

import { useState } from 'react';
import { SwapForm, type SwapRequest } from './SwapForm';
import { BestExecutionCard } from './BestExecutionCard';
import { useQuote } from '@/hooks/useQuote';

/**
 * Swap terminal (PRD §13–15): input form wired to `GET /v1/quote` with the
 * best-execution result card. Route comparison and wallet signing compose
 * into the result column in later swap tasks.
 */
export function SwapTerminal() {
  const [request, setRequest] = useState<SwapRequest | null>(null);
  const { quote, loading, refreshing, error } = useQuote(request);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <SwapForm onSubmit={setRequest} pending={loading || refreshing} />
      <BestExecutionCard
        quote={quote}
        loading={loading}
        refreshing={refreshing}
        error={error}
        idle={request === null}
      />
    </div>
  );
}
