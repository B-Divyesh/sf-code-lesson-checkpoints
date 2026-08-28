# Repair handoff — Code Lesson Checkpoints

**Failed candidate:** `9e99fac936be04e362c51afabe414959b2e36e6a`

**Verifier report:** `8862d87f63928f15394f892b1dd6125e9de48077` / `.factory/verification-2.md`

**Repair commits:** `7108c8d13626144b58daef88742e0ef61413ff8a`, `d1e24478a0c286ae8c71ab67f6a20ff0bf6c24bb`, `52af607f5d59b10250caf8853d09615aaab0f00d`

**Deployment class:** Rust/Axum + SQLite container serving the Vite/TypeScript frontend on `PORT=8080`

## Release blockers repaired

1. **P0 — live records were partitioned across replicas.** The verifier saw roughly one-third success because the generic Container Apps template allowed three replicas, each with a private `/data/checkpoints.db`. `deployment/container-app.json` now makes the product-specific contract explicit: one replica, one Azure Files volume mounted at `/data`, and SQLite's `unix-dotfile` VFS for lock-file semantics on that network mount. `scripts/apply-deployment-contract.sh` preserves the deployed image and runtime settings while applying and verifying the scale, volume, mount, and database URL. The service also uses one SQLite pool connection, a 30-second busy timeout, and bounded migration-lock retries for safe revision handoff.
2. **P2 — four mobile links were shorter than 44 px.** The brand, home lesson-code link, and pricing terms/privacy links now have explicit 44 px minimum targets. At 390×844 their measured sizes are **172.55×44**, **179×44**, **45×44**, and **95×44** CSS px respectively.

Exact regressions were added:

- `tests/deployment-contract.test.ts` fails if SQLite is configured with more than one replica, lacks durable `/data` storage, or diverges from the image's port/path contract.
- `tests/live-coherence.mjs` performs the verifier's unnamed lesson flow over forced fresh connections: 30 learner reads, 30 tutor reads, submit with server-side secret redaction, 30 post-submit tutor reads, reply, 30 post-reply learner reads, delete, then 20 reads that must all be 404.
- `tests/browser-smoke.mjs` measures each reported target at 390 px and now covers all public routes at desktop/mobile, 200% text, reduced motion, same-origin privacy, keyboard Enter/Space/Escape and dialog focus, open-dialog axe, the complete tutor/learner workflow, and console/page errors.
- The migration helper regression proves repeated startup migration is safe on an already-migrated one-connection database.

## Verification evidence

Executed from a clean dependency install on 2026-08-28:

```bash
npm ci
npm audit --omit=dev
npm test
npm run check
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo build --release
BASE_URL=http://127.0.0.1:8092 npm run test:e2e
BASE_URL=http://127.0.0.1:8092 npm run test:pwa
BASE_URL=http://127.0.0.1:8092 EXPECTED_BUILD_SHA=development npm run test:coherence
BASE_URL=http://127.0.0.1:8092 npm run test:load
```

- Install and production audit passed with **0 vulnerabilities**.
- `npm test` passed **7 Vitest tests + 5 Rust tests**. TypeScript checks, rustfmt, Clippy with warnings denied, Vite/extension build, and optimized Rust build passed.
- Release browser smoke passed at **390×844 and 1440×1000** across `/`, `/join`, `/new`, `/pricing`, `/privacy`, `/terms`, tutor and learner states. Serious/critical axe findings: **0**. There was no overflow, console/page error, third-party request, keyboard trap, or reduced-motion failure; 200% root text retained the layout.
- Privacy behavior passed in browser, extension, and relay: the consent gate remained required, source was never requested, output was capped, and database URL/user-info secrets were redacted before storage.
- Service-worker update and an offline shell reload passed with the offline notice visible.
- The supplied URL verifier passed locally and live: HTTP 200, title, `lang=en`, one h1, main landmark, image alt text, labeled buttons, and zero console/page errors.
- Response policy passed: the production origin received its exact CORS allow-origin; `https://evil.example` received none. CSP, `nosniff`, strict-origin referrer policy, and immutable hashed-asset caching are present. No sampled response set a cookie.
- A fresh default release process started with only `PORT`, logged configuration provenance without values, and served successfully. A lesson survived a graceful process restart and was then permanently deleted.
- VS Code packaging produced a **6.3 kB VSIX**. A VS Code Extension Development Host was not available; TypeScript, privacy unit tests, compiled output, and the package consumer boundary passed.
- Production bundles remain within budget: JS **37,187 B raw / 12.56 kB gzip**, CSS **27,336 B raw / 6.65 kB gzip**, mobile AVIF **16,111 B**. Live Lighthouse mobile scored **99 performance / 100 accessibility / 100 best practices / 100 SEO** (FCP 1.4 s, LCP 1.6 s, CLS 0.006, TBT 20 ms). Local load smoke reached **284 req/s**; live reached **122 req/s**.

## Deployment and live proof

The factory container deployment built successfully in ACR from the root multi-stage Dockerfile. Factory-managed Azure Files storage `code-lesson-checkpoints-data` is mounted as `lesson-data` at `/data`; app configuration reports `minReplicas=1`, `maxReplicas=1`, and the checked-in `DATABASE_URL`. An initial empty bootstrap attempt using default SMB byte-range locking produced only a zero-byte database and 512-byte journal; after its failed revision reached zero replicas, those two synthetic files were removed and replaced by the lock-file-VFS database. No lesson record was deleted.

After the commit containing this handoff is deployed, the final release checks are:

```bash
test "$(curl -fsS https://code-lesson-checkpoints.sociobot.in/health | jq -r .build)" = "$(git rev-parse HEAD)"
BASE_URL=https://code-lesson-checkpoints.sociobot.in EXPECTED_BUILD_SHA="$(git rev-parse HEAD)" npm run test:coherence
```

The live matrix additionally verifies the one-replica/mounted-volume control plane, the 30× fresh-connection lifecycle, URL verifier, browser/keyboard/axe, offline update, CORS/security/cache policy, Lighthouse, and a synthetic lesson created before deployment and read/deleted after the replacement. This last canary proves that a revision replacement retains the durable record.

## Known gaps

- No VS Code desktop host is installed in the worker, so the packaged extension was not launched interactively. Its compile, package, privacy, and server-consumer paths pass.
- INP is not available from the synthetic Lighthouse single-load run. TBT was 20 ms and the interaction smoke had no observable delay.
- There are no remaining known release blockers.
