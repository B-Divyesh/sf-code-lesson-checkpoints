import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const requested = process.argv.includes('--grep') ? process.argv[process.argv.indexOf('--grep') + 1] : null;
const browser = await chromium.launch({ headless: true });

async function inContext(action, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  try {
    return await action(context, await context.newPage());
  } finally {
    await context.close();
  }
}

const claims = {
  '@claim:demo-isolation': async () => inContext(async (_context, page) => {
    const origins = [];
    page.on('request', (request) => origins.push(new URL(request.url()).origin));
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('clc:archive', JSON.stringify([{ id: 'real-lesson-sentinel' }]));
      localStorage.setItem('clc:tutor:real-lesson-sentinel', 'private-real-token');
    });
    await page.getByRole('link', { name: /Try it with sample data/ }).click();
    await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
    await page.getByText('Demo — sample data, nothing is saved').waitFor();
    await page.getByText('First block at checkpoint 2').waitFor();
    const before = await page.evaluate(() => ({
      archive: localStorage.getItem('clc:archive'),
      tutor: localStorage.getItem('clc:tutor:real-lesson-sentinel'),
      demo: JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}'),
      keys: Object.keys(localStorage).filter((key) => key.startsWith('demo:')),
    }));
    assert.equal(before.archive, JSON.stringify([{ id: 'real-lesson-sentinel' }]));
    assert.equal(before.tutor, 'private-real-token');
    assert.deepEqual(before.keys, ['demo:clc:workspace']);
    assert.equal(before.demo.lesson.title, 'Debugging the weather API');
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await page.waitForFunction((previousId) => {
      const current = JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}');
      return current.workspaceId && current.workspaceId !== previousId;
    }, before.demo.workspaceId);
    const afterId = await page.evaluate(() => JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}').workspaceId);
    assert.notEqual(afterId, before.demo.workspaceId);
    assert.deepEqual([...new Set(origins)], [new URL(baseURL).origin]);
  }),

  '@claim:consented-redacted-evidence': async () => {
    let created;
    try {
      const create = await fetch(`${baseURL}/api/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Claim evidence fixture', checkpoints: [{ title: 'Run the tests', command: 'npm test', successHint: 'All tests pass' }] }),
      });
      assert.equal(create.status, 201);
      created = await create.json();
      const lesson = await (await fetch(`${baseURL}/api/lessons/code/${created.shareCode}`)).json();
      const endpoint = `${baseURL}/api/lessons/code/${created.shareCode}/checkpoints/${lesson.checkpoints[0].id}/submissions`;
      const rejected = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'blocked', output: 'API_KEY=unshared', note: 'No consent', consented: false }),
      });
      assert.equal(rejected.status, 400, 'evidence without consent is rejected');
      const accepted = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'blocked', output: `API_KEY=claim-secret\n${'x'.repeat(8_100)}`, note: 'The request may be missing its header.', consented: true }),
      });
      assert.equal(accepted.status, 201);
      const tutor = await (await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { headers: { Authorization: `Bearer ${created.tutorToken}` } })).json();
      const submission = tutor.checkpoints[0].submissions[0];
      assert.equal(submission.status, 'blocked');
      assert.equal(submission.note, 'The request may be missing its header.');
      assert.equal(submission.output.includes('claim-secret'), false);
      assert.equal(submission.output.includes('[redacted]'), true);
      assert.equal(submission.output.endsWith('… [output trimmed]'), true);
      assert.ok([...submission.output].length <= 8_020, 'stored output is capped at 8,000 characters plus the trim notice');
      const reply = await fetch(`${baseURL}/api/tutor/submissions/${submission.id}/reply`, {
        method: 'PUT', headers: { Authorization: `Bearer ${created.tutorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: 'Inspect where the request headers are created.' }),
      });
      assert.equal(reply.status, 200);
      const learner = await (await fetch(`${baseURL}/api/lessons/code/${created.shareCode}`)).json();
      assert.equal(learner.checkpoints[0].submissions[0].teacherReply, 'Inspect where the request headers are created.');
    } finally {
      if (created) await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${created.tutorToken}` } });
    }
  },

  '@claim:offline-demo-reload': async () => inContext(async (context, page) => {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.goto(`${baseURL}/demo`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
    assert.equal(await page.locator('#offline').isVisible(), true);
    await context.setOffline(false);
  }),

  '@claim:json-export': async () => inContext(async (_context, page) => {
    await page.goto(`${baseURL}/demo`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export sample record' }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'sample-code-lesson-checkpoints.json');
    const stream = await download.createReadStream();
    let contents = '';
    for await (const chunk of stream) contents += chunk.toString();
    const record = JSON.parse(contents);
    assert.equal(record.title, 'Debugging the weather API');
    assert.equal(record.checkpoints.length, 3);
    assert.equal(record.checkpoints[1].submissions[0].status, 'blocked');
  }, { acceptDownloads: true }),

  '@claim:paid-team-checkout': async () => inContext(async (_context, page) => {
    await page.goto(`${baseURL}/pricing`, { waitUntil: 'networkidle' });
    await page.getByText('$39').waitFor();
    await page.getByText('One-time unlock').waitFor();
    const checkout = await page.getByRole('link', { name: /Buy Team archive/ }).getAttribute('href');
    assert.equal(checkout, 'https://api.sociobot.in/api/v1/products/code-lesson-checkpoints/checkout');
    const response = await fetch(checkout, { redirect: 'manual' });
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get('location')).origin, 'https://checkout.dodopayments.com');
  }),

  '@claim:no-tracking': async () => inContext(async (_context, page) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.goto(`${baseURL}/demo`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
    assert.ok(requests.length > 0);
    assert.deepEqual([...new Set(requests.map((url) => new URL(url).origin))], [new URL(baseURL).origin]);
    assert.equal(await page.locator('input[type="file"]').count(), 0);
  }),

  '@claim:team-roster-history': async () => inContext(async (_context, page) => {
    const records = [
      { id: 'lesson-2026-08', title: 'HTTP request review', learnerName: 'Maya Chen', shareCode: 'MAYA08', tutorToken: 'private-maya', createdAt: '2026-08-12T10:00:00.000Z' },
      { id: 'lesson-2026-07', title: 'Schema migration review', learnerName: 'Maya Chen', shareCode: 'MAYA07', tutorToken: 'private-maya-old', createdAt: '2026-07-10T10:00:00.000Z' },
      { id: 'lesson-2026-06', title: 'Async cleanup', learnerName: 'Jon Bell', shareCode: 'JON006', tutorToken: 'private-jon', createdAt: '2026-06-08T10:00:00.000Z' },
    ];
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate((archive) => {
      localStorage.setItem('sb_license:code-lesson-checkpoints', 'cached-team-license');
      localStorage.setItem('sb_license_verdict:code-lesson-checkpoints', JSON.stringify({ at: Date.now(), verdict: { valid: true, reason: 'ok' } }));
      localStorage.setItem('clc:archive', JSON.stringify(archive));
    }, records);
    await page.goto(`${baseURL}/team`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Your teaching roster.' }).waitFor();
    assert.deepEqual(await page.locator('.archive-row h2').allTextContents(), [
      'HTTP request review',
      'Schema migration review',
      'Async cleanup',
    ]);
    await page.getByLabel('Filter by learner or lesson').fill('schema');
    assert.deepEqual(await page.locator('.archive-row:not([hidden]) h2').allTextContents(), ['Schema migration review']);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.archive-row').count(), 3, 'saved lesson history remains available after a reload');
  }),

  '@claim:permanent-lesson-deletion': async () => {
    let created;
    try {
      const create = await fetch(`${baseURL}/api/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Deletion claim fixture', checkpoints: [{ title: 'Run cleanup', command: 'npm test' }] }),
      });
      assert.equal(create.status, 201);
      created = await create.json();
      const learnerBefore = await (await fetch(`${baseURL}/api/lessons/code/${created.shareCode}`)).json();
      const checkpointId = learnerBefore.checkpoints[0].id;
      const submit = await fetch(`${baseURL}/api/lessons/code/${created.shareCode}/checkpoints/${checkpointId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'blocked', output: 'API_KEY=delete-fixture', note: 'A run to remove', consented: true }),
      });
      assert.equal(submit.status, 201);
      const tutorBefore = await (await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { headers: { Authorization: `Bearer ${created.tutorToken}` } })).json();
      const submissionId = tutorBefore.checkpoints[0].submissions[0].id;
      const reply = await fetch(`${baseURL}/api/tutor/submissions/${submissionId}/reply`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${created.tutorToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: 'This reply must be removed too.' }),
      });
      assert.equal(reply.status, 200);
      const remove = await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${created.tutorToken}` },
      });
      assert.equal(remove.status, 204);
      assert.equal((await fetch(`${baseURL}/api/lessons/code/${created.shareCode}`)).status, 404);
      assert.equal((await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { headers: { Authorization: `Bearer ${created.tutorToken}` } })).status, 404);
      created = undefined;
    } finally {
      if (created) await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${created.tutorToken}` } });
    }
  },
};

try {
  const selected = requested ? Object.entries(claims).filter(([tag]) => tag === requested) : Object.entries(claims);
  assert.ok(selected.length > 0, `Unknown claim tag: ${requested}`);
  for (const [tag, test] of selected) {
    await test();
    console.log(`PASS ${tag}`);
  }
} finally {
  await browser.close();
}
