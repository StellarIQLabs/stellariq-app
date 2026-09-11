import { TransactionBuilder, rpc } from '@stellar/stellar-sdk';

/** Minimal Freighter extension surface (window.freighterApi). */
export interface FreighterApi {
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, opts: { networkPassphrase: string }): Promise<string>;
}

declare global {
  interface Window {
    freighterApi?: FreighterApi;
  }
}

export interface SignResult {
  signedXdr: string;
}

export interface WalletProvider {
  readonly id: 'freighter';
  /** False when the extension is not installed (server-side included). */
  isAvailable(): boolean;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, networkPassphrase: string): Promise<SignResult>;
}

export class FreighterWallet implements WalletProvider {
  readonly id = 'freighter' as const;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.freighterApi;
  }

  private api(): FreighterApi {
    if (!this.isAvailable() || !window.freighterApi) {
      throw new Error('Freighter is not installed. Install it to connect a wallet.');
    }
    return window.freighterApi;
  }

  getPublicKey(): Promise<string> {
    return this.api().getPublicKey();
  }

  async signTransaction(xdr: string, networkPassphrase: string): Promise<SignResult> {
    const signedXdr = await this.api().signTransaction(xdr, { networkPassphrase });
    return { signedXdr };
  }
}

export interface SubmitResult {
  hash: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

/**
 * Submits a wallet-signed transaction to Soroban RPC and polls until it
 * leaves PENDING. Private keys never touch this code path — signing happens
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
