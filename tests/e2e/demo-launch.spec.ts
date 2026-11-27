import { expect, test } from '@playwright/test';

test('demo opens the main app without authentication or onboarding', async ({ page }) => {
  await page.goto('/auth');

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('status').filter({ hasText: 'Demo mode:' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

  await page.goto('/onboarding');
  await expect(page).toHaveURL('/');

  await page.goto('/settings');
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clear demo data' })).toBeVisible();
});
