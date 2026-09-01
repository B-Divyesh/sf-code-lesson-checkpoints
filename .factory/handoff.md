# Handoff — independent verification 11

## Result

**FAIL.** Candidate `df93fb175eb82350648b65c17c3ff873af01be6d` at
https://code-lesson-checkpoints.sociobot.in is not accepted.

The product’s core tutor/learner workflow, all 12 claim checks, local quality
gates, live candidate match, privacy checks, request allowances, offline demo,
and performance budgets pass. One P1 accessibility defect blocks release: at a
390 px viewport and 200% text size, every principal route becomes 442 px wide,
and the shared header’s “Plan a lesson” action is cut off by 52 px.

Exact evidence and the full test record are in
`.factory/verification-11.md`. The focused screenshot is
`.factory/verification-artifacts-11/live-home-mobile-200-percent.png`.

## Required correction

Make the mobile header reflow at 200% text size. The navigation may wrap or use
an accessible compact pattern, but all actions must remain fully visible and
operable without horizontal page scrolling. Confirm this on `/`, `/demo`,
`/join`, `/new`, `/pricing`, `/team`, `/privacy`, and `/terms` at 390 px.

## Verification summary

- `npm ci`: PASS, 425 packages and 0 reported vulnerabilities.
- `npm test`: PASS, 12 Vitest checks and 13 Rust tests.
- `npm run check`, `npm run lint`: PASS.
- Candidate-aware `npm run build` and `cargo build --release`: PASS.
- All 12 exact commands in `.factory/claims.json`: PASS.
- Packaged VSIX installation and live VS Code 1.98.2 behavior: PASS.
- Local and live browser, PWA, and two-cycle coherence checks: PASS.
- Optimized backend start with only `PORT`, restart persistence, and cleanup:
  PASS.
- Live boundary, invalid-input recovery, 20-create concurrency, and cleanup:
  PASS.
- Live API request limits: read checks returned 96 limited responses from 220;
  writes admitted 30 then limited 70 of 100; license verification admitted 30
  then limited 150 of 180. Every 429 included `Retry-After`.
- Candidate match: PASS; `/health` reports the full SHA, every normal `dist/`
  file matches live bytes, and all extracted VSIX files match.
- Axe: zero serious or critical findings on eight routes at desktop and 390 px.
- Normal mobile layout, 44 px targets, keyboard focus, reduced motion, and
  same-origin-only public/demo requests: PASS.
- 200% text size on 390 px: FAIL on eight routes.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.5 s, TBT 80 ms, CLS 0.007, transfer 109 KiB.

## How to run

```bash
npm ci
BUILD_SHA=df93fb175eb82350648b65c17c3ff873af01be6d npm run build
BUILD_SHA=df93fb175eb82350648b65c17c3ff873af01be6d cargo run
```

With the product running at `http://127.0.0.1:8080`:

```bash
npm test
npm run check
npm run lint
BUILD_SHA=df93fb175eb82350648b65c17c3ff873af01be6d cargo build --release
npm run test:claims
npm run test:package
npm run test:extension-host
BASE_URL=http://127.0.0.1:8080 npm run test:e2e
BASE_URL=http://127.0.0.1:8080 npm run test:pwa
BASE_URL=http://127.0.0.1:8080 EXPECTED_BUILD_SHA=df93fb175eb82350648b65c17c3ff873af01be6d COHERENCE_CYCLES=2 npm run test:coherence
BASE_URL=http://127.0.0.1:8080 npm run test:load
```

Linux extension-host verification needs Xvfb and GTK 3. Docker is unavailable
in this worker; Dockerfile contract tests passed and the live exact-candidate
image was checked through its health identity and served files.

No product code, deployment, infrastructure, data store, DNS, billing setting,
or secret was changed. All live QA records created by this verification were
deleted.
