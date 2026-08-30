# Repair handoff — durable single-service state

**Work order:** `code-lesson-checkpoints-repair-7`
**Verifier input:** `.factory/verification-6.md` for candidate `dc5047ed3575eb77c73972be41a630f25d70a9c2`

## What changed

- Replaced the split runtime path with one SQLite-only service. Runtime state now resolves to `/data/checkpoints.db` whenever the durable mount exists, with a local `checkpoints.db` fallback for development.
- Removed the shared-state drivers, migrations, release wiring, injected connection setting, and obsolete verifier reports that contained prohibited infrastructure references. The dependency lock now contains only the SQLite driver path.
- Set `deployment/container-app.json` to one replica and `dataDir: "/data"`; the release contract mounts the product-owned `sf-code-lesson-checkpoints-data` Azure Files storage there and leaves only `PORT=8080` in the app environment.
- The Docker runtime creates `/data`, makes it writable by the non-root user, and compiles the build identity into the binary instead of adding runtime configuration.
- Added regressions for the durable state-file resolver, a complete create → process-close → reopen → authorized-delete lifecycle on a mounted-like SQLite directory, and a tracked-source scan that rejects prohibited infrastructure residue.
- Preserved the tutor/learner flow, isolated demo, offline sample, hosted checkout, privacy redaction, rate limiting, responsive accessibility behavior, and extension package.

## Local verification

Run on 2026-08-30 UTC from `/work/repo`:

- `npm ci` — 112 packages installed; `npm audit` reported 0 vulnerabilities.
- `npm test` — 12 TypeScript/Vitest checks and 12 Rust checks passed, including `sqlite_state_on_a_durable_mount_survives_a_process_restart_regression`.
- `npm run lint` — strict TypeScript, formatting, and Clippy with warnings denied passed.
- `npm run build` and `BUILD_SHA=repair-local cargo build --release` — passed; `dist/` produced. Initial JS is 42.92 kB raw / 13.85 kB gzip; CSS is 28.77 kB raw / 6.87 kB gzip.
- `npm run test:claims` — all six required claim tags passed.
- `COHERENCE_CYCLES=4 npm run test:coherence` — four fresh-connection create/read/submit/reply/delete lifecycles passed.
- `npm run test:e2e` — passed at 390 px and desktop, including keyboard operation, dialog focus, 200% text, reduced motion, no console errors, privacy requests, and axe integration with no serious or critical violations.
- `npm run test:pwa` — service-worker update and offline `/demo` reload passed.
- `npm run test:load` — 200 health requests completed at 778 requests/second.
- `npm run test:package` — clean VSIX consumer package check passed (7 files, 6.72 kB).
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:8080 <evidence-dir>` — passed: 632 ms load, title, `lang=en`, one h1, main landmark, alt text, labeled buttons, and no console errors.
- Lighthouse 13.0.1 local mobile simulation — Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.36 s and CLS 0.0059.

## Deployment evidence

- Commit `eb129d3ec6a6864aba67c8146150cc4e3ece4bd5` was pushed to `main`.
- `scripts/deploy-release.sh eb129d3ec6a6864aba67c8146150cc4e3ece4bd5` built and pushed `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:eb129d3ec6a6` successfully (digest `sha256:676fc81d92879478876a52b9308cfa3b77eef947da44680af2f5ffbb53259560`). The container build completed all 25 stages and includes only the SQLite driver path.
- The platform rejected the sf app template patch before rollout with `ManagedEnvironmentStorageNotFound`: `sf-code-lesson-checkpoints-data` does not exist as a registered durable storage mount. No fallback volume or unrelated storage resource was created or used.
- Readback after the rejection showed the prior revision remained active with three replicas, no volume mount, and its legacy injected connection setting still present. The release script therefore stopped before the canary, restart, and public lifecycle could run.

## Known gaps

The local artifact is complete. Release remains blocked until the factory provisions the product-owned `sf-code-lesson-checkpoints-data` durable storage mount for the sf app. Once available, re-run the exact release command above; it will remove the legacy setting, set one replica, mount `/data`, and run the persistence canary plus four public lifecycle checks. No shared data service was inspected, changed, or contacted.
