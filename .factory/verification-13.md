# Independent product verification 13 — PASS

- **Candidate:** `b9ad53befbea480deff92c3d984802f55a925802`
- **Live URL:** https://code-lesson-checkpoints.sociobot.in
- **Work order:** `code-lesson-checkpoints-verify-13`
- **Verified:** 2026-09-02 UTC

## Verdict

**PASS.** The candidate is deployed and matches the live service. The complete
tutor/learner job works through the web app and packaged VS Code companion,
all 12 registered claims pass, and the prior release-blocking target-size and
tutor-consent defects are repaired.

No product code was modified. This report, the handoff update, and fresh
evidence under `.factory/verification-artifacts-13/` are the only intended
repository changes.

## Defects by severity

- **P0:** none.
- **P1:** none.
- **P2 — researched team controls remain out of scope:** the $39 Team archive
  searches private tutor links stored in one browser for one tutor. It does not
  provide shared team accounts, shared history, membership, or roster controls
  from the researched monetization direction. The limitation is stated
  accurately in the live copy, README, `.factory/scope-decision.md`, and
  handoff. It does not prevent the brief's smallest useful tutor/learner
  checkpoint workflow from working end to end.
- **P3:** none.

## Mandatory first gates

### Cold first read and one-click sample — PASS

The cold first screen answers all three required questions in plain words:

- What it does: **“See where the lesson got stuck.”**
- Who it serves: the next sentence names remote programming tutors and says
  learners run tutor-defined commands or tests locally.
- What to click first: **“Try it with sample data”** says it opens Sam's
  temporary three-checkpoint lesson.

The action is visible without scrolling at 1440 px and 390 px. One click opens
three ordered checkpoints with passed and blocked runs, redacted evidence, a
learner note, and a tutor reply. The persistent banner says **“Demo — sample
data, nothing is saved”** and exposes **Reset demo** and **Start for real**.

Evidence: `first-read-desktop.png`, `first-read-mobile.png`, and
`demo-desktop.png`.

### Claims gate — PASS

`.factory/claims.json` exists with 12 entries. After the documented clean
bootstrap (`npm ci`, production build, running backend demo entry point, and
the README-listed GTK runtime for VS Code), every exact listed command passed
separately. A final combined `npm run test:claims` against the candidate-aware
release build also passed all 12:

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

The VS Code claim downloaded/installed the built VSIX in VS Code 1.98.2,
invoked the companion command, confirmed before local execution, ran a real
fixture, checked the redacted preview, confirmed sharing, and asserted the
submitted payload. Landing, demo, pricing, legal, lesson, and README copy were
cross-checked with the manifest; no unlisted public product promise was found.

## Clean local verification

