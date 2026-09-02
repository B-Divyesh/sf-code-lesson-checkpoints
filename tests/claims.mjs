import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

function builtText(directory = 'dist') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return builtText(path);
    if (!/\.(?:html|js|css|json)$/i.test(entry.name) || statSync(path).size > 2_000_000) return [];
    return [readFileSync(path, 'utf8')];
  }).join('\n');
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
    assert.equal(new URL(page.url()).search, '?demo=1');
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
    assert.equal(before.demo.lesson.checkpoints.length, 3);
    assert.ok(before.demo.expiresAt * 1000 - Date.now() > 23 * 60 * 60 * 1000, 'workspace lasts about 24 hours');
    assert.equal(before.demo.lesson.checkpoints[0].submissions[0].status, 'passed');
    assert.equal(before.demo.lesson.checkpoints[1].submissions[0].status, 'blocked');
    assert.match(before.demo.lesson.checkpoints[1].submissions[0].output, /Authorization: \[redacted\]/);
    assert.match(before.demo.lesson.checkpoints[1].submissions[0].note, /header is added/);
    assert.match(before.demo.lesson.checkpoints[1].submissions[0].teacherReply, /headers object/);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await page.waitForFunction((previousId) => {
      const current = JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}');
      return current.workspaceId && current.workspaceId !== previousId;
    }, before.demo.workspaceId);
    const afterId = await page.evaluate(() => JSON.parse(localStorage.getItem('demo:clc:workspace') ?? '{}').workspaceId);
    assert.notEqual(afterId, before.demo.workspaceId);
    assert.equal((await fetch(`${baseURL}/api/demo/workspaces/${before.demo.workspaceId}`)).status, 404, 'reset deletes the old backend workspace');
    await page.getByRole('button', { name: 'Start for real' }).click();
    await page.waitForURL(`${baseURL}/new`);
    assert.equal(await page.evaluate(() => localStorage.getItem('demo:clc:workspace')), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('clc:tutor:real-lesson-sentinel')), 'private-real-token');
    assert.deepEqual([...new Set(origins)], [new URL(baseURL).origin]);
  }),

  '@claim:lesson-workflow': async () => {
    let created;
    try {
      const response = await fetch(`${baseURL}/api/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Ordered workflow fixture', learnerName: 'Riley',
          checkpoints: [
            { title: 'Open the test suite', command: 'npm test -- setup' },
            { title: 'Trace the failed request', command: 'npm test -- request' },
            { title: 'Verify the repair', command: 'npm test' },
          ],
        }),
      });
      assert.equal(response.status, 201);
      created = await response.json();
      const learner = await (await fetch(`${baseURL}/api/lessons/code/${created.shareCode}`)).json();
      for (const [index, status] of ['passed', 'blocked'].entries()) {
        const submitted = await fetch(`${baseURL}/api/lessons/code/${created.shareCode}/checkpoints/${learner.checkpoints[index].id}/submissions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, output: `attempt-${index + 1}`, note: `note-${index + 1}`, consented: true }),
        });
        assert.equal(submitted.status, 201);
      }
      await inContext(async (context, page) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL).origin });
        await page.goto(`${baseURL}/lesson/${created.id}?t=${created.tutorToken}`, { waitUntil: 'networkidle' });
        assert.deepEqual(await page.locator('.checkpoint h2').allTextContents(), [
          'Open the test suite', 'Trace the failed request', 'Verify the repair',
        ]);
        await page.getByRole('button', { name: 'Copy command for Trace the failed request' }).click();
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'npm test -- request');
        await page.getByText('First block at checkpoint 2').waitFor();
        assert.deepEqual(await page.locator('.attempt .learner-note').allTextContents(), ['note-1', 'note-2']);
        const blocked = page.locator(`#checkpoint-${learner.checkpoints[1].id}`);
        await blocked.getByLabel('Reply to this attempt').fill('Inspect the request headers before changing the test.');
        await blocked.getByRole('button', { name: /Send reply/ }).click();
        await page.getByText('Inspect the request headers before changing the test.').waitFor();
        const updated = await (await fetch(`${baseURL}/api/lessons/code/${created.shareCode}`)).json();
        assert.equal(updated.checkpoints[1].submissions[0].teacherReply, 'Inspect the request headers before changing the test.');
      });
    } finally {
      if (created) await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${created.tutorToken}` } });
    }
  },

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
      assert.equal((await fetch(`${baseURL}/api/tutor/lessons/${created.id}`, { headers: { Authorization: 'Bearer wrong-private-token' } })).status, 403);
      const submission = tutor.checkpoints[0].submissions[0];
      assert.equal(submission.status, 'blocked');
      assert.equal(submission.consented, true, 'the stored consent field is returned with the shared attempt');
      assert.equal(submission.note, 'The request may be missing its header.');
      assert.equal(submission.output.includes('claim-secret'), false);
      assert.equal(submission.output.includes('[redacted]'), true);
      assert.equal(submission.output.endsWith('… [output trimmed]'), true);
      assert.ok([...submission.output].length <= 8_020, 'stored output is capped at 8,000 characters plus the trim notice');
      await inContext(async (_context, page) => {
        await page.goto(`${baseURL}/lesson/${created.id}?t=${encodeURIComponent(created.tutorToken)}`, { waitUntil: 'networkidle' });
        const attempts = page.locator('.attempt');
        assert.equal(await attempts.count(), 1, 'the tutor sees the consented attempt');
        assert.equal(await attempts.locator('.consent-indicator').count(), 1, 'each tutor-visible attempt has one consent indicator');
        assert.equal(
          await attempts.locator('.consent-indicator').innerText(),
          'Learner reviewed and approved this share.',
          'the tutor receives an explicit stored-consent indicator',
        );
      });
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
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.locator('.home-team').getByText('$39', { exact: true }).waitFor();
    assert.equal((await page.locator('.home-team-price > p').innerText()).replace(/\s+/g, ' ').trim(), '$39 once');
    await page.locator('.home-team').getByText('Invite tutors with a team code', { exact: true }).waitFor();
    await page.locator('.home-team').getByText('Search shared lesson history', { exact: true }).waitFor();
    await page.locator('.home-team').getByText('Reopen records on another device', { exact: true }).waitFor();
    await page.locator('.home-team').getByText('No recurring fee', { exact: true }).waitFor();
    assert.equal(await page.locator('.home-team a[href*="checkout"]').count(), 0, 'landing page has no unverified purchase action');
    assert.equal(await page.locator('.home-team a[href="/pricing"]').count(), 1, 'landing page routes to complete plan details');
    await page.goto(`${baseURL}/pricing`, { waitUntil: 'networkidle' });
    await page.getByText('$39').waitFor();
    await page.getByText('One-time purchase', { exact: true }).waitFor();
    await page.getByText('No recurring fee').waitFor();
    const checkout = await page.getByRole('link', { name: /Buy Team workspace/ }).getAttribute('href');
    assert.equal(checkout, 'https://api.sociobot.in/api/v1/products/code-lesson-checkpoints/checkout');
    const response = await fetch(checkout, { redirect: 'manual' });
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get('location')).origin, 'https://checkout.dodopayments.com');
    assert.deepEqual([...new Set(requests.map((url) => new URL(url).origin))], [new URL(baseURL).origin]);
    assert.doesNotMatch(builtText(), /(?:js\.stripe\.com|checkout\.dodopayments\.com|paddle\.com\/checkout|paypal\.com\/sdk)/i);
  }),

  '@claim:license-restore': async () => inContext(async (_context, page) => {
    let checks = 0;
    await page.route('https://api.sociobot.in/api/v1/products/code-lesson-checkpoints/verify?license=*', async (route) => {
      checks += 1;
      const license = new URL(route.request().url()).searchParams.get('license');
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ valid: license !== 'revoked-license', reason: license === 'revoked-license' ? 'revoked' : 'ok' }) });
    });
    await page.goto(`${baseURL}/pricing?license=returned-license`);
    await page.getByRole('link', { name: 'Open Team workspace' }).waitFor();
    assert.equal(new URL(page.url()).search, '');
    assert.equal(await page.evaluate(() => localStorage.getItem('sb_license:code-lesson-checkpoints')), 'returned-license');
    assert.equal(checks, 1);
    await page.reload();
    await page.getByRole('link', { name: 'Open Team workspace' }).waitFor();
    assert.equal(checks, 1, 'the valid verdict is reused for one day');
    await page.evaluate(() => {
      localStorage.removeItem('sb_license:code-lesson-checkpoints');
      localStorage.removeItem('sb_license_verdict:code-lesson-checkpoints');
    });
    await page.goto(`${baseURL}/pricing`);
    await page.getByLabel('License token').fill('manual-license');
    await page.getByRole('button', { name: 'Verify license' }).click();
    await page.getByRole('link', { name: 'Open Team workspace' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('sb_license:code-lesson-checkpoints')), 'manual-license');
    await page.evaluate(() => localStorage.removeItem('sb_license_verdict:code-lesson-checkpoints'));
    await page.goto(`${baseURL}/pricing?license=revoked-license`);
    await page.getByText(/License no longer active/).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('sb_license:code-lesson-checkpoints')), null);
  }),

  '@claim:privacy-boundaries': async () => inContext(async (_context, page) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.goto(`${baseURL}/demo`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Find the first blocked checkpoint.' }).waitFor();
    assert.ok(requests.length > 0);
    assert.deepEqual([...new Set(requests.map((url) => new URL(url).origin))], [new URL(baseURL).origin]);
    assert.equal(await page.locator('input[type="file"]').count(), 0);
    assert.equal(await page.locator('[data-screen-capture], video, iframe').count(), 0);
    assert.doesNotMatch(builtText(), /(?:google-analytics|googletagmanager|segment\.com|mixpanel|posthog|mediaDevices|getDisplayMedia|RTCPeerConnection)/i);
  }),

  '@claim:team-roster-history': async () => {
    const created = [];
    try {
      const ownerResponse = await fetch(`${baseURL}/api/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Checkpoint Studio', ownerName: 'Maya Chen' }) });
      assert.equal(ownerResponse.status, 201); const owner = await ownerResponse.json();
      const memberResponse = await fetch(`${baseURL}/api/teams/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: owner.team.inviteCode, name: 'Jon Bell' }) });
      assert.equal(memberResponse.status, 201); const member = await memberResponse.json();
      for (const [index, [title, learnerName]] of [['HTTP request review', 'Maya Chen'], ['Schema migration review', 'Maya Chen']].entries()) {
        const response = await fetch(`${baseURL}/api/lessons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, learnerName, checkpoints: [{ title: 'Run tests', command: 'npm test' }] }) });
        assert.equal(response.status, 201); const lesson = await response.json(); created.push(lesson);
        const added = await fetch(`${baseURL}/api/teams/${owner.team.id}/lessons`, { method: 'POST', headers: { Authorization: `Bearer ${lesson.tutorToken}`, 'X-Team-Access': index === 0 ? owner.accessToken : member.accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id }) }); assert.equal(added.status, 201);
      }
      const team = await (await fetch(`${baseURL}/api/teams/${owner.team.id}`, { headers: { 'X-Team-Access': member.accessToken } })).json();
      assert.equal(team.members.length, 2); assert.deepEqual(team.lessons.map((lesson) => lesson.title).sort(), ['HTTP request review', 'Schema migration review']);
      const shared = await fetch(`${baseURL}/api/teams/${owner.team.id}/lessons/${created[1].id}`, { headers: { 'X-Team-Access': member.accessToken } }); assert.equal(shared.status, 200);
      await inContext(async (_context, page) => { await page.goto(baseURL); await page.evaluate(({ id, token }) => { localStorage.setItem('sb_license:code-lesson-checkpoints', 'cached-team-license'); localStorage.setItem('sb_license_verdict:code-lesson-checkpoints', JSON.stringify({ token: 'cached-team-license', at: Date.now(), verdict: { valid: true, reason: 'ok' } })); localStorage.setItem('clc:team', JSON.stringify({ id, token })); }, { id: owner.team.id, token: member.accessToken }); await page.goto(`${baseURL}/team`, { waitUntil: 'networkidle' }); await page.getByRole('heading', { name: 'Checkpoint Studio lesson history.' }).waitFor(); await page.getByLabel('Filter by learner or lesson').fill('schema'); assert.deepEqual(await page.locator('.archive-row:not([hidden]) h2').allTextContents(), ['Schema migration review']); await page.locator('.archive-row:not([hidden]) a').click(); await page.getByRole('heading', { name: 'Schema migration review' }).waitFor(); });
      const removed = await fetch(`${baseURL}/api/teams/${owner.team.id}/members/${member.team.members.find((person) => person.role === 'tutor').id}`, { method: 'DELETE', headers: { 'X-Team-Access': owner.accessToken } }); assert.equal(removed.status, 204);
      assert.equal((await fetch(`${baseURL}/api/teams/${owner.team.id}`, { headers: { 'X-Team-Access': member.accessToken } })).status, 403, 'removed tutor cannot read shared history');
    } finally { for (const lesson of created) await fetch(`${baseURL}/api/tutor/lessons/${lesson.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${lesson.tutorToken}` } }); }
  },

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

  '@claim:vscode-companion-download': async () => {
    const packagePath = 'public/downloads/code-lesson-checkpoints-0.1.0.vsix';
    const response = await fetch(`${baseURL}/downloads/code-lesson-checkpoints-0.1.0.vsix`);
    assert.equal(response.status, 200);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(String.fromCharCode(...bytes.slice(0, 2)), 'PK', 'download is a ZIP-based VSIX package');
    const listing = execFileSync('unzip', ['-l', packagePath], { encoding: 'utf8' });
    assert.match(listing, /extension\/package\.json/);
    assert.match(listing, /extension\/dist\/extension\.js/);
    assert.match(listing, /extension\/LICENSE\.txt/);
    const entry = execFileSync('unzip', ['-p', packagePath, 'extension/dist/extension.js'], { encoding: 'utf8' });
    assert.match(entry, /Run locally/);
    assert.match(entry, /execAsync\(checkpoint\.command/);
    assert.match(entry, /Share selected evidence/);
    const { redactAndCap } = await import('../extension/dist/privacy.js');
    const output = redactAndCap(`SERVICE_TOKEN=extension-secret\n${'x'.repeat(8_100)}`);
    assert.equal(output.includes('extension-secret'), false);
    assert.match(output, /\[redacted\]/);
    assert.ok([...output].length <= 8_020);
    execFileSync('npm', ['run', 'test:extension-host'], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: 'inherit',
    });
  },

  '@claim:original-artwork': async () => {
    const design = readFileSync('.factory/design.md', 'utf8');
    const prompt = JSON.parse(readFileSync('assets/src/hero-paper-path.json', 'utf8'));
    assert.match(design, /Generated specifically for this product/);
    assert.match(design, /2026-08-28/);
    assert.ok(typeof prompt.prompt === 'string' && prompt.prompt.length > 100);
    for (const path of [
      'assets/src/hero-paper-path.png',
      'public/assets/hero-paper-path.avif',
      'public/assets/hero-paper-path.webp',
      'public/assets/social-card.jpg',
    ]) assert.ok(statSync(path).size > 1_000, `${path} is a non-empty project asset`);
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
