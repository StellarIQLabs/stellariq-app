import type { Meta, StoryObj } from '@storybook/react';
import { PriceChart } from './charts.js';

const points = Array.from({ length: 48 }, (_, i) => ({
  timestamp: 1789060000 + i * 1800,
  value: 0.2374 + Math.sin(i / 5) * 0.004,
}));

const meta: Meta<typeof PriceChart> = {
  title: 'Charts/PriceChart',
  component: PriceChart,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PriceChart>;

export const Default: Story = {
  args: { data: points, timeframe: '1D' },
};

export const Empty: Story = {
  args: { data: [], timeframe: '1D' },
};
