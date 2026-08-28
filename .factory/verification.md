# Independent verification — FAIL

**Candidate:** `3855ec15f8c6924c830adfa079f986d05701e32d`

**Live URL:** https://code-lesson-checkpoints.sociobot.in
**Verified:** 2026-08-28

This candidate does **not** meet the acceptance contract. The deployed application has a core tutor-access failure, and both candidate and deployment violate the brief's output-redaction constraint.

## Blocking defects

### P0 — deployed lessons with no learner name cannot be opened or deleted through the private tutor link

Live API reproduction (all requests made 2026-08-28):

1. `POST /api/lessons` with `{"title":"QA deletion retry","checkpoints":[{"title":"c","command":"true"}]}` returned `201` with lesson id `fdb00b75-13b5-4256-b7c4-20c60ac7d69d`, learner code `CMNZP2`, and a tutor token.
2. `GET /api/lessons/code/CMNZP2` consistently returned `200` and the created record.
3. `GET /api/tutor/lessons/fdb00b75-13b5-4256-b7c4-20c60ac7d69d` with that exact `Authorization: Bearer` token returned `404 {"error":"That lesson was not found."}`. The same result occurred in Chromium with the actual private tutor URL, and in 20 repeated authenticated GET/DELETE attempts.

The learner-name field is optional in the product and brief. This leaves the tutor unable to see or permanently delete a valid lesson record, breaking the main job-to-be-done and deletion/access control. The deployed backend therefore does not match the candidate backend behavior expected from the source (the source inserts a token hash for every lesson), or it has a serious persistence/routing defect.

### P0 — sensitive environment-style output is stored verbatim

The brief requires environment-variable redaction. Against the live candidate UI/API, a learner-consented submission containing:

```
DATABASE_URL=postgres://qa_user:qa_password@db.example/private
```

was accepted and returned verbatim through the private tutor API. `API_KEY` and `Authorization` examples are redacted, but the implementation's narrow patterns in `frontend/src/privacy.ts`, `src/main.rs`, and `extension/src/extension.ts` do not redact `DATABASE_URL` (or credentials embedded in it). A tutorial command can emit such a variable, so this contradicts the privacy guarantee and the product's purpose.

## Non-blocking defects

### P2 — no immutable cache policy on production static assets

The deployed hashed JS, CSS, service worker, and AVIF responses have no `Cache-Control` header. For example, `GET /assets/index-BG6NGjSw.js` returns `200`, `content-length: 36921`, CSP/referrer/nosniff headers, but no cache directive. This misses the stated long-lived immutable caching policy for hashed assets.

### P2 — footer legal/source links are below the 44 px touch-target requirement

At the 1440 px desktop view, visible `Privacy`, `Terms`, and `Source` links measure 49×20, 43×20, and 50×20 CSS px respectively. The same footer is used on mobile. This is below the required 44 px minimum interactive target height.

### P2 — live health endpoint has no build identity

`GET /health` returns `{"build":"development","status":"ok"}`, not the candidate SHA. The HTML, JS and CSS are exactly matched (below), but the backend cannot be positively identified as the requested candidate; the live tutor-access failure confirms that this matters.

### P2 — default backend start does not produce the required configuration log

The release binary started successfully on `PORT=8091` in a fresh temporary directory with no application configuration other than `PORT`, and `/health` returned `{"build":"development","status":"ok"}`. Its captured stdout/stderr was empty. The required startup log identifying supplied versus generated/default configuration is absent.

## Passing evidence

### Clean checkout, checks, build

- Clean `main` was at the required SHA before verification.
- `npm ci`: completed; `npm audit --omit=dev`: 0 vulnerabilities.
- `npm test`: passed — Vitest 3/3 and Rust 3/3.
- `npm run check`: passed (frontend and VS Code extension TypeScript).
- `npm run build`: passed; produced `dist/` and `extension/dist/extension.js`.
- `cargo clippy --all-targets -- -D warnings`: passed.
- `cargo build --release`: passed; produced the 11 MB production binary.
- Docker image execution could not be tested because this worker has no `docker` or `podman` executable (`docker: command not found`).

### Representative user behavior

- The repository mobile browser smoke passed against the live URL: create lesson, learner join, consent-gated blocked submission, `API_KEY` redaction, tutor reply, deletion navigation, zero page/console errors.
- Live API negative/boundary checks passed where expected: empty title `400`, 13 checkpoints `400`, missing consent `400`, invalid status `400`, missing tutor authorization `401`, bad token `403`.
- The locally built release binary, with `BUILD_SHA` set to the candidate and a fresh SQLite database, passed the missing-learner-name sequence `create → authenticated tutor read → delete`; `/health` returned that exact SHA. This isolates the deployed tutor failure to production deployment/backend mismatch or persistence, rather than accepting it as intended behavior.
- Live load smoke passed: 200 `/health` requests at 125 requests/second.
- The live endpoint allowed origin preflight only for the configured sociobot origin; an `https://evil.example` preflight had no `Access-Control-Allow-Origin`.

### Browser, accessibility, PWA, privacy transport

- Repository axe checks passed with zero serious/critical findings across public routes and tutor/learner flows at 390×844. Independent axe scans of `/new` passed at both 1440×1000 and 390×844.
- Desktop and 390 px views had no horizontal overflow in tested pages. Keyboard Tab reached the skip link with a visible solid 3 px focus outline.
- With `prefers-reduced-motion: reduce`, smooth scrolling computed to `auto` and the spinner animation to `0.00001s`.
- Service worker registration was active (`clc-shell-v1`); `registration.update()` resolved, and an offline reload from cached shell succeeded with the offline notice visible.
- Live home-page network requests stayed same-origin; no analytics/tracker request was observed. CSP restricts scripts/styles/fonts/images to self (plus explicitly permitted Sociobot billing connections), with `nosniff` and strict-origin referrer policy. No cookies were set in sampled responses.

### Deployment comparison and budgets

- Local production `dist/index.html` matched live HTML exactly. SHA-256 of local/live `assets/index-BG6NGjSw.js` matched: `0175ca4c9e300ad402a9fee98863f812c180d3a860d64c4e8774c773588872c3`; CSS matched: `6a291c39ad02daa12f9bcb1da243528c85bbd62914dca6bf86670903e5bb9b0d`.
- Production JS is 36.92 kB raw / 12.41 kB gzip; CSS is 27.03 kB raw / 6.62 kB gzip; initial loaded Latin fonts are about 71 kB; 720 px AVIF hero is 16.1 kB. These pass the stated static budgets.

## Required remediation and re-verification

1. Repair the production tutor-token/persistence path for lessons with and without `learnerName`, and prove create → tutor open → reply → delete using fresh non-sticky requests.
2. Redact broad credential-bearing environment variables and URL credentials in browser, extension, and server code; add regression tests for `DATABASE_URL` and similar values.
3. Deploy with `BUILD_SHA=3855ec15f8c6924c830adfa079f986d05701e32d` (or equivalent immutable build ID) and expose it from `/health`.
4. Set immutable cache headers for hashed assets and make legal/footer links meet 44 px target size.
