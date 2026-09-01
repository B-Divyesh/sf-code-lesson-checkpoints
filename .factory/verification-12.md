# Independent product verification 12 — FAIL

**Candidate:** `a75b9132713d8d179cb8cfee92067ff226704ad6`  
**Live URL:** https://code-lesson-checkpoints.sociobot.in  
**Work order:** `code-lesson-checkpoints-verify-12`  
**Verified:** 2026-09-01 UTC

## Verdict

**FAIL.** The candidate is deployed, the complete tutor/learner workflow works,
all 12 registered claims pass, and the local and live builds match. Release
acceptance is blocked by two contract defects: the desktop Demo navigation
target is 43 px wide instead of the required 44 px, and an approved learner
submission has no explicit consent indicator in the tutor view.

No product code was modified. This report, the handoff update, and evidence
under `.factory/verification-artifacts-12/` are the only intended repository
changes.

## Release-blocking findings

### P1 — The desktop Demo target is smaller than 44 × 44 px

At a 1440 × 900 viewport, the shared-header **Demo** link measures **43 × 44
CSS px** on every checked route:

`/`, `/demo`, `/join`, `/new`, `/pricing`, `/team`, `/privacy`, `/terms`, and
the designed 404 route.

The supplied accessibility and design contracts require every interactive
target to be at least 44 × 44 px. Mobile, keyboard-focus, and 200% text tests
pass, but the normal desktop target remains one pixel too narrow. The existing
browser regression checks every visible target on mobile and checks the header
at 200% text, so it does not catch the normal desktop width.

Evidence: `verification-artifacts-12/accessibility-privacy.json`.

### P1 — Tutors do not receive the required consent indicator

The learner evidence dialog requires: “I reviewed these results and agree to
share them with my tutor.” The backend stores only rows with `consented = 1`.
However, after an approved run reaches the tutor, its attempt shows status,
selected output, note, and reply form without any “reviewed,” “approved,” or
consent indicator. The sidebar says “Selected evidence only,” which describes
scope but does not tell the tutor that the learner explicitly approved that
submission.

This misses the researched brief's privacy constraint, “consent indicators for
both parties.” The tutor-facing evidence text contains no matching indicator,
as recorded independently after a consented live submission; the synthetic
lesson was then deleted.

Evidence: `verification-artifacts-12/tutor-consent-indicator.png` and
`tutor-consent-indicator.json`.

## Additional scope finding

### P2 — The paid tier does not provide the researched small-team controls

The researched monetization scope calls for paid **small-team history and
roster controls**. The shipped $39 “Team archive” is explicitly “For one
tutor” and only searches private tutor links stored in that one browser. It
has no team members, shared history, or roster controls. The live copy is
honest about the narrower feature, but the implementation does not match this
part of the researched acceptance contract and no deviation is explained in
the handoff.

## Mandatory first gates

### Cold first read and one-click sample — PASS

The cold first screen answers all three required questions in plain words:

- What it does: “See where the lesson got stuck.”
- Who it serves: the next sentence names remote programming tutors and
  learners.
- What to click first: “Try it with sample data” says it opens Sam's temporary
  three-checkpoint lesson.

One click opens the useful sample. It has three ordered checkpoints, passed and
blocked runs, hidden sample credentials, a learner note, and a tutor reply. The
persistent banner says “Demo — sample data, nothing is saved” and provides
Reset demo and Start for real.

### Claims gate — PASS

`.factory/claims.json` exists with 12 entries. A literal invocation before
install could not import Playwright, and an invocation before producing and
serving `dist/` could not reach the demo. After the documented clean setup
(`npm ci`, candidate-aware production build, and the backend demo entry point),
every exact listed command passed separately. A final combined
`npm run test:claims` also passed all 12:

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
command, confirmed the command before execution, ran a local fixture, checked
the redacted preview, confirmed sharing, and checked the submitted payload.
The worker needed the README-listed GTK 3 runtime package.

Landing, legal, pricing, demo, lesson, and README copy were compared with the
claims registry. No unlisted public product promise was found.

## Clean local verification

