import Link from 'next/link';
import { Badge } from '@stellariq/ui';
import { getWebEnv } from '@/lib/env';
import { WalletButton } from '@/components/swap/WalletButton';

export function SiteHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { stellarNetwork } = getWebEnv();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-md p-2 text-muted hover:bg-surface-raised hover:text-text md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2" aria-label="StellarIQ Give home">
          <img src="/icon.svg" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="whitespace-nowrap text-base font-bold tracking-tight">
            StellarIQ Give
          </span>
        </Link>
        <Badge tone="accent" className="hidden sm:inline-flex">
          {stellarNetwork}
        </Badge>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="hidden h-9 items-center rounded-md bg-positive px-4 text-sm font-medium text-white hover:brightness-110 sm:inline-flex"
          >
            Donate
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
