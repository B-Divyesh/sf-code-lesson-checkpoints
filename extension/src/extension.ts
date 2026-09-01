import * as vscode from 'vscode';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { redactAndCap } from './privacy';

const execAsync = promisify(exec);
const CODE_KEY = 'codeLesson.shareCode';

type Submission = { status: 'passed' | 'blocked' };
type Checkpoint = { id: string; position: number; title: string; command: string; successHint?: string; submissions: Submission[] };
type Lesson = { title: string; shareCode: string; checkpoints: Checkpoint[] };
type InteractionHost = {
  input(options: vscode.InputBoxOptions): Thenable<string | undefined>;
  info(message: string, options: vscode.MessageOptions, ...items: string[]): Thenable<string | undefined>;
  warning(message: string, options: vscode.MessageOptions, ...items: string[]): Thenable<string | undefined>;
  pick<T extends vscode.QuickPickItem>(items: readonly T[], options: vscode.QuickPickOptions): Thenable<T | undefined>;
};

const vscodeInteractionHost: InteractionHost = {
  input: (options) => vscode.window.showInputBox(options),
  info: (message, options, ...items) => vscode.window.showInformationMessage(message, options, ...items),
  warning: (message, options, ...items) => vscode.window.showWarningMessage(message, options, ...items),
  pick: (items, options) => vscode.window.showQuickPick(items, options),
};
let interactionHost = vscodeInteractionHost;

/** Used only by the packaged-extension host test to drive real command handlers. */
export function setInteractionHostForTesting(host?: InteractionHost): void {
  if (process.env.CLC_EXTENSION_HOST_TEST !== '1') throw new Error('The interaction host can only change inside the packaged-extension test.');
  interactionHost = host ?? vscodeInteractionHost;
}

export function activate(context: vscode.ExtensionContext): { setInteractionHostForTesting: typeof setInteractionHostForTesting } {
  context.subscriptions.push(
    vscode.commands.registerCommand('codeLesson.connect', () => connect(context)),
    vscode.commands.registerCommand('codeLesson.open', () => openLesson(context)),
    vscode.commands.registerCommand('codeLesson.disconnect', async () => {
      await context.workspaceState.update(CODE_KEY, undefined);
      void vscode.window.showInformationMessage('Disconnected from the lesson. No project files were changed.');
    }),
  );
  return { setInteractionHostForTesting };
}

async function connect(context: vscode.ExtensionContext): Promise<void> {
  const code = await interactionHost.input({
    title: 'Connect to a code lesson',
    prompt: 'Enter the six-character code from your tutor.',
    placeHolder: 'ABC123',
    ignoreFocusOut: true,
    validateInput: (value) => normalizeCode(value).length === 6 ? undefined : 'Enter all six letters and numbers.',
  });
  if (!code) return;
  const normalized = normalizeCode(code);
  try {
    const lesson = await loadLesson(normalized);
    await context.workspaceState.update(CODE_KEY, normalized);
    const choice = await interactionHost.info(`Connected to “${lesson.title}”. Commands run only after you confirm each one.`, {}, 'Open checkpoints');
    if (choice) await openLesson(context);
  } catch (error) { showError(error); }
}

async function openLesson(context: vscode.ExtensionContext): Promise<void> {
  const code = context.workspaceState.get<string>(CODE_KEY);
  if (!code) { await connect(context); return; }
  try {
    const lesson = await loadLesson(code);
    const item = await interactionHost.pick(lesson.checkpoints.map((checkpoint) => ({
      label: `${statusIcon(checkpoint)} ${checkpoint.position}. ${checkpoint.title}`,
      description: checkpoint.command,
      detail: checkpoint.successHint ? `Success: ${checkpoint.successHint}` : 'Select to review and run locally',
      checkpoint,
    })), { title: lesson.title, placeHolder: 'Choose a checkpoint to run', matchOnDescription: true });
    if (item) await runCheckpoint(lesson, item.checkpoint);
  } catch (error) { showError(error); }
}

async function runCheckpoint(lesson: Lesson, checkpoint: Checkpoint): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showErrorMessage('Open the project folder before running a checkpoint.');
    return;
  }
  const confirmation = await interactionHost.warning(
    `Run this tutor-defined command in ${folder.name}?\n\n${checkpoint.command}`,
    { modal: true, detail: 'Review the command carefully. It runs locally with your user permissions; the relay cannot see your files.' },
    'Run locally',
  );
  if (confirmation !== 'Run locally') return;
  await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Running: ${checkpoint.title}`, cancellable: false }, async () => {
    let raw = '';
    let passed = true;
    try {
      const result = await execAsync(checkpoint.command, { cwd: folder.uri.fsPath, timeout: 120_000, maxBuffer: 128 * 1024, shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' });
      raw = [result.stdout, result.stderr].filter(Boolean).join('\n');
    } catch (error) {
      passed = false;
      const commandError = error as { stdout?: string; stderr?: string; message?: string };
      raw = [commandError.stdout, commandError.stderr, commandError.message].filter(Boolean).join('\n');
    }
    await reviewEvidence(lesson, checkpoint, passed ? 'passed' : 'blocked', raw);
  });
}

async function reviewEvidence(lesson: Lesson, checkpoint: Checkpoint, initialStatus: 'passed' | 'blocked', raw: string): Promise<void> {
  const output = redactAndCap(raw);
  const document = await vscode.workspace.openTextDocument({ language: 'log', content: output || '(The command produced no output.)' });
  await vscode.window.showTextDocument(document, { preview: true });
  const choice = await interactionHost.pick([
    { label: '$(check) Passed', status: 'passed' as const },
    { label: '$(error) Blocked', status: 'blocked' as const },
    { label: 'Keep private', status: null },
  ], { title: `Review selected output · detected as ${initialStatus}`, placeHolder: 'Nothing is shared until you choose a status' });
  if (!choice?.status) return;
  const note = await interactionHost.input({ title: 'Optional note', prompt: 'What did you expect, and what did you notice?', placeHolder: 'Leave blank to share without a note', ignoreFocusOut: true });
  if (note === undefined) return;
  const consent = await interactionHost.info(
    `Share this ${choice.status} update with your tutor?`,
    { modal: true, detail: `Only the reviewed output (${output.length.toLocaleString()} characters), status, and note will be sent. No source files are attached.` },
    'Share selected evidence',
  );
  if (consent !== 'Share selected evidence') return;
  try {
    await request(`/api/lessons/code/${encodeURIComponent(lesson.shareCode)}/checkpoints/${encodeURIComponent(checkpoint.id)}/submissions`, {
      method: 'POST', body: JSON.stringify({ status: choice.status, output, note, consented: true }),
    });
    void interactionHost.info('Checkpoint evidence shared. You kept control of the run.', {});
  } catch (error) { showError(error); }
}

async function loadLesson(code: string): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/code/${encodeURIComponent(code)}`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = vscode.workspace.getConfiguration('codeLesson').get<string>('serverUrl', 'https://code-lesson-checkpoints.sociobot.in').replace(/\/$/, '');
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || `The relay returned ${response.status}.`);
  return body;
}

function normalizeCode(value: string): string { return value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6); }
function statusIcon(checkpoint: Checkpoint): string { return checkpoint.submissions[0]?.status === 'passed' ? '$(pass)' : checkpoint.submissions[0]?.status === 'blocked' ? '$(error)' : '$(circle-outline)'; }
function showError(error: unknown): void { void vscode.window.showErrorMessage(error instanceof Error ? error.message : 'The checkpoint request failed. Try again.'); }

export function deactivate(): void {}
