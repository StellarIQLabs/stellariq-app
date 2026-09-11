interface AssetDetailProps {
  params: { asset: string };
}

export function generateMetadata({ params }: AssetDetailProps) {
  const asset = decodeURIComponent(params.asset);
  return { title: asset };
}

// Single-asset shell (PRD §9 requirements). Metadata, price, volume,
// liquidity and supported markets compose here in the asset-detail task.
export default function AssetDetailPage({ params }: AssetDetailProps) {
  const asset = decodeURIComponent(params.asset);
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="font-mono text-2xl font-bold">{asset}</h1>
        <p className="mt-1 text-sm text-muted">Asset intelligence, price history and markets.</p>
      </header>
    </main>
  );
}
