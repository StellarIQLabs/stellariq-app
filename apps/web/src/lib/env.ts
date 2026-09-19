/**
 * Typed, validated access to NEXT_PUBLIC_* environment variables.
 * Fails fast with a clear message when required config is missing.
 */
export interface WebEnv {
  apiBaseUrl: string;
  wsUrl: string;
  stellarNetwork: string;
  horizonUrl: string;
  /** Soroban RPC endpoint used to submit wallet-signed transactions. */
  sorobanRpcUrl: string;
  /** Swap-router contract id. Undefined until the contract is deployed. */
  swapRouterId?: string;
}

function required(name: string, raw: string | undefined, fallback?: string): string {
  // Next.js inlines unset NEXT_PUBLIC_* vars as empty strings (not undefined),
  // so treat empty the same as missing and use the fallback.
  const value = raw && raw.length > 0 ? raw : fallback;
  if (!value) {
    throw new Error(`Missing required env var ${name}. See apps/web/.env.example.`);
  }
  return value;
}

function optional(raw: string | undefined): string | undefined {
  return raw === undefined || raw === '' ? undefined : raw;
}

let cached: WebEnv | null = null;

export function getWebEnv(): WebEnv {
  // NOTE: each NEXT_PUBLIC_* var MUST be referenced as a static literal
  // (process.env.NEXT_PUBLIC_X) so Next.js can inline it into the browser
  // bundle at build time. Dynamic access (process.env[name]) is NOT inlined
  // and silently falls back — which shipped localhost URLs to production.
  const swapRouterId = optional(process.env.NEXT_PUBLIC_SWAP_ROUTER_ID);
  cached ??= {
    apiBaseUrl: required(
      'NEXT_PUBLIC_API_BASE_URL',
      process.env.NEXT_PUBLIC_API_BASE_URL,
      'http://localhost:4000',
    ),
    wsUrl: required('NEXT_PUBLIC_WS_URL', process.env.NEXT_PUBLIC_WS_URL, 'ws://localhost:4000/ws'),
    stellarNetwork: required(
      'NEXT_PUBLIC_STELLAR_NETWORK',
      process.env.NEXT_PUBLIC_STELLAR_NETWORK,
      'testnet',
    ),
    horizonUrl: required(
      'NEXT_PUBLIC_HORIZON_URL',
      process.env.NEXT_PUBLIC_HORIZON_URL,
      'https://horizon-testnet.stellar.org',
    ),
    sorobanRpcUrl: required(
      'NEXT_PUBLIC_SOROBAN_RPC_URL',
      process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
      'https://soroban-testnet.stellar.org',
    ),
    ...(swapRouterId !== undefined ? { swapRouterId } : {}),
  };
  return cached;
}
