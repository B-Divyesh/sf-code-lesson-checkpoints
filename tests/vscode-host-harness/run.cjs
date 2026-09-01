const assert = require('node:assert/strict');
const vscode = require('vscode');

async function run() {
  const serverUrl = process.env.CLC_EXTENSION_TEST_SERVER;
  assert.ok(serverUrl, 'the fixture relay URL is available inside the extension host');
  await vscode.workspace.getConfiguration('codeLesson').update(
    'serverUrl',
    serverUrl,
    vscode.ConfigurationTarget.Global,
  );

  const extension = vscode.extensions.getExtension('sociobot.code-lesson-checkpoints');
  assert.ok(extension, 'the visitor-facing VSIX is installed in the VS Code host');
  assert.equal(extension.packageJSON.version, '0.1.0');
  const api = await extension.activate();
  assert.equal(typeof api?.setInteractionHostForTesting, 'function', 'the packaged extension exposes its host-test seam');

  const observed = {
    commandConfirmation: false,
    shareConfirmation: false,
    preview: '',
  };
  const interactionHost = {
    input: async (options) => {
      if (options.title === 'Connect to a code lesson') return 'ABC123';
      if (options.title === 'Optional note') return 'The sample command completed.';
      throw new Error(`Unexpected input prompt: ${options.title}`);
    },
    info: async (message, options, ...items) => {
      if (message.startsWith('Connected to')) {
        assert.deepEqual(items, ['Open checkpoints']);
        return 'Open checkpoints';
      }
      if (message.startsWith('Share this passed update')) {
        assert.equal(options.modal, true);
        assert.match(options.detail, /Only the reviewed output/);
        assert.match(options.detail, /No source files are attached/);
        assert.deepEqual(items, ['Share selected evidence']);
        observed.shareConfirmation = true;
        return 'Share selected evidence';
      }
      if (message === 'Checkpoint evidence shared. You kept control of the run.') return undefined;
      throw new Error(`Unexpected information message: ${message}`);
    },
    warning: async (message, options, ...items) => {
      assert.match(message, /node sample-command\.cjs/);
      assert.equal(options.modal, true);
      assert.match(options.detail, /runs locally/);
      assert.deepEqual(items, ['Run locally']);
      observed.commandConfirmation = true;
      return 'Run locally';
    },
    pick: async (items, options) => {
      if (options.title === 'Packaged companion test') return items[0];
      if (String(options.title).startsWith('Review selected output')) {
        const preview = vscode.workspace.textDocuments.find((document) => document.languageId === 'log');
        assert.ok(preview, 'the executed command opens a review document');
        observed.preview = preview.getText();
        return items.find((item) => item.status === 'passed');
      }
      throw new Error(`Unexpected quick pick: ${options.title}`);
    },
  };

  api.setInteractionHostForTesting(interactionHost);
  try {
    await vscode.commands.executeCommand('codeLesson.connect');
  } finally {
    api.setInteractionHostForTesting();
  }

  assert.equal(observed.commandConfirmation, true, 'the command was shown in a modal before execution');
  assert.equal(observed.shareConfirmation, true, 'the selected evidence was shown in a modal before sharing');
  assert.match(observed.preview, /SERVICE_TOKEN=\[redacted\]/);
  assert.match(observed.preview, /visitor-facing command completed/);
  assert.doesNotMatch(observed.preview, /extension-host-secret/);

  const evidenceResponse = await fetch(`${serverUrl}/evidence`);
  assert.equal(evidenceResponse.status, 200);
  const evidence = await evidenceResponse.json();
  assert.equal(evidence.gets, 2, 'connect and open both loaded the lesson through the packaged extension');
  assert.equal(evidence.submissions.length, 1, 'the packaged extension shared one approved result');
  assert.deepEqual(evidence.submissions[0], {
    status: 'passed',
    output: 'SERVICE_TOKEN=[redacted]\nvisitor-facing command completed\n',
    note: 'The sample command completed.',
    consented: true,
  });
  console.log('VS Code host claim passed: installed VSIX, command confirmation, local run, redacted preview, and share confirmation.');
}

module.exports = { run };
