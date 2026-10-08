import { TransactionBuilder, rpc } from '@stellar/stellar-sdk';
import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';

export interface SignResult {
  signedXdr: string;
}

export interface WalletProvider {
  /** Resolves false when no wallet UI can be shown (server-side). */
  detect(): Promise<boolean>;
  /** Opens the wallet picker and returns the chosen account. */
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, networkPassphrase: string): Promise<SignResult>;
  disconnect(): Promise<void>;
}

type Kit = typeof StellarWalletsKit;

const WALLET_ID_KEY = 'siq-wallet-id';
let kitPromise: Promise<Kit> | null = null;

/**
 * Loads Stellar Wallets Kit on first use, in the browser only. The kit and its
 * wallet modules are heavy, so they stay out of the server bundle and out of
 * pages that never touch a wallet.
 */
function loadKit(): Promise<Kit> {
  kitPromise ??= (async () => {
    const [sdk, types, freighter, albedo, xbull, rabet, hana, lobstr] = await Promise.all([
      import('@creit.tech/stellar-wallets-kit/sdk'),
      import('@creit.tech/stellar-wallets-kit/types'),
      import('@creit.tech/stellar-wallets-kit/modules/freighter'),
      import('@creit.tech/stellar-wallets-kit/modules/albedo'),
      import('@creit.tech/stellar-wallets-kit/modules/xbull'),
      import('@creit.tech/stellar-wallets-kit/modules/rabet'),
      import('@creit.tech/stellar-wallets-kit/modules/hana'),
      import('@creit.tech/stellar-wallets-kit/modules/lobstr'),
    ]);
    const kit = sdk.StellarWalletsKit;
    const selectedWalletId = window.localStorage.getItem(WALLET_ID_KEY) ?? undefined;
    kit.init({
      modules: [
        new freighter.FreighterModule(),
        new albedo.AlbedoModule(),
        new xbull.xBullModule(),
        new rabet.RabetModule(),
        new hana.HanaModule(),
        new lobstr.LobstrModule(),
      ],
      network: types.Networks.TESTNET,
      theme: types.SwkAppDarkTheme,
      authModal: { showInstallLabel: true },
      ...(selectedWalletId ? { selectedWalletId } : {}),
    });
    return kit;
  })();
  return kitPromise;
}

function message(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}

/**
 * Any Stellar wallet through Stellar Wallets Kit: Freighter, Albedo (no
 * install needed), xBull, Rabet, Hana and LOBSTR. Signing always happens
 * inside the wallet; secrets never reach this app.
 */
export class StellarWallet implements WalletProvider {
  async detect(): Promise<boolean> {
    return typeof window !== 'undefined';
  }

  async getPublicKey(): Promise<string> {
    const kit = await loadKit();
    try {
      const { address } = await kit.authModal();
      window.localStorage.setItem(WALLET_ID_KEY, kit.selectedModule.productId);
      return address;
    } catch (err: unknown) {
      throw new Error(message(err, 'Wallet connection was cancelled.'));
    }
  }

  async signTransaction(xdr: string, networkPassphrase: string): Promise<SignResult> {
    const kit = await loadKit();
    const address = window.localStorage.getItem('siq-wallet') ?? undefined;
    try {
      const res = await kit.signTransaction(xdr, {
        networkPassphrase,
        ...(address ? { address } : {}),
      });
      return { signedXdr: res.signedTxXdr };
    } catch (err: unknown) {
      throw new Error(message(err, 'Signing was cancelled in your wallet.'));
    }
  }

  async disconnect(): Promise<void> {
    window.localStorage.removeItem(WALLET_ID_KEY);
    if (kitPromise) {
      await (await kitPromise).disconnect().catch(() => undefined);
    }
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
