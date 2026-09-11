'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Spinner } from '@stellariq/ui';
import type { Asset } from '@stellariq/types';
import { ApiError, fetchAssets } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export interface SwapRequest {
  from: string;
  to: string;
  amount: number;
}

export interface SwapFormProps {
  onSubmit: (request: SwapRequest) => void;
  pending?: boolean;
}

function validateAmount(raw: string): string | null {
  if (raw.trim() === '') {
    return 'Enter an amount.';
  }
  if (!/^\d*\.?\d+$/.test(raw.trim())) {
    return 'Amount must be a number.';
  }
  if (Number(raw) <= 0) {
    return 'Amount must be greater than zero.';
  }
  return null;
}

/**
 * Swap input form (PRD §13): From/To asset selectors with price hints, amount
 * input with validation, and a direction switch. Quote fetching wires to
 * `onSubmit` in the quote-flow task.
 */
export function SwapForm({ onSubmit, pending = false }: SwapFormProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchAssets({ limit: 50 }, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setAssets(result.data);
          setFrom(
            (prev) =>
              prev || result.data.find((a) => a.code === 'XLM')?.id || result.data[0]?.id || '',
          );
          setTo(
            (prev) =>
              prev || result.data.find((a) => a.code === 'USDC')?.id || result.data[1]?.id || '',
          );
          setAssetsError(null);
          setLoadingAssets(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setAssetsError(
            err instanceof ApiError
              ? `Could not load assets (API ${err.status}).`
              : 'Could not load assets (network error).',
          );
          setLoadingAssets(false);
        }
      });
    return () => controller.abort();
  }, []);

  const amountError = touched ? validateAmount(amount) : null;
  const sameAsset = from !== '' && from === to;
  const formError = amountError ?? (sameAsset ? 'Choose two different assets.' : null);
  const submittable =
    !loadingAssets && assetsError === null && formError === null && from !== '' && to !== '';

  const fromAsset = useMemo(() => assets.find((a) => a.id === from), [assets, from]);
  const estimate =
    fromAsset?.price !== undefined && validateAmount(amount) === null
      ? fromAsset.price * Number(amount)
      : undefined;

  function switchDirection(): void {
    setFrom(to);
    setTo(from);
  }

  return (
    <Card title="New swap">
      {loadingAssets ? (
        <Spinner label="Loading assets…" />
      ) : assetsError !== null ? (
        <p className="py-4 text-center text-sm text-negative">{assetsError}</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (validateAmount(amount) !== null || sameAsset) {
              return;
            }
            onSubmit({ from, to, amount: Number(amount) });
          }}
        >
          <div>
            <label htmlFor="swap-from" className="mb-1 block text-sm text-muted">
              From
            </label>
            <select
              id="swap-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {formatPrice(a.price)}
                </option>
              ))}
            </select>
            {fromAsset?.price !== undefined && (
              <p className="mt-1 font-mono text-xs text-muted">
                1 {fromAsset.code} ≈ {formatPrice(fromAsset.price)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={switchDirection}
            aria-label="Switch direction"
            className="mx-auto rounded-full border border-border px-3 py-1 text-sm text-muted hover:border-accent hover:text-text"
          >
            ↓ ↑
          </button>

          <div>
            <label htmlFor="swap-to" className="mb-1 block text-sm text-muted">
              To
            </label>
            <select
              id="swap-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {formatPrice(a.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="swap-amount" className="mb-1 block text-sm text-muted">
              Amount
            </label>
            <input
              id="swap-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setTouched(true);
              }}
              placeholder="0.00"
              aria-invalid={amountError !== null}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            />
            {estimate !== undefined ? (
              <p className="mt-1 font-mono text-xs text-muted">≈ {formatPrice(estimate)}</p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                USD estimate appears once the amount is valid.
              </p>
            )}
          </div>

          {formError !== null && (
            <p role="alert" className="text-sm text-negative">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={!submittable || pending} loading={pending}>
            Get best quote
          </Button>
        </form>
      )}
    </Card>
  );
}
