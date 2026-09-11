'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, Spinner } from '@stellariq/ui';
import type { Swap } from '@stellariq/types';
import { ApiError, fetchRecentSwaps } from '@/lib/api';
import { formatCount, formatTime } from '@/lib/format';

export interface LargeSwapsFeedProps {
  limit?: number;
  /** Poll interval in ms. Set to 0 to disable polling. */
  pollIntervalMs?: number;
}

function shortHash(hash: string): string {
  return hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash;
}

/**
 * Live whale-swap feed (PRD §16): amount, pair and timestamp per swap with
 * polling refresh, loading, error and empty states.
 */
export function LargeSwapsFeed({ limit = 8, pollIntervalMs = 15000 }: LargeSwapsFeedProps) {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (signal: AbortSignal, initial: boolean) => {
      try {
        const fresh = await fetchRecentSwaps(limit, signal);
        if (!signal.aborted) {
          setSwaps(fresh);
          setUpdatedAt(Date.now());
          setError(null);
          if (initial) {
            setLoading(false);
          }
        }
      } catch (err: unknown) {
        if (!signal.aborted && initial) {
          setError(
            err instanceof ApiError
              ? `API error ${err.status}: is the StellarIQ API running?`
              : 'Network error: could not reach the StellarIQ API.',
          );
          setLoading(false);
        }
      }
    },
    [limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal, true);
    if (pollIntervalMs > 0) {
      timer.current = setInterval(() => {
        const pollController = new AbortController();
        void load(pollController.signal, false);
      }, pollIntervalMs);
    }
    return () => {
      controller.abort();
      if (timer.current !== null) {
        clearInterval(timer.current);
      }
    };
  }, [load, pollIntervalMs]);

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          Large swaps
          <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-positive" />
            Live
          </span>
        </span>
      }
      action={
        <Link href="/markets" className="text-sm text-accent hover:underline">
          Explore markets
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Watching for whale swaps…" />
      ) : error !== null ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : swaps.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No swaps observed yet.</p>
      ) : (
        <>
          <ul className="divide-y divide-border/50">
            {swaps.map((swap) => (
              <li
                key={swap.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
              >
                {swap.isLarge ? (
                  <Badge tone="warning">Whale</Badge>
                ) : (
                  <Badge tone="neutral">{swap.protocol}</Badge>
                )}
                <span className="font-mono">
                  {formatCount(swap.inputAmount)} {swap.inputAsset} →{' '}
                  {formatCount(swap.outputAmount)} {swap.outputAsset}
                </span>
                <span className="font-mono text-xs text-muted" title={swap.transactionHash}>
                  {shortHash(swap.transactionHash)}
                </span>
                <span className="ml-auto shrink-0 font-mono text-xs text-muted">
                  {formatTime(swap.timestamp)}
                </span>
              </li>
            ))}
          </ul>
          {updatedAt !== null && (
            <p className="mt-2 text-right font-mono text-xs text-muted">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
