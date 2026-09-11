import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MarketPriceChart } from './MarketPriceChart.js';

vi.mock('lightweight-charts', () => {
  const setData = vi.fn();
  const fitContent = vi.fn();
  const remove = vi.fn();
  const series = { setData };
  const chart = {
    addSeries: vi.fn(() => series),
    timeScale: vi.fn(() => ({ fitContent })),
    remove,
  };
  return {
    CandlestickSeries: {},
    ColorType: { Solid: 'solid' },
    createChart: vi.fn(() => chart),
    __stubs: { setData, fitContent, remove, chart },
  };
});

const CANDLES = [
  { timestamp: 1789060000, open: 0.237, high: 0.238, low: 0.236, close: 0.2374, volume: 1000 },
  { timestamp: 1789060900, open: 0.2374, high: 0.239, low: 0.237, close: 0.2381, volume: 1200 },
];

describe('MarketPriceChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timeframe tabs and notifies on switch', () => {
    const onTimeframeChange = vi.fn();
    render(
      <MarketPriceChart
        pair="XLM/USDC"
        candles={CANDLES}
        timeframe="1D"
        onTimeframeChange={onTimeframeChange}
      />,
    );
    for (const tf of ['1H', '4H', '1D', '1W', '1M']) {
      expect(screen.getByRole('tab', { name: tf })).toBeInTheDocument();
    }
    expect(screen.getByRole('tab', { name: '1D' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: '1W' }));
    expect(onTimeframeChange).toHaveBeenCalledWith('1W');
  });

  it('pushes candle data into the chart series', async () => {
    const { createChart, __stubs } = (await import('lightweight-charts')) as unknown as {
      createChart: ReturnType<typeof vi.fn>;
      __stubs: { setData: ReturnType<typeof vi.fn> };
    };
    render(
      <MarketPriceChart
        pair="XLM/USDC"
        candles={CANDLES}
        timeframe="1D"
        onTimeframeChange={() => undefined}
      />,
    );
    expect(createChart).toHaveBeenCalled();
    expect(__stubs.setData).toHaveBeenCalledWith([
      { time: 1789060000, open: 0.237, high: 0.238, low: 0.236, close: 0.2374 },
      { time: 1789060900, open: 0.2374, high: 0.239, low: 0.237, close: 0.2381 },
    ]);
  });

  it('shows an empty state when no history exists', () => {
    render(
      <MarketPriceChart
        pair="XLM/USDC"
        candles={[]}
        timeframe="1D"
        onTimeframeChange={() => undefined}
      />,
    );
    expect(screen.getByText('No price history for this range')).toBeInTheDocument();
  });

  it('shows a loading state while fetching', () => {
    render(
      <MarketPriceChart
        pair="XLM/USDC"
        candles={[]}
        timeframe="1D"
        onTimeframeChange={() => undefined}
        loading
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
