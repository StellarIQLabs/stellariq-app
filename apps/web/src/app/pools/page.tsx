import { PoolCatalog } from '@/components/pools/PoolCatalog';

export const metadata = { title: 'Pools' };

// Pool catalog (PRD §12): protocol, token pair, TVL, volume and fee with
// protocol filter.
export default function PoolsPage() {
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <header>
        <h1 className="text-2xl font-bold">Pools</h1>
        <p className="mt-1 text-sm text-muted">
          Liquidity pools with protocol, pair, TVL, volume and fees.
        </p>
      </header>
      <PoolCatalog />
    </main>
  );
}
