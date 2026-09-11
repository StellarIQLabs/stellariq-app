import { createHmac, randomBytes } from 'node:crypto';

/** Monetization tiers (PRD §30). Limits attach per tier in the rate-limit task. */
export type ApiTier = 'free' | 'developer' | 'pro' | 'enterprise';

export const API_TIERS: [ApiTier, ...ApiTier[]] = ['free', 'developer', 'pro', 'enterprise'];

export interface ApiKeyRecord {
  id: string;
  /** First 12 chars of the raw key — safe to log, used for support lookups. */
  prefix: string;
  keyHash: string;
  name: string;
  tier: ApiTier;
  createdAt: string;
  revokedAt: string | null;
}

export interface IssuedKey {
  /** Raw key — shown once at issuance, never stored. */
  key: string;
  record: ApiKeyRecord;
}

function hashKey(raw: string, salt: string): string {
  return createHmac('sha256', salt).update(raw).digest('hex');
}

function newId(): string {
  return `key_${randomBytes(8).toString('hex')}`;
}

/**
 * API key issuance and per-key lookup. Raw keys are random 256-bit tokens
 * prefixed `siq_`; only HMAC hashes are stored.
 */
export class KeyStore {
  private readonly salt: string;
  private readonly records = new Map<string, ApiKeyRecord>();

  constructor(salt: string) {
    this.salt = salt;
  }

  issue(name: string, tier: ApiTier): IssuedKey {
    const key = `siq_${randomBytes(32).toString('base64url')}`;
    const record: ApiKeyRecord = {
      id: newId(),
      prefix: key.slice(0, 12),
      keyHash: hashKey(key, this.salt),
      name,
      tier,
      createdAt: new Date().toISOString(),
      revokedAt: null,
    };
    this.records.set(record.keyHash, record);
    return { key, record };
  }

  /** Returns the live record for a presented raw key, or null. */
  verify(rawKey: string): ApiKeyRecord | null {
    const record = this.records.get(hashKey(rawKey, this.salt)) ?? null;
    if (!record || record.revokedAt !== null) {
      return null;
    }
    return record;
  }

  revoke(id: string): boolean {
    for (const record of this.records.values()) {
      if (record.id === id && record.revokedAt === null) {
        record.revokedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  list(): ApiKeyRecord[] {
    return [...this.records.values()];
  }

  /** Seeds documented local-dev keys. Only call when explicitly enabled. */
  seedDevKeys(): IssuedKey[] {
    return [this.issue('local-dev-free', 'free'), this.issue('local-dev-pro', 'pro')];
  }
}
