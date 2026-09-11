import type { Meta, StoryObj } from '@storybook/react';
import { Stat, Badge } from './primitives.js';

const meta: Meta<typeof Stat> = {
  title: 'Primitives/Stat',
  component: Stat,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Stat>;

export const Volume: Story = {
  args: { label: 'Volume 24h', value: '$12.8M', change: 2.14 },
};

export const Loading: Story = {
  args: { label: 'TVL', value: '—', loading: true },
};

export const ErrorState: Story = {
  args: { label: 'Trades', value: '—', error: 'Upstream data unavailable' },
};

export const Tones: Story = {
  args: { label: 'Badge tones', value: '' },
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Badge tone="positive">Verified</Badge>
      <Badge tone="warning">Unverified</Badge>
      <Badge tone="accent">XLM/USDC</Badge>
      <Badge tone="negative">-2.14%</Badge>
    </div>
  ),
};
