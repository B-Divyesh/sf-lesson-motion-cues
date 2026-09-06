import { expect, test, type Download, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const REAL_STORAGE_KEY = 'lmc:project:v1';
const storedProject = (title = 'My real lesson') => ({
  format: 'lesson-motion-cues', version: 1, title, duration: 45, background: '#fffced', actors: [], cues: []
});

async function bytes(download: Download) {
  const path = await download.path();
  if (!path) throw new Error('Download had no local path');
  return readFile(path);
}

async function setPreviewTime(page: Page, seconds: number) {
  await page.locator('#scrubber').evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, seconds);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('lmc:test-clean')) {
      localStorage.clear();
      sessionStorage.setItem('lmc:test-clean', '1');
    }
  });
});

test('@claim:cold-first-screen names the job, audience, and recommended sample action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveTitle('Lesson Motion Cues — build timed lesson animations');
  await expect(page.getByRole('heading', { level: 1, name: 'Build a timed lesson animation' })).toBeVisible();
  await expect(page.getByText(/For teachers and technical educators/)).toBeVisible();
  await expect(page.getByText('Recommended first step.')).toBeVisible();
  const sample = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(sample).toBeVisible();
  const box = await sample.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(844);
});

test('@claim:demo-isolation keeps sample changes separate from real lessons', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Lesson title').fill('My real lesson');
  await page.getByLabel('Lesson title').blur();
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Lesson Motion Cues');
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.getByLabel('Lesson title')).toHaveValue('How pollination travels');
  await expect(page.locator('.actor-row')).toHaveCount(3);
  await expect(page.locator('.cue')).toHaveCount(7);
  await page.getByLabel('Lesson title').fill('Changed only in demo');
  await page.getByLabel('Lesson title').blur();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).title, REAL_STORAGE_KEY)).toBe('My real lesson');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Lesson title')).toHaveValue('How pollination travels');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByLabel('Lesson title')).toHaveValue('My real lesson');
});

test('@claim:free-core creates a captioned cue without a license', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:lesson-motion-cues'))).toBeNull();
  await page.locator('#stage').getByRole('button', { name: 'Add first actor' }).click();
  await page.getByLabel('Name').fill('Orbit');
  await page.locator('#actor-dialog').getByRole('button', { name: 'Add actor', exact: true }).click();
  await page.getByRole('button', { name: '+ Add cue' }).click();
  await page.getByLabel('Cue type').selectOption('say');
  await page.getByLabel('Caption text').fill('A planet follows a curved path.');
  await page.getByRole('button', { name: 'Save cue' }).click();
  await setPreviewTime(page, 1);
  await expect(page.getByText('A planet follows a curved path.')).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).cues.length, REAL_STORAGE_KEY)).toBe(1);
});

test('@claim:cue-preview renders sample captions and deterministic motion', async ({ page }) => {
  await page.goto('/demo');
  await setPreviewTime(page, 3);
  await expect(page.getByText('I carry pollen from one flower to another.')).toBeVisible();
  await setPreviewTime(page, 9.5);
  const x = await page.locator('[data-actor="bee"]').evaluate(el => Number((el as HTMLElement).style.getPropertyValue('--x')));
  expect(x).toBeCloseTo(41.5);
});

test('@claim:portable-exports downloads reusable JSON, JavaScript, and SVG', async ({ page }) => {
  await page.goto('/demo');
  await setPreviewTime(page, 3);
  await page.getByRole('button', { name: /Export files/ }).click();
  const jsonEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Versioned JSON/ }).click();
  const json = JSON.parse((await bytes(await jsonEvent)).toString());
  expect(json).toMatchObject({ format: 'lesson-motion-cues', version: 1, title: 'How pollination travels' });
  expect(json.actors).toHaveLength(3);
  expect(json.cues).toHaveLength(7);
  const starts = json.cues.map((cue: { start: number }) => cue.start);
  expect(starts).toEqual([...starts].sort((a: number, b: number) => a - b));
  const jsEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /JavaScript data/ }).click();
  const javascript = (await bytes(await jsEvent)).toString();
  expect(javascript).toContain('export const lesson =');
  expect(JSON.parse(javascript.replace(/^.*export const lesson = /s, '').replace(/;\s*$/, ''))).toMatchObject({ version: 1 });
  const svgEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Self-contained SVG/ }).click();
  const svg = (await bytes(await svgEvent)).toString();
  expect(svg).toMatch(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  expect(svg).toContain('I carry pollen from one flower to another.');
  expect(svg).not.toMatch(/(?:href|src)="https?:/);
});

