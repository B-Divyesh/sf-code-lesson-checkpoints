# Verification handoff — FAIL

**Work order:** `code-lesson-checkpoints-verify-8`

**Candidate:** `bb09ce478e089a81e4836cdab24758514d5fb7c2`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Full report:** `.factory/verification-8.md`

## Result

**FAIL. Do not release.** The candidate source and image pass locally, but the candidate is not serving publicly and the deployed storage/topology contract is unsafe.

## Blocking evidence

- Public `/health` returns old build `6d49b4a6a9e0158369d007cededde4e6cc6ce44e`.
- The allowed `sf-code-lesson-checkpoints` app still has an environment variable named `DATABASE_URL`; its value was not read.
- Healthy revision `0000020` runs three replicas without `/data` mounted.
- Candidate revision `0000021` has one `/data`-mounted replica but is unhealthy and restart-looping. Its logs show SQLite `database is locked` during WAL setup.
- Live `npm run test:e2e` fails after lesson creation because the learner view cannot load the runnable checkpoint.
- Fresh-connection coherence against the old served build returned 21 successful reads and 9 server errors out of 30.
- Public roster/history/permanent-delete claims are not fully represented in `.factory/claims.json`.

## What passed

- All six exact claim tests pass against the exact-SHA local release binary.
- `npm test`, `npm run check`, `npm run lint`, exact production web and release builds, local browser/PWA tests, extension packaging, load smoke, and four-cycle local coherence pass.
- Candidate source and image contain no prohibited resource name, `DATABASE_URL`, PostgreSQL URL/driver, or `libpq`. The image is non-root and embeds the full candidate SHA.
- Exact candidate HTML/JS/CSS match the registry image; manifest digest is `sha256:0b6007a13d059742b4d25596e206327189357fb6bda09a4212c2d4f5716563d0`.
- An isolated UID 999 test created SQLite at `/data/checkpoints.db`, stopped/restarted the exact candidate binary, read the same lesson, and deleted it. Synthetic `/data` files were removed afterward.
- Live cold first-read, one-click demo, PWA offline reload, route semantics, keyboard focus, reduced motion, same-origin privacy log, security headers, and accessibility pass. Axe found no serious/critical issues.
- Lighthouse mobile: 100/100/100/100; LCP 1.455 s, CLS 0.0060, TBT 0 ms, 110,358 bytes.
- Product API throttles return `429` plus `Retry-After: 1`; Sociobot license verification showed a 30-request burst and `Retry-After: 4`.

## Next action

Remove the stale connection setting, resolve the SQLite mount lock, and make the candidate the only healthy serving replica with `/data` mounted. Then rerun the full candidate identity, four-cycle coherence, revision-restart persistence, live E2E, and claims-coverage checks. Do not use or inspect any other service or shared data resource.
