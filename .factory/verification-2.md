# Independent product verification — FAIL

**Candidate:** `9e99fac936be04e362c51afabe414959b2e36e6a`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-28

**Work order:** `code-lesson-checkpoints-verify-2`

The candidate **fails** the acceptance contract. The checked-in implementation passes locally and the live frontend exactly matches the candidate build, but the deployed backend partitions lesson data across instances. A tutor or learner receives intermittent `404` responses for a record that was just created, valid evidence submissions intermittently fail, and authorized deletion is unreliable. This breaks the primary tutor/learner workflow and the required FERPA/GDPR-ready deletion boundary.

## Defects

### P0 — live lesson state is partitioned across backend instances

Fresh evidence against the live URL on 2026-08-28:

1. `POST /api/lessons` created unnamed lesson `169798ae-238b-48a5-9e6a-8f98f6dce702` with code `MWNSLC` and a tutor token.
2. Thirty authenticated `GET /api/tutor/lessons/{id}` requests made over fresh connections split **10 × 200 / 20 × 404**.
3. Thirty `GET /api/lessons/code/MWNSLC` requests split **9 × 200 / 21 × 404**.
4. Sixty authorized deletion attempts split **5 × 204 / 55 × 404**. The successful attempts removed the record from its owning instance; 30 subsequent learner reads were all 404.

A second, named lesson independently reproduced the write failure:

- Created lesson `8820dbb7-0a2b-41a6-872d-8fe7eb700c88`, code `CBH53T`.
- After resolving its checkpoint on an instance that could see it, 30 simultaneous valid, consented evidence submissions split **11 × 201 / 19 × 404**.
- Thirty authenticated tutor reads then split **9 × 200 / 21 × 404**. A successful read contained all 11 accepted attempts, and their database credentials were redacted.
- Cleanup split **1 × 204 / 59 × 404**; 30 subsequent learner reads were all 404.

Every sampled `/health` response reported the exact candidate SHA, so these are not visibly mixed software revisions. The roughly one-third success rate and per-request changes are consistent with multiple instances using independent SQLite storage. A single browser flow can pass when its connection remains routed to the instance that accepted the create, which explains why the repository smoke test passes while fresh connections fail.

Impact:

- Tutors intermittently cannot open a valid private lesson link or identify the first blocked checkpoint.
- Learners intermittently cannot open a valid code or share a run.
- A successful delete response does not establish that the record was addressable across the deployment before deletion; users cannot rely on access or erasure behavior.
- One earlier synthetic lesson named `Live concurrency and privacy QA` could not be cleaned up after the initial reproduction because both authenticated delete attempts reached an instance returning 404. It contains no real learner data.

Required remediation: run a single replica for SQLite or move all replicas to one supported shared transactional database, then verify create/read/submit/reply/delete across new connections and after instance restart/replacement.

### P2 — several mobile interactive targets remain below 44 px

At a 390 × 844 CSS-pixel viewport, visible targets measured:

- Header home/brand link: **172.5 × 39 px**
- Home “I have a lesson code” link: **178 × 20 px**
- Pricing “terms” link: **37 × 17 px**
- Pricing “privacy notice” link: **87 × 17 px**

This misses the attached accessibility/design requirement that touch/click targets be at least 44 × 44 CSS px. Footer links, buttons, and form controls met the target in the sampled screens.

## Clean checkout and quality gates

The checkout was clean and at the requested commit before verification.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS; 112 packages installed |
| `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| `npm test` | PASS; 5 Vitest tests and 4 Rust tests |
| `npm run check` | PASS; frontend and extension TypeScript |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS; produced `dist/` and `extension/dist/extension.js` |
| `cargo build --release` | PASS |
| VS Code extension package | PASS; `@vscode/vsce` produced a 6.3 kB VSIX |

There is no separate lint script. The VSIX packager warned that the extension manifest lacks a `repository` field and that the extension package does not include a license file; the repository itself has the required MIT `LICENSE`.

No Docker, Podman, Buildah, or VS Code host executable was available in the worker. The exact frontend/extension and optimized Rust builds ran natively. The Dockerfile was inspected: it is multi-stage, does not depend on `.git`, declares `ARG BUILD_SHA=dev`, runs as a non-root user, exposes 8080, and persists SQLite under `/data`.

## Local release behavior

The optimized release binary was copied beside the production `dist/` and started in a fresh directory with only `PORT=8091` plus a minimal process `PATH`.

- Startup succeeded and emitted structured configuration provenance with `database_url=default`, `build_sha=default`, and `dist_dir=default`, without values or secrets.
- A second start with `BUILD_SHA=9e99fac936be04e362c51afabe414959b2e36e6a` returned that exact SHA from `/health`.
- A lesson with no learner name survived a graceful stop/restart with its checkpoint, redacted evidence, and tutor reply intact; authenticated deletion then made both learner and tutor reads return 404.
- Local browser smoke passed at 390 × 844: create, learner join, consented blocked evidence, `DATABASE_URL` redaction, tutor reply, deletion, axe, semantics, touch-target assertions, and zero console/page errors.
- Dialog keyboard smoke passed: Enter opened the evidence dialog, focus moved to its close control, Escape closed it, keyboard submission worked, and an open-dialog axe scan had no serious/critical findings.
- Service-worker update and offline shell reload passed.
- Load smoke passed: 200 `/health` requests at **132 requests/second**.
- Rate-limit smoke returned **101 × 422 / 49 × 429** for 150 simultaneous invalid mutations.
- CORS included `Access-Control-Allow-Origin` for the configured production origin and omitted it for `https://evil.example`.
- Hashed assets returned `Cache-Control: public, max-age=31536000, immutable`.

