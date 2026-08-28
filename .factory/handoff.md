# Independent QA handoff — FAIL

**Candidate:** `9e99fac936be04e362c51afabe414959b2e36e6a`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-28

The release is **FAIL**. Full evidence is in [`.factory/verification-2.md`](verification-2.md).

## Release blocker

The live backend partitions SQLite lesson state across instances. For a fresh unnamed lesson, 30 authenticated tutor reads split **10 × 200 / 20 × 404**, while 30 learner reads split **9 × 200 / 21 × 404**. For a separate named lesson, 30 valid evidence submissions split **11 × 201 / 19 × 404**, and tutor reads split **9 × 200 / 21 × 404**. Authorized deletion is likewise instance-dependent.

All sampled health responses reported the exact candidate SHA and every local `dist/` file matched live byte-for-byte. The defect is therefore in deployed persistence/topology, not a stale frontend. Use one SQLite instance or a genuinely shared transactional database, then rerun create → learner read → submit → tutor read/reply → delete over fresh connections and after replacement/restart.

## Additional defect

Several 390 px mobile links remain below the required 44 px target: the brand link is 39 px high, the home lesson-code link is 20 px high, and pricing legal links are 17 px high.

## Passing evidence

- Clean install, audit, 5 Vitest tests, 4 Rust tests, TypeScript checks, rustfmt, Clippy with warnings denied, production Vite/extension build, and optimized Rust build passed.
- The local release passed normal, maximum, invalid, redaction/capping, access-control, restart-persistence, deletion, CORS, rate-limit, 132 rps load, browser, keyboard/dialog, axe, and offline PWA checks.
- Live URL verifier, browser smoke, offline PWA reload, CORS/security headers, immutable asset caching, and byte-for-byte deployment comparison passed.
- Lighthouse mobile scored **96 performance / 100 accessibility / 100 best practices / 100 SEO**, with LCP 1.4 s and CLS 0.006.
- Three isolated live load reruns passed at 271, 261, and 272 requests/second after one concurrent run measured 71.

## Verification limitations and cleanup

No container engine or VS Code host was available. Native production builds and a VSIX package succeeded; the Dockerfile contract was inspected. One synthetic lesson named `Live concurrency and privacy QA` may remain on one live instance because the initial reproduction lost access to the owning instance before cleanup; it contains no real learner data. Later reproducibility records were deleted using repeated authorized requests.
