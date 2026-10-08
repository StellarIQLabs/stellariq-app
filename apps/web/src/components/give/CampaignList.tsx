'use client';

import { useEffect, useState } from 'react';
import { EmptyState, Spinner } from '@stellariq/ui';
import { fetchCampaigns, type Campaign } from '@/lib/donations';
import { CampaignCard } from './CampaignCard';

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCampaigns(ctrl.signal)
      .then(setCampaigns)
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load.');
      });
    return () => ctrl.abort();
  }, []);

  if (error) {
    return (
      <p role="alert" className="py-6 text-center text-sm text-negative">
        {error} The API may be waking up; refresh in a few seconds.
      </p>
    );
  }
  if (!campaigns) {
    return <Spinner label="Loading campaigns from Stellar…" />;
  }
  if (campaigns.length === 0) {
    return <EmptyState title="No campaigns yet" hint="Campaigns created on-chain appear here." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((c) => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </div>
  );
}
