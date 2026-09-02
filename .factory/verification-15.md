# Independent product verification 15 — PASS

- **Candidate:** `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`
- **Live URL:** https://code-lesson-checkpoints.sociobot.in
- **Work order:** `code-lesson-checkpoints-verify-15`
- **Verified:** 2026-09-02 UTC

## Verdict

**PASS.** Fresh evidence confirms that the requested candidate is deployed and
that the tutor/learner checkpoint workflow works end to end. All 12 registered
claims pass locally through the production demo entry point and against the
live service. No release-blocking or lower-severity product defects were found.

The previously reported deployment concern was not reproduced. The live health
response reports the full candidate SHA, the live browser/API suites pass, and
all 24 non-VSIX production files match the local candidate build byte for byte.

No product code was modified. This report, the handoff update, and evidence in
`.factory/verification-artifacts-15/` are the only repository changes.

## Defects by severity

- **P0:** none.
- **P1:** none.
- **P2:** none.
- **P3:** none.

## Mandatory first gates

### Cold first read and one-click sample — PASS

At 390 px, without stored state, the first screen answers all three questions:

- What it does: **“See where the lesson got stuck.”**
- Who it serves: it names remote programming tutors and explains that learners
  run tutor-defined commands or tests locally and choose what to share.
- What to do first: **“Try it with sample data”** is visible without scrolling,
  beside the outcome “Opens Sam’s three-checkpoint lesson in a temporary demo.”

One click opened `/?demo=1`. The populated tutor view identified checkpoint 2
as the first block and included passed/blocked states, redacted output, a
learner note, and a tutor reply. The persistent banner says **“Demo — sample
data, nothing is saved”** and provides **Reset demo** and **Start for real**.

Evidence: `first-read.json`, `live-first-read-mobile.png`,
`live-home-desktop.png`, `live-demo-mobile.png`, and `live-demo-desktop.png`.

### Claims gate — PASS

`.factory/claims.json` exists with 12 entries. After `npm ci`, the exact
candidate-aware production build, and the documented backend demo entry point,
every listed command was run separately and passed:

1. `demo-isolation`
2. `lesson-workflow`
3. `consented-redacted-evidence`
4. `offline-demo-reload`
5. `json-export`
6. `paid-team-checkout`
7. `license-restore`
8. `team-roster-history`
9. `privacy-boundaries`
10. `permanent-lesson-deletion`
11. `vscode-companion-download`
12. `original-artwork`

The first bootstrap probe was made before the local server was running and did
not reach the product. The VS Code check then identified the README-documented
missing GTK host library. After starting the documented entry point and
installing `libgtk-3-0`, all exact claim commands passed. The complete combined
claim suite also passed against the live service.

The VS Code claim downloaded and installed the built VSIX in VS Code 1.98.2,
showed the command before local execution, ran the fixture, hid the fixture
credential, asked before sharing, and checked the submitted result. Landing and
README promises were cross-checked with the manifest; no unlisted public claim
was found.

## Clean local verification

