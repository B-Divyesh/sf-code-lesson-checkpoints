# Code Lesson Checkpoints

Code Lesson Checkpoints helps remote programming tutors see where a learner’s code first fails.

Tutors add commands or tests. Learners run them locally and choose whether to share a status, selected output, and note.
The tutor sees attempts in order and replies to the blocked attempt without taking over the learner’s screen.

Lesson planning and sharing are free. The optional Team archive costs $39 once.
It searches and reopens tutor links saved on that device. Checkout runs on Sociobot’s hosted billing page.
The app never embeds a payment provider.

## Try the sample

Open the isolated sample at <https://code-lesson-checkpoints.sociobot.in/?demo=1>.
It contains three checkpoints, passed and blocked runs, hidden sample credentials, a learner note, and a tutor reply.

**Reset demo** replaces the temporary workspace. **Start for real** deletes the sample and opens the lesson planner.
The demo uses only the `demo:clc:workspace` browser key. It never reads or changes real lesson keys.

## What is included

- A Rust and SQLite service for lesson records
- A responsive TypeScript web app for tutors and learners
- An isolated sample that reloads offline after its first visit
- JSON export and permanent lesson deletion
- Local and server checks that hide common keys and cap output
- A packaged VS Code companion for running tutor commands locally

## Install the VS Code companion

Download [Code Lesson Checkpoints 0.1.0](https://code-lesson-checkpoints.sociobot.in/downloads/code-lesson-checkpoints-0.1.0.vsix).

1. Open the Extensions view in VS Code.
2. Choose **Install from VSIX…** from the view menu.
3. Select the downloaded file.
4. Run **Code Lesson: Connect to Lesson** and enter the six-character lesson code.
5. Run **Code Lesson: Open Checkpoints** to review a command before running it.

For extension development, open this repository with `extension/` as the extension root.
Use an Extension Development Host, or run `npm run test:package` to inspect a fresh package.

## Run locally

Requirements: Node 22+, npm 10+, current stable Rust, and a C toolchain.

```bash
npm ci
npm run build
cargo run
```

Open <http://localhost:8080>. For frontend hot reload, run `cargo run` and `npm run dev` in separate terminals.

## Test and verify

```bash
npm test
npm run test:claims
npm run check
npm run lint
npm run build
npm run test:package
npm run test:e2e
npm run test:pwa
npm run test:load
```

Each public promise and its independent command are listed in [`.factory/claims.json`](.factory/claims.json).
The isolated sample is documented in [`.factory/demo.md`](.factory/demo.md).

## Privacy and product boundaries

Source files are never requested or uploaded. Learners approve every shared run.
The service stores lesson steps, selected output, notes, replies, and timestamps.
Tutors can permanently delete the complete lesson record.

This product is not remote desktop software, a recorder, an automated grader, or a code generator.
Read the live [privacy notice](https://code-lesson-checkpoints.sociobot.in/privacy) and [terms](https://code-lesson-checkpoints.sociobot.in/terms).

The paper-path illustration was generated for this product. Its prompt and provenance are in [`.factory/design.md`](.factory/design.md).

## Deploy

Build the multi-stage image with `docker build -t code-lesson-checkpoints .`.
The factory release command is `scripts/deploy-release.sh <full-commit-sha>`.
Deployment configuration lives in [`deployment/container-app.json`](deployment/container-app.json).

## License

MIT — see [LICENSE](LICENSE).
