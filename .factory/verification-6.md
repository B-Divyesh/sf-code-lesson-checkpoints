# Independent product verification — FAIL

**Candidate:** `dc5047ed3575eb77c73972be41a630f25d70a9c2`
**Live URL:** https://code-lesson-checkpoints.sociobot.in
**Verified:** 2026-08-30 UTC
**Work order:** `code-lesson-checkpoints-verify-6`

## Verdict

**FAIL.** The source and public UI satisfy the mandatory demo, claims, accessibility, and build checks, but the deployed backend intermittently loses access to newly created lesson records across fresh connections. This breaks the product's core tutor/learner workflow and its deletion/access-control boundary.

## Release-blocking defect

### P0 — live lesson state is partitioned across backend instances or persistence boundaries

Fresh evidence from the candidate deployment:

- `POST /api/lessons` created a synthetic verifier lesson with `201`.
- The repository's live coherence test then made 30 separate HTTP/1.1, no-keepalive learner reads. Results: **15 × 200 and 15 × 404** immediately after creation.
- A second independent probe created a new synthetic lesson and made 40 fresh HTTP/1.1 reads: **20 × 200 and 20 × 404**. Authorized delete returned **404, 404, 404, then 204**, when a request eventually reached the state-owning backend.
- The failing repository command was:

  ```bash
  BASE_URL=https://code-lesson-checkpoints.sociobot.in \
  EXPECTED_BUILD_SHA=dc5047ed3575eb77c73972be41a630f25d70a9c2 \
  npm run test:coherence
  ```

This means a tutor or learner can create a valid lesson and then be told it does not exist; a valid deletion can also falsely report not found. It contradicts the brief's timeline, access, and deletion requirements. Apply and verify the checked-in single-replica durable SQLite deployment contract (including the `/data` mount), then repeat a multi-connection create/read/submit/reply/delete test and a restart/revision persistence canary.

## Mandatory first gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Claims manifest exists | PASS | `.factory/claims.json` has six claims. |
| Every listed claim test runs first from `/demo` | PASS | All six exact commands passed locally, then again against live. |
| Cold first read | PASS | Live h1: “See where the lesson got stuck.” It names remote programming tutors, says learners run locally and choose evidence, and first offers **Try it with sample data**. |
| One-click isolated sample | PASS | First-screen action opens `/demo`, with “Demo — sample data, nothing is saved,” Reset demo, and Start for real. |

## Claim evidence

Each exact manifest command passed from a fresh local production server and again with `BASE_URL=https://code-lesson-checkpoints.sociobot.in`:

- `@claim:demo-isolation`
- `@claim:consented-redacted-evidence`
- `@claim:offline-demo-reload`
- `@claim:json-export`
- `@claim:paid-team-checkout`
- `@claim:no-tracking`

The tests demonstrated demo namespace isolation/reset, consent enforcement, secret redaction and 8,000-character output cap, offline reload, JSON export, $39 hosted Dodo checkout redirect, no third-party public/demo requests, and no source-file input.

## Source, build, and consumer checks

The clean checkout began at the requested SHA. Passing checks:

- `npm ci`
- `npm test` — 11 Vitest tests and 10 Rust tests
- `npm run check`
- `npm run lint` — TypeScript, Rust formatting, Clippy warnings denied
- `BUILD_SHA=dc5047ed3575eb77c73972be41a630f25d70a9c2 npm run build`
- `npm run test:e2e` — local complete tutor/learner flow
- `npm run test:pwa` — service-worker update and offline demo reload
- `npm run test:load` — 200 health requests at 418 requests/sec
- `npm run test:package` — clean VSIX package/unpack consumer syntax, entry, and license check

The application also started on `PORT` with no other application configuration in a temporary runtime directory; `/health` returned `200` and startup logged default configuration provenance without values.

The worker has neither `docker` nor `podman`, so the Docker image build could not be executed (`docker: command not found`). Dockerfile inspection found a multi-stage non-root image, current `rust:1` base, build-arg identity default, `/data`, and port 8080.

## Live product checks that passed

- `/health` reports the exact candidate: `{"build":"dc5047ed3575eb77c73972be41a630f25d70a9c2","status":"ok"}`.
- An exact build with `BUILD_SHA` matched the deployed JS and CSS byte-for-byte (JS SHA-256 `d23bfe7af1b28b51ed1fabf62d01ffdec2a5245fd8810fd125912978d13c2ef2`; CSS SHA-256 `9fcdf8be8a7646f4f6c31deb981a073cc05b3f0897d1f67cc26698364707cad7`).
- Live `test:e2e` passed: 390 px and desktop layouts, keyboard skip link/Enter/Space/Escape/dialog focus, demo isolation, create/share/redact/reply/delete, 200% text, reduced motion, all routes, no overflow, no console/page errors, and zero serious/critical axe findings.
- Live `test:pwa` passed: service-worker update and offline `/demo` reload with the offline notice.
- A fresh Playwright request log for landing showed only same-origin assets; no trackers or analytics were requested. No source file upload was offered.
- CSP, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` were present. Hashed assets use immutable caching.
- Backend write limiting was observed live: after 47 immediate synthetic demo-workspace writes from the same client, request 48 returned `429` with `Retry-After: 1` and `X-RateLimit-After: 1`. The documented allowance is enforced; health remains exempt.
- Production bundle output: initial JS 42.97 kB raw / 13.90 kB gzip and CSS 28.77 kB raw / 6.87 kB gzip, within budget.

## Cleanup

Synthetic verifier lessons contained only the title/checkpoint `true` and no user data. The second probe was deleted once a request reached its owning instance. The failed coherence suite attempts cleanup in `finally`, but a split deployment can return 404 to cleanup too; any residual synthetic rows are confined to the defective ephemeral boundary.

## Required re-verification

Do not release until fresh no-keepalive requests are all consistent after create, submit, reply, delete, and a restart/revision change. The successful source/browser checks do not mitigate the P0 deployed persistence failure.
