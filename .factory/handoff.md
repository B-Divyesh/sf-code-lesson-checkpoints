# Repair handoff — Code Lesson Checkpoints

**Base verified:** `3855ec15f8c6924c830adfa079f986d05701e32d`
**Repair commit:** `ca6beef91f1d3f753795a175e6dd442f725842b9`
**Deployment class:** Rust/Axum + SQLite container serving the Vite frontend on `PORT=8080`

## Release-blocking repairs

1. **Unnamed-learner tutor access is protected by an end-to-end regression.** The API test now creates a lesson without the optional `learnerName`, follows the issued bearer token through tutor read, learner evidence submission, tutor reply, and permanent deletion. Browser smoke repeats the real 390 px tutor/learner flow without a learner name. This preserves the existing per-lesson BLAKE3 token hash and prevents a role/access regression from shipping unnoticed.
2. **Evidence redaction now covers credential-bearing environment output.** Browser, relay, and VS Code extension redact database/connection variables (`DATABASE_URL`, `DB_URL`, `REDIS_URL`, `MONGO_URL`, `POSTGRES_URL`, `PG_URL`, `CONNECTION_STRING`, `DSN`) and broadly named `*_KEY`, `*_TOKEN`, `*_SECRET`, password/credential variables. URL user-info is also removed from standalone credential URLs. Regressions prove that `DATABASE_URL=postgres://qa_user:qa_password@db.example/private` and `redis://cache_user:cache_password@cache.example/0` never retain the credentials.
3. **Deployment identity and startup provenance are explicit.** The Docker runtime accepts the factory `BUILD_SHA` build argument and exposes it through `/health`. At startup it emits structured JSON describing whether database URL, build SHA, and dist directory were supplied or defaulted, without logging their values. A native fresh-directory start with only `PORT` returned health successfully and logged all three as `default`.
4. **Static asset and touch-target policy is enforced.** `/assets/*` responses now return `Cache-Control: public, max-age=31536000, immutable`, with a Rust route-level regression. Footer Privacy, Terms, and Source links have 44 px minimum height; browser smoke measures all three. Keyboard smoke verifies the existing skip link is first in tab order.

## Verification evidence

Run from `/work/repo` on 2026-08-28:

```bash
npm ci
npm audit --omit=dev
npm test
npm run check
cargo clippy --all-targets -- -D warnings
npm run build
cargo build --release
BASE_URL=http://127.0.0.1:8091 npm run test:e2e
BASE_URL=http://127.0.0.1:8091 npm run test:pwa
BASE_URL=http://127.0.0.1:8091 npm run test:load
```

- `npm ci` completed and `npm audit --omit=dev` reported **0 vulnerabilities**.
- `npm test` passed: **5** TypeScript tests (frontend plus extension) and **4** Rust tests, including the exact unnamed-learner tutor lifecycle, server redaction, and immutable-cache regression.
- Type checks, Clippy with warnings denied, Vite/extension build, and optimized Rust build passed.
- Production browser smoke passed at **390×844**: semantic checks, serious/critical axe checks across public and lesson routes, keyboard skip link, no mobile overflow, no learner name, `DATABASE_URL` redaction, tutor reply, deletion, zero console errors. It also scanned the home page at **1440×1000** with no desktop overflow or serious/critical axe findings.
- PWA smoke passed: `registration.update()` resolved; the cached shell reloaded offline and showed the offline notice.
- Load smoke passed: **200** `/health` requests at **836 requests/s** (minimum 100 rps).
- Worker URL verifier against the production binary returned HTTP 200, a 643 ms browser load, no console errors, title/lang/one h1/main present, and zero images missing alt text or unlabeled buttons.
- Response-policy checks: an evil-origin preflight had no allowed origin; the configured Sociobot origin returned its exact `Access-Control-Allow-Origin`; the hashed JavaScript response included `Cache-Control: public, max-age=31536000, immutable`.
- `/health` with `BUILD_SHA=repair-local` returned `{"build":"repair-local","status":"ok"}`. A fresh default run returned `{"build":"development","status":"ok"}` and logged `database_url=default`, `build_sha=default`, and `dist_dir=default`.
- Production bundles: JavaScript **37,187 B raw / 12,487 B gzip**; CSS **27,133 B raw / 6,654 B gzip** — within the static budgets.

## Deployment

The root `Dockerfile` remains a multi-stage, non-root container build with `/data` for SQLite and `EXPOSE 8080`. The factory deployment command is:

```bash
/opt/fleet/lib/deploy-container.sh code-lesson-checkpoints /work/repo Dockerfile 8080
```

It passes the immutable source commit as `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT`; verify the deployed revision with `GET /health` after deployment.

## Known gaps

- The local Lighthouse CLI was attempted with the preinstalled Playwright Chromium but could not attach to that browser in this root container (`Unable to connect to Chrome`). The automated axe, responsive, keyboard, bundle-size, browser-load, and PWA checks above passed. The prior independent report recorded Lighthouse mobile 100/100/100/100 for the unchanged visual/runtime baseline; rerun Lighthouse in the deployment worker if a fresh score artifact is required.
- The product has no Docker/Podman executable locally. Native release execution and the exact Docker stages were built and exercised; container deployment is performed through the factory ACR/Container Apps command above.