test('@claim:video-export records a playable browser video file', async ({ page }) => {
  test.setTimeout(20_000);
  await page.goto('/demo');
  await page.getByLabel('Length').fill('1');
  await page.getByLabel('Length').blur();
  await page.getByRole('button', { name: /Export files/ }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Record video/ }).click();
  const download = await downloadEvent;
  const video = await bytes(download);
  expect(video.byteLength).toBeGreaterThan(1_000);
  if (download.suggestedFilename().endsWith('.mp4')) expect(video.subarray(4, 8).toString()).toBe('ftyp');
  else {
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
    expect(video.subarray(0, 4).toString('hex')).toBe('1a45dfa3');
  }
});

test('@claim:reduced-motion uses stepped actor positions', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto('/demo');
    await setPreviewTime(page, 8);
    expect(await page.locator('[data-actor="bee"]').evaluate(el => Number((el as HTMLElement).style.getPropertyValue('--x')))).toBe(16);
    await setPreviewTime(page, 12);
    expect(await page.locator('[data-actor="bee"]').evaluate(el => Number((el as HTMLElement).style.getPropertyValue('--x')))).toBe(67);
  } finally {
    await context.close();
  }
});

test('@claim:local-privacy sends no lesson or imported SVG data off site', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await page.locator('#stage').getByRole('button', { name: 'Add first actor' }).click();
  await page.getByLabel('Name').fill('Local diagram');
  await page.locator('input[name="svg"]').setInputFiles({ name: 'diagram.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8"/></svg>') });
  await page.locator('#actor-dialog').getByRole('button', { name: 'Add actor', exact: true }).click();
  await expect(page.getByText('Local diagram', { exact: true }).first()).toBeVisible();
  const networkRequests = requests.filter(url => /^https?:/.test(url));
  expect(networkRequests.every(url => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(await page.context().cookies()).toEqual([]);
});

test('@claim:audio-local keeps imported audio in the current tab', async ({ page }) => {
  await page.goto('/');
  const wavHeader = Buffer.from('524946462400000057415645666d74201000000001000100401f0000803e0000020010006461746100000000', 'hex');
  await page.locator('#audio-file').setInputFiles({ name: 'narration.wav', mimeType: 'audio/wav', buffer: wavHeader });
  await expect(page.getByText('narration.wav is attached for this tab.')).toBeVisible();
  expect(await page.locator('#lesson-audio').getAttribute('src')).toMatch(/^blob:/);
  const savedAudio = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).audio, REAL_STORAGE_KEY);
  expect(savedAudio).toEqual({ name: 'narration.wav' });
});

test('@claim:svg-sanitization removes scripts and external references', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await page.locator('#stage').getByRole('button', { name: 'Add first actor' }).click();
  await page.getByLabel('Name').fill('Safe shape');
  await page.locator('input[name="svg"]').setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><image href="https://invalid.example/tracker.png"/><circle cx="8" cy="8" r="6"/></svg>') });
  await page.locator('#actor-dialog').getByRole('button', { name: 'Add actor', exact: true }).click();
  const cleaned = await page.locator('[data-actor] img').evaluate((image: HTMLImageElement) => {
    const encoded = image.src.split(',')[1];
    return new TextDecoder().decode(Uint8Array.from(atob(encoded), character => character.charCodeAt(0)));
  });
  expect(cleaned).not.toMatch(/<script|onload=|https:\/\//i);
  expect(requests.some(url => url.includes('invalid.example'))).toBe(false);
});

test('@claim:offline-reload opens the sample after the first visit', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto('/demo');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    });
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'Edit a timed pollination lesson' })).toBeVisible();
    await expect(page.locator('.actor-row')).toHaveCount(3);
  } finally {
    await context.close();
  }
});

