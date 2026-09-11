/** Validated, env-aware server configuration. */
export interface ApiEnv {
  host: string;
  port: number;
  logLevel: string;
  dataApiUrl: string | null;
  apiKeySalt: string;
  /** Guards POST /v1/keys. Absent means issuance is disabled. */
  adminToken: string | null;
  /** Seeds documented local-dev keys (dev only, never in production). */
  seedDevKeys: boolean;
  /** Redis counters for rate limits. Absent means in-memory counters. */
  redisUrl: string | null;
}

function numberOr(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${name}: expected a number, got "${raw}".`);
  }
  return parsed;
}

export function loadEnv(): ApiEnv {
  return {
    host: process.env['API_HOST'] ?? '0.0.0.0',
    port: numberOr('API_PORT', 4000),
    logLevel: process.env['LOG_LEVEL'] ?? 'info',
    dataApiUrl: process.env['DATA_API_URL'] ?? null,
    apiKeySalt: process.env['API_KEY_SALT'] ?? 'dev-salt-change-in-production',
    adminToken: process.env['ADMIN_TOKEN'] ?? null,
    seedDevKeys: process.env['SEED_DEV_KEYS'] === 'true',
    redisUrl: process.env['REDIS_URL'] ?? null,
  };
}
