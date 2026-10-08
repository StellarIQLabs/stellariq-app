import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app.js';
import { MockDataSource } from '../data/mock.js';
import type { ApiEnv } from '../env.js';
import {
  decimalToStroops,
  mapCampaign,
  setDonationsReader,
  stroopsToDecimal,
  type Campaign,
  type DonationsReader,
  type Receipt,
} from '../services/donations.js';

const ENV: ApiEnv = {
  host: '127.0.0.1',
  port: 4000,
  logLevel: 'silent',
  dataApiUrl: null,
  apiKeySalt: 'test-salt',
  adminToken: null,
  seedDevKeys: false,
  redisUrl: null,
  keyStorePath: null,
};

const G = 'GBM6MLCWZJ3ZFNVUKNOIL5Q2TNWDERK6QA4AHQPYLVS27D4MBRQE7BJJ';

const campaign = mapCampaign(
  {
    id: 1,
    title: 'Clean water',
    description: 'Boreholes',
    creator: G,
    beneficiary: G,
    token: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    goal: 5_000_000_000n,
    raised: 1_250_000_000n,
    deadline: 4_102_444_800n,
    created_at: 1_700_000_000n,
    donor_count: 3,
    donation_count: 4,
    open: true,
  },
  0,
);

const receipt: Receipt = {
  id: 1,
  campaignId: 1,
  donor: G,
  amount: '125',
  memo: 'hi',
  timestamp: new Date(0).toISOString(),
  ledger: 10,
};

class FakeReader implements DonationsReader {
  readonly contractId = 'CFAKE';
  constructor(private readonly fail = false) {}
  private guard(): void {
    if (this.fail) throw new Error('rpc down');
  }
  async listCampaigns(): Promise<Campaign[]> {
    this.guard();
    return [campaign];
  }
  async getCampaign(id: number): Promise<Campaign | null> {
    this.guard();
    return id === 1 ? campaign : null;
  }
  async getReceipt(id: number): Promise<Receipt | null> {
    this.guard();
    return id === 1 ? receipt : null;
  }
  async recentReceipts(): Promise<Receipt[]> {
    this.guard();
    return [receipt];
  }
  async stats() {
    this.guard();
    return { campaigns: 1, activeCampaigns: 1, donations: 4, donors: 3, totalRaised: '125' };
  }
}

describe('donation routes', () => {
  afterEach(() => setDonationsReader(null));

  it('maps contract amounts and progress', () => {
    assert.equal(campaign.goal, '500');
    assert.equal(campaign.raised, '125');
    assert.equal(campaign.progressPct, 25);
    assert.equal(campaign.status, 'active');
    assert.equal(stroopsToDecimal(15_000_001n), '1.5000001');
    assert.equal(decimalToStroops('1.5'), 15_000_000n);
  });

  it('lists, fetches and 404s campaigns', async () => {
    setDonationsReader(new FakeReader());
    const app = await buildApp({ env: ENV, source: new MockDataSource() });
    const list = await app.inject({ method: 'GET', url: '/v1/campaigns' });
    assert.equal(list.statusCode, 200);
    assert.equal((list.json() as { total: number }).total, 1);
    assert.equal((await app.inject({ method: 'GET', url: '/v1/campaigns/1' })).statusCode, 200);
    assert.equal((await app.inject({ method: 'GET', url: '/v1/campaigns/9' })).statusCode, 404);
    assert.equal((await app.inject({ method: 'GET', url: '/v1/campaigns/abc' })).statusCode, 400);
    await app.close();
  });

  it('serves receipts, recent donations and stats', async () => {
    setDonationsReader(new FakeReader());
    const app = await buildApp({ env: ENV, source: new MockDataSource() });
    assert.equal((await app.inject({ method: 'GET', url: '/v1/receipts/1' })).statusCode, 200);
    assert.equal((await app.inject({ method: 'GET', url: '/v1/receipts/2' })).statusCode, 404);
    const recent = await app.inject({ method: 'GET', url: '/v1/campaigns/1/donations?limit=5' });
    assert.equal(recent.statusCode, 200);
    const stats = await app.inject({ method: 'GET', url: '/v1/donations/stats' });
    assert.equal((stats.json() as { donors: number }).donors, 3);
    await app.close();
  });

  it('returns 503 when the network is unreachable', async () => {
    setDonationsReader(new FakeReader(true));
    const app = await buildApp({ env: ENV, source: new MockDataSource() });
    assert.equal((await app.inject({ method: 'GET', url: '/v1/campaigns' })).statusCode, 503);
    await app.close();
  });
});
