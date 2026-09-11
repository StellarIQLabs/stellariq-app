import { SwapTerminal } from '@/components/swap/SwapTerminal';
import { WalletButton } from '@/components/swap/WalletButton';

export const metadata = { title: 'Swap' };

// Swap terminal (PRD §13–15): best-execution quotes across Stellar routes.
// You always keep custody of your keys.
export default function SwapPage() {
  return (
    <main className="flex flex-col gap-6 py-2 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Swap</h1>
          <p className="mt-1 text-sm text-muted">
            Best-execution quotes across Stellar routes. You always keep custody of your keys.
          </p>
        </div>
        <WalletButton />
      </header>
      <SwapTerminal />
    </main>
  );
}
