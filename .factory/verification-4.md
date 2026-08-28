# Independent product verification — FAIL

**Candidate:** `62e8e47c46dfc1178bb5814aad24817b19e0e0da`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-28

**Work order:** `code-lesson-checkpoints-verify-4`

The candidate **fails** the acceptance contract. The source passes its local gates and the live image, health identity, and all 22 frontend artifacts match the candidate. However, the repaired durable single-replica deployment contract was lost in the candidate deployment. Two live replicas with separate ephemeral SQLite files returned conflicting results for the same newly created lesson, including unreliable deletion. The backend also does not satisfy the mandatory per-client rate-limit contract.

## Defects by severity

### P0 — the live deployment again partitions lesson data across ephemeral replicas

Fresh control-plane evidence showed active revision `sf-code-lesson-checkpoints--0000013`, image `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:62e8e47c46df`, `minReplicas: 1`, `maxReplicas: 3`, no volumes, no volume mounts, and only a `PORT=8080` Container Apps environment override. During the reproduction, Azure reported two replicas; both were ready and running. This contradicts checked-in `deployment/container-app.json`, which requires one replica, an Azure Files volume mounted at `/data`, and the lock-file SQLite URL.

The defect was independently reproduced against the public URL:

1. The repository's live browser flow created a lesson and reached its learner evidence form, but timed out after 30 seconds waiting for the just-submitted redacted evidence to appear.
2. A separate controlled run created `Verifier 4 replica coherence QA` with `POST /api/lessons` (`201`). Sixty learner reads made through separate HTTP/1.1, no-keepalive processes split **29 × 200 / 31 × 404**. Sixty authenticated tutor reads split **31 × 200 / 29 × 404**.
3. Authorized deletion returned **404** on its first attempt and **204** only when the request reached the owning replica. All 30 post-delete reads then returned `404`.
4. The repository coherence test had passed minutes earlier while only one replica was serving. This demonstrates why a single passing run cannot validate the current autoscaling/ephemeral topology.

Impact: tutors and learners intermittently cannot open a valid lesson; evidence and replies are not consistently visible; and a deletion request can report `404` while the educational record still exists on another replica. The core job-to-be-done and FERPA/GDPR-ready deletion boundary are therefore unreliable.

Required remediation: apply the checked-in deployment contract after deploying every candidate, verify `maxReplicas: 1`, the Azure Files volume/mount, and `DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile`, then repeat the fresh-process lifecycle and a revision-replacement persistence canary.

### P1 — API reads are unbounded and writes are globally, not per-client, limited

The mandatory backend contract requires every server-side endpoint except health to be rate limited using the first `X-Forwarded-For` hop.

- A live burst of **500** requests to `GET /api/lessons/code/ZZZZZZ` returned **500 × 404 and 0 × 429**.
- The router explicitly applies the governor only to `POST`, `PUT`, and `DELETE` methods.
- The configured `GlobalKeyExtractor` returns the same unit key for every request and does not inspect `X-Forwarded-For`. In a local 500-request mutation burst, 499 requests used one forwarded IP and the final request used a different IP; that final request still received `429`, proving the shared global bucket.
- A live burst of 500 invalid `POST /api/lessons` requests did trigger the partial protection: **469 × 422 / 31 × 429**. The first input ordinal receiving `429` was 289, and every `429` had `Retry-After: 0`. Locally, 180 concurrent writes produced **104 × 422 / 76 × 429**.

Impact: lesson-code reads can be brute-forced without application throttling, while one abusive client can consume the global write allowance and deny valid tutor/learner writes to everyone. Use a trusted first-hop forwarded-IP extractor and cover all `/api` routes, with health explicitly exempt if desired.

## Clean checkout and quality gates

Verification ran in detached clean worktree `/tmp/clc-qa-62e8e47-lIWexm` at the exact candidate. The source checkout was not modified during tests.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS — 112 packages installed |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 8 Vitest tests and 5 Rust tests |
| `npm run check` | PASS — frontend and extension TypeScript |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS — Vite `dist/` and extension compilation |
| `cargo build --release` | PASS — optimized backend binary |
| Local `npm run test:e2e` | PASS |
| Local `npm run test:pwa` | PASS |
| Local `npm run test:coherence` | PASS |
| Local `npm run test:load` | PASS — 200 health requests at 174 req/s |
| Live `npm run test:e2e` | **FAIL** — timeout waiting for newly submitted evidence |
| Live `npm run test:pwa` | PASS |
| Live `npm run test:load` | PASS — 200 health requests at 262 req/s |

There is no separate lint script. No Docker, Podman, or VS Code desktop executable was available. The exact Vite/extension production build and optimized Rust build ran natively; the Dockerfile was inspected and remains multi-stage, `.git`-independent, non-root, and build-SHA aware.

## Local backend, boundaries, and recovery

The optimized binary started successfully with only `PORT=8094` in an otherwise empty environment. Its JSON startup log marked database URL, build SHA, and dist directory as defaults without printing values or secrets.

Passing independent coverage:

- Full tutor/learner flow: create, join, Enter/Space/Escape dialog operation, consented blocked evidence, secret redaction, first-block timeline, tutor reply, learner refresh, and confirmed deletion.
- Rejected blank/101-character lesson titles, 81-character learner name, zero/13 checkpoints, 101-character checkpoint title, 501-character command, 301-character success hint, malformed JSON, and a body over 64 KiB.
- Accepted the exact 100/80/100/500/300-character create boundaries.
- Rejected missing consent, invalid status, an unrelated checkpoint, a 1,001-character note, missing tutor authorization, wrong tutor token, empty reply, and 2,001-character reply; valid retries recovered.
- Accepted a 1,000-character note. A 12,000-character sample was stored as 8,019 characters including the trim notice; database URL, bearer credential, Redis URL credentials, and API token were absent.
- Lowercase, dash-separated lesson code normalization worked.
- **30/30** concurrent valid submissions returned `201` and all 30 persisted.
- A lesson with 31 submissions survived a graceful process stop/restart. Authorized deletion returned `204`, followed by `404` on learner access.

## Extension package boundary

`@vscode/vsce@3.6.2` produced `/tmp/code-lesson-checkpoints-0.1.0-verify4.vsix` at **6,456 bytes**. It was unpacked into a clean temporary consumer; archive integrity passed, the declared `extension/dist/extension.js` entry existed, and `node --check` passed. The packager warned that the manifest has no `repository` field and the VSIX omits a license file, although the repository contains the required MIT `LICENSE`. Interactive Extension Development Host testing was unavailable because no VS Code executable is installed.

## Live accessibility, visual, privacy, and paid-unlock checks

- Factory URL verifier passed: HTTP 200, 622 ms network-idle load, correct title and language, one h1, a main landmark, complete image alt text, no unlabeled buttons, and no console/page errors.
- Independent Playwright + axe checks found **0 serious/critical findings** on `/`, `/join`, `/new`, `/pricing`, `/privacy`, and `/terms` at both 390 × 844 and 1440 × 1000.
- Every sampled route had one h1, one main landmark, `lang=en`, a descriptive title, no missing image alt, no unlabeled button, no horizontal overflow, and no visible interactive target below 44 × 44 px. The same routes had no horizontal overflow at 200% root text on 390 px mobile.
- The skip link was the first Tab stop and had a visible 3 px blue outline. The local dynamic flow verified dialog focus transfer plus Enter, Space, and Escape operation.
- With reduced motion requested, scroll behavior was `auto`, and sampled transition/animation durations were `0.00001s`. There is no looping visual motion.
- Manual screenshot review at desktop and 390 px found clear hierarchy, intentional mobile stacking, legible forms, and no clipping or fixed-bar obstruction. The product-specific paper-path system matches `.factory/design.md`.
- Public-route loads generated no console/page errors and contacted no external origin. Source inspection found no analytics/tracking or CDN fonts/scripts. The explicit purchase/verification integration points only to the Sociobot API.
- A mocked valid checkout return stored `sb_license:code-lesson-checkpoints`, stripped the token from the URL, showed **Open Team archive** on the first render, and made no second verification request on immediate reload. A mocked revoked restore removed the token, restored **Buy Team archive**, and announced that free Pair tools remain available.
- The service worker update resolved and an offline shell reload displayed the offline notice.

The live core workflow did produce failing API responses because of the P0; public informational routes themselves had no console or page errors.

## Deployment identity, response policy, and budgets

- Live `/health` returned the exact full candidate SHA, GitHub `main` resolved to that SHA, and the deployed image tag was `62e8e47c46df`.
- All **22** local `dist/` files matched their live paths byte-for-byte by SHA-256 comparison.
- Production CORS returned the exact allow-origin for the Sociobot origin and no allow-origin for `https://evil.example`. Sampled responses set no cookies.
- CSP restricts scripts/styles/fonts to self, connections to self and Sociobot billing, framing to none, and form actions to self/Sociobot. `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` were present.
- Hashed assets returned `Cache-Control: public, max-age=31536000, immutable`.
- Initial JavaScript: **37,138 B raw / 12,741 B encoded**. CSS: **27,336 B raw / 7,002 B encoded**. Fonts: **71,358 B encoded** across three loaded self-hosted files. Mobile AVIF hero: **16,111 B**. Total initial resource transfer: **109,012 B**. All static budgets pass.
- Lighthouse 13.0.1 mobile: **Performance 94 / Accessibility 100 / Best Practices 100 / SEO 100**; FCP 1.05 s, LCP 1.41 s, CLS 0.006, TBT 275 ms, total size 106 KiB. Synthetic Lighthouse does not report field INP.

## Cleanup and limitations

The controlled live coherence record was deleted from its owning replica, and 30 subsequent reads returned `404`. The repository browser smoke may have left one synthetic `Async debugging` record after timing out before its cleanup step; it contains no real learner data, and its private token was not exposed by the test. No production records were altered otherwise.

No infrastructure, deployment, DNS, billing, or product code was changed. Azure was queried read-only. Container image execution and an interactive VS Code Extension Development Host were unavailable in this worker.

## Verdict

**FAIL.** Local implementation quality, accessibility, privacy controls, paid-unlock recovery, offline support, bundle size, and build matching are strong. Release acceptance is blocked by the recurring live multi-replica ephemeral-SQLite split, and the server also violates the mandatory per-client/all-endpoint rate-limit policy.