| Check | Result |
| --- | --- |
| Candidate and branch | PASS — `main` at exact candidate |
| `npm ci` | PASS — 425 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 12 Vitest checks and 13 Rust tests |
| `npm run check` | PASS |
| `npm run lint` | PASS — TypeScript, rustfmt, and Clippy with warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS — `dist/` and versioned VSIX produced |
| `BUILD_SHA=<candidate> cargo build --release` | PASS |
| every claims command, then `npm run test:claims` | PASS — 12/12 |
| `npm run test:package` | PASS — VSIX integrity, entry, license, consumer syntax |
| VS Code 1.98.2 Extension Host | PASS — installed package and complete run/share flow |
| `npm run test:e2e` | PASS locally and live |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:load` | PASS — 200 health requests at 531 requests/second |
| `npm run test:coherence` | PASS — three local and three live lifecycle cycles |

The optimized backend started under `env -i` with only a normal `PATH` and
`PORT`. It reported the compiled candidate identity and used the documented
working-directory SQLite fallback because `/data` was absent. Five independent
fresh-database cycles created a lesson, stopped the real process with SIGTERM,
started a replacement process, read the same lesson, and deleted it: 5/5
returned `201 → 200 → restart → 200 → 204`.

Docker is unavailable in this worker. The Dockerfile contract tests pass, the
frontend and release backend were built directly, and the deployed container
reports and serves the candidate.

## End-to-end behavior, boundaries, and recovery

Local and live browser runs confirmed the real job: a tutor creates ordered
commands or tests; a learner opens the code, reviews and shares a passed or
blocked run; secret-like output is redacted and capped; the tutor sees explicit
learner approval, identifies the first blocked checkpoint, replies to the exact
attempt, exports JSON, and permanently deletes the lesson.

Dialog focus, Escape/Enter/Space operation, route focus, browser back/forward,
invalid join-code recovery, demo reset/exit isolation, and offline messaging
all pass.

Independent live API checks confirmed:

- malformed JSON returns 400;
- blank or 101-character titles, zero or 13 checkpoints, invalid evidence
  status, missing consent, and a 1,001-character note return 400;
- a request over 64 KiB returns 413;
- missing tutor authorization returns 401 and a wrong token returns 403;
- the maximum valid 100-character title, 80-character learner name, 12
  checkpoints, 100-character checkpoint titles, 500-character commands, and
  300-character hints creates and reads successfully;
- decorated lowercase lesson codes normalize correctly;
- 20 simultaneous creates returned 20 unique lesson IDs and codes;
- all 21 boundary/concurrency fixtures were deleted with HTTP 204.

## Backend identity and request allowances

- Live `/health` returns build
  `b9ad53befbea480deff92c3d984802f55a925802`, `database: "sqlite"`, and
  `status: "ok"`.
- The configured general API allowance is a burst of 100 plus one token every
  20 ms. A 160-request live burst produced 116 route responses and 44 HTTP
  429 responses while tokens replenished.
- The configured write allowance is a burst of 30 plus one token every 100 ms.
  A 60-request live burst produced 30 validation responses and 30 HTTP 429s.
- Every product API 429 carried `Retry-After: 1` and
  `X-RateLimit-After: 1`; both read and write routes recovered after 1.1 s.
- The Sociobot license-verification endpoint admitted 30 checks and returned
  10 HTTP 429s in the same 40-request burst. Every 429 carried
  `Retry-After: 4` and `X-RateLimit-After: 4`.
- Health is intentionally exempt. The product has no sign-in requirement, so
  the Entra authority condition does not apply.

## Live deployment match

- `/health` reports the complete candidate SHA and the footer shows its first
  12 characters.
- All 24 local non-VSIX `dist/` files match the live responses byte for byte.
- The separately built VSIX containers have build-time ZIP metadata, but all
  seven extracted files match exactly.
- Three fresh-connection live create/read/submit/reply/delete cycles pass.

The live deployment therefore matches the candidate.

## Accessibility, privacy, headers, caching, and performance

- Home, demo, join, new, pricing, team, privacy, terms, and the designed 404
  were checked at 1440 px and 390 px. Each has `lang=en`, one `h1`, one `main`,
  complete image alternatives, and no horizontal overflow.
- Axe found zero serious or critical findings on all nine routes at both sizes.
- Every visible target is at least 44 × 44 px on mobile and desktop. The prior
  43 px Demo-link defect is repaired.
- Keyboard traversal begins with the 143 × 44 px skip link. Its visible focus
  treatment is a 3 px solid blue outline, and Enter moves focus to `main`.
- Route changes, dialog opening/closing, Enter, Space, Escape, browser history,
  and tutor/learner form controls are keyboard-operable.
- `prefers-reduced-motion: reduce` matches, makes scrolling `auto`, and reduces
  UI transitions to 0.00001 s.
- The complete cold public/demo request log contained eight same-origin
  requests, no third-party requests, and no console or page errors.
- Trusted-origin API requests receive CORS permission; an untrusted origin does
  not.
- Responses include CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`.
- Hashed assets use `public, max-age=31536000, immutable`. Unknown routes return
  the designed page with HTTP 404. Collected links return 200, except that
  designed 404 itself and the expected Sociobot checkout 303 to hosted Dodo.
- Initial JavaScript is 46,570 bytes raw / 14,622 bytes gzip; CSS is 30,538
  bytes raw / 7,189 bytes gzip; initially used fonts total 71,352 bytes; the
  mobile hero AVIF is 15,874 bytes.
- Fresh mobile Lighthouse scored Performance 100, Accessibility 100, Best
  Practices 100, and SEO 100. FCP was 1.1 s, LCP 1.5 s, TBT 40 ms, CLS 0.006,
  and total transfer 109 KiB.
- The service-worker update check passed and the sample reloaded offline with
  the explicit reconnect notice.
- The factory `verify-url.sh` passed with title, `lang=en`, one `h1`, `main`, no
  missing alt text, no unlabeled buttons, and no console errors.

## Product and documentation checks

`.factory/design.md` records a product-specific paper-cut direction, palette,
self-hosted type, spacing, interaction and motion policies, and original image
provenance. The deployed UI follows it. Route metadata, social image, favicon,
touch icon, `robots.txt`, `sitemap.xml`, privacy, terms, README, MIT license,
demo notes, claims registry, and copy audit are present.

The brief's ten-session success measure requires real tutor field research and
cannot be established by technical QA. It is not presented as a public claim.

## Evidence

Fresh evidence is under `.factory/verification-artifacts-13/`:

- `first-read-desktop.png` and `first-read-mobile.png`
- `demo-desktop.png`
- `keyboard-focus-mobile.png`
- `screenshot-desktop.png` and `screenshot-mobile.png`
- `verify.json` and `index.html`
- `lighthouse-live.json`
