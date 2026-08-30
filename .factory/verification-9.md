# Independent product verification 9 — PASS

**Candidate:** `d101dafe759a13c787acbbaa113dbd827f4ee491`
**Live URL:** https://code-lesson-checkpoints.sociobot.in
**Work order:** `code-lesson-checkpoints-verify-9`
**Verified:** 2026-08-30 UTC

## Verdict

**PASS.** The candidate completes the researched tutor/learner job end to end,
all eight registered claims pass against the exact-SHA release entry point, and
the live deployment is the candidate. Local tests, release builds, VS Code
extension packaging, browser flows, privacy, accessibility, PWA behavior,
SQLite persistence, concurrency, rate limiting, and performance all passed.

No product code was modified. Verification added only this report, the updated
handoff, and evidence under `.factory/verification-artifacts-9/`. No unrelated
service, app setting, secret, database, vault, deployment, or infrastructure
resource was read, connected to, changed, or restarted.

## Mandatory first gates

### Cold first read and one-click demo

PASS at 1440 × 900 and 390 × 844.

- What it does: **“See where the lesson got stuck.”** The next sentence says
  tutors define runnable checkpoints and learners choose evidence to share.
- For whom: remote programming tutors and their learners.
- What to click first: **Try it with sample data**. It is visible at y=397 on
  the 390 px screen and y=727 on the desktop screen.
- One activation opens `/demo`, already populated with Sam's three-checkpoint
  weather API lesson, a passed run, blocked run, redacted output, note, and
  tutor reply.
- The persistent banner says **“Demo — sample data, nothing is saved”** and
  offers **Reset demo** and **Start for real**.

Evidence: `first-read-desktop.png`, `live-home-mobile.png`, and
`live-demo-desktop.png` in `.factory/verification-artifacts-9/`.

### Claims

`.factory/claims.json` exists with eight entries. After `npm ci`, the documented
production demo entry point was built and started, and every exact listed
command passed individually:

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | Real local keys were unchanged; only `demo:clc:workspace` changed; reset returned a new workspace id. |
| `consented-redacted-evidence` | PASS | Unconsented evidence was rejected; secrets were redacted; output was capped; note and tutor reply round-tripped. |
| `offline-demo-reload` | PASS | A fresh context reloaded the populated demo offline and showed the offline notice. |
| `json-export` | PASS | Downloaded JSON parsed with the sample title, three checkpoints, and blocked evidence. |
| `paid-team-checkout` | PASS | Pricing showed $39 and one-time terms; the hosted checkout returned the expected 303. |
| `no-tracking` | PASS | Public/demo browser requests were same-origin only; no file upload control exists. |
| `team-roster-history` | PASS | Search filtered a three-record local roster and the records survived reload. |
| `permanent-lesson-deletion` | PASS | Authorized deletion removed the lesson, checkpoints, evidence, note, and reply; learner/tutor reads returned 404. |

The full `npm run test:claims` also passed against the optimized release binary.
The literal commands fail before dependencies exist and refuse connections
before the documented server is running; these are prerequisites, not claim
assertion failures. With the clean install and demo entry point running, no
claim test failed. Landing, legal, pricing, and README claims were cross-checked
against the manifest; no material unlisted product claim was found.

