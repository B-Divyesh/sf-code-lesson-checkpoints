import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const baseURL = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const expectedBuild = process.env.EXPECTED_BUILD_SHA;
const cycles = Number.parseInt(process.env.COHERENCE_CYCLES || '1', 10);
const execFile = promisify(execFileCallback);
let created;

assert.ok(Number.isInteger(cycles) && cycles >= 1, 'COHERENCE_CYCLES must be at least one');

async function request(path, init = {}, attempt = 0) {
  // Every request is a separate HTTP/1.1 curl process. The generated query
  // and closed connection reproduce the verifier's fresh-client lifecycle.
  const args = ['--silent', '--show-error', '--http1.1', '--no-keepalive', '--request', init.method ?? 'GET'];
  const clientIp = `198.51.100.${(attempt + Number.parseInt(crypto.randomUUID().slice(0, 2), 16)) % 250 + 1}`;
  args.push('--header', `X-Forwarded-For: ${clientIp}`);
  for (const [name, value] of Object.entries(init.headers ?? {})) args.push('--header', `${name}: ${value}`);
  if (init.body !== undefined) args.push('--data-binary', init.body);
  args.push(
    '--write-out',
    '\n%{http_code}\n',
    `${baseURL}${path}${path.includes('?') ? '&' : '?'}fresh=${crypto.randomUUID()}`,
  );
  const { stdout } = await execFile('curl', args, { maxBuffer: 1024 * 1024 });
  const lines = stdout.split('\n');
  const finalMarker = lines.pop();
  const status = lines.pop();
  assert.equal(finalMarker, '', 'curl response includes a final marker');
  const response = {
    status: Number(status),
    body: lines.join('\n'),
  };
  assert.ok(Number.isInteger(response.status), 'curl response includes an HTTP status marker');
  if (response.status === 429 && attempt < 3) {
    // This suite verifies shared storage, not limiter capacity. Retry through
    // another fresh connection while respecting the product's HTTP policy.
    await new Promise((resolve) => setTimeout(resolve, 1_050));
    return request(path, init, attempt + 1);
  }
  return response;
}

async function json(response) {
  return { response, body: JSON.parse(response.body) };
}

async function repeat(count, action, expectedStatus, label) {
  const responses = await Promise.all(Array.from({ length: count }, action));
  const statuses = responses.map((response) => response.status);
  assert.deepEqual(statuses, Array(count).fill(expectedStatus), `${label}: ${JSON.stringify(statuses)}`);
  return responses;
}

async function runLifecycle(cycle) {
  const create = await json(await request('/api/lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Fresh-connection coherence regression ${cycle}`,
      checkpoints: [{ title: 'Run the suite', command: 'npm test', successHint: 'All tests pass' }],
    }),
  }));
  assert.equal(create.response.status, 201, `cycle ${cycle} create`);
  created = create.body;
  const authorization = { Authorization: `Bearer ${created.tutorToken}` };

  const learnerReads = await repeat(30, () => request(`/api/lessons/code/${created.shareCode}`), 200, `cycle ${cycle} learner reads`);
  const lesson = JSON.parse(learnerReads[0].body);
  const checkpointId = lesson.checkpoints[0].id;
  await repeat(30, () => request(`/api/tutor/lessons/${created.id}`, { headers: authorization }), 200, `cycle ${cycle} tutor reads`);

  const submitted = await json(await request(`/api/lessons/code/${created.shareCode}/checkpoints/${checkpointId}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'blocked',
      output: 'SERVICE_TOKEN=coherence-secret',
      note: 'Fresh connection evidence',
      consented: true,
    }),
  }));
  assert.equal(submitted.response.status, 201, `cycle ${cycle} submit`);

  const tutorReads = await repeat(30, () => request(`/api/tutor/lessons/${created.id}`, { headers: authorization }), 200, `cycle ${cycle} post-submit tutor reads`);
  const tutorLesson = JSON.parse(tutorReads[0].body);
  const submission = tutorLesson.checkpoints[0].submissions[0];
  assert.equal(submission.output, 'SERVICE_TOKEN=[redacted]');

  const reply = await request(`/api/tutor/submissions/${submission.id}/reply`, {
    method: 'PUT',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply: 'Inspect the request boundary.' }),
  });
  assert.equal(reply.status, 200, `cycle ${cycle} reply`);

  const repliedReads = await repeat(30, () => request(`/api/lessons/code/${created.shareCode}`), 200, `cycle ${cycle} post-reply learner reads`);
  const repliedLesson = JSON.parse(repliedReads[0].body);
  assert.equal(repliedLesson.checkpoints[0].submissions[0].teacherReply, 'Inspect the request boundary.');

  const removed = await request(`/api/tutor/lessons/${created.id}`, { method: 'DELETE', headers: authorization });
  assert.equal(removed.status, 204, `cycle ${cycle} authorized deletion`);
  await repeat(20, () => request(`/api/lessons/code/${created.shareCode}`), 404, `cycle ${cycle} post-delete learner reads`);
  created = undefined;
}

try {
  const health = await json(await request('/health'));
  assert.equal(health.response.status, 200);
  if (expectedBuild) assert.equal(health.body.build, expectedBuild, 'live build identity');

  for (let cycle = 1; cycle <= cycles; cycle += 1) await runLifecycle(cycle);
  console.log(`Live coherence passed: ${cycles} fresh-connection create/read/submit/reply/delete cycles against the durable single-service boundary.`);
} finally {
  if (created) {
    await request(`/api/tutor/lessons/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${created.tutorToken}` },
    }).catch(() => undefined);
  }
}
