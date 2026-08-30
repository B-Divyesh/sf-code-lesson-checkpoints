import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  const activeScript = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    await registration.update();
    return registration.active?.scriptURL;
  });
  assert.match(activeScript ?? '', /\/sw\.js$/, 'active service worker serves the shell');

  await page.goto(`${baseURL}/demo`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
  await page.getByText('Demo — sample data, nothing is saved').waitFor();
  assert.equal(await page.locator('#offline').isVisible(), true, 'offline shell states that updates cannot be shared');
  console.log('PWA smoke passed: service worker update resolves and the sample demo reloads offline with notice.');
} finally {
  await context.setOffline(false);
  await browser.close();
}
