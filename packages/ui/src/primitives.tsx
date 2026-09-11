import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface StatProps {
  label: string;
  value: ReactNode;
  change?: number | undefined;
  loading?: boolean;
  error?: string | undefined;
  hint?: string;
}

export function Stat({ label, value, change, loading, error, hint }: StatProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {loading ? (
        <div
          className="mt-2 h-7 w-24 animate-pulse rounded bg-surface-raised"
          aria-label="Loading"
        />
      ) : error ? (
        <p className="mt-2 text-sm text-negative">{error}</p>
      ) : (
        <p className="mt-2 font-mono text-2xl font-semibold text-text">{value}</p>
      )}
      {change !== undefined && !loading && !error && (
        <p
          className={clsx(
            'mt-1 text-sm font-medium',
            change >= 0 ? 'text-positive' : 'text-negative',
          )}
        >
          {change >= 0 ? '+' : ''}
          {change.toFixed(2)}%
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export interface BadgeProps {
  tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'accent';
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-surface-raised text-muted',
  positive: 'bg-positive/15 text-positive',
  negative: 'bg-negative/15 text-negative',
  warning: 'bg-warning/15 text-warning',
  accent: 'bg-accent/15 text-accent',
};

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted" role="status">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
      {label}
    </div>
  );
}
