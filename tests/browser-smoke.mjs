import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const consoleErrors = [];
const unexpectedOrigins = [];
const observedPages = new WeakSet();
function observe(target) {
  if (observedPages.has(target)) return;
  observedPages.add(target);
  target.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  target.on('pageerror', (error) => consoleErrors.push(error.message));
  target.on('response', (response) => { if (response.status() >= 400) consoleErrors.push(`${response.status()} ${response.url()}`); });
  target.on('request', (request) => {
    const origin = new URL(request.url()).origin;
    if (origin !== new URL(baseURL).origin) unexpectedOrigins.push(origin);
  });
}
observe(page);
context.on('page', observe);

async function assertAccessible(target, label) {
  const result = await new AxeBuilder({ page: target }).analyze();
  const blocking = result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  assert.deepEqual(blocking.map((violation) => `${violation.id}: ${violation.help}`), [], `${label} has serious accessibility violations`);
}

async function assertTouchTargets(target, selectors, label) {
  const sizes = await Promise.all(selectors.map(async ({ selector, name }) => {
    const box = await target.locator(selector).boundingBox();
    assert.ok(box, `${label}: ${name} is visible`);
    return { name, width: box.width, height: box.height };
  }));
  for (const size of sizes) {
    assert.ok(size.width >= 44, `${label}: ${size.name} is ${size.width}px wide; expected at least 44px`);
    assert.ok(size.height >= 44, `${label}: ${size.name} is ${size.height}px high; expected at least 44px`);
  }
}

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('main').count(), 1);
  assert.equal(await page.locator('h1').count(), 1);
  assert.match(await page.title(), /Code Lesson Checkpoints/);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://code-lesson-checkpoints.sociobot.in/');
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), 'https://code-lesson-checkpoints.sociobot.in/assets/social-card.jpg');
  assert.equal(await page.locator('img:not([alt])').count(), 0);
  assert.equal((await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)), true, 'home page overflows at 390px');
  await assertTouchTargets(page, [
    { selector: 'header .brand', name: 'header home link' },
    { selector: '.hero-actions .text-link', name: 'lesson-code link' },
  ], 'mobile home');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate((element) => document.activeElement === element), true, 'keyboard reaches the skip link first');
  const footerTargets = await page.locator('footer nav a').evaluateAll((links) => links.map((link) => {
    const box = link.getBoundingClientRect();
    return box.width >= 44 && box.height >= 44;
  }));
  assert.deepEqual(footerTargets, [true, true, true], 'footer links meet the 44 px touch target');
  await assertAccessible(page, 'home page');

  for (const route of ['/join', '/pricing', '/team', '/privacy', '/terms', '/missing-page']) {
    await page.goto(`${baseURL}${route}`);
    assert.equal(await page.locator('h1').count(), 1, `${route} must have one h1`);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://code-lesson-checkpoints.sociobot.in${route}`);
    assert.equal(await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth), true, `${route} overflows at 390px`);
    if (route === '/pricing') {
      await assertTouchTargets(page, [
        { selector: '.legal-callout a[href="/terms"]', name: 'pricing terms link' },
        { selector: '.legal-callout a[href="/privacy"]', name: 'pricing privacy link' },
      ], 'mobile pricing');
    }
    await assertAccessible(page, route);
  }

  // A license returned from hosted checkout must update this first pricing
  // render. Previously it was stored and verified but still showed Buy until
  // the tutor manually refreshed the page.
  const billingContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const billingPage = await billingContext.newPage();
  await billingPage.route('https://api.sociobot.in/api/v1/products/code-lesson-checkpoints/verify?license=qa-license-token', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) });
  });
  await billingPage.goto(`${baseURL}/pricing?license=qa-license-token`);
  await billingPage.getByRole('link', { name: 'Open Team archive' }).waitFor();
  assert.equal(new URL(billingPage.url()).searchParams.has('license'), false, 'returned license is removed from the visible URL');
  assert.equal(await billingPage.locator('a[href="/team"]').count(), 2, 'returned valid license unlocks the first pricing render');
  await billingContext.close();

  await page.goto(`${baseURL}/new`);
  await assertAccessible(page, 'lesson form');
  await page.getByLabel('Lesson title').fill('Async debugging');
  await page.getByRole('button', { name: /Create lesson path/ }).click();
  await page.waitForURL(/\/lesson\//);
  await page.getByText('Your lesson path is ready.').waitFor();
  const code = (await page.locator('.share-strip > code').textContent())?.trim();
  assert.equal(code?.length, 6);

  const learner = await context.newPage();
  await learner.goto(`${baseURL}/join/${code}`);
  await assertAccessible(learner, 'learner lesson');
  const shareRun = learner.getByRole('button', { name: /Share a run/ }).first();
  await shareRun.focus();
  await learner.keyboard.press('Enter');
  const dialog = learner.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.getByRole('button', { name: 'Close evidence form' }).evaluate((button) => document.activeElement === button), true, 'dialog moves focus to its close button');
  await assertAccessible(learner, 'open evidence dialog');
  await learner.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await shareRun.focus();
  await learner.keyboard.press('Space');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByLabel('Blocked').check();
  await dialog.getByLabel(/Selected terminal output/).fill('DATABASE_URL=postgres://qa_user:qa_password@db.example/private\nExpected 200 but got 401');
  await dialog.getByLabel(/What do you think/).fill('The request may be missing its header.');
  await dialog.getByLabel(/I reviewed this evidence/).check();
  await dialog.getByRole('button', { name: /Share this run/ }).click();
  await learner.getByText('DATABASE_URL=[redacted]').waitFor();
  assert.equal(await learner.getByText('qa_password').count(), 0);

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

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const desktopPage = await desktop.newPage();
  observe(desktopPage);
  for (const route of ['/', '/join', '/new', '/pricing', '/team', '/privacy', '/terms', '/missing-page']) {
    await desktopPage.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    assert.equal(await desktopPage.locator('body').evaluate((body) => body.scrollWidth <= innerWidth), true, `${route} overflows at desktop`);
    await assertAccessible(desktopPage, `desktop ${route}`);
  }
  await desktopPage.goto(baseURL);
  await desktopPage.locator('html').evaluate((html) => { html.style.fontSize = '32px'; });
  assert.equal(await desktopPage.locator('body').evaluate((body) => body.scrollWidth <= innerWidth), true, 'home page overflows at 200% root text');
  await desktopPage.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await desktopPage.locator('html').evaluate((html) => getComputedStyle(html).scrollBehavior), 'auto');
  assert.equal(await desktopPage.locator('.button').first().evaluate((button) => parseFloat(getComputedStyle(button).transitionDuration) <= 0.001), true, 'reduced motion removes meaningful transitions');
  await desktop.close();

  assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join('; ')}`);
  assert.deepEqual([...new Set(unexpectedOrigins)], [], `public and lesson routes contacted third parties: ${unexpectedOrigins.join('; ')}`);
  console.log('Browser smoke passed: mobile semantics, create, share, redact, reply, delete, no console errors.');
} finally {
  await browser.close();
}