| Check | Result |
| --- | --- |
| Candidate and branch | PASS — `main` at the exact candidate |
| `npm ci` | PASS — 425 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 12 Vitest checks and 13 Rust tests |
| `npm run check` | PASS |
| `npm run lint` | PASS — TypeScript, rustfmt, and Clippy with warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS — `dist/` and versioned VSIX produced |
| `BUILD_SHA=<candidate> cargo build --release` | PASS |
| `npm run test:claims` | PASS — 12 of 12 |
| `npm run test:package` | PASS — VSIX integrity, entry, license, and consumer syntax |
| VS Code 1.98.2 host check | PASS — installed package and complete run/share flow |
| `npm run test:e2e` | PASS locally and live |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:load` | PASS — 200 health requests at 399 requests/second |
| `npm run test:coherence` | PASS — three local, three live, and one release-binary cycle |

The optimized backend started under `env -i` with only `PORT` and a normal
`PATH`. It reported the compiled candidate identity, used the documented
working-directory fallback because `/data` was absent, preserved a lesson
across a graceful process restart, and deleted that fixture afterward.

Docker is unavailable in this worker. The Dockerfile contract unit tests pass,
the frontend and release backend stages were built directly, and the live
container reports and serves the candidate.

## End-to-end, boundaries, recovery, and concurrency

Local and live browser runs confirmed the real job: a tutor creates ordered
commands, a learner opens the code, reviews and shares a passed or blocked run,
secret-like output is redacted and capped, the tutor identifies the first
blocked checkpoint and replies, the tutor exports JSON, and permanent deletion
removes the lesson. Dialog focus, Escape/Enter/Space operation, route focus,
browser back/forward, invalid join-code recovery, and offline messaging pass.

Independent live API checks confirmed:

- malformed shape returns 422;
- blank or 101-character titles, zero or 13 checkpoints, invalid evidence
  status, missing consent, and a 1,001-character note return 400;
- a request over 64 KiB returns 413;
- missing tutor authorization returns 401 and a wrong token returns 403;
- a maximum valid lesson with a 100-character title, 80-character learner
  name, 12 checkpoints, 100-character checkpoint titles, 500-character
  commands, and 300-character hints creates and reads successfully;
- decorated lowercase share codes normalize correctly;
- 20 simultaneous creates returned 20 unique IDs and codes, and all 20
  cleanup requests returned 204.

No synthetic verification lesson was left in live product state.

## Backend identity, persistence, and request allowances

- Live `/health` returns build
  `a75b9132713d8d179cb8cfee92067ff226704ad6`, `database: "sqlite"`, and
  `status: "ok"`.
- The configured general API allowance is a burst of 100 plus one token every
  20 ms (50/second). In 160 concurrent live reads over 779 ms, 120 reached the
  route while tokens replenished and 40 returned 429.
- The configured write allowance is a burst of 30 plus one token every 100 ms
  (10/second). In 60 concurrent invalid writes over 168 ms, 31 reached input
  validation and 29 returned 429.
- Every product API 429 included `Retry-After: 1`; reads and writes recovered
  after the wait.
- The Sociobot license-verification endpoint admitted 30 invalid-license
  checks, then returned 10 responses with 429 and `Retry-After: 4` in the next
  batch.
- Health is intentionally exempt. The product has no sign-in requirement, so
  the Entra authority condition does not apply.
- A release-binary lesson remained readable after a graceful stop/restart and
  returned 404 after authenticated deletion.

## Live deployment match

- `/health` reports the complete candidate SHA and the footer shows its first
  12 characters.
- All 24 non-VSIX files in local `dist/` match their live responses byte for
  byte.
- The local and live VSIX ZIP containers differ only in package metadata from
  separate builds; all seven extracted files match exactly.
- Three fresh-connection live create/read/submit/reply/delete cycles pass
  against the candidate identity.

The live deployment therefore matches the candidate.

## Accessibility, privacy, headers, and performance

- Home, demo, join, new, pricing, team, privacy, terms, and the designed 404
  route were checked at 1440 px and 390 px. Each has `lang=en`, one `h1`, one
  `main`, complete image alternatives, and no horizontal overflow.
- Axe found zero serious or critical issues on all nine routes at both sizes.
- At 390 px, every visible target is at least 44 × 44 px. The desktop Demo
  target fails as documented above.
- At 390 px and 200% root text, all eight principal routes remain exactly 390
  px wide and preserve every header action.
- Keyboard traversal starts with the skip link and shows a 3 px blue focus
  outline. The checked focus targets are at least 44 px high.
- Reduced-motion media matches and collapses animations/transitions to 0.01
  ms.
- The complete live public/demo request log contained eight same-origin
  requests, no third-party resources, and no console or page errors.
- An untrusted origin receives no CORS allow-origin header; the production
  origin does.
- Responses include CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Hashed assets use `public, max-age=31536000, immutable`. Unknown routes
  return the designed page with HTTP 404. All real collected links returned
  200, except the expected Sociobot checkout 303 to hosted Dodo checkout.
- Initial JavaScript is 46.43 KB raw / 14.68 KB gzip; CSS is 30.28 KB raw /
  7.13 KB gzip; initially used fonts total 71.35 KB; the mobile hero AVIF is
  15.87 KB.
- Fresh mobile Lighthouse scored Performance 92, Accessibility 100, Best
  Practices 100, and SEO 100. FCP was 1.1 s, LCP 1.5 s, TBT 350 ms, CLS 0.006,
  and total transfer 109 KiB.
- The service-worker update check passed and the sample reloaded offline with
  the offline notice.

## Product and documentation checks

- `.factory/design.md` records the product-specific paper-cut direction,
  palette, self-hosted typography, spacing, interaction, motion, and original
  art provenance. The live product visibly follows it.
- Landing information order, exact `$39 once` price, route titles,
  descriptions, canonicals, social card, favicon, touch icon, `robots.txt`,
  `sitemap.xml`, privacy, terms, README, MIT license, demo notes, and copy audit
  are present.
- The 10-session success measure needs tutor field research and cannot be
  established by this technical verification. It is not asserted as a public
  claim.

## Evidence

Evidence is in `.factory/verification-artifacts-12/`, including:

- `first-read-desktop.png`
- `demo-mobile.png`
- `keyboard-focus-mobile.png`
- `tutor-consent-indicator.png`
- `accessibility-privacy.json`
- `api-boundaries.json`
- `rate-limit.json` and `billing-rate-limit.json`
- `dist-coherence.json`
- `lighthouse.json` and `lighthouse-summary.json`
- `verify.json`
- `all-claims-final.log`

## Final acceptance

**FAIL — candidate `a75b9132713d8d179cb8cfee92067ff226704ad6` is not accepted.**
