import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { downloadAndUnzipVSCode, runTests, runVSCodeCommand } from '@vscode/test-electron';

const version = '1.98.2';
const root = resolve('.');
const vsix = join(root, 'public/downloads/code-lesson-checkpoints-0.1.0.vsix');
const harness = join(root, 'tests/vscode-host-harness');
const scratch = mkdtempSync(join(tmpdir(), 'clc-vscode-host-'));
const workspace = join(scratch, 'workspace');
const extensionsDir = join(scratch, 'extensions');
const userDataDir = join(scratch, 'user-data');
mkdirSync(workspace);
writeFileSync(join(workspace, 'sample-command.cjs'), "console.log('SERVICE_TOKEN=extension-host-secret');\nconsole.log('visitor-facing command completed');\n");

const evidence = { gets: 0, submissions: [] };
const lesson = {
  title: 'Packaged companion test',
  shareCode: 'ABC123',
  checkpoints: [{
    id: 'checkpoint-1',
    position: 1,
    title: 'Run the sample command',
    command: 'node sample-command.cjs',
    successHint: 'The command prints its completion line.',
    submissions: [],
  }],
};

const server = createServer((request, response) => {
  const send = (status, body) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body));
  };
  if (request.method === 'GET' && request.url === '/api/lessons/code/ABC123') {
    evidence.gets += 1;
    send(200, lesson);
    return;
  }
  if (request.method === 'GET' && request.url === '/evidence') {
    send(200, evidence);
    return;
  }
  if (request.method === 'POST' && request.url === '/api/lessons/code/ABC123/checkpoints/checkpoint-1/submissions') {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => { raw += chunk; });
    request.on('end', () => {
      evidence.submissions.push(JSON.parse(raw));
      send(201, { id: 'submission-1' });
    });
    return;
  }
  send(404, { error: 'Fixture route not found.' });
});

try {
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const serverUrl = `http://127.0.0.1:${address.port}`;
  const vscodeExecutablePath = await downloadAndUnzipVSCode(version);
  const profileArgs = [`--extensions-dir=${extensionsDir}`, `--user-data-dir=${userDataDir}`];
  await runVSCodeCommand([...profileArgs, '--install-extension', vsix, '--force'], { version });
  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath: harness,
    extensionTestsPath: join(harness, 'run.cjs'),
    extensionTestsEnv: {
      CLC_EXTENSION_HOST_TEST: '1',
      CLC_EXTENSION_TEST_SERVER: serverUrl,
    },
    launchArgs: [workspace, ...profileArgs],
  });
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
  rmSync(scratch, { recursive: true, force: true });
}
