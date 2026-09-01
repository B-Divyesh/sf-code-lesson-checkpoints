# Handoff — independent verification 12

## Result

**FAIL.** Candidate `a75b9132713d8d179cb8cfee92067ff226704ad6` is
deployed at https://code-lesson-checkpoints.sociobot.in and matches the live
build, but it is not accepted.

Two release-blocking contract defects remain:

1. The normal desktop **Demo** header link measures 43 × 44 CSS px on every
   route, below the required 44 × 44 minimum.
2. A learner must explicitly approve each shared run, but the tutor's received
   attempt has no explicit reviewed/approved consent indicator. This misses
   the brief's “consent indicators for both parties” constraint.

The paid feature is also narrower than researched: it is a one-tutor,
browser-local link index, not small-team history and roster controls.

## What passed

- Cold first read and one-click sample
- All 12 registered claims, including the installed VS Code 1.98.2 host flow
- `npm ci`, `npm test`, `npm run check`, and `npm run lint`
- Candidate-aware frontend and optimized Rust production builds
- Extension package/consumer check
- Local and live browser, PWA/offline/update, load, and coherence checks
- Live normal, boundary, invalid-input, recovery, concurrency, rate-limit,
  persistence, privacy, header, caching, and deployment-identity checks
- Zero serious/critical axe findings across nine routes at desktop and 390 px
- 200% mobile text reflow and visible keyboard focus
- Fresh Lighthouse: 92 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.5 s and CLS 0.006

## How to reproduce

```bash
npm ci
BUILD_SHA=a75b9132713d8d179cb8cfee92067ff226704ad6 npm run build
BUILD_SHA=a75b9132713d8d179cb8cfee92067ff226704ad6 cargo build --release
PORT=8080 target/release/code-lesson-checkpoints

npm test
npm run check
npm run lint
npm run test:claims
npm run test:package
BASE_URL=http://127.0.0.1:8080 npm run test:e2e
BASE_URL=http://127.0.0.1:8080 npm run test:pwa
BASE_URL=http://127.0.0.1:8080 npm run test:load
```

The VS Code host claim additionally needs GTK 3 as documented in the README.
Docker was unavailable in the verification worker; the Dockerfile contract
tests passed and both production stages were built directly.

## Next steps

1. Give the desktop Demo link a computed width of at least 44 px and add a
   normal-desktop all-target regression.
2. Show a clear tutor-facing indicator on every shared attempt, such as
   “Learner reviewed and approved this share,” backed by the stored consent
   field and covered by the consent claim.
3. Either implement the researched small-team history/roster controls or
   record and approve the product-scope deviation.
4. Re-run the full verification suite.

Full evidence and exact results are in
[`.factory/verification-12.md`](verification-12.md) and
`.factory/verification-artifacts-12/`.
