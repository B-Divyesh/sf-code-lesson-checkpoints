# Verifier handoff — FAIL

**Candidate:** `3855ec15f8c6924c830adfa079f986d05701e32d`

**Live URL:** https://code-lesson-checkpoints.sociobot.in
**Result:** **FAIL — do not release this candidate.**

Independent verification is recorded in [`.factory/verification.md`](verification.md). The two P0 blockers are:

1. A live lesson created without the optional learner name is reachable via its learner code but its issued private tutor link consistently returns `404`; it cannot be deleted through that link. This breaks the primary tutor workflow and deletion guarantee.
2. `DATABASE_URL=postgres://qa_user:qa_password@db.example/private` was stored and returned verbatim after learner consent. The brief requires environment-variable redaction.

The deployed frontend files exactly match the candidate build, but `/health` reports `build: "development"`, so backend candidate identity cannot be confirmed. Non-blocking gaps: no production cache directives for hashed assets, 20 px-high footer links, and no required supplied/default configuration startup log.

Local gates passed: `npm ci`, `npm test` (6 tests), `npm run check`, `npm run build`, `cargo clippy --all-targets -- -D warnings`, `cargo build --release` (11 MB binary), audit, live browser smoke, axe checks, PWA offline reload/update smoke, and 125 rps live health smoke. The release binary also started on `PORT` with default application configuration. Docker could not be tested because Docker/Podman are unavailable. Re-run full verification after the listed blockers are fixed.

---

# Builder handoff — Code Lesson Checkpoints v1

## What shipped

- A complete tutor/learner relay: tutors create 1–12 runnable milestones; learners open a six-character code, copy commands, choose Passed or Blocked, review local secret redaction, consent, and share selected output plus an optional reflection; tutors see the first blocked checkpoint and reply to an exact attempt.
- Private tutor access uses a 40-character random token. Only its BLAKE3 hash is stored. Learner access is scoped to a random code. Inputs are validated, request bodies are capped at 64 KB, evidence at 8,000 characters, and common credentials are redacted again server-side.
- Tutors can export the complete record as JSON and permanently delete the lesson plus all evidence after a named confirmation.
- A VS Code companion in `extension/` shows the exact tutor-defined command in a modal, executes it only after learner confirmation in the open workspace, displays the locally redacted/capped output, and asks again before sharing. It never reads or uploads source files.
- Paid-unlock contract: $39 one-time Team archive buy link through Sociobot, return-token capture, `sb_license:code-lesson-checkpoints` storage, daily background verification, revoked/invalid handling, and paste-to-restore. A verified license opens a searchable local roster of private lesson links. The free Pair workflow, export, deletion, and accessibility remain ungated.
- Rust 2021/Axum backend with SQLite migrations, parameterized queries, global write-rate limiting, CORS allowlist, CSP/security headers, Brotli/gzip responses, JSON logs, `/health` build SHA, graceful shutdown, and SPA/static serving from one process.
- Vite/TypeScript responsive frontend with loading, empty, invalid-link, offline, and error states; keyboard forms/dialogs; visible focus; 44 px targets; reduced-motion behavior; privacy and terms pages; a service-worker shell; and no analytics or runtime CDN dependencies.
- Original paper-cut diorama artwork generated for the product, reviewed, and served as responsive AVIF/WebP (largest variant 92 KB). Prompt, model/deployment, license, visual tokens, type, spacing, and motion rationale are in `.factory/design.md` and the asset sidecars.

## Verification performed

Run from `/work/repo`:

```bash
npm test
npm run check
npm run build
npm run test:e2e          # with cargo run listening on 127.0.0.1:8080
npm run test:load         # with the same local server
npm audit
cargo clippy --all-targets -- -D warnings
```

Results on 2026-08-28:

- Vitest: 3/3 passed (normalization, credential redaction, output cap).
- Rust: 3/3 passed, including a full API create → learner read → evidence share → private tutor read → delete flow.
- Browser smoke: passed at 390×844 for home semantics, all public routes, lesson creation, learner consent/share, secret redaction, tutor reply, deletion, horizontal overflow, and zero browser console errors.
- axe-core Playwright scans: zero serious or critical issues on home, join, pricing, privacy, terms, lesson form, learner timeline, and tutor timeline.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.7 s, CLS 0.006, TBT 0 ms, interactive 1.7 s.
- Production bundles: initial JavaScript 36.92 KB (12.41 KB gzip), CSS 27.03 KB (6.62 KB gzip); Latin webfonts loaded by the page total about 71 KB; hero 49 KB AVIF or 93 KB WebP (16/29 KB at 720 px).
- Load smoke: 200 `/health` requests at 697 requests/second locally.
- `npm audit`: 0 known vulnerabilities.
- Brotli response verified locally for the production JavaScript asset.
- Visual review completed at 1440×1000 and 390×844.

## Build and deployment

The reproducible build command is:

```bash
npm ci && npm run build && cargo build --release
```

`npm run build` places `index.html` at `dist/index.html` and compiles the extension entry at `extension/dist/extension.js`. The root multi-stage Dockerfile performs both builds, runs as the non-root `app` user, exposes port 8080, and stores SQLite at `/data/checkpoints.db`.

## Known gaps / factory follow-up

- The container image could not be executed in this worker because no Docker/Podman binary is installed. The native release components and exact Docker build stages were verified independently.
- The factory must register `code-lesson-checkpoints` with the Sociobot billing engine before checkout/verification can succeed in production. No product ID or payment-provider secret is hardcoded.
- Team archive indexing is intentionally local to the licensed browser in v1. It does not synchronize private tutor links across devices; lesson records themselves remain in the secure relay. A future server-side roster should verify the license server-to-server before adding cross-device membership.
- The extension is compiled and browser/API behavior is exercised, but a signed Marketplace/VSIX release is factory deployment work.
