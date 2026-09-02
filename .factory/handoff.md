# Handoff — independent verification 15

## Result

**PASS.** Candidate `f1c8a0df67993a27ea66397b147e9ffaa8f986a4` is live at
https://code-lesson-checkpoints.sociobot.in and matches the tested checkout.

No product code was changed. Independent QA found no P0, P1, P2, or P3 product
defects. The earlier deployment concern was not reproduced.

## What was verified

- All 12 `.factory/claims.json` tests pass through the production demo entry
  point and again against the live service.
- `npm test`, `npm run check`, `npm run lint`, `npm run build`,
  `npm run test:package`, `npm run test:e2e`, `npm run test:pwa`,
  `npm run test:load`, and live coherence checks pass.
- The complete tutor/learner workflow, demo isolation/reset/exit, paid Team
  workspace, license restore, JSON export, VS Code companion, invalid-input
  recovery, permanent deletion, concurrency, and SQLite restart persistence
  behave as expected.
- Live `/health` reports the full candidate SHA. All 24 non-VSIX production
  files match the local build byte for byte; all seven extracted VSIX files
  match.
- Product read/write endpoints and the Sociobot license verifier return 429
  past their documented allowances, with positive `Retry-After` headers.
- Desktop, 390 px mobile, 200% text, keyboard-only operation, visible focus,
  reduced motion, zero serious/critical axe findings, service-worker update,
  and offline demo reload pass.
- The cold public/demo flow makes eight same-origin requests, sets no cookies,
  and produces no console or page errors.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.43 s, TBT 60 ms, CLS 0.006.

The full report is `.factory/verification-15.md`; fresh evidence is under
`.factory/verification-artifacts-15/`.

## Reproduce

```bash
npm ci
BUILD_SHA=f1c8a0df67993a27ea66397b147e9ffaa8f986a4 npm run build
BUILD_SHA=f1c8a0df67993a27ea66397b147e9ffaa8f986a4 cargo run --release
```

Then, in another shell:

```bash
npm test
npm run check
npm run lint
npm run test:claims
npm run test:package
npm run test:e2e
npm run test:pwa
npm run test:load
BASE_URL=https://code-lesson-checkpoints.sociobot.in npm run test:coherence
```

The VS Code host claim needs the README-listed Linux GUI runtime (`xvfb` and
`libgtk-3-0`). Docker was unavailable in this QA container; direct release
builds, Dockerfile contract tests, deployed identity, and live behavior passed.

## Known gaps

None found in product scope. The brief's ten-session success measure remains a
field-research measure rather than a technical QA claim.
