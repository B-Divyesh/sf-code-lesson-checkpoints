# Code Lesson Checkpoints

Code Lesson Checkpoints gives remote programming tutors a consent-based trail of runnable milestones. A tutor defines commands or tests, a learner runs them locally, and the learner shares only a status, selected output, and an optional reflection. The tutor sees attempts in order and replies at the first misconception—without taking over the learner’s screen.

The free Pair plan is useful for one tutor/learner pair. A $39 one-time Team archive license adds small-roster history controls through the Sociobot billing service. The app never embeds a payment provider.

Try the isolated sample at `https://code-lesson-checkpoints.sociobot.in/demo`. It opens a realistic three-checkpoint lesson with a passed run, a blocked run, redacted evidence, and a tutor reply. **Reset demo** provisions a fresh 24-hour workspace. **Start for real** discards the sample and opens the lesson planner. Demo state uses only the `demo:clc:workspace` browser key and never enters the real lesson tables.

## What is included

- Rust/Axum relay with one durable SQLite state file, hashed private tutor tokens, short learner codes, validation, secure response headers, JSON logs, migrations, and graceful shutdown
- Vite/TypeScript responsive web app for planning, joining, submitting evidence, responding, and deleting records
- VS Code extension source under `extension/`; it displays the exact tutor-defined command for learner confirmation, runs locally, redacts/caps output, and asks again before sharing
- Local secret-pattern redaction plus a second server-side pass; 8,000-character output cap
- Offline shell, explicit loading/empty/error states, keyboard-operable forms and dialogs, and reduced-motion treatment
- Hosted-checkout license return, daily verification cache, and restore-by-token flow

## Run locally

Requirements: Node 22+, npm 10+, Rust 1.85+ and a C toolchain.

```bash
npm ci
npm run assets       # only needed when regenerating image derivatives
npm run build        # writes the web app to dist/ and compiles extension/dist/
cargo run
```

Open `http://localhost:8080`. For frontend hot reload, run `cargo run` and `npm run dev` in separate terminals, then open `http://localhost:5173`.

The container starts with only `PORT`; its state file is `/data/checkpoints.db` when the durable mount exists, otherwise `checkpoints.db` for local development.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP listener |

## Test and verify

```bash
npm test             # Vitest privacy helpers + Rust unit/API flow tests
npm run test:claims  # every user-facing claim against the sample sandbox
npm run check        # strict TypeScript checks, including the extension
npm run lint         # TypeScript, Rust formatting, and Clippy
npm run build
npm run test:package # package and inspect the VS Code extension consumer
npm run test:e2e     # desktop/mobile browser, keyboard, accessibility, privacy
npm run test:pwa     # update and offline-demo behavior
npm run test:coherence # fresh-connection lifecycle
docker build -t code-lesson-checkpoints .
docker run --rm -p 8080:8080 code-lesson-checkpoints
```

The complete API integration test creates a lesson, opens it as the learner, submits redacted evidence, reads it through the private tutor link, and deletes it. [`.factory/claims.json`](.factory/claims.json) maps each public claim to one exact browser/API regression, and [`.factory/demo.md`](.factory/demo.md) documents the clean demo entry point.

## VS Code companion

The compiled extension entry is `extension/dist/extension.js`. For local development, open the repository in VS Code and use an Extension Development Host with `extension/` as the extension root, or package that folder with `@vscode/vsce`. The learner invokes **Code Lesson: Connect to Lesson**, enters the six-character code, and then uses **Code Lesson: Open Checkpoints**.

## Privacy and product boundaries

Source files are never requested or uploaded. The relay stores lesson titles, optional learner names, checkpoint definitions, selected output, notes, replies, and timestamps. Tutors can permanently delete the complete record. See `/privacy` and `/terms` in the running product. This is not a remote desktop, browser IDE, monitoring recorder, automated grader, or code generator.

The generated hero illustration is original project artwork; prompt and provenance are recorded in [`.factory/design.md`](.factory/design.md) and `assets/src/hero-paper-path.json`.

## Deployment

The multi-stage Dockerfile compiles both frontend and Rust service, runs as a non-root user on port 8080, and creates a writable `/data` directory. [`deployment/container-app.json`](deployment/container-app.json) mounts the product-owned `sf-code-lesson-checkpoints-data` share at `/data` and pins the service to one replica. Lesson records, tutor authorization hashes, deletion, and demo workspaces persist in `/data/checkpoints.db`. API reads are capped per client, and writes use a stricter per-client allowance. Rate-limit responses include `Retry-After`.

The only release command is `scripts/deploy-release.sh <full-commit-sha>`. It builds the immutable image, applies and reads back the one-replica `/data` mount, writes a canary, restarts the revision, verifies the canary after restart, and runs repeated fresh-connection lifecycle checks. `BASE_URL=https://code-lesson-checkpoints.sociobot.in EXPECTED_BUILD_SHA=<commit> COHERENCE_CYCLES=4 npm run test:coherence` repeats the public probe. DNS, durable-share provisioning, and billing registration remain factory-managed outside this repository.

## License

MIT — see [LICENSE](LICENSE).
