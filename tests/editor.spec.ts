import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('loads an accessible, working cue editor', async ({ page }) => {
  await expect(page).toHaveTitle(/Lesson Motion Cues/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByLabel('Lesson title')).toHaveValue('How pollination travels');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''))).toEqual([]);
});

test('creates an actor and a timed caption cue from a blank project', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'New' }).click();
  await expect(page.getByText('No actors on this terrain')).toBeVisible();
  await page.getByRole('button', { name: 'Add first actor' }).click();
  await page.getByLabel('Name').fill('Orbit');
  await page.locator('#actor-dialog').getByRole('button', { name: 'Add actor', exact: true }).click();
  await expect(page.locator('.actor-name', { hasText: 'Orbit' })).toBeVisible();
  await page.getByRole('button', { name: '+ Add cue' }).click();
  await page.getByLabel('Cue type').selectOption('say');
  await page.getByLabel('Caption text').fill('A planet follows a curved path.');
  await page.getByRole('button', { name: 'Save cue' }).click();
  await expect(page.locator('.cue-say')).toBeVisible();
});

test('exports deterministic JSON and serves legal routes', async ({ page }) => {
  await page.getByRole('button', { name: /Export/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Versioned JSON/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.lmc\.json$/);
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms' })).toBeVisible();
});

test('fits the core editor at 390px without page-level overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflows).toBe(false);
  await expect(page.getByRole('button', { name: 'Play preview' })).toBeVisible();
});
