const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

const plainCompact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

/** $12.8M style compact currency. */
export function formatUsd(value: number | undefined): string {
  return value === undefined ? '—' : usdCompact.format(value);
}

/** 84.3K style compact count. */
export function formatCount(value: number | undefined): string {
  return value === undefined ? '—' : plainCompact.format(value);
}

/** $0.2374 style price with adaptive precision. */
export function formatPrice(value: number | undefined): string {
  return value === undefined ? '—' : priceFormat.format(value);
}

/** +2.14% style change, sign included. */
export function formatChange(value: number | undefined): string {
  if (value === undefined) {
    return '—';
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/** Unix seconds to a short local time. */
export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
