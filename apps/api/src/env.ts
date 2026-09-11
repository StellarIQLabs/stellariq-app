/** Validated, env-aware server configuration. */
export interface ApiEnv {
  host: string;
  port: number;
  logLevel: string;
  dataApiUrl: string | null;
  apiKeySalt: string;
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
  };
}
