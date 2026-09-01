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
  target.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (response.status() >= 400 && !(response.status() === 404 && pathname === '/missing-page')) {
      consoleErrors.push(`${response.status()} ${response.url()}`);
    }
  });
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
    { selector: '.hero-actions a[href="/?demo=1"]', name: 'sample-data action' },
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

  await page.evaluate(() => localStorage.setItem('clc:archive', JSON.stringify([{ id: 'real-record' }])));
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await page.waitForURL(`${baseURL}/?demo=1`);
  await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
  assert.equal(await page.locator('main h1').evaluate((heading) => document.activeElement === heading), true, 'forward route moves focus to the demo heading');
  await page.goBack();
  await page.getByRole('heading', { name: 'See where the lesson got stuck.' }).waitFor();
  assert.equal(await page.locator('main h1').evaluate((heading) => document.activeElement === heading), true, 'Back moves focus to the restored heading');
  await page.goForward();
  await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
  assert.equal(await page.locator('main h1').evaluate((heading) => document.activeElement === heading), true, 'Forward restores focus to the demo heading');
  await page.getByText('Demo — sample data, nothing is saved').waitFor();
  await page.getByText('First block at checkpoint 2').waitFor();
  assert.equal(await page.getByText('qa_password').count(), 0, 'sample evidence contains no raw secret');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('clc:archive') ?? 'null')), [{ id: 'real-record' }], 'demo leaves real archive storage untouched');
  const demoKeys = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('demo:')));
  assert.deepEqual(demoKeys, ['demo:clc:workspace'], 'demo uses only its namespaced storage key');
  assert.equal(await page.locator('h4').count(), 0, 'demo heading levels do not skip from h2 to h4');
  const firstWorkspace = await page.evaluate(() => JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}').workspaceId);
  await page.getByLabel('Sample terminal output').fill(`API_KEY=browser-secret\n${'x'.repeat(8_100)}`);
  await page.getByText('1 possible secret hidden. Output trimmed to 8,000 characters.').waitFor();
  assert.equal(await page.locator('#demo-redacted').textContent().then((value) => value?.includes('browser-secret')), false, 'browser preview hides the secret');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export sample record' }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'sample-code-lesson-checkpoints.json');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.waitForFunction((previousId) => {
    const current = JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}');
    return current.workspaceId && current.workspaceId !== previousId;
  }, firstWorkspace);
  const resetWorkspace = await page.evaluate(() => JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}').workspaceId);
  assert.notEqual(resetWorkspace, firstWorkspace, 'reset provisions a fresh isolated workspace');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.waitForURL(`${baseURL}/new`);
  assert.equal(await page.evaluate(() => localStorage.getItem('demo:clc:workspace')), null, 'leaving demo discards its local data');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('clc:archive') ?? 'null')), [{ id: 'real-record' }], 'leaving demo preserves real storage');
  await page.evaluate(() => localStorage.removeItem('clc:archive'));

  for (const route of ['/demo', '/join', '/pricing', '/team', '/privacy', '/terms']) {
    const response = await page.goto(`${baseURL}${route}`);
    assert.equal(response?.status(), 200, `${route} response status`);
    assert.equal(await page.locator('h1').count(), 1, `${route} must have one h1`);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://code-lesson-checkpoints.sociobot.in${route}`);
    assert.ok((await page.locator('meta[name="description"]').getAttribute('content'))?.length > 20, `${route} has a route description`);
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
  assert.equal(await billingPage.locator('a[href="/team"]').count(), 1, 'returned valid license unlocks the first pricing render');
  await billingContext.close();

  await page.goto(`${baseURL}/new`);
  await assertAccessible(page, 'lesson form');
  await page.getByLabel('Lesson title').fill('Async debugging');
  await page.getByRole('button', { name: /Create lesson/ }).click();
  await page.waitForURL(/\/lesson\//);
  await page.getByText('Your lesson is ready.').waitFor();
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
  await dialog.getByLabel(/Selected terminal output/).fill('SERVICE_TOKEN=browser-secret\nExpected 200 but got 401');
  await dialog.getByLabel(/What do you think/).fill('The request may be missing its header.');
  await dialog.getByLabel(/I reviewed these results/).check();
  await dialog.getByRole('button', { name: /Share this run/ }).click();
  await learner.getByText('SERVICE_TOKEN=[redacted]').waitFor();
  assert.equal(await learner.getByText('browser-secret').count(), 0);

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
  for (const route of ['/', '/demo', '/join', '/new', '/pricing', '/team', '/privacy', '/terms']) {
    const response = await desktopPage.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200, `desktop ${route} response status`);
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

  // A real document-level 404 produces Chromium's expected failed-resource
  // console line, so verify it in an isolated page and keep the normal-route
  // console assertion signal-free.
  const missingContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const missingPage = await missingContext.newPage();
  const missingResponse = await missingPage.goto(`${baseURL}/missing-page`);
  assert.equal(missingResponse?.status(), 404, 'unknown route has a real HTTP 404');
  assert.equal(await missingPage.locator('h1').count(), 1, 'not-found page has one h1');
  assert.equal(await missingPage.getByRole('heading', { name: 'Page not found' }).count(), 1);
  assert.equal((await missingPage.locator('footer a[href^="https://github.com"]').textContent())?.trim(), 'Source on GitHub (external)');
  await assertAccessible(missingPage, 'not-found page');
  await missingContext.close();

  assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join('; ')}`);
  assert.deepEqual([...new Set(unexpectedOrigins)], [], `public and lesson routes contacted third parties: ${unexpectedOrigins.join('; ')}`);
  console.log('Browser smoke passed: mobile semantics, create, share, redact, reply, delete, no console errors.');
} finally {
  await browser.close();
}
