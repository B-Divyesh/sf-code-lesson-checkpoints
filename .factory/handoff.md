# Verification handoff — PASS

**Work order:** `code-lesson-checkpoints-verify-9`
**Candidate:** `d101dafe759a13c787acbbaa113dbd827f4ee491`
**URL:** https://code-lesson-checkpoints.sociobot.in
**Verified:** 2026-08-30 UTC

## Result

**PASS.** Fresh independent evidence confirms that the live service is the
candidate and completes the remote tutor/learner checkpoint workflow. All
eight claims, local quality gates, exact production builds, VSIX packaging,
local/live browser flows, offline reload, privacy, accessibility, SQLite
persistence, concurrency, rate limiting, and four-cycle local/live coherence
checks passed. No P0, P1, or P2 defect remains.

The complete evidence and command results are in
`.factory/verification-9.md`. Screenshots and the Lighthouse JSON report are
under `.factory/verification-artifacts-9/`.

## Key verification evidence

- Cold first read answers what the product does, who it serves, and what to
  click. **Try it with sample data** is visible on desktop and 390 px mobile.
- The one-click demo opens realistic populated data with the persistent sample
  banner, Reset demo, and Start for real.
- `npm test`: 12 Vitest assertions and 13 Rust tests passed.
- `npm run check`, `npm run lint`, `BUILD_SHA=<candidate> npm run build`, and
  `BUILD_SHA=<candidate> cargo build --release` passed.
- All eight exact claim commands passed individually; the combined release
  run passed as well.
- `npm run test:e2e` and `npm run test:pwa` passed locally and live.
- `npm run test:package` produced and inspected the VSIX successfully.
- Four fresh-connection lifecycle cycles passed locally and live.
- Live `/health` reports the full candidate SHA and SQLite.
- All 24 live `dist/` files match the candidate-aware local build byte for
  byte.
- Live API burst: 117 normal responses and 103 throttles from 220 simultaneous
  requests in 725 ms. Every 429 included `Retry-After: 1`.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.455 s, CLS 0.006, TBT 0 ms.
- Initial transfer is about 110 kB; hashed assets have one-year immutable
  caching.
- Public/demo requests are same-origin only. Secure response headers, CORS
  rejection for an untrusted Origin, reduced motion, visible keyboard focus,
  200% text, 390 px layout, and zero serious/critical axe findings passed.

## Run the main checks

```bash
npm ci
BUILD_SHA=d101dafe759a13c787acbbaa113dbd827f4ee491 npm run build
BUILD_SHA=d101dafe759a13c787acbbaa113dbd827f4ee491 cargo build --release
PORT=8080 target/release/code-lesson-checkpoints

# In another shell:
npm test
npm run check
npm run lint
npm run test:claims
npm run test:e2e
npm run test:pwa
npm run test:load
npm run test:package
COHERENCE_CYCLES=4 npm run test:coherence
BASE_URL=https://code-lesson-checkpoints.sociobot.in \
EXPECTED_BUILD_SHA=d101dafe759a13c787acbbaa113dbd827f4ee491 \
COHERENCE_CYCLES=4 npm run test:coherence
```

## Known gaps and next steps

The verifier container had no Docker executable, so the redundant local
`docker build` command could not run. This is not a product defect: both build
stages passed directly, the optimized server passed, live identity is exact,
and all 24 deployed static files matched the production build. No product work
is required before release.
