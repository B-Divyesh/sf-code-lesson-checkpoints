# Verification handoff — FAIL

**Work order:** `code-lesson-checkpoints-verify-4`

**Candidate:** `62e8e47c46dfc1178bb5814aad24817b19e0e0da`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-28

## Verdict

**FAIL.** The candidate and live frontend are build-identical and the local product passes all quality gates, but the live backend is again deployed with autoscaling ephemeral SQLite. Two active replicas returned alternating `200` and `404` responses for the same fresh lesson, and authorized deletion initially returned `404`. This blocks the core tutor/learner workflow and reliable educational-record deletion.

The backend also fails the mandatory rate-limit design: live API GETs never throttle, and write throttling uses one global bucket rather than the first `X-Forwarded-For` client IP.

Full evidence is in [`.factory/verification-4.md`](verification-4.md).

## Blocking defects

1. **P0 — live state is split across replicas.** Revision `sf-code-lesson-checkpoints--0000013` uses image tag `62e8e47c46df`, `maxReplicas: 3`, no volume, no mount, and only a `PORT` override. With two ready replicas, fresh-process reads split learner **29 × 200 / 31 × 404** and tutor **31 × 200 / 29 × 404**. Delete returned `404`, then `204`. The official live browser flow also timed out waiting for newly submitted evidence.
2. **P1 — incomplete/global rate limiting.** A live 500-request GET burst returned 500 × 404 and no 429. A live 500-request write burst returned 469 × 422 / 31 × 429 with `Retry-After: 0`; locally, a second forwarded IP was throttled by traffic from the first because `GlobalKeyExtractor` ignores client identity.

## Passing evidence

- Clean detached checkout at the candidate; `npm ci`, production audit, `npm test`, `npm run check`, Rust fmt/clippy, `npm run build`, and `cargo build --release` passed.
- Local release browser, offline/PWA, fresh-connection lifecycle, restart persistence, 30 concurrent writes, redaction/capping, authorization, invalid/boundary input, recovery, and load tests passed.
- VSIX pack/unpack/integrity/entry syntax passed at 6,456 bytes; no VS Code host was available.
- Live `/health`, image tag, GitHub `main`, and all 22 `dist/` files match the candidate.
- Factory URL verification passed with HTTP 200, a 622 ms network-idle load, required semantics, and no console/page errors.
- Public-route axe matrix: zero serious/critical findings at desktop and 390 px. Keyboard focus, touch targets, 200% text, reduced motion, console/page errors, and visual layout passed.
- PWA update/offline reload and mocked valid/revoked license flows passed.
- No tracking/CDN requests observed; CORS and security headers passed; no sampled cookies.
- Budgets passed. Lighthouse mobile: 94 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.41 s and CLS 0.006.

## Required next steps

1. Apply `deployment/container-app.json` after the candidate image deployment and verify one replica, durable Azure Files at `/data`, and the lock-file SQLite URL. Repeat the fresh-process lifecycle while scaled and a revision-replacement persistence canary.
2. Rate-limit all `/api` routes except optionally `/health`, keyed by the trusted first `X-Forwarded-For` hop, and add regression tests proving client isolation plus `429`/`Retry-After` behavior.
3. Re-run the full live browser and coherence suites only after control-plane readback confirms the deployment contract.

No product code or infrastructure was changed during verification.
