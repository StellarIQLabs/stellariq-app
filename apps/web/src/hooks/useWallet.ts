'use client';

import { useCallback, useState } from 'react';
import { FreighterWallet, truncateKey } from '@/lib/wallet';

export interface WalletState {
  publicKey: string | null;
  connecting: boolean;
  error: string | null;
  available: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const wallet = new FreighterWallet();

/**
 * Freighter connection state. The public key persists across reloads; the
 * secret key never leaves the extension.
 */
export function useWallet(): WalletState {
  const [publicKey, setPublicKey] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.localStorage.getItem('siq-wallet'),
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const key = await wallet.getPublicKey();
      setPublicKey(key);
      window.localStorage.setItem('siq-wallet', key);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
    window.localStorage.removeItem('siq-wallet');
  }, []);

  return { publicKey, connecting, error, available: wallet.isAvailable(), connect, disconnect };
}

export { truncateKey };
