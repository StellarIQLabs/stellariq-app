'use client';

import { useCallback, useEffect, useState } from 'react';
import { StellarWallet, truncateKey } from '@/lib/wallet';

export interface WalletState {
  publicKey: string | null;
  connecting: boolean;
  error: string | null;
  available: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const wallet = new StellarWallet();
const STORAGE_KEY = 'siq-wallet';
const CHANGE_EVENT = 'siq-wallet-change';

/**
 * Wallet connection state (any Stellar Wallets Kit wallet). The public key persists across reloads; the
 * secret key never leaves the extension.
 */
export function useWallet(): WalletState {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    void wallet.detect().then(setAvailable);
    // Every component using this hook shares one connection: read the stored
    // key after mount and follow changes made by other instances.
    const sync = () => setPublicKey(window.localStorage.getItem(STORAGE_KEY));
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const key = await wallet.getPublicKey();
      setPublicKey(key);
      window.localStorage.setItem(STORAGE_KEY, key);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed.';
      // Closing the wallet picker is a choice, not an error.
      if (!/closed the modal|cancel/i.test(msg)) {
        setError(msg);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
    void wallet.disconnect();
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { publicKey, connecting, error, available, connect, disconnect };
}

export { truncateKey };
