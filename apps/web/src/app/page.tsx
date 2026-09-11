import Link from 'next/link';

export const metadata = { title: 'Overview' };

// Overview dashboard shell (PRD §19). Live sections — totals, top markets,
// top pools, large swaps — are composed here by the dashboard tasks.
export default function OverviewPage() {
  return (
    <main className="flex flex-col gap-8 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">StellarIQ</p>
        <h1 className="mt-1 text-3xl font-bold">Stellar DeFi Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Aggregated volume, liquidity and trading activity across Stellar markets and pools.
        </p>
      </header>

      <section aria-label="Network totals" className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Volume 24h</p>
          <p className="mt-2 font-mono text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Total value locked</p>
          <p className="mt-2 font-mono text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Trades 24h</p>
          <p className="mt-2 font-mono text-2xl font-semibold">—</p>
        </div>
      </section>

      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Explore">
        <Link
          className="rounded-md border border-border px-4 py-2 hover:border-accent"
          href="/markets"
        >
          Explore markets
        </Link>
        <Link
          className="rounded-md border border-border px-4 py-2 hover:border-accent"
          href="/pools"
        >
          Explore pools
        </Link>
        <Link
          className="rounded-md border border-border px-4 py-2 hover:border-accent"
          href="/assets"
        >
          Browse assets
        </Link>
        <Link className="rounded-md bg-accent px-4 py-2 font-medium text-white" href="/swap">
          Open swap terminal
        </Link>
      </nav>
    </main>
  );
}
