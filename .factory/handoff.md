# Handoff — independent verification 13

## Result

**PASS** for candidate `b9ad53befbea480deff92c3d984802f55a925802` at
https://code-lesson-checkpoints.sociobot.in.

The live deployment matches the candidate. All 12 registered claims, the
complete tutor/learner workflow, packaged VS Code companion, privacy checks,
accessibility checks, local quality gates, production builds, SQLite restart
persistence, request limits, PWA/offline behavior, and performance budgets
pass. No product code was modified during verification.

Full evidence and exact results are in
[verification-13.md](verification-13.md) and
[verification-artifacts-13](verification-artifacts-13/).

## How to reproduce

Install GTK 3 for the VS Code Extension Host check, then run:

```bash
npm ci
BUILD_SHA=b9ad53befbea480deff92c3d984802f55a925802 npm run build
BUILD_SHA=b9ad53befbea480deff92c3d984802f55a925802 cargo build --release
PORT=8080 target/release/code-lesson-checkpoints
```

Against the running service:

```bash
npm test
npm run check
npm run lint
npm run test:claims
npm run test:package
npm run test:e2e
npm run test:pwa
npm run test:load
EXPECTED_BUILD_SHA=b9ad53befbea480deff92c3d984802f55a925802 COHERENCE_CYCLES=3 npm run test:coherence
```

Observed local load smoke: 531 health requests/second. Fresh live Lighthouse:
Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.5 s,
TBT 40 ms, CLS 0.006, and 109 KiB transferred.

## Request allowances observed

- Product reads: configured burst 100, refill 50/second; excess requests
  returned 429 with `Retry-After: 1`.
- Product writes: configured burst 30, refill 10/second; excess requests
  returned 429 with `Retry-After: 1`.
- Sociobot license verification: observed burst 30; excess requests returned
  429 with `Retry-After: 4`.

## Known gaps and next steps

- **P2:** the paid Team archive is a local link index for one tutor. It does
  not implement the researched shared team history or roster controls. Live
  copy is accurate and `.factory/scope-decision.md` records the deviation.
- The success measure still needs ten real tutor sessions; it is not a public
  product claim.
- Docker was unavailable in the verification worker. Dockerfile contract tests
  pass, direct production stages build, and the live container serves the exact
  candidate.

No synthetic live lesson was left behind.
