# Independent product verification — FAIL

**Candidate:** `5531d03ea41f31099bdd5f17aa2c33ba1615fe65`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-30

**Work order:** `code-lesson-checkpoints-verify-5`

The candidate **fails** the acceptance contract. The source gates pass and the live build is the requested candidate, but the deployment-only data-loss defect has recurred. The live app is again running three replicas with separate ephemeral SQLite databases. In addition, the mandatory claims manifest and one-click sample-data demo are absent, and the advertised Team archive checkout returns `404`.

## Defects by severity

### P0 — live lesson data is split across three ephemeral replicas

Fresh Azure readback for active revision `sf-code-lesson-checkpoints--0000016` showed:

- image `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:5531d03ea41f`;
- `activeRevisionsMode: Single` and 100% traffic to the latest revision;
- **three running replicas** with `minReplicas: 1`, `maxReplicas: 3`;
- **no volume**, **no volume mount**, and only `PORT=8080` in the environment.

This contradicts checked-in `deployment/container-app.json`, which requires one replica, Azure Files mounted at `/data`, and `DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile`.

Public reproduction using separate HTTP/1.1 processes:

1. `POST /api/lessons` created `Verifier 5 replica QA` with `201`.
2. Forty learner reads split **13 × 200 / 27 × 404**.
3. Forty authenticated tutor reads split **13 × 200 / 27 × 404**.
4. Authorized deletion returned `404` seven times and `204` on attempt eight, when the request finally reached the owning replica.
5. After that successful deletion, 30/30 learner reads returned `404`.

Two earlier concurrency probes also created a lesson with `201` and immediately received `404` from both learner read and authorized deletion. The repository coherence test happened to pass once, demonstrating that a single lifecycle is not sufficient evidence under the current topology.

Impact: a tutor or learner intermittently cannot open a valid lesson; submissions and replies can appear missing; and a valid deletion request can falsely report that the lesson does not exist. This breaks the core job and the stated deletion/privacy boundary.

Required release action: apply the checked-in deployment contract, verify `maxReplicas: 1`, the Azure Files volume and `/data` mount, and the lock-file SQLite URL in live control-plane readback, then repeat a multi-connection lifecycle and revision-replacement persistence canary.

### P1 — mandatory claims manifest and claim tests are absent

`.factory/claims.json` does not exist. Therefore no claim test could be run before the broader suite. This is an explicit release blocker in the work order and the claims contract.

The live site and README nevertheless make claims including “No source uploads,” browser/server secret redaction, an 8,000-character cap, offline shell behavior, evidence export/deletion, free Pair use, and paid archive behavior. With no manifest, all are unlisted and none has the required one-to-one `@claim:<id>` demo-sandbox test.

### P1 — there is no one-click sample-data demo or isolated demo sandbox

- The cold first screen has “Plan a lesson” and “I have a lesson code,” but no visible **Try it with sample data** action.
- `GET /demo` renders the designed not-found screen: title `Page not found — Code Lesson Checkpoints`, h1 `This path has no checkpoint.`
- There is no demo banner, Reset demo action, Start for real action, demo storage namespace, or `.factory/demo.md`.

The first screen otherwise passes the plain-language comprehension test: it says what the product does (“See where the lesson got stuck”), who it serves (“Remote programming tutors…”), and what to click first (“Plan a lesson”). The mandatory one-click demo requirement still makes this gate fail.

### P1 — advertised paid checkout is broken

The live pricing page advertises “Team archive — $39 once” and links to `https://api.sociobot.in/api/v1/products/code-lesson-checkpoints/checkout`. A fresh GET returned HTTP `404` with `{"error":"enabled factory product","status":404}`. Visitors cannot purchase the advertised tier.

The separate verify endpoint is reachable: an invalid license returned `200` with `{valid:false, reason:"invalid"}`. Its rate limit also works: a 300-request burst produced **30 × 200 / 270 × 429**, with `Retry-After: 3` or `4` on every throttle.

### P2 — unknown routes are soft 404s

`/missing-page` and `/demo` render the product’s not-found UI but return HTTP `200`, not `404`. This weakens crawler and cache correctness and does not meet the “real 404 route” requirement.

## Mandatory first gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `.factory/claims.json` exists and every listed test runs first | **FAIL** | File absent; no claims could be enumerated or run |
| Cold first read explains what, for whom, and first action | PASS | Clear h1, audience sentence, and “Plan a lesson” action |
| One-click sample-data demo on first screen | **FAIL** | No demo action; `/demo` is the not-found view |

## Clean checkout and build gates

Verification began from clean commit `5531d03ea41f31099bdd5f17aa2c33ba1615fe65`. Installation did not alter tracked files.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS — 112 packages installed |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `npm test` | PASS — 10 Vitest tests and 8 Rust tests |
| `npm run lint` | PASS — TypeScript checks, Rust format, Clippy with warnings denied |
| `BUILD_SHA=5531... npm run build` | PASS — Vite `dist/` and extension compilation |
| `BUILD_SHA=5531... cargo build --release` | PASS |
| `npm run test:package` | PASS — 6.73 KB VSIX, 7 files, clean unpacked consumer integrity/license/entry/syntax |
| Local `npm run test:e2e` | PASS |
| Local `npm run test:pwa` | PASS |
| Local `npm run test:coherence` | PASS |
| Local `npm run test:load` | PASS — 200 health requests at 146 req/s |
| Live `npm run test:e2e` | PASS in that run |
| Live `npm run test:pwa` | PASS |
| Live `npm run test:coherence` | PASS in that run |
| Live `npm run test:load` | PASS — 200 health requests at 257 req/s |

