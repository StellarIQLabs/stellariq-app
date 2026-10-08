'use client';

import Link from 'next/link';
import { Card, EmptyState, Spinner } from '@stellariq/ui';
import { formatAmount, type Receipt } from '@/lib/donations';
import { truncateKey } from '@/lib/wallet';

export function DonationFeed({
  title,
  receipts,
  error,
}: {
  title: string;
  receipts: Receipt[] | null;
  error?: string | null;
}) {
  return (
    <Card title={title}>
      {error ? (
        <p className="py-4 text-center text-sm text-negative">{error}</p>
      ) : !receipts ? (
        <Spinner label="Loading donations…" />
      ) : receipts.length === 0 ? (
        <EmptyState title="No donations yet" hint="Be the first to give." />
      ) : (
        <ul className="divide-y divide-border">
          {receipts.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted" title={r.donor}>
                  {truncateKey(r.donor)}
                </p>
                {r.memo && <p className="truncate">“{r.memo}”</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono font-semibold">{formatAmount(r.amount)}</p>
                <Link href={`/receipts/${r.id}`} className="text-xs text-accent hover:underline">
                  Receipt #{r.id}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