## Clean local verification

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS; 112 packages, 0 vulnerabilities |
| `npm test` | PASS; 12 Vitest assertions and 13 Rust tests |
| `npm run check` | PASS; web and extension TypeScript |
| `npm run lint` | PASS; TypeScript, rustfmt, Clippy with warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS; `dist/` emitted |
| `BUILD_SHA=<candidate> cargo build --release` | PASS |
| `npm run test:package` | PASS; VSIX packaged and clean-consumer syntax checked |
| `npm run test:e2e` | PASS locally and live |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:load` | PASS; 200 health requests at 417 req/s |
| `COHERENCE_CYCLES=4 npm run test:coherence` | PASS locally |
| Live exact-SHA `COHERENCE_CYCLES=4` | PASS |

The release binary also started in an empty temporary working directory with
an empty runtime environment except `PORT` and normal `PATH`; `/health`
returned the candidate SHA and `database: "sqlite"`.

The worker image does not contain a `docker` executable, so a redundant local
`docker build` could not run. This is an environment limitation, not a product
failure: both Docker build stages were run directly, the live build identity
matched, and all 24 live static files matched the SHA-aware local production
build byte for byte.

## End-to-end product and recovery paths

The local and live browser suites exercised planning a lesson, copying the
six-character code, joining as the learner, opening the evidence dialog by
Enter and Space, closing with Escape, selecting Blocked, redacting a secret,
consenting, sharing output and a reflection, replying as tutor, observing the
reply as learner, and permanently deleting the lesson. No console or page
errors occurred.

Independent invalid/boundary checks produced the expected recoverable result:

- malformed JSON, blank title, zero checkpoints, 13 checkpoints, and a
  101-character title returned 400 with useful messages;
- a body over 64 KiB returned 413;
- missing lesson code returned 404, missing tutor auth returned 401, and a
  wrong tutor token returned 403;
- the maximum valid 100-character title, 80-character learner name, 12
  checkpoints, 100-character checkpoint titles, 500-character commands, and
  300-character hints created and read successfully, then deleted;
- the join UI announced the short-code error, explained a missing six-character
  code, returned to the join form, and opened a valid lesson on retry;
- 20 simultaneous lesson creates all returned 201 with 20 unique codes, and all
  20 authorized cleanup requests returned 204.

All synthetic local and live lessons were deleted.

## Backend identity, persistence, and limits

- Live `/health` returned
  `{"build":"d101dafe759a13c787acbbaa113dbd827f4ee491","database":"sqlite","status":"ok"}`.
- A local lesson survived a graceful process stop and restart from the same
  SQLite file, remained readable, and was then deleted.
- Four local and four live fresh-connection cycles each created, read,
  submitted, replied, and deleted successfully.
- Same-client read throttle, local: 220 simultaneous reads produced 114 normal
  404s and 106 `429`s.
- Same-client read throttle, live: 220 simultaneous reads in 725 ms produced
  117 normal 404s and 103 `429`s. Every observed throttle returned
  `Retry-After: 1` and `X-RateLimit-After: 1`. The source contract is a burst
  allowance of 100 with one token replenished every 20 ms; the 17 additional
  reads completed as tokens replenished during the burst.
- Health is intentionally exempt. API routes use the first
  `X-Forwarded-For` hop for the client key; mutation routes also have the
  documented stricter bucket.

No sign-in is required, so the Entra tenant requirement is not applicable.

## Live deployment equivalence

- The checked-out clean clone began at the exact candidate SHA.
- The candidate-aware production build emitted JS
  `index-CP5dOsIt.js` (42.95 kB raw / 13.88 kB gzip) and CSS
  `index-BX5pPZ0V.css` (28.77 kB raw / 6.87 kB gzip).
- SHA-256 comparisons matched every one of the 24 local `dist/` files to its
  live URL. There were zero mismatches.
- Live `/health` and the footer both identify the candidate.

This fresh public evidence supersedes the historical deployment failure in
`.factory/verification-8.md`.

## Accessibility, privacy, headers, and performance

- Desktop and 390 px routes have `lang=en`, one h1, one main landmark,
  route-specific titles/canonicals, ordered semantics, no missing image alt,
  and no horizontal overflow. Unknown routes return a designed real 404.
- Axe reported zero serious/critical findings across home, demo, join, new,
  pricing, team, privacy, terms, lesson, dialog, and 404 states.
- Keyboard traversal reaches the visible skip link first. Focus is a 3 px
  `#34708e` outline; Enter opened the demo and Space reset it. Dialog focus is
  moved and restored correctly. Tested targets are at least 44 px.
- 200% root text did not overflow. Reduced motion changes smooth scrolling to
  `auto` and meaningful transition durations to effectively zero.
- Fresh public/demo request logs contained only
  `https://code-lesson-checkpoints.sociobot.in`. No trackers, analytics,
  third-party fonts/scripts, or source-file upload were observed.
- Headers include CSP with response-header-only `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`. An untrusted Origin gets
  no CORS allow-origin header.
- Hashed assets use `public, max-age=31536000, immutable`. Initial transfer was
  about 110 kB: 14.4 kB JS, 7.5 kB CSS, 72.3 kB fonts, and 16.2 kB hero art.
- Live service-worker update passed; the populated demo reloaded offline with
  the correct connection notice.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.080 s, LCP 1.455 s, TBT 0 ms, CLS 0.006.

Lighthouse report and screenshots are in
`.factory/verification-artifacts-9/`.

## Findings by severity

- **P0:** none.
- **P1:** none.
- **P2:** none.
- **Environment note:** Docker CLI unavailable in the verifier container; the
  release stages, live identity, byte equivalence, and runtime behavior were
  verified by the checks above.

## Final acceptance

**PASS — candidate `d101dafe759a13c787acbbaa113dbd827f4ee491` is accepted at
https://code-lesson-checkpoints.sociobot.in.**
