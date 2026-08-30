# Repair handoff — PASS

**Work order:** `code-lesson-checkpoints-repair-8`
**Released candidate:** `460762e99d1d2414fc0578b1627f913f58b5664e`
**Public URL:** `https://code-lesson-checkpoints.sociobot.in`
**Verified:** 2026-08-30 UTC

## Result

**PASS.** The public service now serves the repaired candidate from one healthy
replica with the product-owned `/data` SQLite mount. The stale application
connection setting was removed by replacing the full environment with `PORT`
only; its previous value was never read.

## Repairs

- Reproduced the original connection-time failure: a held SQLite exclusive
  lock makes `PRAGMA journal_mode=WAL` return `database is locked`.
- Removed WAL setup from the connection path. Startup uses SQLite's
  `unix-none` VFS only in the enforced single-writer topology, then uses the
  rollback `DELETE` journal rather than WAL on Azure Files.
- Added the exact Rust regression
  `azure_files_lock_does_not_kill_startup_during_wal_configuration_regression`.
  It proves the former WAL configuration fails under the synthetic lock while
  the repaired connection opens and the replacement writer migrates after the
  lock is released.
- Made the deployment contract replace the complete application environment
  with `PORT=8080`, deactivate stale mounted revisions before starting a new
  candidate, and retire all older active revisions once the candidate is
  ready.
- Added claim coverage for the searchable Team roster/local lesson history and
  permanent deletion of a lesson, its checkpoints, evidence, and replies.

## Local verification

- `npm ci` — PASS (112 packages, 0 vulnerabilities).
- `npm test` — PASS (12 TypeScript/Vitest assertions; 13 Rust tests).
- `npm run check` and `npm run lint` — PASS (strict TypeScript, rustfmt,
  Clippy with warnings denied).
- `npm run build` — PASS; `dist/` emitted. Initial JS is 42.92 kB raw /
  13.85 kB gzip and CSS is 28.77 kB raw / 6.87 kB gzip.
- `BUILD_SHA=460762e99d1d2414fc0578b1627f913f58b5664e cargo build --release`
  — PASS.
- `npm run test:package` — PASS; VSIX packaged and consumer syntax checked.
- Local `npm run test:claims`, `npm run test:e2e`, `npm run test:pwa`,
  `npm run test:load`, and `COHERENCE_CYCLES=4 npm run test:coherence` — PASS.
  The load smoke completed 200 health requests at 677 requests/second. The
  browser suite covers desktop and 390 px mobile, keyboard forms/dialogs,
  focus, reduced motion, no console errors, privacy requests, and serious or
  critical axe findings.

## Live verification

- `GET /health` returned
  `{"build":"460762e99d1d2414fc0578b1627f913f58b5664e","database":"sqlite","status":"ok"}`.
- Product app/revision readback: revision `sf-code-lesson-checkpoints--0000025`
  is the sole active, healthy `RunningAtMaxScale` revision; its template has
  one `/data` mount, `minReplicas: 1`, `maxReplicas: 1`, and environment name
  `PORT` only. The settled replica list count is `1`.
- Live persistence canary: created a synthetic lesson, restarted the active
  revision, read it as learner (`200`) and tutor (`200`), then authorized
  deletion (`204`). The synthetic record was removed.
- `BASE_URL=https://code-lesson-checkpoints.sociobot.in`
  `EXPECTED_BUILD_SHA=460762e99d1d2414fc0578b1627f913f58b5664e`
  `COHERENCE_CYCLES=4 npm run test:coherence` — PASS.
- Live `npm run test:e2e`, `npm run test:pwa`, `npm run test:claims`, and
  `npm run test:load` — PASS. All eight listed claims passed; the live load
  smoke completed 200 health requests at 350 requests/second.
- Factory `verify-url.sh` — PASS: HTTP 200, 602 ms load, no console errors,
  `lang=en`, one h1, main landmark, and no missing image alt text. Response
  headers include CSP with `frame-ancestors 'none'`, `nosniff`, and strict
  origin referrer policy.

## Known gaps and next steps

None. The historical failed verification remains in
`.factory/verification-8.md` as the original independent report; this handoff
records the repair evidence.
