# Independent product verification 11 — FAIL

**Candidate:** `df93fb175eb82350648b65c17c3ff873af01be6d`  
**Live URL:** https://code-lesson-checkpoints.sociobot.in  
**Work order:** `code-lesson-checkpoints-verify-11`  
**Verified:** 2026-09-01 UTC

## Verdict

**FAIL.** The candidate completes the tutor and learner workflow, all 12
registered claim checks pass, and the live deployment matches the candidate.
Release acceptance is blocked by one accessibility defect: at 390 px, a 200%
text-size setting makes the shared header 442 px wide and cuts off part of the
“Plan a lesson” action on every principal route.

No product code was modified. This report, the handoff update, and evidence
under `.factory/verification-artifacts-11/` are the only repository changes.

## Release-blocking finding

### P1 — The mobile header does not preserve content at 200% text size

At a 390 × 844 viewport, setting the root text size from 16 px to 32 px makes
every checked route horizontally overflow:

| Route | Viewport width | Document width | Result |
| --- | ---: | ---: | --- |
| `/` | 390 px | 442 px | FAIL |
| `/demo` | 390 px | 442 px | FAIL |
| `/join` | 390 px | 442 px | FAIL |
| `/new` | 390 px | 442 px | FAIL |
| `/pricing` | 390 px | 442 px | FAIL |
| `/team` | 390 px | 442 px | FAIL |
| `/privacy` | 390 px | 442 px | FAIL |
| `/terms` | 390 px | 442 px | FAIL |

The shared header navigation starts at x=220.55 and ends at x=441.55. The
“Plan a lesson” link starts at x=317.55 and ends at x=441.55, leaving its last
52 px outside the viewport. The screenshot shows the action text cut off.

Evidence:
`.factory/verification-artifacts-11/live-home-mobile-200-percent.png`.

The accessibility contract requires text to resize to 200% without content or
function loss. The header needs to wrap, collapse, or otherwise reflow at this
setting before release.

## Mandatory first gates

### Cold first read and one-click sample — PASS

The cold first screen answers all three questions in plain words:

- What it does: “See where the lesson got stuck.”
- Who it serves: the next sentence names remote programming tutors and
  learners.
- What to do first: “Try it with sample data” is visible and says it opens
  Sam’s three-checkpoint temporary demo.

One click opens the working sample. It shows three ordered checkpoints, passed
and blocked runs, hidden sample credentials, a learner note, and a tutor reply.
The persistent banner says “Demo — sample data, nothing is saved” and provides
Reset demo and Start for real.

### Claims gate — PASS

`.factory/claims.json` exists with 12 entries. After the documented clean setup
(`npm ci`, exact production build, and the backend demo entry point), every
listed command passed separately:

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

The VS Code claim installed the built VSIX into VS Code 1.98.2, invoked its
command, confirmed the displayed local command, ran the fixture, checked the
redacted preview, confirmed sharing, and checked the submitted data. The test
container needed the README-listed GTK 3 runtime package before this check.

Landing, legal, pricing, lesson, demo, and README copy were compared with the
registry. No unlisted product promise was found.

## Clean local verification

