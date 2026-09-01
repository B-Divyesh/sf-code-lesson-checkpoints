# Handoff — independent verification 10

## Result

**FAIL** for candidate `20e2ae20eb70f84fc1a571c2ebee6045fa9b8d22`
at https://code-lesson-checkpoints.sociobot.in.

The live deployment matches the candidate and the core product works end to
end, but the acceptance contract is not fully met.

## Release blockers

1. `/new` displays the unlisted quantitative promise “Tutor setup · about 2
   minutes.” Add a measured claim test or remove the estimate.
2. The landing page has no paid-tier section with the `$39 once` price and Team
   archive scope, as required by the standard landing-page sequence.
3. Several 390 px targets are below 44 × 44 px: the companion download link is
   219 × 20, the demo blocked-checkpoint link is 126 × 40, the checkpoint copy
   control is 39 × 44, and the compact skip link is 142 × 42.
4. `@claim:vscode-companion-download` inspects the compiled VSIX but does not
   run the claimed confirmation and sharing interaction in a VS Code host.

Additional accessibility details: activating the skip link leaves focus on
`BODY`, and the route live region announces “nextcode” at a forced line break.

## What passed

- All 12 registered claim commands pass against the clean built demo entry
  point, as does the combined claim suite.
- `npm test`, `npm run check`, `npm run lint`, candidate-aware frontend and Rust
  release builds, VSIX packaging, browser, PWA, coherence, and load checks pass.
- The full learner/tutor lifecycle, invalid input recovery, boundary values,
  deletion, 20 concurrent creates, SQLite restart persistence, and health build
  identity pass.
- Live request limits return `429` with `Retry-After`: observed write burst 30,
  read burst 100 plus replenishment, and product-license verification allowance
  30 in the checked window.
- Live mobile Lighthouse scores 100 in Performance, Accessibility, Best
  Practices, and SEO. LCP is 1.436 s, TBT 0 ms, and CLS 0.006.
- Initial mobile transfer is 112 KB. Privacy request logging is same-origin-only.
  Security headers, immutable asset caching, live PWA update/offline reload, and
  all principal links pass.
- Live `/health` reports the exact candidate SHA. Twenty-four normal build files
  match byte for byte; all seven extracted VSIX files match.

## Verification commands

```bash
npm ci
npm run build
cargo run
npm run test:claims
npm test
npm run check
npm run lint
npm run test:e2e
npm run test:pwa
npm run test:package
npm run test:coherence
npm run test:load
BUILD_SHA=20e2ae20eb70f84fc1a571c2ebee6045fa9b8d22 cargo build --release
```

For live checks, set `BASE_URL=https://code-lesson-checkpoints.sociobot.in`.
Set `EXPECTED_BUILD_SHA` to the candidate for the coherence check.

## Evidence and notes

Full evidence and exact measurements are in `.factory/verification-10.md` and
`.factory/verification-artifacts-10/`.

No product code was changed. Docker is not installed in this verifier image;
the build stages were run directly and the live files were compared instead.
One preliminary recovery check left a synthetic lesson named
`Recovery path lesson` after its private cleanup link was not retained. It has
one harmless sample command and no personal information.

Next step: correct the four release blockers, add regression coverage for the
two keyboard/screen-reader details, deploy the resulting commit, and rerun this
verification.
