import assert from 'node:assert/strict';

const baseURL = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const expectedBuild = process.env.EXPECTED_BUILD_SHA;
let created;

async function request(path, init = {}) {
  return fetch(`${baseURL}${path}${path.includes('?') ? '&' : '?'}fresh=${crypto.randomUUID()}`, {
    ...init,
    headers: { Connection: 'close', ...init.headers },
  });
}

async function json(response) {
  const body = await response.json();
  return { response, body };
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
  const lesson = await learnerReads[0].json();
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
  const tutorLesson = await tutorReads[0].json();
  const submission = tutorLesson.checkpoints[0].submissions[0];
  assert.equal(submission.output, 'DATABASE_URL=[redacted]');

  const reply = await request(`/api/tutor/submissions/${submission.id}/reply`, {
    method: 'PUT',
    headers: { ...authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply: 'Inspect the request boundary.' }),
  });
  assert.equal(reply.status, 200);

  const repliedReads = await repeat(30, () => request(`/api/lessons/code/${created.shareCode}`), 200, 'post-reply learner reads');
  const repliedLesson = await repliedReads[0].json();
  assert.equal(repliedLesson.checkpoints[0].submissions[0].teacherReply, 'Inspect the request boundary.');

  const removed = await request(`/api/tutor/lessons/${created.id}`, { method: 'DELETE', headers: authorization });
  assert.equal(removed.status, 204);
  const deletedReads = await repeat(20, () => request(`/api/lessons/code/${created.shareCode}`), 404, 'post-delete learner reads');
  await Promise.all(deletedReads.map((response) => response.body?.cancel()));
  created = undefined;
  console.log('Live coherence passed: fresh-connection create/read/submit/reply/delete is consistent.');
} finally {
  if (created) {
    await request(`/api/tutor/lessons/${created.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${created.tutorToken}` },
    }).catch(() => undefined);
  }
}
