import { expect, test } from '@playwright/test';

test('overview loads DeFi totals and sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Stellar DeFi Overview' })).toBeVisible();
  await expect(page.getByText('Top markets')).toBeVisible();
  await expect(page.getByText('Top pools')).toBeVisible();
  await expect(page.getByText('Large swaps')).toBeVisible();
  await expect(page.getByText('XLM/USDC').first()).toBeVisible();
});

test('primary navigation reaches markets, pools, assets and swap', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Markets', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Markets', exact: true })).toBeVisible();
  await expect(page.getByText('XLM/USDC').first()).toBeVisible();

  await page.getByRole('link', { name: 'Swap', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Swap', exact: true })).toBeVisible();
  await expect(page.getByLabel('From')).toBeVisible();
});

test('swap form validates input before quoting', async ({ page }) => {
  await page.goto('/swap');
  await page.getByLabel('Amount').fill('-5');
  await expect(page.getByText('Amount must be a number.')).toBeVisible();
});
