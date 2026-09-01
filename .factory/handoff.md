# Polish handoff — PASS

**Work order:** `code-lesson-checkpoints-polish-1`

**Live URL:** <https://code-lesson-checkpoints.sociobot.in>

**Demo URL:** <https://code-lesson-checkpoints.sociobot.in/?demo=1>

## What changed

- Closed all 44 findings from `.factory/review-1.md`; no earlier review or polish report existed.
- Replaced the undefined paid history promise with the implemented local tutor-link archive.
- Added a versioned, visitor-downloadable VSIX and install links on the landing and learner pages.
- Added direct `?demo=1` entry, complete demo content checks, reset deletion, and real-data isolation checks.
- Added History API navigation, back/forward heading focus, a route announcement, route metadata, and a plain 404.
- Rewrote the landing page, README, pricing, terms, footer, and lesson labels in plain words.
- Fixed the lesson heading outline and identified the external source link.
- Bound cached license verdicts to their exact token and tested return, restore, cache, and revocation paths.
- Expanded `.factory/claims.json` from 8 to 12 independently runnable claims.
- Preserved the paper-cut workbench identity, responsive layout, local fonts, and original artwork.

The finding-by-finding map is in [`.factory/polish-1.md`](polish-1.md).

## Verification evidence

A clean clone of `bb27ed6f8d3562620850421814b3cdd7c1761397` was installed and tested from scratch.

- `npm ci`: 0 vulnerabilities.
- `npm test`: 12 Vitest tests and 13 Rust tests passed.
- `npm run lint`: TypeScript, rustfmt, and Clippy passed.
- `BUILD_SHA=<sha> npm run build`: passed; `dist/` produced.
- `BUILD_SHA=<sha> cargo build --release`: passed.
- Every command in `.factory/claims.json` ran separately: 12 of 12 passed.
- `npm run test:e2e`: mobile/desktop flow, keyboard, focus, 404, metadata, privacy, console, and axe passed.
- `npm run test:pwa`: service-worker update and isolated offline demo reload passed.
- `npm run test:load`: 200 health requests at 839 requests/second.
- `npm run test:package`: VSIX structure, entry point, license, and syntax passed.
- Local Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.7 s; CLS 0.006; 113 KiB transfer.
- Live Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.4 s; CLS 0.006; 108 KiB transfer.

Evidence files:

- `.factory/evidence/polish-1/home-mobile.png`
- `.factory/evidence/polish-1/home-desktop.png`
- `.factory/evidence/polish-1/demo-mobile.png`
- `.factory/evidence/polish-1/lighthouse-local.json`
- `.factory/evidence/polish-1/lighthouse-live.json`
- `.factory/evidence/polish-1/live/verify.json`
- `.factory/evidence/polish-1/live/screenshot-desktop.png`
- `.factory/evidence/polish-1/live/screenshot-mobile.png`

## Live release verification

The release script builds an immutable image, applies the configured single-app contract, and checks restart persistence.
It uses only `sf-code-lesson-checkpoints` and its product-owned `/data` mount.

The live checks cover:

- `/health` reports the deployed 40-character build SHA and `database: "sqlite"`.
- Four fresh-connection create/read/submit/reply/delete cycles pass after a revision restart.
- All 12 claim commands pass independently against the live URL.
- The cold browser suite passes mobile and desktop routes, route focus, heading order, 404, axe, privacy, and console checks.
- `/opt/fleet/lib/verify-url.sh` reports HTTPS 200, the expected title, `lang="en"`, one h1, one main, alt text, and no console errors.
- The versioned VSIX downloads from `/downloads/code-lesson-checkpoints-0.1.0.vsix`.

## Run and verify

```bash
npm ci
npm test
npm run lint
npm run build
BUILD_SHA=$(git rev-parse HEAD) cargo build --release
PORT=8080 ./target/release/code-lesson-checkpoints
BASE_URL=http://127.0.0.1:8080 npm run test:claims
BASE_URL=http://127.0.0.1:8080 npm run test:e2e
BASE_URL=http://127.0.0.1:8080 npm run test:pwa
BASE_URL=http://127.0.0.1:8080 npm run test:load
npm run test:package
```

## Known gaps and next steps

None for this work order. Publishing the VSIX to the Visual Studio Marketplace remains optional because the live product ships the installable package directly.
