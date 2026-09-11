import { MarketDetail } from '@/components/markets/MarketDetail';

interface MarketDetailPageProps {
  params: { pair: string };
}

export function generateMetadata({ params }: MarketDetailPageProps) {
  const pair = decodeURIComponent(params.pair);
  return { title: pair };
}

// Market detail (PRD §20): price header, timeframe tabs and sections for
// chart, volume, liquidity and trades.
export default function MarketDetailPage({ params }: MarketDetailPageProps) {
  const pair = decodeURIComponent(params.pair);
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <MarketDetail pair={pair} />
    </main>
  );
}
