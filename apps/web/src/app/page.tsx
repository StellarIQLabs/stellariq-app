import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';

export const metadata = { title: 'Overview' };

// Overview dashboard (PRD §19): Stellar DeFi totals with sections for top
// markets, top pools and large swaps.
export default function OverviewPage() {
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">StellarIQ</p>
        <h1 className="mt-1 text-3xl font-bold">Stellar DeFi Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Aggregated volume, liquidity and trading activity across Stellar markets and pools.
        </p>
      </header>
      <OverviewDashboard />
    </main>
  );
}
