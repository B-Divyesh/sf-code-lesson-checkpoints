import assert from 'node:assert/strict';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';

const runtimeURL = process.env.POSTGRES_RUNTIME_URL;
const binary = new URL('../target/release/code-lesson-checkpoints', import.meta.url).pathname;
const execFile = promisify(execFileCallback);
const ports = [18100, 18101];
const processes = [];

if (!runtimeURL) {
  throw new Error('POSTGRES_RUNTIME_URL is required for the real PostgreSQL replica-coherence regression.');
}
if (!existsSync(binary)) {
  throw new Error('Build the release binary first: cargo build --release.');
}

function baseURL(port) {
  return `http://127.0.0.1:${port}`;
}

async function curl(port, path, init = {}) {
  const args = ['--silent', '--show-error', '--http1.1', '--no-keepalive', '--request', init.method ?? 'GET'];
  for (const [name, value] of Object.entries(init.headers ?? {})) args.push('--header', `${name}: ${value}`);
  if (init.body !== undefined) args.push('--data-binary', init.body);
  args.push('--write-out', '\n%{http_code}', `${baseURL(port)}${path}?fresh=${crypto.randomUUID()}`);
  const { stdout } = await execFile('curl', args, { maxBuffer: 1024 * 1024 });
  const separator = stdout.lastIndexOf('\n');
  return { status: Number(stdout.slice(separator + 1)), body: stdout.slice(0, separator) };
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await curl(port, '/health');
      if (response.status === 200) return;
    } catch {
      // The binary is still opening its database connection.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`replica on port ${port} did not start`);
}

try {
  for (const [index, port] of ports.entries()) {
    processes.push(spawn(binary, [], {
      env: {
        ...process.env,
        DATABASE_URL: runtimeURL,
        PORT: String(port),
        BUILD_SHA: `postgres-replica-${index + 1}`,
        DIST_DIR: 'dist',
      },
      stdio: 'ignore',
    }));
  }
  await Promise.all(ports.map(waitForServer));

  for (let cycle = 0; cycle < 4; cycle += 1) {
    const writer = ports[cycle % ports.length];
    const readerAndDeleter = ports[(cycle + 1) % ports.length];
    const create = await curl(writer, '/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `PostgreSQL replica regression ${cycle + 1}`,
        checkpoints: [{ title: 'Read from the other process', command: 'npm test' }],
      }),
    });
    assert.equal(create.status, 201, `cycle ${cycle + 1} create`);
    const lesson = JSON.parse(create.body);

    const read = await curl(readerAndDeleter, `/api/lessons/code/${lesson.shareCode}`);
    assert.equal(read.status, 200, `cycle ${cycle + 1} cross-process read`);

    const deletion = await curl(readerAndDeleter, `/api/tutor/lessons/${lesson.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${lesson.tutorToken}` },
    });
    assert.equal(deletion.status, 204, `cycle ${cycle + 1} cross-process authorized delete`);

    const missing = await curl(writer, `/api/lessons/code/${lesson.shareCode}`);
    assert.equal(missing.status, 404, `cycle ${cycle + 1} deletion visible to writer`);
  }

  console.log('PostgreSQL replica coherence passed: four create/read/authorized-delete cycles crossed two fresh backend processes.');
} finally {
  for (const process of processes) process.kill('SIGTERM');
  await Promise.all(processes.map((process) => new Promise((resolve) => process.once('exit', resolve))));
}
