import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SwapForm } from './SwapForm.js';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof api>();
  return {
    ...original,
    fetchAssets: vi.fn(async () => ({
      data: [
        {
          id: 'XLM',
          code: 'XLM',
          issuer: null,
          name: 'Stellar Lumens',
          decimals: 7,
          verificationStatus: 'verified',
          createdAt: '2015-01-01T00:00:00.000Z',
          price: 0.2374,
        },
        {
          id: 'USDC:ISSUER',
          code: 'USDC',
          issuer: 'ISSUER',
          name: 'USD Coin',
          decimals: 7,
          verificationStatus: 'verified',
          createdAt: '2021-01-01T00:00:00.000Z',
          price: 1,
        },
      ],
      page: 1,
      limit: 50,
      total: 2,
    })),
  };
});

describe('SwapForm', () => {
  it('loads assets and submits a validated request', async () => {
    const onSubmit = vi.fn();
    render(<SwapForm onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByLabelText('From')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get best quote' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ from: 'XLM', to: 'USDC:ISSUER', amount: 10000 }),
    );
  });

  it('rejects invalid amounts and identical assets', async () => {
    const onSubmit = vi.fn();
    render(<SwapForm onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByLabelText('From')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '-5' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Amount must be a number.');
    fireEvent.click(screen.getByRole('button', { name: 'Get best quote' }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'XLM' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose two different assets.');
  });
});