Docker and Podman are not installed in this worker. The exact frontend, extension, and optimized backend builds ran natively. The Dockerfile was inspected: it is multi-stage, uses `rust:1-slim-bookworm`, does not depend on `.git`, sets build identity from `ARG BUILD_SHA`, runs as non-root, and exposes port 8080. The live container identifies as the exact candidate and its frontend bytes match the local production build.

## Functional, invalid-input, concurrency, and persistence evidence

The local optimized service started with only `PORT=8098` in an otherwise empty environment and logged all optional configuration as default without exposing values.

Passing local checks:

- Full tutor/learner browser flow: create lesson, join, consent to blocked evidence, redact a database credential, show the first blocked checkpoint, reply, refresh, and permanently delete.
- Rejected blank/101-character lesson titles, zero/13 checkpoints, 101-character checkpoint title, 501-character command, 301-character success hint, missing consent, invalid status, 1,001-character note, empty/2,001-character reply, wrong tutor token, and a body over 64 KiB.
- Accepted exact 100/80/100/500/300-character create boundaries and a 1,000-character note. Valid retries after rejected input succeeded.
- A 12,000-character output was stored as 8,019 characters including the trim notice; API/database credentials were absent.
- Lowercase dash-separated share-code normalization worked.
- **30/30** concurrent valid submissions returned `201` and all 30 persisted locally.
- A created lesson survived a graceful stop/restart in the same data directory; authorized deletion returned `204`, followed by `404` on learner access.

The live browser flow passed once, but the separate-process reproduction above proves that the deployed topology makes the same workflow intermittent.

## Accessibility, keyboard, mobile, privacy, and PWA

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 671 ms network-idle load, descriptive title, `lang=en`, one h1, one main landmark, complete image alt text, labeled buttons, and no console/page errors.
- The repository’s Playwright axe integration found **0 serious/critical violations** across `/`, `/join`, `/new`, `/pricing`, `/team`, `/privacy`, `/terms`, and the not-found view at 390 × 844 and 1440 × 1000.
- Keyboard checks covered the first-tab skip link, visible 3 px blue focus treatment, Enter/Space opening of the evidence dialog, focus transfer into the dialog, and Escape dismissal.
- Every sampled route had no horizontal overflow at 390 px, desktop, or 200% root text. Manual screenshots of home and lesson creation showed intentional stacking, readable controls, and no obstruction.
- Reduced-motion mode changed smooth scrolling to `auto` and reduced sampled transitions/animations to `0.00001s`; there is no looping motion.
- A Playwright request log across seven public routes recorded **49/49 same-origin requests**, no external requests, and no HTTP errors. The full local and live core-flow smoke also asserted no unexpected origins. Source inspection found no analytics, trackers, CDN fonts, or source-file upload input.
- The service worker update resolved, and the cached shell reloaded offline with its visible offline notice.

The privacy implementation is sound in a coherent single instance, but the live replica split makes the promise of reliable access and deletion false in practice.

## Headers, rate limits, identity, caching, and budgets

- `/health` returned `5531d03ea41f31099bdd5f17aa2c33ba1615fe65`.
- **24/24** local `dist/` files matched the live deployment byte-for-byte.
- Responses include `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`. No product-origin cookies were set. CORS allowed the product origin and did not allow `https://evil.example`.
- Hashed assets return `Cache-Control: public, max-age=31536000, immutable`.
- Live API read burst: **141 × 404 / 359 × 429** across 500 concurrent requests; all throttles had `Retry-After: 1`.
- Live mutation burst: **67 × 422 / 133 × 429** across 200 concurrent invalid writes; all throttles had `Retry-After: 1`.
- Local tests confirm first-hop `X-Forwarded-For` extraction and per-client isolation. `/health` is intentionally exempt.
- Initial JavaScript: **37,574 B raw / 12.70 KB gzip**. CSS: **27,336 B raw / 6.65 KB gzip**. Mobile AVIF hero: **15,874 B**. All stated bundle budgets pass.
- Lighthouse 13.0.1 mobile: **Performance 97 / Accessibility 100 / Best Practices 100 / SEO 100**; FCP 1.05 s, LCP 1.35 s, CLS 0.006, TBT 197 ms, total transfer 108,851 B. Synthetic Lighthouse does not report field INP.

## Cleanup and limitations

The controlled replica reproduction was deleted after reaching its owning replica; 30 subsequent reads returned `404`. Two earlier synthetic records named `Verifier 5 concurrency QA` may remain on ephemeral replicas because their authorized cleanup requests also returned `404`. They contain no personal or real learner data.

No product code, infrastructure, DNS, billing configuration, or production records were intentionally modified. Azure control-plane checks were read-only. An interactive VS Code Extension Development Host was unavailable, so the extension was verified by packaging and installing/unpacking it as a clean consumer.

## Verdict

**FAIL.** The deployed core workflow is unreliable because state is partitioned across three ephemeral replicas. Release acceptance is independently also blocked by the missing claims manifest/tests, the absent one-click isolated sample demo, and the dead paid checkout.
