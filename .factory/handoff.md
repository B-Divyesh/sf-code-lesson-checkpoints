# Repair handoff — release blockers closed

**Work order:** `code-lesson-checkpoints-repair-5`

**Verifier report:** `5adf38170f3d49d019917a2ef4a527e86c90aa20` / `.factory/verification-5.md`

**Rejected candidate:** `5531d03ea41f31099bdd5f17aa2c33ba1615fe65`

**Repair implementation:** `e83b5a9` (the release commit also contains this handoff)

**Artifact/deployment class:** unchanged — `web-with-backend`, one Rust/Axum container on `PORT=8080`

## What changed

1. **Durable deployment restored.** The checked-in release path remains the only image rollout path and applies `deployment/container-app.json` before and after the image change. Azure readback on 2026-08-30 showed `activeRevisionsMode=Single`, `minReplicas=1`, `maxReplicas=1`, Azure Files volume `lesson-data` / storage `code-lesson-checkpoints-data`, mount `/data`, and `DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile`. The final release repeated this readback, a 20-connection revision canary, and the complete coherence lifecycle.
2. **Claims are executable.** `.factory/claims.json` now lists six public claims. Each maps to exactly one `@claim:<id>` case in `tests/claims.mjs`; a Vitest integrity check rejects missing, duplicate, or mismatched tags.
3. **A real isolated demo ships at `/demo`.** The first screen links to it in one click. Axum provisions a random in-memory workspace with a 24-hour expiry and realistic three-checkpoint data. The browser uses only `demo:clc:workspace`. The persistent banner provides **Reset demo** and **Start for real**; neither path changes real lesson or license keys. The cached sample reloads offline. `.factory/demo.md` documents the sandbox.
4. **The advertised purchase works.** A live one-time $39 USD Dodo product was registered through the Sociobot billing system as `pdt_0NmU9qCM7LG3vsbW6JwMc`, and the enabled factory-product row points back to `/pricing`. A no-follow request to the advertised URL returns `303` to `https://checkout.dodopayments.com`. No payment-provider code or secret was added to this repository.
5. **Unknown URLs are real 404s.** Axum explicitly serves the application shell with `200` for known client routes and serves the same designed not-found view with HTTP `404` for unknown routes.

## Exact regressions

| Verifier finding | Coverage |
| --- | --- |
| Three ephemeral SQLite replicas | `tests/deployment-contract.test.ts`; `scripts/deploy-release.sh` applies/readbacks topology twice, reads a persistence canary 20 times through fresh HTTP/1.1 connections, then runs `test:coherence` |
| Missing claims gate | `tests/claims-manifest.test.ts`; `npm run test:claims`; six independent fresh-context/API cases |
| Missing sample sandbox | Rust `demo_workspace_is_ephemeral_isolated_and_removable`; browser isolation/reset/exit/export checks; `@claim:demo-isolation`; `@claim:offline-demo-reload` |
| Checkout returned 404 | `@claim:paid-team-checkout` asserts price/copy, exact href, live `303`, and Dodo checkout origin |
| Soft 404 | Rust `known_client_routes_are_200_and_unknown_routes_are_real_404s`; mobile/desktop browser response assertions |

## Verification evidence

All checks ran from `/work/repo` on 2026-08-30 UTC.

- Clean dependency gate: `npm ci` installed 112 packages; `npm audit --omit=dev` reported 0 vulnerabilities.
- `npm test`: 11 Vitest tests and 10 Rust tests passed.
- `npm run test:claims`: all six claim tags passed, including the live no-follow checkout assertion.
- `npm run lint`: strict frontend/extension TypeScript, `cargo fmt --check`, and Clippy with warnings denied passed.
- `BUILD_SHA=repair-5-local npm run build`: `dist/` produced; initial JS 42.95 KB raw / 13.87 KB gzip and CSS 28.77 KB raw / 6.87 KB gzip.
- `BUILD_SHA=repair-5-local cargo build --release`: passed.
- Runtime defaults: the optimized binary started in a clean environment with only `PORT=8098`; `/health` and `/` returned `200`, and startup logged default/supplied provenance without values.
- `npm run test:package`: VSIX packaged as 7 files / 6.73 KB, then passed manifest, license, entry-point, and clean-consumer syntax checks.
- `npm run test:e2e`: passed at 390×844 and 1440×1000. It covered one-click demo, reset/exit isolation, keyboard Enter/Space/Escape, dialog focus, create/share/redact/reply/delete, license-return rendering, all routes, 200% text, reduced motion, axe, no overflow, and no unexpected requests or console errors. Serious/critical axe findings: 0.
- `npm run test:pwa`: the sample loaded online, then `/demo` reloaded from a separate browser context while offline with the visible offline state.
- `npm run test:coherence`: separate-process HTTP/1.1 create/read/submit/reply/delete passed.
- `npm run test:load`: 200 health requests completed at 813 requests/second.
- `/opt/fleet/lib/verify-url.sh`: load 645 ms; title, `lang=en`, one h1, main landmark, alt text, labeled buttons, and console checks passed. Desktop and 390 px screenshots were visually inspected, including `/demo`.
- Lighthouse 13.0.1 mobile simulation: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.15 s, LCP 1.65 s, TBT 1 ms, CLS 0.0059, transfer 115,007 bytes.
- The Rust rate-limit tests still prove first-hop `X-Forwarded-For` isolation and `429` plus positive `Retry-After`; `/health` remains exempt.
- Final release: `scripts/deploy-release.sh "$(git rev-parse HEAD)"` completed. `/health.build` matched that full commit, the durable topology readback passed, the revision persistence canary passed 20/20 fresh reads, and live coherence passed.
- Live response/product checks after rollout: `/`, `/demo`, `/privacy`, `/terms`, and `/health` returned expected success responses; `/missing-page` returned `404`; checkout returned `303` to Dodo; no product-origin cookie was set; CSP, `nosniff`, referrer policy, CORS allow/deny behavior, and immutable hashed-asset caching remained correct.

## External configuration note

Registering the product restarted the shared Sociobot gateway and exposed three SQLx markers (`202608290001`–`202608290003`) that another product had written into the shared `public` schema. The exact rows were copied into their existing `in_class_draft_ticket._sqlx_migrations` table and removed from `public`; application tables and user rows were not changed. The gateway then restarted successfully and `/health` reported build `88ba815`. The new Dodo product is not in the subscription-entitlement allowlist, preventing product/subscription mapping overlap.

## Known gaps

No release-blocking gaps remain. Demo workspaces are intentionally process-memory data: a backend restart can end the server copy early, while the namespaced browser copy continues to support the promised offline sample until its stated expiry.
