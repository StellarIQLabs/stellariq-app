'use client';

import { Button } from '@stellariq/ui';
import { truncateKey, useWallet } from '@/hooks/useWallet';

/** Connect/disconnect control for the Freighter wallet. */
export function WalletButton() {
  const { publicKey, connecting, error, available, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <span className="inline-flex h-9 items-center gap-2">
        <span
          className="rounded-full bg-positive/15 px-3 py-1.5 font-mono text-xs text-positive"
          title={publicKey}
        >
          {truncateKey(publicKey)}
        </span>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </span>
    );
  }

  if (!available) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noreferrer"
        title="Install Freighter and switch it to Testnet"
        className="inline-flex h-9 items-center whitespace-nowrap rounded-md border border-border px-3 text-sm font-medium text-text hover:border-accent"
      >
        Install Freighter
      </a>
    );
  }

  return (
    <span className="relative inline-flex items-center">
      <Button
        size="sm"
        className="h-9 whitespace-nowrap"
        loading={connecting}
        onClick={() => void connect()}
      >
        Connect wallet
      </Button>
      {error && (
        <span
          role="alert"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-md border border-border bg-surface p-2 text-xs text-negative shadow-lg"
        >
          {error}
        </span>
      )}
    </span>
  );
}
