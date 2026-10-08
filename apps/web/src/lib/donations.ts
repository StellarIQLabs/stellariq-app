import {
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from '@stellar/stellar-sdk';
import { getWebEnv } from './env';

export interface Campaign {
  id: number;
  title: string;
  description: string;
  creator: string;
  beneficiary: string;
  token: string;
  goal: string;
  raised: string;
  progressPct: number;
  deadline: string;
  createdAt: string;
  donorCount: number;
  donationCount: number;
  open: boolean;
  status: 'active' | 'closed' | 'ended';
}

export interface Receipt {
  id: number;
  campaignId: number;
  donor: string;
  amount: string;
  memo: string;
  timestamp: string;
  ledger: number;
}

export interface DonationStats {
  campaigns: number;
  activeCampaigns: number;
  donations: number;
  donors: number;
  totalRaised: string;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const base = getWebEnv().apiBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? 'Not found.'
        : `The StellarIQ API returned ${res.status}. Retry shortly.`,
    );
  }
  return (await res.json()) as T;
}

export const fetchCampaigns = (signal?: AbortSignal) =>
  get<{ data: Campaign[] }>('/v1/campaigns', signal).then((r) => r.data);
export const fetchCampaign = (id: number, signal?: AbortSignal) =>
  get<Campaign>(`/v1/campaigns/${id}`, signal);
export const fetchCampaignDonations = (id: number, limit = 10, signal?: AbortSignal) =>
  get<{ data: Receipt[] }>(`/v1/campaigns/${id}/donations?limit=${limit}`, signal).then(
    (r) => r.data,
  );
export const fetchRecentDonations = (limit = 8, signal?: AbortSignal) =>
  get<{ data: Receipt[] }>(`/v1/donations?limit=${limit}`, signal).then((r) => r.data);
export const fetchDonationStats = (signal?: AbortSignal) =>
  get<DonationStats>('/v1/donations/stats', signal);
export const fetchReceipt = (id: number, signal?: AbortSignal) =>
  get<Receipt>(`/v1/receipts/${id}`, signal);

/** Whole-unit decimal string to i128 stroops (7 decimals). */
export function toStroops(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
    throw new Error('Enter an amount like 10 or 2.5 (up to 7 decimals).');
  }
  const [whole = '0', frac = ''] = trimmed.split('.');
  return BigInt(whole) * 10_000_000n + BigInt(`${frac}0000000`.slice(0, 7));
}

export function formatAmount(value: string, symbol = 'XLM'): string {
  const n = Number(value);
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${symbol}`;
}

const NATIVE_XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

export function tokenSymbol(token: string): string {
  return token === NATIVE_XLM_SAC ? 'XLM' : `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function explorerUrl(kind: 'tx' | 'contract' | 'account', id: string): string {
  const network = getWebEnv().stellarNetwork === 'mainnet' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/${kind}/${id}`;
}

export function daysLeft(deadlineIso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(deadlineIso).getTime() - now) / 86_400_000));
}

/** Gives a new testnet account 10,000 XLM from Friendbot so anyone can try a donation. */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok && res.status !== 400) {
    throw new Error('Friendbot is unavailable right now. Try again in a minute.');
  }
}

export interface DonateInput {
  donor: string;
  campaignId: number;
  amount: string;
  memo: string;
}

/**
 * Builds and prepares (simulates, adds footprint and fees) an unsigned
 * `donate` transaction. The wallet signs it; StellarIQ never sees a secret.
 */
export async function buildDonateTransaction(input: DonateInput): Promise<string> {
  const env = getWebEnv();
  const server = new rpc.Server(env.sorobanRpcUrl);
  const { passphrase } = await server.getNetwork();
  let account;
  try {
    account = await server.getAccount(input.donor);
  } catch {
    throw new Error('This wallet has no testnet XLM yet. Use "Get test XLM" first.');
  }
  const op = new Contract(env.donationsContractId).call(
    'donate',
    Address.fromString(input.donor).toScVal(),
    nativeToScVal(input.campaignId, { type: 'u32' }),
    nativeToScVal(toStroops(input.amount), { type: 'i128' }),
    nativeToScVal(input.memo.slice(0, 280), { type: 'string' }),
  );
  const tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: passphrase })
    .addOperation(op)
    .setTimeout(300)
    .build();
  try {
    const prepared = await server.prepareTransaction(tx);
    return prepared.toXDR();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/#9\b/.test(msg)) throw new Error('This campaign is closed.');
    if (/#10\b/.test(msg)) throw new Error('This campaign has ended.');
    if (/#13\b/.test(msg)) throw new Error('The beneficiary cannot donate to their own campaign.');
    if (/balance|#10\)|insufficient/i.test(msg))
      throw new Error('Not enough XLM for this donation.');
    throw new Error('The network rejected this donation during simulation.');
  }
}

export interface DonateResult {
  hash: string;
  receiptId: number | null;
}

/** Submits a wallet-signed donation and waits for its receipt id. */
export async function submitDonation(signedXdr: string): Promise<DonateResult> {
  const env = getWebEnv();
  const server = new rpc.Server(env.sorobanRpcUrl);
  const { passphrase } = await server.getNetwork();
  const sent = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, passphrase));
  if (sent.status === 'ERROR') {
    throw new Error('The network rejected the transaction.');
  }
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = await server.getTransaction(sent.hash);
    if (res.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      const id = res.returnValue ? Number(scValToNative(res.returnValue)) : null;
      return { hash: sent.hash, receiptId: id };
    }
    if (res.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('The donation failed on-chain. No funds were moved.');
    }
  }
  return { hash: sent.hash, receiptId: null };
}
