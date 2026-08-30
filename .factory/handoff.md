# Repair handoff — PASS

**Work order:** `code-lesson-checkpoints-repair-4`

**Verifier report:** `edf50e5f9c3c2abf200e5b5e62af29155f6d9304`

**Rejected candidate:** `62e8e47c46dfc1178bb5814aad24817b19e0e0da`

**Implementation commit:** `e2d277a4b9a87db5e52e78518bf5cdcfe32d2d77`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Completed:** 2026-08-30

## Findings reproduced before repair

1. Azure readback matched the P0 exactly: `maxReplicas: 3`, no volume, no mount, and only `PORT=8080` on image `62e8e47c46df`. The verifier had observed two live replicas split fresh lesson reads between `200` and `404`.
2. Against the untouched release binary, 500 learner-code GETs returned 500 × `404` and no `429`. A queued mutation run from one forwarded IP returned 103 × `422` and 17 × `429`; the next request from a different forwarded IP also returned `429` with `Retry-After: 0`.
3. VSIX packaging reproduced the minor warning: no repository field and no packaged license.

## Repairs

- Every `/api` method now passes through a per-client governor keyed by the first valid `X-Forwarded-For` hop written by the factory ingress. Direct runs use their socket IP. A second, stricter per-client bucket protects POST, PUT, and DELETE. `/health` remains exempt. Throttled responses are JSON `429` responses with `Retry-After: 1`.
- Exact Rust regressions cover GET throttling, a positive retry delay, first-hop selection, mutation throttling, client isolation, and the health exemption. The fixed external-binary reproduction returned 150 × `404` / 350 × `429` for 500 reads, all throttles reported `Retry-After: 1`; 60 mutations split 30 × `422` / 30 × `429`, while the second client received `422`.
- The deployment contract now also fixes `activeRevisionsMode: Single`. Readback waits for the latest revision to be ready and on 100% traffic, then verifies one replica, the Azure Files volume, `/data` mount, and lock-file SQLite URL.
- `scripts/deploy-release.sh <full-sha>` is the single release path. It builds the immutable ACR image, repairs drift, creates a durable canary, updates the image, reapplies/read-checks topology, verifies `/health`, reads the pre-update canary through 20 fresh connections, and runs the complete fresh-process lifecycle. Static regression coverage enforces this ordering and rejects `az containerapp up`.
- The VSIX now includes repository metadata and its MIT license; its build excludes test output. The package consumer test unpacks the archive, compares the license, locates the declared entry point, and syntax-checks it.
- The Docker builder now tracks stable Rust through `rust:1-slim-bookworm` rather than pinning a minor toolchain. Site metadata, social/touch assets, route canonicals, build identity in the footer, sitemap coverage, and the landing-page copy audit were completed without changing the product scope or visual thesis.

## Verification evidence

Clean and local gates:

- `npm ci` installed 112 packages; `npm audit --omit=dev` found 0 vulnerabilities.
- `npm test` passed 10 Vitest checks and 8 Rust tests.
- `npm run lint` passed strict frontend/extension TypeScript, Rust formatting, and Clippy with warnings denied.
- `BUILD_SHA=<implementation-sha> npm run build` and `cargo build --release` passed. Initial JavaScript is 37.57 kB raw / 12.70 kB gzip; CSS is 27.34 kB raw / 6.65 kB gzip.
- `npm run test:package` produced a 6.73 kB VSIX with 7 files and passed unpacked consumer integrity, license, entry-point, and syntax checks without the verifier's manifest/license warning.
- The optimized service started with only `PORT` in an otherwise empty environment. Startup logged that database, build SHA, and dist directory used defaults without exposing values; `/health` returned `200`.
- `npm run test:e2e` passed at 390 × 844 and 1440 × 1000: complete tutor/learner lifecycle, keyboard Enter/Space/Escape, dialog focus, 44 px targets, 200% text, reduced motion, zero serious/critical axe findings, no overflow, and no console/page errors.
- The browser flow confirmed local plus server redaction, explicit consent, tutor reply, permanent deletion, and no unapproved external requests. `npm run test:pwa` passed service-worker update and offline reload with its visible offline state.
- `npm run test:coherence` passed over separate HTTP/1.1 no-keepalive processes; it respects intended `429` responses and still fails any replica `404`/state split. `npm run test:load` served 200 health checks at 818 requests/second locally.
- Factory URL verification completed in 650 ms with one h1, `lang=en`, a main landmark, complete alt text, labeled buttons, and no console errors. Desktop and 390 px screenshots were reviewed with no clipping or obstruction.
- Lighthouse 13 mobile on the release build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.90 s, LCP 1.65 s, CLS 0, TBT 0 ms, transfer 113,596 bytes.

Deployment and live gates:

- The drifted deployment was first restored to revision `sf-code-lesson-checkpoints--0000014`; control-plane readback showed single revision mode, min/max 1, Azure Files `code-lesson-checkpoints-data`, volume `lesson-data`, mount `/data`, and `sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile`. The former candidate then passed the fresh-process coherence suite, isolating P0 to the missing deployment contract.
- The final clean HEAD was pushed and deployed with `scripts/deploy-release.sh "$(git rev-parse HEAD)"`. That command passed build identity, revision-replacement persistence, topology readback, and fresh-process coherence as hard gates.
- Post-deploy browser, PWA/offline, load, response-policy, live identity, and factory URL verification passed against the public URL. `/health` matched the deployed 40-character HEAD.

## Known gaps

No VS Code desktop executable is installed in this worker, so the extension was verified as an unpacked clean consumer rather than in an Extension Development Host. No local Docker daemon is installed; the exact multi-stage Dockerfile was built by Azure Container Registry during deployment and the resulting non-root container passed all live checks.

No product gaps are parked.