Boundary and recovery coverage passed locally:

- Blank title, zero checkpoints, 13 checkpoints, 101-character title, 501-character command, 1,001-character note, malformed JSON, missing consent, invalid status, wrong checkpoint, missing tutor token, wrong tutor token, empty reply, and 2,001-character reply were rejected.
- A 100-character title, 80-character learner name, and 12 checkpoints were accepted and deleted.
- A 12,000-character evidence sample was capped to 8,019 stored characters including the trim notice. `DATABASE_URL`, Authorization bearer data, standalone Redis URL credentials, and broad token variables were absent from the stored record.
- Share-code normalization, valid reply, retry after invalid input, persistence, and permanent deletion passed.

## Live browser, accessibility, privacy, and PWA evidence

- Repository browser smoke passed once end to end at 390 × 844. This does not clear the P0 because it reused a browser connection; the fresh-connection probes above failed consistently.
- The supplied URL verifier passed: HTTP 200, 783 ms load, title, `lang=en`, one h1, main landmark, image alt text, labeled buttons, and zero console/page errors.
- Independent axe scans found **0 serious/critical findings** on `/`, `/join`, `/new`, `/pricing`, `/privacy`, `/terms`, and the archive/locked states at both 1440 × 1000 and 390 × 844.
- All sampled pages had no horizontal overflow at desktop, 390 px mobile, or with root text enlarged to 200%.
- Keyboard focus reached the skip link first. Its visible focus treatment was a solid 3 px `rgb(52, 112, 142)` outline on both viewports. Invalid short codes produced the announced six-character error; a nonexistent full code produced the recovery screen and “Try again” action.
- With `prefers-reduced-motion: reduce`, smooth scrolling computed to `auto` and transition duration to `0.00001s`; no looping decorative motion remained.
- Service-worker `registration.update()` resolved, and the cached shell reloaded offline with the offline notice.
- Across public routes, observed browser requests stayed on the product origin. No analytics, ad, third-party font, or tracker request occurred. The intentional license flow was separately intercepted and verified: query token storage and URL stripping, daily Sociobot verification, exact hosted checkout URL, $39 one-time copy, and unlocked archive navigation all behaved as specified.
- Live responses set CSP, `nosniff`, and strict-origin referrer policy. Evil-origin CORS preflight received no allowed origin; the production origin received only its exact origin. Sampled responses set no cookies.

## Deployment identity, bundles, and performance

- Twelve sampled live `/health` responses returned `9e99fac936be04e362c51afabe414959b2e36e6a`.
- Every one of the 22 local `dist/` files matched its live URL byte-for-byte, including HTML, service worker, scripts, styles, fonts, images, sitemap, and robots file.
- JavaScript: **37,187 B raw / 12.56 kB gzip**.
- CSS: **27,133 B raw / 6.63 kB gzip**.
- Mobile AVIF hero: **16,111 B**.
- Lighthouse 13.0.1 mobile: **Performance 96, Accessibility 100, Best Practices 100, SEO 100**; FCP 1.0 s, LCP 1.4 s, CLS 0.006, TBT 220 ms, total transfer 106 KiB. INP is not available from this synthetic single-load run.
- The first live load smoke, run concurrently with browser/PWA checks, measured 71 requests/second. Three immediate isolated reruns passed at **271, 261, and 272 requests/second**.
- Brotli content encoding and immutable caching were present on the hashed JavaScript asset.

## Verdict

**FAIL.** Local code quality and frontend deployment fidelity are strong, but the live backend cannot provide coherent shared persistence. The P0 must be fixed and reverified across fresh connections before release acceptance.
