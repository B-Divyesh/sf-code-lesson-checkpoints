import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const baseURL = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const expectedBuild = process.env.EXPECTED_BUILD_SHA;
const execFile = promisify(execFileCallback);
let created;

async function request(path, init = {}) {
  // A separate HTTP/1.1 curl process for every request prevents a sticky
  // browser/connection route from hiding per-replica SQLite partitions.
  const args = ['--silent', '--show-error', '--http1.1', '--no-keepalive', '--request', init.method ?? 'GET'];
  for (const [name, value] of Object.entries(init.headers ?? {})) args.push('--header', `${name}: ${value}`);
  if (init.body !== undefined) args.push('--data-binary', init.body);
  args.push('--write-out', '\n%{http_code}', `${baseURL}${path}${path.includes('?') ? '&' : '?'}fresh=${crypto.randomUUID()}`);
  const { stdout } = await execFile('curl', args, { maxBuffer: 1024 * 1024 });
  const separator = stdout.lastIndexOf('\n');
  assert.ok(separator >= 0, 'curl response includes an HTTP status marker');
  return { status: Number(stdout.slice(separator + 1)), body: stdout.slice(0, separator) };
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

try {
  const health = await json(await request('/health'));
  assert.equal(health.response.status, 200);
  if (expectedBuild) assert.equal(health.body.build, expectedBuild, 'live build identity');

  const create = await json(await request('/api/lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Fresh-connection coherence regression',
      checkpoints: [{ title: 'Run the suite', command: 'npm test', successHint: 'All tests pass' }],
    }),
  }));
  assert.equal(create.response.status, 201);
  created = create.body;
  const authorization = { Authorization: `Bearer ${created.tutorToken}` };

  const learnerReads = await repeat(30, () => request(`/api/lessons/code/${created.shareCode}`), 200, 'learner reads');
  const lesson = JSON.parse(learnerReads[0].body);
  const checkpointId = lesson.checkpoints[0].id;
  await repeat(30, () => request(`/api/tutor/lessons/${created.id}`, { headers: authorization }), 200, 'tutor reads');

  const submitted = await json(await request(`/api/lessons/code/${created.shareCode}/checkpoints/${checkpointId}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'blocked',
      output: 'DATABASE_URL=postgres://qa_user:qa_password@db.example/private',
      note: 'Fresh connection evidence',
      consented: true,
    }),
  }));
  assert.equal(submitted.response.status, 201);

  const tutorReads = await repeat(30, () => request(`/api/tutor/lessons/${created.id}`, { headers: authorization }), 200, 'post-submit tutor reads');
  const tutorLesson = JSON.parse(tutorReads[0].body);
  const submission = tutorLesson.checkpoints[0].submissions[0];
  assert.equal(submission.output, 'DATABASE_URL=[redacted]');

  const reply = await request(`/api/tutor/submissions/${submission.id}/reply`, {
    method: 'PUT',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply: 'Inspect the request boundary.' }),
  });
  assert.equal(reply.status, 200);

  const repliedReads = await repeat(30, () => request(`/api/lessons/code/${created.shareCode}`), 200, 'post-reply learner reads');
  const repliedLesson = JSON.parse(repliedReads[0].body);
  assert.equal(repliedLesson.checkpoints[0].submissions[0].teacherReply, 'Inspect the request boundary.');

  const removed = await request(`/api/tutor/lessons/${created.id}`, { method: 'DELETE', headers: authorization });
  assert.equal(removed.status, 204);
  const deletedReads = await repeat(20, () => request(`/api/lessons/code/${created.shareCode}`), 404, 'post-delete learner reads');
  created = undefined;
  console.log('Live coherence passed: separate-process HTTP/1.1 create/read/submit/reply/delete is consistent.');
} finally {
  if (created) {
    await request(`/api/tutor/lessons/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${created.tutorToken}` },
    }).catch(() => undefined);
  }
}
