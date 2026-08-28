# Independent QA handoff — FAIL

**Candidate:** `470d834e381a1c24f8e2849ccbd534c9abb01a68`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-28

**Work order:** `code-lesson-checkpoints-verify-3`

The release is **FAIL**. Full evidence is in [`.factory/verification-3.md`](verification-3.md).

## Release blocker

The live control plane has not applied the candidate's SQLite deployment contract. Azure reports image `:470d834e381a`, one active revision with **3 replicas**, `maxReplicas: 3`, `volumes: null`, and only a `PORT=8080` environment override. The checked-in contract requires one replica, an Azure Files mount at `/data`, and the lock-file SQLite URL.

A fresh lesson reproduced the resulting partition:

- separate-process learner reads: **19 × 200 / 41 × 404**
- separate-process authenticated tutor reads: **21 × 200 / 39 × 404**
- authorized cleanup: **2 × 404** before **1 × 204** reached the owner
- all 30 post-delete reads: `404`

A browser independently reproduced `POST 201` followed by an immediate authenticated `GET 404`. Tutors and learners therefore cannot rely on create/read/share/reply/delete, and deletion is not a dependable FERPA/GDPR boundary.

Apply and verify `deployment/container-app.json`, then rerun fresh-process create/read/submit/reply/delete plus a revision-replacement persistence canary. The checked-in coherence script passed once but did not exercise replica distribution reliably.

## Additional defect

**P2 — valid returned license requires manual reload.** `/pricing?license=...` stored and stripped the token, performed one successful Sociobot verification, and cached the verdict, but the first render still showed **Buy Team archive**. Only reload showed **Open Team archive**. Rerender immediately after a valid verdict.

## Passing evidence

- Clean detached checkout at the exact candidate; GitHub `main` also resolved to it.
- `npm ci`, production audit (0 vulnerabilities), 7 Vitest tests, 5 Rust tests, TypeScript checks, rustfmt, warning-denied Clippy, exact Vite/extension production build, and optimized Rust build passed.
- Release binary started with only `PORT`; normal, maximum, malformed/oversized, auth, consent, redaction/capping, retry, reply, deletion, restart, concurrency, and rate-limit checks passed locally.
- Local browser, PWA, fresh-connection lifecycle, and 604 req/s load checks passed.
- VSIX packaged at 6,456 bytes and passed clean unpack/integrity/syntax/entry checks. No VS Code desktop host or container engine was available.
- Live `/health` returned the exact full SHA, candidate image tag is live, and all 22 built frontend files matched byte-for-byte.
- URL verifier passed with zero console/page errors. Twelve public-route axe scans across 390 px and desktop found 0 serious/critical issues. Keyboard dialog flow, visible 3 px focus, 44 px mobile targets, 200% text, reduced motion, and no-overflow checks passed.
- Public browsing remained same-origin with no analytics/trackers/CDN fonts. Consent, dual redaction, 8,019-character capped evidence, CORS allowlist, CSP, `nosniff`, referrer policy, no cookies, immutable hashed-asset caching, and Brotli passed.
- PWA update/offline reload passed. Live load was 106 req/s.
- Budgets passed: JS 37,187 B raw, CSS 27,336 B raw, initial fonts 71,358 B, mobile hero 16,111 B, and 109,011 B initial resource transfer.
- Lighthouse mobile: **100 performance / 100 accessibility / 100 best practices / 100 SEO**; LCP 1.5 s, CLS 0.006, TBT 0 ms.

## Cleanup and scope

All identifiable synthetic live records were deleted by retrying across fresh connections until their owning replica returned `204`. One early browser record titled `Focused delete navigation QA` may remain because its ID/token were not emitted before timeout; it contains no real learner data and its finally-block attempted deletion.

No product code or infrastructure was changed. This handoff and `.factory/verification-3.md` are the only repository changes.
