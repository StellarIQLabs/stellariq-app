'use client';

import { useEffect, useState } from 'react';
import { Stat } from '@stellariq/ui';
import { fetchDonationStats, formatAmount, type DonationStats } from '@/lib/donations';

export function GiveStats() {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchDonationStats(ctrl.signal)
      .then(setStats)
      .catch(() => {
        if (!ctrl.signal.aborted) setError('unavailable');
      });
    return () => ctrl.abort();
  }, []);

  const loading = !stats && !error;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Raised on-chain"
        value={stats ? formatAmount(stats.totalRaised) : '-'}
        loading={loading}
        error={error}
      />
      <Stat
        label="Donations"
        value={stats ? String(stats.donations) : '-'}
        loading={loading}
        error={error}
      />
      <Stat
        label="Unique donors"
        value={stats ? String(stats.donors) : '-'}
        loading={loading}
        error={error}
      />
      <Stat
        label="Active campaigns"
        value={stats ? String(stats.activeCampaigns) : '-'}
        loading={loading}
        error={error}
      />
    </div>
  );
}
