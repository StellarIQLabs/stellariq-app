'use client';

import { useState } from 'react';
import { Card } from '@stellariq/ui';
import { SwapForm, type SwapRequest } from './SwapForm';

/**
 * Swap terminal shell (PRD §13–15): input form on the left, quote results on
 * the right. The quote-fetching flow, best execution, route comparison and
 * wallet signing compose into the result panel in later swap tasks.
 */
export function SwapTerminal() {
  const [request, setRequest] = useState<SwapRequest | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SwapForm onSubmit={setRequest} />
      <Card title="Best execution">
        {request === null ? (
          <p className="py-4 text-center text-sm text-muted">
            Enter an amount and request a quote to compare execution routes.
          </p>
        ) : (
          <p className="py-4 text-center font-mono text-sm">
            {request.amount} {request.from} → {request.to}
          </p>
        )}
      </Card>
    </div>
  );
}
