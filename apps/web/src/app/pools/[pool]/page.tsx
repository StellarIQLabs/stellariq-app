interface PoolDetailProps {
  params: { pool: string };
}

export function generateMetadata({ params }: PoolDetailProps) {
  const pool = decodeURIComponent(params.pool);
  return { title: `Pool ${pool}` };
}

// Pool detail shell (PRD §12 metrics). Reserves, TVL, fees, volume/TVL,
// trade count and price impact compose here in the pool-detail task.
export default function PoolDetailPage({ params }: PoolDetailProps) {
  const pool = decodeURIComponent(params.pool);
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="font-mono text-2xl font-bold">Pool {pool}</h1>
        <p className="mt-1 text-sm text-muted">Reserves, fees, volume and liquidity analytics.</p>
      </header>
    </main>
  );
}
