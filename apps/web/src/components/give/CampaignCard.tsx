import Link from 'next/link';
import { Badge } from '@stellariq/ui';
import { daysLeft, formatAmount, tokenSymbol, type Campaign } from '@/lib/donations';
import { ProgressBar } from './ProgressBar';

const STATUS_TONE = { active: 'positive', ended: 'warning', closed: 'neutral' } as const;

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const symbol = tokenSymbol(campaign.token);
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{campaign.title}</h3>
        <Badge tone={STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
      </div>
      <p className="line-clamp-2 text-sm text-muted">{campaign.description}</p>
      <ProgressBar pct={campaign.progressPct} />
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="font-mono font-semibold">{formatAmount(campaign.raised, symbol)}</span>
          <span className="text-muted"> of {formatAmount(campaign.goal, symbol)}</span>
        </span>
        <span className="text-muted">
          {campaign.donorCount} donors
          {campaign.status === 'active' ? ` · ${daysLeft(campaign.deadline)} days left` : ''}
        </span>
      </div>
    </Link>
  );
}
