'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@stellariq/ui';
import {
  daysLeft,
  explorerUrl,
  fetchCampaign,
  fetchCampaignDonations,
  formatAmount,
  tokenSymbol,
  type Campaign,
  type Receipt,
} from '@/lib/donations';
import { getWebEnv } from '@/lib/env';
import { truncateKey } from '@/lib/wallet';
import { DonateForm } from './DonateForm';
import { DonationFeed } from './DonationFeed';
import { ProgressBar } from './ProgressBar';

export function CampaignDetail({ id }: { id: number }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [receipts, setReceipts] = useState<Receipt[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [c, r] = await Promise.all([
          fetchCampaign(id, signal),
          fetchCampaignDonations(id, 15, signal),
        ]);
        setCampaign(c);
        setReceipts(r);
      } catch (err: unknown) {
        if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Failed to load.');
      }
    },
    [id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  if (error) {
    return (
      <div className="py-10 text-center">
        <p role="alert" className="text-negative">
          {error}
        </p>
        <Link href="/" className="mt-3 inline-block text-sm text-accent hover:underline">
          Back to campaigns
        </Link>
      </div>
    );
  }
  if (!campaign) {
    return <Spinner label="Loading campaign from Stellar…" />;
  }

  const symbol = tokenSymbol(campaign.token);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link href="/" className="text-sm text-muted hover:text-text">
            ← All campaigns
          </Link>
          <h1 className="text-2xl font-bold">{campaign.title}</h1>
          <p className="text-muted">{campaign.description}</p>
        </header>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p>
              <span className="font-mono text-2xl font-semibold">
                {formatAmount(campaign.raised, symbol)}
              </span>
              <span className="text-muted"> raised of {formatAmount(campaign.goal, symbol)}</span>
            </p>
            <p className="font-mono text-sm text-muted">{campaign.progressPct.toFixed(1)}%</p>
          </div>
          <ProgressBar pct={campaign.progressPct} />
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-muted">Donors</dt>
              <dd className="font-mono">{campaign.donorCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Donations</dt>
              <dd className="font-mono">{campaign.donationCount}</dd>
            </div>
            <div>
              <dt className="text-muted">Days left</dt>
              <dd className="font-mono">{daysLeft(campaign.deadline)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 text-sm">
          <h2 className="mb-3 font-semibold">Verify on-chain</h2>
          <dl className="grid gap-2">
            <Row
              label="Charity wallet"
              value={campaign.beneficiary}
              href={explorerUrl('account', campaign.beneficiary)}
            />
            <Row
              label="Donations contract"
              value={getWebEnv().donationsContractId}
              href={explorerUrl('contract', getWebEnv().donationsContractId)}
            />
            <Row
              label="Accepted token"
              value={campaign.token}
              text={symbol}
              href={explorerUrl('contract', campaign.token)}
            />
          </dl>
        </section>

        <DonationFeed title="Donations to this campaign" receipts={receipts} />
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <DonateForm campaign={campaign} onDonated={() => void load()} />
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  href,
  text,
}: {
  label: string;
  value: string;
  href: string;
  text?: string;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-accent hover:underline"
          title={value}
        >
          {text ?? truncateKey(value)}
        </a>
      </dd>
    </div>
  );
}
