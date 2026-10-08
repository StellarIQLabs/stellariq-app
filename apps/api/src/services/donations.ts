import {
  Account,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  type xdr,
} from '@stellar/stellar-sdk';

/** Testnet deployment of `stellariq-contract/contracts/donations`. */
export const DEFAULT_DONATIONS_CONTRACT_ID =
  'CBCHKIDRFJ4KO2DGJEP75NJPYN65YVD6QOVVHC5IU7PRTHGHW75OF2KX';
export const DEFAULT_SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

/** Amounts are returned as decimal strings in whole token units (7 decimals). */
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

export interface DonationsReader {
  readonly contractId: string;
  listCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | null>;
  getReceipt(id: number): Promise<Receipt | null>;
  /** Most recent receipts, newest first, optionally for one campaign. */
  recentReceipts(limit: number, campaignId?: number): Promise<Receipt[]>;
  stats(): Promise<DonationStats>;
}

const STROOPS = 10_000_000n;

export function stroopsToDecimal(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / STROOPS;
  const frac = (abs % STROOPS).toString().padStart(7, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
}

export function decimalToStroops(value: string): bigint {
  const [whole = '0', frac = ''] = value.split('.');
  return BigInt(whole) * STROOPS + BigInt(`${frac}0000000`.slice(0, 7));
}

function toIso(seconds: bigint | number): string {
  return new Date(Number(seconds) * 1000).toISOString();
}

interface RawCampaign {
  id: number;
  title: string;
  description: string;
  creator: string;
  beneficiary: string;
  token: string;
  goal: bigint;
  raised: bigint;
  deadline: bigint;
  created_at: bigint;
  donor_count: number;
  donation_count: number;
  open: boolean;
}

interface RawReceipt {
  id: bigint;
  campaign_id: number;
  donor: string;
  amount: bigint;
  memo: string;
  timestamp: bigint;
  ledger: number;
}

export function mapCampaign(raw: RawCampaign, nowMs = Date.now()): Campaign {
  const ended = Number(raw.deadline) * 1000 < nowMs;
  const pct = raw.goal > 0n ? Number((raw.raised * 10_000n) / raw.goal) / 100 : 0;
  return {
    id: Number(raw.id),
    title: raw.title,
    description: raw.description,
    creator: raw.creator,
    beneficiary: raw.beneficiary,
    token: raw.token,
    goal: stroopsToDecimal(raw.goal),
    raised: stroopsToDecimal(raw.raised),
    progressPct: Math.min(pct, 100),
    deadline: toIso(raw.deadline),
    createdAt: toIso(raw.created_at),
    donorCount: Number(raw.donor_count),
    donationCount: Number(raw.donation_count),
    open: raw.open,
    status: !raw.open ? 'closed' : ended ? 'ended' : 'active',
  };
}

export function mapReceipt(raw: RawReceipt): Receipt {
  return {
    id: Number(raw.id),
    campaignId: Number(raw.campaign_id),
    donor: raw.donor,
    amount: stroopsToDecimal(raw.amount),
    memo: raw.memo,
    timestamp: toIso(raw.timestamp),
    ledger: Number(raw.ledger),
  };
}

interface CacheEntry<T> {
  value: T;
  expires: number;
}

/**
 * Reads campaign state straight from the donations contract through Soroban
 * RPC simulation. No key or fee is needed for reads. Results are cached for a
 * few seconds so a busy page does not hammer the public RPC.
 */
export class SorobanDonationsReader implements DonationsReader {
  private readonly server: rpc.Server;
  private readonly contract: Contract;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  // Simulation only needs a syntactically valid source account.
  private readonly simSource = Keypair.random().publicKey();

  constructor(
    readonly contractId: string,
    rpcUrl: string,
    private readonly passphrase: string = TESTNET_PASSPHRASE,
    private readonly ttlMs = 10_000,
  ) {
    this.server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
    this.contract = new Contract(contractId);
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expires > Date.now()) {
      return hit.value as T;
    }
    const value = await load();
    this.cache.set(key, { value, expires: Date.now() + this.ttlMs });
    return value;
  }

  /** Returns the decoded value, or null when the contract returned an error. */
  private async read<T>(method: string, ...args: xdr.ScVal[]): Promise<T | null> {
    const tx = new TransactionBuilder(new Account(this.simSource, '0'), {
      fee: '100',
      networkPassphrase: this.passphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();
    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      if (/Error\(Contract, #\d+\)/.test(sim.error)) {
        return null;
      }
      throw new Error(`Soroban simulation failed for ${method}: ${sim.error}`);
    }
    if (!sim.result) {
      return null;
    }
    return scValToNative(sim.result.retval) as T;
  }

  private async campaignCount(): Promise<number> {
    return this.cached('count', async () =>
      Number((await this.read<number>('campaign_count')) ?? 0),
    );
  }

  private async receiptCount(): Promise<number> {
    return this.cached('receipts', async () =>
      Number((await this.read<bigint>('receipt_count')) ?? 0n),
    );
  }

  getCampaign(id: number): Promise<Campaign | null> {
    return this.cached(`c:${id}`, async () => {
      const raw = await this.read<RawCampaign>('get_campaign', nativeToScVal(id, { type: 'u32' }));
      return raw ? mapCampaign(raw) : null;
    });
  }

  async listCampaigns(): Promise<Campaign[]> {
    const count = await this.campaignCount();
    const ids = Array.from({ length: count }, (_, i) => count - i);
    const all = await Promise.all(ids.map((id) => this.getCampaign(id)));
    return all.filter((c): c is Campaign => c !== null);
  }

  getReceipt(id: number): Promise<Receipt | null> {
    return this.cached(`r:${id}`, async () => {
      const raw = await this.read<RawReceipt>('get_receipt', nativeToScVal(id, { type: 'u64' }));
      return raw ? mapReceipt(raw) : null;
    });
  }

  async recentReceipts(limit: number, campaignId?: number): Promise<Receipt[]> {
    const total = await this.receiptCount();
    const out: Receipt[] = [];
    // Receipts are sequential; walk back in small batches until we have enough.
    for (let next = total; next >= 1 && out.length < limit; next -= 10) {
      const ids = Array.from({ length: Math.min(10, next) }, (_, i) => next - i);
      const batch = await Promise.all(ids.map((id) => this.getReceipt(id)));
      for (const r of batch) {
        if (r && (campaignId === undefined || r.campaignId === campaignId)) {
          out.push(r);
        }
      }
      if (next - 10 < total - 100) {
        break; // cap the scan so one request never fans out too far
      }
    }
    return out.slice(0, limit);
  }

  async stats(): Promise<DonationStats> {
    const campaigns = await this.listCampaigns();
    let raised = 0n;
    let donors = 0;
    let donations = 0;
    for (const c of campaigns) {
      raised += decimalToStroops(c.raised);
      donors += c.donorCount;
      donations += c.donationCount;
    }
    return {
      campaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      donations,
      donors,
      totalRaised: stroopsToDecimal(raised),
    };
  }
}

let reader: DonationsReader | null = null;

export function getDonationsReader(): DonationsReader {
  reader ??= new SorobanDonationsReader(
    process.env['DONATIONS_CONTRACT_ID'] || DEFAULT_DONATIONS_CONTRACT_ID,
    process.env['SOROBAN_RPC_URL'] || DEFAULT_SOROBAN_RPC_URL,
    process.env['STELLAR_NETWORK_PASSPHRASE'] || TESTNET_PASSPHRASE,
  );
  return reader;
}

/** Test seam: swap in a fake reader. */
export function setDonationsReader(next: DonationsReader | null): void {
  reader = next;
}
