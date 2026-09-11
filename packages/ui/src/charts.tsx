import { useMemo } from 'react';
import { colors } from './tokens.js';

export interface ChartPoint {
  timestamp: number;
  value: number;
}

export interface LineChartProps {
  data: ChartPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  /** Accessible label and empty-state text. */
  label?: string;
  emptyMessage?: string;
}

function buildPath(data: ChartPoint[], width: number, height: number): string {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  return data
    .map((d, i) => {
      const x = i * stepX;
      const y = height - ((d.value - min) / span) * (height - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/** Dependency-free SVG line/area chart primitive for price and TVL history. */
export function LineChart({
  data,
  width = 560,
  height = 200,
  stroke = colors.accent,
  label = 'Historical chart',
  emptyMessage = 'No history available for this range.',
}: LineChartProps) {
  const path = useMemo(
    () => (data.length > 0 ? buildPath(data, width, height) : ''),
    [data, width, height],
  );
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="w-full"
    >
      <path d={area} fill={stroke} opacity={0.12} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export interface BarsChartProps {
  data: ChartPoint[];
  width?: number;
  height?: number;
  fill?: string;
  label?: string;
  emptyMessage?: string;
}

/** Dependency-free SVG bar chart primitive for volume history. */
export function BarsChart({
  data,
  width = 560,
  height = 120,
  fill = colors.accent,
  label = 'Volume history',
  emptyMessage = 'No volume history for this range.',
}: BarsChartProps) {
  const max = useMemo(() => Math.max(0, ...data.map((d) => d.value)) || 1, [data]);
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }
  const slot = width / data.length;
  const barWidth = Math.max(1, slot * 0.7);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="w-full"
    >
      {data.map((d) => {
        const h = Math.max(1, (d.value / max) * (height - 4));
        const x = (data.indexOf(d) * slot + (slot - barWidth) / 2).toFixed(2);
        return (
          <rect
            key={d.timestamp}
            x={x}
            y={(height - h).toFixed(2)}
            width={barWidth}
            height={h.toFixed(2)}
            rx={1}
            fill={fill}
            opacity={0.8}
          />
        );
      })}
    </svg>
  );
}

export interface PriceChartProps {
  data: ChartPoint[];
  timeframe: string;
  onTimeframeChange?: (timeframe: string) => void;
  timeframes?: string[];
}

const DEFAULT_TIMEFRAMES = ['1H', '4H', '1D', '1W', '1M'];

/** Price chart with timeframe switcher and empty state. */
export function PriceChart({
  data,
  timeframe,
  onTimeframeChange,
  timeframes = DEFAULT_TIMEFRAMES,
}: PriceChartProps) {
  const last = data[data.length];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-1" role="tablist" aria-label="Timeframe">
          {timeframes.map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={tf === timeframe}
              onClick={() => onTimeframeChange?.(tf)}
              className={
                tf === timeframe
                  ? 'rounded px-2.5 py-1 text-xs font-semibold bg-accent/15 text-accent'
                  : 'rounded px-2.5 py-1 text-xs font-medium text-muted hover:text-text'
              }
            >
              {tf}
            </button>
          ))}
        </div>
        {last !== undefined && (
          <p className="font-mono text-sm text-muted">Last: {last.value.toLocaleString()}</p>
        )}
      </div>
      <LineChart data={data} label={`Price history (${timeframe})`} />
    </div>
  );
}