test('rejects malformed imported JSON without changing or corrupting saved state', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Lesson title').fill('Safe lesson');
  await page.getByLabel('Lesson title').blur();
  const malformed = { format: 'lesson-motion-cues', version: 1, title: 'Broken lesson', duration: 20, background: '#fffced', actors: [{ id: 'actor_1', name: 7, shape: 'circle', color: '#c98427', x: 20, y: 40, size: 15 }], cues: [] };
  let alertText = '';
  page.once('dialog', async dialog => { alertText = dialog.message(); await dialog.accept(); });
  await page.locator('#project-file').setInputFiles({ name: 'broken.lmc.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(malformed)) });
  await expect.poll(() => alertText).toContain('Actor 1 name');
  await expect(page.getByLabel('Lesson title')).toHaveValue('Safe lesson');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).title, REAL_STORAGE_KEY)).toBe('Safe lesson');
  await page.reload();
  await expect(page.getByLabel('Lesson title')).toHaveValue('Safe lesson');
});

test('recovers from malformed stored JSON with a clear blank state', async ({ page }) => {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: REAL_STORAGE_KEY, value: { ...storedProject('Broken saved lesson'), actors: [{ id: 'actor_1', name: 7, shape: 'circle', color: '#c98427', x: 20, y: 40, size: 15 }] } });
  await page.goto('/');
  await expect(page.getByText('Saved lesson reset')).toBeVisible();
  await expect(page.getByLabel('Lesson title')).toHaveValue('Untitled lesson');
  expect(await page.evaluate(key => localStorage.getItem(key), REAL_STORAGE_KEY)).toBeNull();
  await expect(page.locator('#stage').getByRole('button', { name: 'Add first actor' })).toBeVisible();
});

test('keeps the blank-project path and dialog focus usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New lesson' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  const addFirst = page.locator('#stage').getByRole('button', { name: 'Add first actor' });
  await addFirst.click();
  await expect(page.getByLabel('Name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(addFirst).toBeFocused();
});

test('handles duration and cue boundaries and recovers after an invalid cue', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Length').fill('901');
  await page.getByLabel('Length').blur();
  await expect(page.getByLabel('Length')).toHaveValue('900');
  await page.locator('#stage').getByRole('button', { name: 'Add first actor' }).click();
  await page.getByLabel('Name').fill('Boundary actor');
  await page.locator('#actor-dialog').getByRole('button', { name: 'Add actor', exact: true }).click();
  await page.getByRole('button', { name: '+ Add cue' }).click();
  await page.getByLabel('Starts at').fill('899.9');
  await page.getByLabel('Lasts').fill('0.2');
  await page.getByRole('button', { name: 'Save cue' }).click();
  await expect(page.locator('#cue-dialog .form-error')).toHaveText('Keep this cue between 0 and 900 seconds.');
  await page.getByLabel('Lasts').fill('0.1');
  await page.getByRole('button', { name: 'Save cue' }).click();
  await expect(page.locator('.cue-enter')).toHaveCount(1);
  await page.getByLabel('Length').fill('0');
  await page.getByLabel('Length').blur();
  await expect(page.getByLabel('Length')).toHaveValue('1');
});

test('uses route-specific titles, accessible structure, and a designed not-found page', async ({ page }) => {
  for (const [path, title] of [['/', 'Lesson Motion Cues — build timed lesson animations'], ['/demo', 'Demo — Lesson Motion Cues'], ['/privacy', 'Privacy — Lesson Motion Cues'], ['/terms', 'Terms — Lesson Motion Cues']]) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  }
  await page.goto('/missing-page');
  await expect(page).toHaveTitle('Page not found — Lesson Motion Cues');
  await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the lesson editor' })).toBeVisible();
});

test('explains the unavailable checkout without opening a broken link', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Field Kit' }).click();
  await expect(page.getByRole('button', { name: 'Checkout temporarily unavailable' })).toBeDisabled();
  await expect(page.getByText('Sociobot product registration is pending.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Verify and restore' })).toBeVisible();
});

test('@claim:field-kit restores a valid license and loads all three paid templates', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/lesson-motion-cues/verify?*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) }));
  await page.goto('/');
  await page.getByRole('button', { name: 'View Field Kit' }).click();
  await page.getByLabel('Have a license?').fill('test-license-fixture');
  await page.getByRole('button', { name: 'Verify and restore' }).click();
  await expect(page.locator('[data-template]')).toHaveCount(3);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /Process lesson/ }).click();
  await expect(page.getByLabel('Lesson title')).toHaveValue('Explain a process');
});
