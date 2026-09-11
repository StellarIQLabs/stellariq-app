export const metadata = { title: 'Markets' };

// Market catalog shell (PRD §11). The sortable pair table ordered by volume
// composes here in the market-catalog task.
export default function MarketsPage() {
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="mt-1 text-sm text-muted">
          Base/quote markets with price, 24h change and liquidity, sorted by volume.
        </p>
      </header>
      <section aria-label="Market catalog">
        <p className="text-sm text-muted">The market catalog renders here.</p>
      </section>
    </main>
  );
}
