'use client';

import { useEffect, useState } from 'react';
import { fetchRecentDonations, type Receipt } from '@/lib/donations';
import { DonationFeed } from './DonationFeed';

export function RecentDonations() {
  const [receipts, setReceipts] = useState<Receipt[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchRecentDonations(8, ctrl.signal)
      .then(setReceipts)
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load.');
      });
    return () => ctrl.abort();
  }, []);

  return <DonationFeed title="Latest donations" receipts={receipts} error={error} />;
}
