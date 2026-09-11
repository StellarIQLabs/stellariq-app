/**
 * Typed, validated access to NEXT_PUBLIC_* environment variables.
 * Fails fast with a clear message when required config is missing.
 */
export interface WebEnv {
  apiBaseUrl: string;
  wsUrl: string;
  stellarNetwork: string;
  horizonUrl: string;
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var ${name}. See apps/web/.env.example.`);
  }
  return value;
}

let cached: WebEnv | null = null;

export function getWebEnv(): WebEnv {
  cached ??= {
    apiBaseUrl: required('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:4000'),
    wsUrl: required('NEXT_PUBLIC_WS_URL', 'ws://localhost:4000/ws'),
    stellarNetwork: required('NEXT_PUBLIC_STELLAR_NETWORK', 'testnet'),
    horizonUrl: required('NEXT_PUBLIC_HORIZON_URL', 'https://horizon-testnet.stellar.org'),
  };
  return cached;
}
