'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Spinner } from '@stellariq/ui';
import {
  explorerUrl,
  fetchCampaign,
  fetchReceipt,
  formatAmount,
  type Campaign,
  type Receipt,
} from '@/lib/donations';
import { getWebEnv } from '@/lib/env';

export function ReceiptView({ id }: { id: number }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchReceipt(id, ctrl.signal)
      .then(async (r) => {
        setReceipt(r);
        setCampaign(await fetchCampaign(r.campaignId, ctrl.signal));
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load.');
      });
    return () => ctrl.abort();
  }, [id]);

  if (error) {
    return (
      <p role="alert" className="py-10 text-center text-negative">
        Receipt #{id}: {error}
      </p>
    );
  }
  if (!receipt) {
    return <Spinner label="Loading receipt…" />;
  }

  const rows: [string, React.ReactNode][] = [
    ['Receipt', `#${receipt.id}`],
    [
      'Campaign',
      <Link
        key="c"
        href={`/campaigns/${receipt.campaignId}`}
        className="text-accent hover:underline"
      >
        {campaign?.title ?? `#${receipt.campaignId}`}
      </Link>,
    ],
    [
      'Amount',
      <span key="a" className="font-mono">
        {formatAmount(receipt.amount)}
      </span>,
    ],
    [
      'Donor',
      <a
        key="d"
        href={explorerUrl('account', receipt.donor)}
        target="_blank"
        rel="noreferrer"
        className="break-all font-mono text-accent hover:underline"
      >
        {receipt.donor}
      </a>,
    ],
    ['Message', receipt.memo || '-'],
    ['Date', new Date(receipt.timestamp).toLocaleString()],
    [
      'Ledger',
      <span key="l" className="font-mono">
        {receipt.ledger}
      </span>,
    ],
  ];

  return (
    <article className="mx-auto flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-positive">
        Donation receipt
      </p>
      <h1 className="text-2xl font-bold">Thank you for giving</h1>
      <dl className="grid gap-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted">
        This receipt is stored in the StellarIQ Give contract and can be read by anyone.{' '}
        <a
          href={explorerUrl('contract', getWebEnv().donationsContractId)}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          View contract
        </a>
      </p>
    </article>
  );
}
