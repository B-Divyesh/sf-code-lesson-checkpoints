import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('response', (response) => { if (response.status() >= 400) consoleErrors.push(`${response.status()} ${response.url()}`); });

async function assertAccessible(target, label) {
  const result = await new AxeBuilder({ page: target }).analyze();
  const blocking = result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  assert.deepEqual(blocking.map((violation) => `${violation.id}: ${violation.help}`), [], `${label} has serious accessibility violations`);
}

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('main').count(), 1);
  assert.equal(await page.locator('h1').count(), 1);
  assert.match(await page.title(), /Code Lesson Checkpoints/);
  assert.equal(await page.locator('img:not([alt])').count(), 0);
  assert.equal((await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)), true, 'home page overflows at 390px');
  await assertAccessible(page, 'home page');

  for (const route of ['/join', '/pricing', '/privacy', '/terms']) {
    await page.goto(`${baseURL}${route}`);
    assert.equal(await page.locator('h1').count(), 1, `${route} must have one h1`);
    await assertAccessible(page, route);
  }

  await page.goto(`${baseURL}/new`);
  await assertAccessible(page, 'lesson form');
  await page.getByLabel('Lesson title').fill('Async debugging');
  await page.getByLabel('Learner name').fill('Sam');
  await page.getByRole('button', { name: /Create lesson path/ }).click();
  await page.waitForURL(/\/lesson\//);
  await page.getByText('Your lesson path is ready.').waitFor();
  const code = (await page.locator('.share-strip > code').textContent())?.trim();
  assert.equal(code?.length, 6);

  const learner = await context.newPage();
  await learner.goto(`${baseURL}/join/${code}`);
  await assertAccessible(learner, 'learner lesson');
  await learner.getByRole('button', { name: /Share a run/ }).first().click();
  const dialog = learner.getByRole('dialog');
  await dialog.getByLabel('Blocked').check();
  await dialog.getByLabel(/Selected terminal output/).fill('API_KEY=must-not-leak\nExpected 200 but got 401');
  await dialog.getByLabel(/What do you think/).fill('The request may be missing its header.');
  await dialog.getByLabel(/I reviewed this evidence/).check();
  await dialog.getByRole('button', { name: /Share this run/ }).click();
  await learner.getByText('API_KEY=[redacted]').waitFor();
  assert.equal(await learner.getByText('must-not-leak').count(), 0);

  await page.reload();
  await page.getByText('First block at checkpoint 1').waitFor();
  await assertAccessible(page, 'tutor timeline');
  await page.getByLabel('Reply to this attempt').fill('Inspect where the Authorization header is constructed.');
  await page.getByRole('button', { name: /Send reply/ }).click();
  await page.getByText('Inspect where the Authorization header is constructed.').waitFor();
  await learner.reload();
  await learner.getByText('Inspect where the Authorization header is constructed.').waitFor();

  await page.getByRole('button', { name: /Delete this lesson/ }).click();
  await page.getByRole('textbox', { name: 'Confirmation', exact: true }).fill('DELETE');
  await page.getByRole('button', { name: 'Delete lesson permanently' }).click();
  await page.waitForURL(`${baseURL}/?deleted=1`);

  assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join('; ')}`);
  console.log('Browser smoke passed: mobile semantics, create, share, redact, reply, delete, no console errors.');
} finally {
  await browser.close();
}
