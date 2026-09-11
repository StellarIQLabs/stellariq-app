'use client';

import Link from 'next/link';
import { Badge, Card, Spinner, Table } from '@stellariq/ui';
import { useOverviewData } from '@/hooks/useOverviewData';
import { formatCount, formatTime, formatUsd } from '@/lib/format';
import { SummaryStatCards } from './SummaryStatCards';
import { TopMarketsTable } from './TopMarketsTable';

/**
 * Overview dashboard (PRD §19): Stellar DeFi totals plus sections for top
 * markets, top pools and large swaps. Each section handles loading, error and
 * empty states; dedicated components (stat cards, sortable tables, live feed)
 * replace these generic renderings in later dashboard tasks.
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

        <Card
          title="Top pools"
          action={
            <Link href="/pools" className="text-sm text-accent hover:underline">
              View all
            </Link>
          }
        >
          <Table
            columns={[
              {
                key: 'pair',
                header: 'Pool',
                render: (p) => (
                  <span className="font-mono">
                    {p.tokenA}/{p.tokenB}
                  </span>
                ),
              },
              {
                key: 'protocol',
                header: 'Protocol',
                render: (p) => <Badge tone="accent">{p.protocol}</Badge>,
              },
              {
                key: 'tvl',
                header: 'TVL',
                align: 'right',
                render: (p) => <span className="font-mono">{formatUsd(p.tvl)}</span>,
              },
            ]}
            rows={data.pools}
            keyOf={(p) => p.id}
            emptyMessage="No pools indexed yet."
          />
        </Card>
      </div>

      <Card
        title="Large swaps"
        action={
          <Link href="/markets" className="text-sm text-accent hover:underline">
            Explore markets
          </Link>
        }
      >
        {data.swaps.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No swaps observed yet.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {data.swaps.slice(0, 6).map((swap) => (
              <li key={swap.id} className="flex items-center gap-3 py-2.5 text-sm">
                {swap.isLarge && <Badge tone="warning">Whale</Badge>}
                <span className="font-mono">
                  {formatCount(swap.inputAmount)} {swap.inputAsset} →{' '}
                  {formatCount(swap.outputAmount)} {swap.outputAsset}
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-muted">
                  {formatTime(swap.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