| Check | Result |
| --- | --- |
| Checkout identity | PASS — clean `main` at exact candidate before QA artifacts |
| `npm ci` | PASS — 425 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 12 Vitest checks and 13 Rust tests |
| `npm run check` | PASS |
| `npm run lint` | PASS — TypeScript, rustfmt, and Clippy with warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS — `dist/` and versioned VSIX produced |
| `BUILD_SHA=<candidate> cargo run --release` | PASS |
| all claim commands | PASS — 12/12 |
| `npm run test:package` | PASS — VSIX integrity, entry, license, consumer syntax |
| VS Code 1.98.2 Extension Host | PASS — installed package and full run/share flow |
| `npm run test:e2e` | PASS locally and live |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:load` | PASS — 200 health requests at 514 requests/second |
| `npm run test:coherence` | PASS live fresh-connection lifecycle |

Docker is unavailable in this worker. The frontend and optimized Rust backend
were built directly, the Dockerfile contract tests pass, and the deployed
container reports and serves the exact candidate.

## End-to-end behavior, boundaries, and recovery

Local and live browser runs confirmed the real job: a tutor creates ordered
commands or tests; a learner opens the six-character code, reviews and shares a
passed or blocked run; common secret patterns are hidden and output is capped;
the tutor sees explicit learner approval, finds the first blocked checkpoint,
replies to that attempt, exports JSON, and permanently deletes the lesson.

Keyboard route changes, browser back/forward, dialog focus, Enter, Space,
Escape, demo reset/exit, invalid-code messaging, offline messaging, and
deletion confirmation all behaved as expected.

Independent live API checks confirmed:

- zero or 13 checkpoints return 400; the 12-checkpoint maximum creates and
  reads successfully;
- a 101-character lesson title and 501-character command return 400;
- malformed JSON returns 400 and a body over 64 KiB returns 413;
- an unknown lesson code returns 404 with a recovery instruction;
- missing consent and an invalid run status return 400 with plain guidance;
- an incorrect tutor token returns 403;
- valid cleanup returns 204 and the deleted lesson then returns 404.

Twenty simultaneous valid lesson creates produced 20 unique IDs and 20 unique
codes. All 20 read successfully and all 20 were deleted with 204.

## Backend identity, persistence, and request allowances

- Live `/health` returns `status: "ok"`, `database: "sqlite"`, and build
  `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`.
- The optimized backend started in a fresh directory with `env -i PORT=8091`
  and no application configuration. It used the documented working-directory
  SQLite fallback, created a lesson, stopped, restarted, read the same lesson,
  and deleted it (`201 → restart → 200 → 204`).
- The configured general API allowance is a burst of 100 plus one token every
  20 ms. A 200-request live burst produced 119 route responses and 81 responses
  with 429 while tokens replenished.
- The write allowance is a burst of 30 plus one token every 100 ms. A 60-write
  validation burst produced 30 validation responses and 30 responses with 429.
- Every product 429 included `Retry-After: 1` and `X-RateLimit-After: 1`.
- The Sociobot product-license verifier admitted 30 checks and returned 10
  responses with 429 in a 40-request burst. Each included `Retry-After: 4` and
  `X-RateLimit-After: 4`.
- Health is intentionally exempt. The product has no sign-in requirement, so
  the Entra authority condition does not apply.

## Live deployment match

- `/health` reports the full candidate SHA and the footer shows its first 12
  characters.
- All 24 local non-VSIX `dist/` files match live responses byte for byte.
- The independently built and live VSIX archives differ only in ZIP metadata;
  all seven extracted files are identical.
- Live claim, browser, PWA, coherence, boundary, and concurrency checks pass.

## Accessibility, privacy, headers, caching, and performance

- Home, demo, join, new, pricing, team, privacy, terms, lesson views, dialogs,
  and the designed 404 were checked at 390 px and desktop.
- The Playwright axe integration found zero serious or critical findings on
  every principal route at both sizes.
- Each route has `lang=en`, one `h1`, a `main`, complete image alternatives,
  valid route focus, and no horizontal overflow. Visible targets are at least
  44 × 44 px, including at 200% text size.
- The first Tab reaches the 143 × 44 px skip link. Its 3 px blue focus outline
  has 4.84:1 contrast against the page. Enter moves focus to `main`.
- Reduced motion changes scrolling to `auto` and removes meaningful
  transitions. The checked disclosure interaction measured 24 ms in the Event
  Timing API and reached its second animation frame in 26.1 ms.
- A cold home-to-demo request log contained eight requests, all to the product
  origin, with no cookies, console errors, or page errors.
- Trusted-origin API preflight receives the product origin; an unrelated origin
  receives no `Access-Control-Allow-Origin` value.
- Responses include a matching CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Hashed JS and CSS use `public, max-age=31536000, immutable`.
- Initial JavaScript is 51,645 bytes raw / 15.90 kB gzip; CSS is 31,524 bytes
  raw / 7.33 kB gzip; initially used fonts total 71,352 bytes; the mobile hero
  AVIF is 15,874 bytes.
- Fresh mobile Lighthouse scored Performance 100, Accessibility 100, Best
  Practices 100, and SEO 100. LCP was 1.43 s, TBT 60 ms, CLS 0.006, and total
  transfer 112,908 bytes.
- Service-worker update and populated offline demo reload pass locally and live.
- The factory URL verifier passed with title, `lang=en`, one `h1`, `main`, no
  missing alternative text, no unlabeled buttons, and no console errors.

## Product and documentation checks

`.factory/design.md` records the product-specific paper-cut direction, opaque
palette, self-hosted type, spacing, interaction/motion policies, and original
asset provenance. The deployed UI follows it. Route metadata, canonical URLs,
social image, favicons, `robots.txt`, `sitemap.xml`, privacy, terms, README, MIT
license, demo notes, claims registry, copy audit, and handoff are present.

The brief's ten-session success measure requires tutor field research and is
not presented as a technically proven public claim.

## Evidence

Fresh evidence is in `.factory/verification-artifacts-15/`, including claim and
gate logs, live screenshots, network/header records, API boundary/concurrency
results, allowance results, persistence logs, live/local hashes, the extracted
VSIX comparison, URL-verifier output, and the Lighthouse report.
