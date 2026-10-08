import { TransactionBuilder, rpc } from '@stellar/stellar-sdk';
import {
  isConnected,
  requestAccess,
  signTransaction as freighterSign,
} from '@stellar/freighter-api';

export interface SignResult {
  signedXdr: string;
}

export interface WalletProvider {
  readonly id: 'freighter';
  /** Resolves false when the extension is not installed (server-side included). */
  detect(): Promise<boolean>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, networkPassphrase: string): Promise<SignResult>;
}

/**
 * Freighter via the official `@stellar/freighter-api` bridge. Current
 * Freighter builds no longer inject `window.freighterApi`, so the bridge is
 * the only reliable way to talk to the extension.
 */
export class FreighterWallet implements WalletProvider {
  readonly id = 'freighter' as const;

  async detect(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const res = await isConnected();
      return !res.error && res.isConnected;
    } catch {
      return false;
    }
  }

  async getPublicKey(): Promise<string> {
    if (!(await this.detect())) {
      throw new Error('Freighter is not installed. Install it to connect a wallet.');
    }
    const res = await requestAccess();
    if (res.error || !res.address) {
      throw new Error(res.error?.message ?? 'Freighter did not share an address.');
    }
    return res.address;
  }

  async signTransaction(xdr: string, networkPassphrase: string): Promise<SignResult> {
    const res = await freighterSign(xdr, { networkPassphrase });
    if (res.error || !res.signedTxXdr) {
      throw new Error(res.error?.message ?? 'Signing was cancelled in Freighter.');
    }
    return { signedXdr: res.signedTxXdr };
  }
}

export interface SubmitResult {
  hash: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

/**
 * Submits a wallet-signed transaction to Soroban RPC and polls until it
 * leaves PENDING. Private keys never touch this code path - signing happens
 * exclusively inside the wallet extension.
 */
export async function submitSignedTransaction(
  signedXdr: string,
  rpcUrl: string,
  attempts = 20,
): Promise<SubmitResult> {
  const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
  const network = await server.getNetwork();
  const sent = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, network.passphrase),
  );
  if (sent.status === 'ERROR') {
    return { hash: sent.hash, status: 'FAILED' };
  }
  let status: SubmitResult['status'] = 'PENDING';
  for (let i = 0; i < attempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const latest = await server.getTransaction(sent.hash);
    if (latest.status === 'SUCCESS' || latest.status === 'FAILED') {
      status = latest.status;
      break;
    }
  }
  return { hash: sent.hash, status };
}

export function truncateKey(publicKey: string): string {
  return publicKey.length > 12 ? `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}` : publicKey;
}
