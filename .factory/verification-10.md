# Independent product verification 10 — FAIL

**Candidate:** `20e2ae20eb70f84fc1a571c2ebee6045fa9b8d22`  
**Live URL:** https://code-lesson-checkpoints.sociobot.in  
**Work order:** `code-lesson-checkpoints-verify-10`  
**Verified:** 2026-09-01 UTC

## Verdict

**FAIL.** The candidate and live deployment complete the core tutor/learner
workflow, and all registered claim commands pass against the built demo entry
point. Release acceptance is blocked by contract findings in claim coverage,
landing-page structure, and mobile target sizing.

No product code was modified. Verification added this report and evidence under
`.factory/verification-artifacts-10/`, and updated `.factory/handoff.md`.

## Release-blocking findings

### P1 — An unlisted quantitative promise has no measured claim test

The live `/new` route says **“Tutor setup · about 2 minutes.”** The sentence is
also in `frontend/src/main.ts:157`, but `.factory/claims.json` has no matching
claim or measured test. The claims contract requires every quantitative promise
to be listed and measured. Remove the estimate or add a sandboxed timing claim.

### P1 — The landing page omits the required paid-tier section

The landing page ends after “What this tool does not do” and the footer. It does
not include the required paid-tier section with the exact `$39 once` price and
what Team archive adds. `/pricing` contains those facts, but the site-structure
contract requires them in the landing-page sequence. This is especially visible
at 390 px, where the compact header also omits the Team plan link.

Evidence: `.factory/verification-artifacts-10/live-home-mobile.png`.

### P1 — Several mobile interactive targets are smaller than 44 px

At a 390 × 844 viewport, computed target boxes included:

| Route | Control | Measured box |
| --- | --- | ---: |
| `/` | Install the VS Code companion | 219 × 20 px |
| `/?demo=1` | Open the blocked checkpoint | 126 × 40 px |
| `/?demo=1` | Copy checkpoint 2 command | 39 × 44 px |
| `/join` | Focused skip link | 142 × 42 px |

The supplied accessibility and design contracts require every touch target to
be at least 44 × 44 CSS px.

### P1 — The VS Code behavior claim is checked by inspection, not execution

`@claim:vscode-companion-download` confirms that the VSIX is a ZIP, checks its
file list, searches compiled JavaScript for three strings, and directly calls
the redaction helper. It does not load the extension in a VS Code host, invoke
its commands, confirm the command dialog, run a sample command, or confirm the
share dialog. This does not demonstrate the observable behavior promised by the
claim. `npm run test:package` independently confirms package integrity and
JavaScript syntax, but not the claimed interaction.

## Additional findings

### P2 — Two keyboard/screen-reader details need correction

- Activating the first “Skip to content” link scrolls to `#main`, but
  `document.activeElement` becomes `BODY`, not `MAIN`. The main target needs to
  receive programmatic focus.
- SPA navigation correctly focuses the new `h1`, and the heading accessibility
  name includes spaces. The separate live-region message uses raw
  `textContent`, however, and announces “Plan your nextcode lesson.” without a
  space at the forced line break.

## Mandatory first gates

### Cold first read and one-click sample

**PASS** at 1440 × 900 and 390 × 844.

- What it does: “See where the lesson got stuck.”
- For whom: the next sentence names remote programming tutors and learners.
- What to click first: “Try it with sample data” is visible in the first view.
- One click creates a separate sample workspace and opens Sam’s three ordered
  checkpoints, one passed run, one blocked run, hidden sample credentials, a
  learner note, and a tutor reply.
- The persistent banner provides Reset demo and Start for real.

Evidence: `live-home-desktop.png`, `live-home-mobile.png`, and
`live-demo-mobile.png` in `.factory/verification-artifacts-10/`.

### Claims gate

`.factory/claims.json` exists with 12 entries. The literal first invocation in
the untouched clone could not import Playwright because dependencies were not
installed. After `npm ci`, an invocation without the documented demo server
returned connection-refused results. After the documented clean setup
(`npm run build`, then `cargo run`), every exact listed command passed, and the
combined `npm run test:claims` passed all 12 checks:

`demo-isolation`, `lesson-workflow`, `consented-redacted-evidence`,
`offline-demo-reload`, `json-export`, `paid-team-checkout`, `license-restore`,
`team-roster-history`, `privacy-boundaries`, `permanent-lesson-deletion`,
`vscode-companion-download`, and `original-artwork`.

The separate cross-check found the unlisted two-minute estimate and the VS Code
claim-proof gap described above, so the claims contract is not accepted despite
the green registered suite.

## Clean local verification

