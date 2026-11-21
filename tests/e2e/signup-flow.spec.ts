import { expect, test } from '@playwright/test';

test('sign up, onboard, log a mood, chat, and publish a Circle post', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth$/);

  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByLabel('Email').fill(`demo-${Date.now()}@example.test`);
  await page.getByLabel('Password').fill('safe-demo-password');
  await page.getByRole('button', { name: 'Create account' }).last().click();

  await expect(page).toHaveURL(/\/verify-email$/);
  const verificationNotice = page.getByRole('status').filter({ hasText: 'Local demo code:' });
  const codeText = await verificationNotice.textContent();
  const code = codeText?.match(/[A-Fa-f0-9]{8}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByLabel('Verification code').fill(code!);
  await page.getByRole('button', { name: 'Verify and continue' }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel('Name', { exact: true }).fill('Demo Student');
  await page.getByLabel('Campus').selectOption({ label: 'Demo Campus' });
  await page.getByLabel('Course or program').fill('Demo studies');
  await page.getByLabel('Year of study').selectOption('2');
  await page.getByRole('button', { name: 'Continue to privacy choices' }).click();
  await page.getByRole('button', { name: 'Finish setup' }).click();

  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Good' }).click();
  await expect(page.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('link', { name: /Talk to Sakhi/ }).click();
  await page.getByRole('button', { name: 'Help me make a study plan' }).click();
  await expect(page.getByText('Help me make a study plan')).toBeVisible();
  await expect(page.getByText(/Let’s make it manageable/i)).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Circle' }).click();
  await page.getByLabel('Title').fill('Demo study group check-in');
  await page.getByLabel('Your post').fill('I am looking for a calm study session this week.');
  await page.getByRole('button', { name: 'Share post' }).click();
  await expect(page.getByRole('heading', { name: 'Demo study group check-in' })).toBeVisible();
});
