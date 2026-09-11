export const metadata = { title: 'Pools' };

// Pool catalog shell (PRD §12). Protocol filters and the TVL-ordered pool
// table compose here in the pool-catalog task.
export default function PoolsPage() {
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Pools</h1>
        <p className="mt-1 text-sm text-muted">
          Liquidity pools with protocol, pair, TVL, volume and fees.
        </p>
      </header>
      <section aria-label="Pool catalog">
        <p className="text-sm text-muted">The pool catalog renders here.</p>
      </section>
    </main>
  );
}