| Check | Result |
| --- | --- |
| Candidate identity and clean start | PASS; clone began at the exact candidate SHA |
| `npm ci` | PASS; 397 packages, 0 reported vulnerabilities |
| `npm test` | PASS; 12 Vitest assertions and 13 Rust tests |
| `npm run check` | PASS |
| `npm run lint` | PASS; TypeScript, rustfmt, and Clippy with warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS; `dist/` and versioned VSIX produced |
| `BUILD_SHA=<candidate> cargo build --release` | PASS |
| `npm run test:package` | PASS; VSIX contents, license, entry file, and syntax |
| `npm run test:e2e` | PASS locally and live |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:coherence` | PASS locally; three live exact-SHA cycles also passed |
| `npm run test:load` | PASS; 200 health checks at 171 requests/second |

Docker is not installed in the verification container, so a redundant local
`docker build` could not be run. Both build stages were run directly, Dockerfile
contract tests passed, and the live files and compiled identity were checked.

## End-to-end and recovery checks

Confirmed locally and live that a tutor can create ordered checkpoints, copy a
learner link, receive passed and blocked attempts, see selected redacted output
and a note, reply to the blocked attempt, export JSON, and permanently delete
the record. The live browser suite completed this flow at 390 px without console
or page errors.

Independent live API checks confirmed:

- malformed JSON, zero checkpoints, 13 checkpoints, and a 101-character title
  return 400-class responses with useful messages;
- a request body over 64 KiB returns 413;
- missing tutor authorization returns 401, a wrong tutor token returns 403, and
  a wrong checkpoint returns 404;
- a 100-character title, 80-character learner name, 12 checkpoints,
  100-character checkpoint names, 500-character commands, and 300-character
  hints create and read successfully in order;
- 20 simultaneous lesson creates returned 20 unique codes and all 20 records
  were deleted;
- a short lesson code announces “Enter all six characters from your tutor,” and
  replacing it with a valid code opens the lesson without a page error.

One preliminary browser recovery check stopped before retaining its private
cleanup link. It left one synthetic lesson named `Recovery path lesson` in the
product’s own SQLite state. It contains one harmless sample command and no
personal information. All later test records were deleted.

## Backend identity, persistence, and request allowances

- Live `/health` returns build
  `20e2ae20eb70f84fc1a571c2ebee6045fa9b8d22`, `database: "sqlite"`, and
  `status: "ok"`.
- The optimized binary starts in an empty directory with only `PORT` and a
  normal `PATH`. Its health response reports the compiled candidate identity.
- A lesson stored in the local SQLite file remained readable after a graceful
  process stop and restart, then deleted successfully.
- For one live client, 220 concurrent reads produced 123 normal 404 responses
  while tokens replenished and 97 `429` responses. Every `429` included
  `Retry-After: 1`. The configured read burst is 100, replenished every 20 ms.
- For one live client, 100 concurrent writes admitted exactly 30 validation
  responses and returned 70 `429` responses with `Retry-After: 1`. The observed
  write burst allowance is 30, replenished every 100 ms.
- The Sociobot product-license verification endpoint admitted 30 checks in the
  observed window, then returned 131 `429` responses with `Retry-After: 3–4`.
- Health is intentionally exempt. The product requires no sign-in, so the Entra
  tenant condition does not apply.

## Live deployment match

- `/health` reports the exact candidate SHA.
- The candidate-aware build emits live assets `index-gvLgmto6.js` and
  `index-CZzfDBCU.css`.
- Twenty-four normal `dist/` files match the live bytes exactly.
- The VSIX outer ZIP differs only in generated timestamps; all seven extracted
  files match exactly.

The live deployment therefore matches the candidate.

## Accessibility, privacy, headers, and performance

- Home, demo, join, new, pricing, team, privacy, terms, and the designed 404
  were checked at desktop and 390 px. Each has `lang=en`, one `h1`, one `main`,
  no missing image alt text, and no horizontal overflow.
- Axe found zero serious or critical issues on all checked routes in both
  viewport sets. The target-size and focus findings above come from additional
  manual/computed checks.
- Keyboard checks confirm the skip link is first, visible focus is a 3 px blue
  outline, Enter opens the sample, Space resets it, and SPA route changes focus
  the new heading. Dialog behavior also passes the live browser suite.
- Setting the root text size to 200% preserved headings and produced no
  horizontal overflow on all principal routes.
- Reduced-motion mode changes smooth scrolling to `auto` and meaningful
  transitions to effectively zero.
- Public and demo request logs contained only the product origin. No third-party
  scripts, fonts, advertising measurement, media capture, or file input ran.
- Untrusted origins receive no CORS allow-origin header. Responses include CSP
  with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Hashed assets return `public, max-age=31536000, immutable`. All 20 unique
  links found across principal routes return 200 or the expected hosted-checkout
  303.
- Initial 390 px transfer was 112 KB: 14.7 KB encoded JavaScript, 7.3 KB CSS,
  71.4 KB fonts, and 15.9 KB hero art, within all supplied budgets.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.051 s, LCP 1.436 s, TBT 0 ms, CLS 0.006.
- Social art is 1200 × 630, the touch icon is 180 × 180, and the mobile hero is
  a 720 × 480 AVIF.

## Evidence

- `.factory/verification-artifacts-10/live-home-desktop.png`
- `.factory/verification-artifacts-10/live-home-mobile.png`
- `.factory/verification-artifacts-10/live-demo-mobile.png`
- `.factory/verification-artifacts-10/lighthouse-live.json`

## Final acceptance

**FAIL — candidate `20e2ae20eb70f84fc1a571c2ebee6045fa9b8d22` is not accepted.**

