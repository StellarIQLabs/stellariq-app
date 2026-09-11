import { AssetCatalog } from '@/components/assets/AssetCatalog';

export const metadata = { title: 'Assets' };

// Asset catalog (PRD §9): searchable, filterable registry with verification
// badges and current prices.
export default function AssetsPage() {
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <header>
        <h1 className="text-2xl font-bold">Assets</h1>
        <p className="mt-1 text-sm text-muted">
          Every indexed Stellar asset with issuer, verification status and current price.
        </p>
      </header>
      <AssetCatalog />
    </main>
  );
}
