import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'View market', variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Compare routes', variant: 'secondary' } };
export const Ghost: Story = { args: { children: 'Cancel', variant: 'ghost' } };
export const Loading: Story = { args: { children: 'Fetching quote', loading: true } };
