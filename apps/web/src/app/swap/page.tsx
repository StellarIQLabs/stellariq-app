export const metadata = { title: 'Swap' };

// Swap terminal shell (PRD §13–15). The quote form, best-execution card,
// route comparison and wallet flow compose here in the swap tasks.
export default function SwapPage() {
  return (
    <main className="flex flex-col gap-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Swap</h1>
        <p className="mt-1 text-sm text-muted">
          Best-execution quotes across Stellar routes. You always keep custody of your keys.
        </p>
      </header>
      <section aria-label="Swap terminal">
        <p className="text-sm text-muted">The swap terminal renders here.</p>
      </section>
    </main>
  );
}
