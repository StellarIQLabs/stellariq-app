interface MarketDetailProps {
  params: { pair: string };
}

export function generateMetadata({ params }: MarketDetailProps) {
  const pair = decodeURIComponent(params.pair);
  return { title: pair };
}

// Market detail shell (PRD §20). Price header, timeframe tabs, price chart,
// volume/liquidity charts and the trades table compose here in later tasks.
export default function MarketDetailPage({ params }: MarketDetailProps) {
  const pair = decodeURIComponent(params.pair);
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="font-mono text-2xl font-bold">{pair}</h1>
        <p className="mt-1 text-sm text-muted">Price, volume, liquidity and recent trades.</p>
      </header>
    </main>
  );
}
