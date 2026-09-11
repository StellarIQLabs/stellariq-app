import { PoolDetail } from '@/components/pools/PoolDetail';

interface PoolDetailPageProps {
  params: { pool: string };
}

export function generateMetadata({ params }: PoolDetailPageProps) {
  const pool = decodeURIComponent(params.pool);
  return { title: `Pool ${pool}` };
}

// Pool detail (PRD §12 metrics): reserves, TVL, fees, volume/TVL ratio, trade
// count and estimated price impact.
export default function PoolDetailPage({ params }: PoolDetailPageProps) {
  const pool = decodeURIComponent(params.pool);
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <PoolDetail poolId={pool} />
    </main>
  );
}
