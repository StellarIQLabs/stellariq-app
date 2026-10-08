'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@stellariq/ui';
import { useWallet } from '@/hooks/useWallet';
import {
  buildDonateTransaction,
  explorerUrl,
  fundWithFriendbot,
  submitDonation,
  type Campaign,
  type DonateResult,
} from '@/lib/donations';
import { FreighterWallet } from '@/lib/wallet';

const PRESETS = ['10', '25', '100'];

type Phase = 'idle' | 'building' | 'signing' | 'submitting' | 'done';

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Donate',
  building: 'Preparing…',
  signing: 'Confirm in Freighter…',
  submitting: 'Sending to Stellar…',
  done: 'Donate again',
};

export function DonateForm({
  campaign,
  onDonated,
}: {
  campaign: Campaign;
  onDonated?: (result: DonateResult) => void;
}) {
  const { publicKey, connecting, available, connect, error: walletError } = useWallet();
  const [amount, setAmount] = useState('25');
  const [memo, setMemo] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DonateResult | null>(null);
  const [funding, setFunding] = useState(false);

  if (campaign.status !== 'active') {
    return (
      <p className="rounded-md border border-border p-4 text-sm text-muted">
        This campaign is no longer accepting donations.
      </p>
    );
  }

  const busy = phase === 'building' || phase === 'signing' || phase === 'submitting';

  async function donate() {
    if (!publicKey) return;
    setError(null);
    setResult(null);
    try {
      setPhase('building');
      const unsigned = await buildDonateTransaction({
        donor: publicKey,
        campaignId: campaign.id,
        amount,
        memo,
      });
      setPhase('signing');
      const { signedXdr } = await new FreighterWallet().signTransaction(
        unsigned,
        'Test SDF Network ; September 2015',
      );
      setPhase('submitting');
      const res = await submitDonation(signedXdr);
      setResult(res);
      setPhase('done');
      onDonated?.(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Donation failed.');
      setPhase('idle');
    }
  }

  async function fund() {
    if (!publicKey) return;
    setFunding(true);
    setError(null);
    try {
      await fundWithFriendbot(publicKey);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Funding failed.');
    } finally {
      setFunding(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">Make a donation</h2>
      <p className="text-xs text-muted">
        Testnet demo. Funds go straight to the charity wallet in the same transaction; the contract
        only records your receipt.
      </p>

      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`flex-1 rounded-md border px-3 py-2 font-mono text-sm ${
              amount === p ? 'border-accent text-accent' : 'border-border text-muted'
            }`}
          >
            {p} XLM
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Amount (XLM)</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 font-mono"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Message (optional, public)</span>
        <input
          maxLength={140}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Good luck with the project!"
          className="rounded-md border border-border bg-background px-3 py-2"
        />
      </label>

      {!publicKey ? (
        <div className="flex flex-col gap-2">
          <Button loading={connecting} onClick={() => void connect()}>
            Connect Freighter to donate
          </Button>
          {!available && (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noreferrer"
              className="text-center text-xs text-accent hover:underline"
            >
              Install Freighter (set it to Testnet)
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button loading={busy} disabled={busy} onClick={() => void donate()}>
            {PHASE_LABEL[phase]}
          </Button>
          <Button variant="ghost" size="sm" loading={funding} onClick={() => void fund()}>
            Get test XLM for this wallet
          </Button>
        </div>
      )}

      {(error ?? walletError) && (
        <p role="alert" className="text-sm text-negative">
          {error ?? walletError}
        </p>
      )}
      {result && (
        <div role="status" className="rounded-md bg-positive/10 p-3 text-sm text-positive">
          Thank you! Your donation is on-chain.{' '}
          {result.receiptId !== null && (
            <Link href={`/receipts/${result.receiptId}`} className="underline">
              View receipt #{result.receiptId}
            </Link>
          )}{' '}
          <a
            href={explorerUrl('tx', result.hash)}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Transaction
          </a>
        </div>
      )}
    </div>
  );
}
