'use client';

import { useState } from 'react';
import { Horizon, Networks } from '@stellar/stellar-sdk';
import { Button, Card } from '@stellariq/ui';
import { clsx } from 'clsx';
import type { Quote, SwapRoute } from '@stellariq/types';
import type { QuoteRequest } from '@/lib/api';
import { ContractNotDeployedError, StubRouterClient } from '@/lib/contracts';
import { getWebEnv } from '@/lib/env';
import { buildSwapTransactionXdr } from '@/lib/txBuilder';
import { FreighterWallet, submitSignedTransaction } from '@/lib/wallet';

export interface SwapReviewModalProps {
  request: QuoteRequest;
  quote: Quote;
  route: SwapRoute;
  userPublicKey: string;
  onClose: () => void;
}

type Stage =
  | 'review'
  | 'generating'
  | 'unsigned'
  | 'signing'
  | 'submitting'
  | 'confirmed'
  | 'failed';

const SLIPPAGE_BPS = 50;

function minAmountOut(output: number): string {
  return (output * (1 - SLIPPAGE_BPS / 10000)).toFixed(7);
}

function networkPassphrase(network: string): string {
  return network === 'mainnet' || network === 'public' ? Networks.PUBLIC : Networks.TESTNET;
}

/**
 * End-to-end swap flow (PRD §15 user flow): review → generate unsigned
 * transaction → wallet sign → submit → confirmation. StellarIQ never sees
 * private keys.
 */
export function SwapReviewModal({
  request,
  quote,
  route,
  userPublicKey,
  onClose,
}: SwapReviewModalProps) {
  const [stage, setStage] = useState<Stage>('review');
  const [unsignedXdr, setUnsignedXdr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const env = getWebEnv();
  const passphrase = networkPassphrase(env.stellarNetwork);

  async function generate(): Promise<void> {
    setStage('generating');
    setError(null);
    try {
      const router = new StubRouterClient(env.swapRouterId);
      const invocation = router.buildInvocation({
        route,
        user: userPublicKey,
        amountIn: String(request.amount),
        minAmountOut: minAmountOut(quote.outputAmount),
        deadline: Math.floor(Date.now() / 1000) + 600,
      });
      const server = new Horizon.Server(env.horizonUrl);
      const account = await server.loadAccount(userPublicKey);
      const xdr = buildSwapTransactionXdr({
        invocation,
        userPublicKey,
        networkPassphrase: passphrase,
        sequence: account.sequence,
      });
      setUnsignedXdr(xdr);
      setStage('unsigned');
    } catch (err: unknown) {
      setError(
        err instanceof ContractNotDeployedError
          ? 'The swap router is not deployed on this network yet — quoting stays available.'
          : err instanceof Error
            ? err.message
            : 'Transaction generation failed.',
      );
      setStage('failed');
    }
  }

  async function signAndSubmit(): Promise<void> {
    if (!unsignedXdr) {
      return;
    }
    setStage('signing');
    setError(null);
    try {
      const wallet = new FreighterWallet();
      const { signedXdr } = await wallet.signTransaction(unsignedXdr, passphrase);
      setStage('submitting');
      const result = await submitSignedTransaction(signedXdr, env.sorobanRpcUrl);
      if (result.status === 'SUCCESS') {
        setTxHash(result.hash);
        setStage('confirmed');
      } else {
        setError(`Submission ended with status ${result.status} (hash ${result.hash}).`);
        setStage('failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signing or submission failed.');
      setStage('failed');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Review swap"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card
          title="Review swap"
          className={clsx('w-full max-w-md', stage === 'submitting' && 'opacity-80')}
        >
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">You pay</dt>
              <dd className="font-mono">
                {request.amount} {request.from}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">You receive (est.)</dt>
              <dd className="font-mono">
                {quote.outputAmount.toLocaleString()} {quote.to}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Route</dt>
              <dd className="font-mono">
                Route {route.id} ({route.kind})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Price impact</dt>
              <dd className="font-mono">{(quote.priceImpact * 100).toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Slippage tolerance</dt>
              <dd className="font-mono">{SLIPPAGE_BPS / 100}%</dd>
            </div>
          </dl>

          {stage === 'confirmed' ? (
            <div className="mt-4 rounded-md border border-positive/40 bg-positive/10 p-3 text-sm">
              <p className="font-semibold text-positive">Swap confirmed</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">{txHash}</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {stage === 'review' && (
                <Button onClick={() => void generate()}>Generate transaction</Button>
              )}
              {stage === 'generating' && <Button loading>Generating…</Button>}
              {stage === 'unsigned' && (
                <>
                  <p className="break-all rounded-md bg-surface-raised p-2 font-mono text-[10px] text-muted">
                    {unsignedXdr?.slice(0, 120)}…
                  </p>
                  <Button onClick={() => void signAndSubmit()}>Sign in wallet</Button>
                </>
              )}
              {stage === 'signing' && <Button loading>Waiting for wallet signature…</Button>}
              {stage === 'submitting' && <Button loading>Submitting to Stellar…</Button>}
              {error && (
                <p role="alert" className="text-sm text-negative">
                  {error}
                </p>
              )}
              {(stage === 'failed' || stage === 'review' || stage === 'unsigned') && (
                <Button variant="ghost" onClick={onClose}>
                  {stage === 'failed' ? 'Close' : 'Cancel'}
                </Button>
              )}
            </div>
          )}
          {stage === 'confirmed' && (
            <div className="mt-4">
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
