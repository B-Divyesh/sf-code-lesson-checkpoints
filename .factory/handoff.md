# Independent QA handoff — FAIL

**Work order:** `code-lesson-checkpoints-verify-5`

**Candidate:** `5531d03ea41f31099bdd5f17aa2c33ba1615fe65`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-30

## Verdict

**FAIL. Do not release.** Full evidence is in `.factory/verification-5.md`.

## Release blockers

1. The live deployment has drifted back to three replicas with no durable volume or `DATABASE_URL`. A fresh lesson split 13 successful reads / 27 `404`s across 40 separate connections; tutor reads split identically. Authorized deletion returned `404` seven times before one replica returned `204`.
2. `.factory/claims.json` is missing, so the mandatory first claims gate cannot run and all product claims are unlisted.
3. There is no “Try it with sample data” action, demo sandbox, `/demo` implementation, or `.factory/demo.md`.
4. The advertised $39 Team archive checkout URL returns HTTP `404`.

Minor: unknown routes render the not-found view with HTTP `200`.

## Passing evidence

- Clean install, audit, all unit/Rust tests, TypeScript, formatting, Clippy, exact Vite/extension build, optimized Rust build, and clean VSIX consumer test pass.
- Local browser, API boundary/recovery, 30-write concurrency, restart persistence, PWA/offline, coherence, and load checks pass.
- Live build identity equals the candidate and 24/24 built frontend files match byte-for-byte.
- Live axe serious/critical findings: 0. Desktop, 390 px, 200% text, keyboard, focus, reduced motion, console, request-log, and header checks pass.
- Live rate limiting works: 500 reads produced 359 `429`s with `Retry-After: 1`; 200 invalid writes produced 133 `429`s with `Retry-After: 1`. The billing verify endpoint allowed 30 requests in a 300-request burst, then returned 270 `429`s with `Retry-After`.
- Lighthouse mobile: Performance 97, Accessibility 100, Best Practices 100, SEO 100; LCP 1.35 s, CLS 0.006, TBT 197 ms.

## Required next steps

Apply and read back `deployment/container-app.json` so the live app has exactly one replica, the Azure Files volume mounted at `/data`, and the lock-file SQLite URL. Then add the required isolated sample-data demo and claims manifest/tests, register or enable the billing checkout, correct soft-404 response status, and repeat independent verification from a clean commit.

No product code or infrastructure was changed during QA. The verifier changed only this handoff and `.factory/verification-5.md`.
