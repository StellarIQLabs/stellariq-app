'use client';

import { Card, Spinner } from '@stellariq/ui';
import { useOverviewData } from '@/hooks/useOverviewData';
import { SummaryStatCards } from './SummaryStatCards';
import { TopMarketsTable } from './TopMarketsTable';
import { TopPoolsTable } from './TopPoolsTable';
import { LargeSwapsFeed } from './LargeSwapsFeed';

/**
 * Overview dashboard (PRD §19): Stellar DeFi totals plus sections for top
 * markets, top pools and the live large-swaps feed.
 */
export function OverviewDashboard() {
  const { data, loading, error } = useOverviewData();

  if (loading) {
    return <Spinner label="Loading Stellar DeFi overview…" />;
  }

  if (error !== null || data === null) {
    return (
      <Card title="Overview unavailable">
        <p className="text-sm text-negative">{error ?? 'Unexpected empty response.'}</p>
        <p className="mt-2 text-sm text-muted">
          Start the StellarIQ API (<span className="font-mono">pnpm dev:api</span>) and reload.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SummaryStatCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopMarketsTable markets={data.markets} />
        <TopPoolsTable pools={data.pools} />
      </div>

      <LargeSwapsFeed />
    </div>
  );
}
