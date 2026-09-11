import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Market } from '@stellariq/types';
import { TopMarketsTable } from './TopMarketsTable.js';

const MARKETS: Market[] = [
  {
    id: 'XLM/AQUA',
    baseAsset: 'XLM',
    quoteAsset: 'AQUA',
    protocol: 'aqua',
    poolId: 'p3',
    price: 197.83,
    priceChange24h: -1.2,
    volume24h: 84000,
    liquidity: 310000,
  },
  {
    id: 'XLM/USDC',
    baseAsset: 'XLM',
    quoteAsset: 'USDC',
    protocol: 'stellar-dex',
    poolId: 'p1',
    price: 0.2374,
    priceChange24h: 2.14,
    volume24h: 4200000,
    liquidity: 4200000,
  },
  {
    id: 'XLM/EURC',
    baseAsset: 'XLM',
    quoteAsset: 'EURC',
    protocol: 'stellar-dex',
    poolId: 'p2',
    price: 0.2198,
    priceChange24h: 1.42,
    volume24h: 760000,
    liquidity: 1500000,
  },
];

describe('TopMarketsTable', () => {
  it('sorts by volume descending by default and links to market detail', () => {
    render(<TopMarketsTable markets={MARKETS} />);
    const links = screen.getAllByRole('link', { name: /XLM\// });
    expect(links.map((link) => link.textContent)).toEqual(['XLM/USDC', 'XLM/EURC', 'XLM/AQUA']);
    expect(links[0]).toHaveAttribute('href', '/markets/XLM%2FUSDC');
  });

  it('toggles sort direction when the active header is clicked', () => {
    render(<TopMarketsTable markets={MARKETS} />);
    fireEvent.click(screen.getByRole('button', { name: /Volume/ }));
    const links = screen.getAllByRole('link', { name: /XLM\// });
    expect(links.map((link) => link.textContent)).toEqual(['XLM/AQUA', 'XLM/EURC', 'XLM/USDC']);
  });

  it('shows loading and error states', () => {
    const { rerender } = render(<TopMarketsTable markets={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<TopMarketsTable markets={[]} error="API down" />);
    expect(screen.getByText('API down')).toBeInTheDocument();
  });
});
