export const metadata = { title: 'Assets' };

// Asset catalog shell (PRD §9). Search, filters and the registry table
// compose here in the asset-catalog task.
export default function AssetsPage() {
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Assets</h1>
        <p className="mt-1 text-sm text-muted">
          Every indexed Stellar asset with issuer, verification status and current price.
        </p>
      </header>
      <section aria-label="Asset catalog">
        <p className="text-sm text-muted">The searchable asset catalog renders here.</p>
      </section>
    </main>
  );
}