| Check | Result |
| --- | --- |
| Candidate and branch | PASS — clean start on `main` at the exact candidate |
| `npm ci` | PASS — 425 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 12 Vitest checks and 13 Rust tests |
| `npm run check` | PASS |
| `npm run lint` | PASS — TypeScript, rustfmt, and Clippy with warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS — `dist/` and versioned VSIX produced |
| `BUILD_SHA=<candidate> cargo build --release` | PASS |
| Every claim command | PASS — 12 of 12 |
| `npm run test:package` | PASS — VSIX contents, entry, license, and consumer syntax |
| VS Code 1.98.2 host check | PASS — installed package and complete confirmation/run/share flow |
| `npm run test:e2e` | PASS locally and live |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:coherence` | PASS — two local and two live complete cycles |
| `npm run test:load` | PASS — 200 health requests at 366 requests/second |

The optimized backend started in an empty directory with only `PORT` and a
normal `PATH`. It reported the compiled candidate identity, used the documented
working-directory fallback because `/data` was absent, preserved a lesson
across a graceful stop and restart, and deleted that test lesson afterward.

Docker is unavailable in this worker. The Dockerfile contract unit checks pass,
both image stages were built directly, and the live image reports and serves
the exact candidate.

## End-to-end, boundaries, recovery, and concurrency

The local and live browser suites confirmed that a tutor can create ordered
checkpoints, give a learner the lesson code, receive selected redacted output
and a note, identify the first blocked checkpoint, reply to that attempt,
export JSON, and permanently delete the complete lesson. Dialog focus,
keyboard operation, browser history, and route focus all passed.

Independent live API checks confirmed:

- malformed JSON, no checkpoints, 13 checkpoints, and a 101-character lesson
  title return 400;
- a request larger than 64 KiB returns 413;
- missing tutor authorization returns 401, a wrong tutor token returns 403,
  and a checkpoint outside the lesson returns 404;
- a 100-character title, 80-character learner name, 12 checkpoints,
  100-character checkpoint titles, 500-character commands, and 300-character
  hints create and read successfully in order;
- 20 simultaneous lesson creates returned 20 unique codes; all 20 records and
  the boundary record were deleted with 204 responses;
- a three-character join code shows “Enter all six characters from your
  tutor.” Replacing it with a valid code opens the correct lesson, and the test
  lesson was deleted.

No verification record was left in live product state.

## Backend identity, persistence, and request allowances

- Live `/health` returns build
  `df93fb175eb82350648b65c17c3ff873af01be6d`, `database: "sqlite"`, and
  `status: "ok"`.
- The general API bucket is configured for an initial burst of 100 and one
  token every 20 ms. In a live set of 220 concurrent reads, 124 completed with
  the expected 404 while tokens replenished and 96 returned 429. Every 429 had
  `Retry-After: 1`.
- The mutation bucket allows 30 initially and one token every 100 ms. In 100
  concurrent invalid writes, exactly 30 reached validation and 70 returned
  429. Every 429 had `Retry-After: 1`.
- The Sociobot product-license verification endpoint admitted 30 of 180
  simultaneous invalid-license checks and returned 150 responses with 429.
  Every limited response had `Retry-After: 4`.
- Health is intentionally exempt. The product has no sign-in requirement, so
  the Entra authority condition does not apply.

## Live deployment match

- `/health` reports the complete candidate SHA.
- The exact candidate-aware production build emits live assets
  `index-Da8rE2Ro.js` and `index-CDb64Ruu.css`.
- Every non-VSIX file in local `dist/` matches the corresponding live response
  byte for byte: 0 mismatches.
- The seven extracted VSIX files match the live download exactly.

The live deployment therefore matches the candidate.

## Accessibility, privacy, headers, and performance

- Home, demo, join, new, pricing, team, privacy, and terms were checked at
  desktop and 390 px. At the normal text setting, each has `lang=en`, one `h1`,
  one `main`, complete image text alternatives, and no horizontal overflow.
- Axe found zero serious or critical findings on all eight routes at both
  viewport sizes.
- Every visible mobile link, button, input, textarea, and summary met the
  44 × 44 px target check.
- Keyboard checks confirmed that the skip link appears at x=8, y=8 with a
  143 × 44 box and 3 px blue focus outline, then moves focus to `main`. Enter
  opens the demo, Space resets it, route changes focus the new heading, and
  dialog focus returns to the originating control.
- Reduced-motion mode changes smooth scrolling to `auto`, reduces transitions
  to 0.01 ms, and removes the looping spinner movement.
- The separate 200% text check fails as documented above.
- Public and demo request logs contained only
  `https://code-lesson-checkpoints.sociobot.in`; there were no console or page
  errors. The flow loaded no third-party scripts or fonts.
- An untrusted origin receives no CORS allow-origin header. Responses include
  the expected CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Hashed assets return `public, max-age=31536000, immutable`. Unknown routes
  return the designed page with HTTP 404.
- All 20 unique links collected from the principal routes returned 200, except
  the expected Sociobot checkout 303 to the hosted payment page.
- Initial JavaScript is 46.43 KB raw / 14.68 KB gzip; CSS is 30.15 KB raw /
  7.11 KB gzip; initially used fonts total 71.35 KB; the mobile hero AVIF is
  15.87 KB. All supplied transfer budgets pass.
- Lighthouse mobile scored 100 for Performance, Accessibility, Best Practices,
  and SEO. FCP was 1.4 s, LCP 1.5 s, TBT 80 ms, CLS 0.007, and total transfer
  109 KiB.
- The service-worker update check passed, and the isolated sample reloaded
  offline with the offline notice after its first visit.

## Product and documentation checks

- `.factory/design.md` records the paper-cut workbench direction, palette,
  self-hosted typography, spacing, interaction, motion, and original artwork
  provenance. The desktop and mobile pages visibly follow it.
- The landing page follows the required information order and includes the
  optional Team archive with `$39 once` and the included features.
- Route titles, descriptions, canonicals, social image, favicon, touch icon,
  `robots.txt`, `sitemap.xml`, privacy, terms, README, MIT license, demo notes,
  and handoff are present.

## Evidence

- `.factory/verification-artifacts-11/screenshot-desktop.png`
- `.factory/verification-artifacts-11/screenshot-mobile.png`
- `.factory/verification-artifacts-11/live-demo-mobile.png`
- `.factory/verification-artifacts-11/live-skip-focus-mobile.png`
- `.factory/verification-artifacts-11/live-home-mobile-200-percent.png`
- `.factory/verification-artifacts-11/lighthouse-live.json`
- `.factory/verification-artifacts-11/verify.json`

## Final acceptance

**FAIL — candidate `df93fb175eb82350648b65c17c3ff873af01be6d` is not accepted.**
