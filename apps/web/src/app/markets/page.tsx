import { MarketCatalog } from '@/components/markets/MarketCatalog';

export const metadata = { title: 'Markets' };

// Market catalog (PRD §11): base/quote markets with price, 24h change and
// liquidity, sorted by volume.
export default function MarketsPage() {
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <header>
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="mt-1 text-sm text-muted">
          Base/quote markets with price, 24h change and liquidity, sorted by volume.
        </p>
      </header>
      <MarketCatalog />
    </main>
  );
}
