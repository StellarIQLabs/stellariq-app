'use client';

import { Button } from '@stellariq/ui';
import { truncateKey, useWallet } from '@/hooks/useWallet';

/** Connect/disconnect control for the Freighter wallet. */
export function WalletButton() {
  const { publicKey, connecting, error, available, connect, disconnect } = useWallet();

  if (publicKey) {
    return (
      <span className="inline-flex items-center gap-2">
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

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button size="sm" loading={connecting} onClick={() => void connect()}>
        Connect wallet
      </Button>
      {!available && !connecting && (
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted hover:text-text"
        >
          Install Freighter to sign swaps
        </a>
      )}
      {error && (
        <span role="alert" className="text-xs text-negative">
          {error}
        </span>
      )}
    </span>
  );
}
