import { AssetDetail } from '@/components/assets/AssetDetail';

interface AssetDetailPageProps {
  params: { asset: string };
}

export function generateMetadata({ params }: AssetDetailPageProps) {
  const asset = decodeURIComponent(params.asset);
  return { title: asset };
}

// Single-asset intelligence (PRD §9 requirements): metadata, issuer info,
// price, 24h volume, liquidity and supported markets.
export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  const asset = decodeURIComponent(params.asset);
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <AssetDetail assetId={asset} />
    </main>
  );
}
