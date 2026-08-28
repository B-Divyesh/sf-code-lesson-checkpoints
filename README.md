# Code Lesson Checkpoints

Code Lesson Checkpoints gives remote programming tutors a consent-based trail of runnable milestones. A tutor defines commands or tests, a learner runs them locally, and the learner shares only a status, selected output, and an optional reflection. The tutor sees attempts in order and replies at the first misconception—without taking over the learner’s screen.

The free Pair plan is useful for one tutor/learner pair. A $39 one-time Team archive license adds small-roster history controls through the Sociobot billing service. The app never embeds a payment provider.

## What is included

- Rust/Axum relay with SQLite, hashed private tutor tokens, short learner codes, validation, secure response headers, JSON logs, migrations, and graceful shutdown
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

Configuration is environment-only:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP listener |
| `DATABASE_URL` | `sqlite://checkpoints.db?mode=rwc` | SQLite database |
| `DIST_DIR` | `dist` | Built frontend directory |
| `CORS_ORIGIN` | production origin + localhost | Comma-separated browser origins |
| `BUILD_SHA` | `development` | Returned by `/health` |
| `RUST_LOG` | package default | Structured log filter |

## Test and verify

```bash
npm test             # Vitest privacy helpers + Rust unit/API flow tests
npm run check        # strict TypeScript checks, including the extension
npm run build
docker build -t code-lesson-checkpoints .
docker run --rm -p 8080:8080 -v clc-data:/data code-lesson-checkpoints
```

The complete API integration test creates a lesson, opens it as the learner, submits redacted evidence, reads it through the private tutor link, and deletes it.

## VS Code companion

The compiled extension entry is `extension/dist/extension.js`. For local development, open the repository in VS Code and use an Extension Development Host with `extension/` as the extension root, or package that folder with `@vscode/vsce`. The learner invokes **Code Lesson: Connect to Lesson**, enters the six-character code, and then uses **Code Lesson: Open Checkpoints**.

## Privacy and product boundaries

Source files are never requested or uploaded. The relay stores lesson titles, optional learner names, checkpoint definitions, selected output, notes, replies, and timestamps. Tutors can permanently delete the complete record. See `/privacy` and `/terms` in the running product. This is not a remote desktop, browser IDE, monitoring recorder, automated grader, or code generator.

The generated hero illustration is original project artwork; prompt and provenance are recorded in [`.factory/design.md`](.factory/design.md) and `assets/src/hero-paper-path.json`.

## Deployment

The multi-stage Dockerfile compiles both frontend and Rust service, runs as a non-root user on port 8080, and keeps SQLite under `/data`. Because SQLite is a single-writer store, [`deployment/container-app.json`](deployment/container-app.json) requires exactly one replica and a durable Azure Files mount at `/data`; the deployed URL selects SQLite's lock-file VFS for that network mount. After the factory creates or updates the container app, `scripts/apply-deployment-contract.sh` applies and verifies that product-specific topology. `BASE_URL=https://code-lesson-checkpoints.sociobot.in EXPECTED_BUILD_SHA=<commit> npm run test:coherence` checks the full workflow over fresh connections. DNS, storage provisioning, and billing registration remain factory-managed outside this repository.

## License

MIT — see [LICENSE](LICENSE).
