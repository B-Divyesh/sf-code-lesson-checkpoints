# Independent product verification 8 — FAIL

**Candidate:** `bb09ce478e089a81e4836cdab24758514d5fb7c2`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-30 UTC

**Work order:** `code-lesson-checkpoints-verify-8`

## Verdict

**FAIL.** The candidate source and image pass the local product, privacy, accessibility, package, build, rate-limit, and SQLite restart checks. The allowed deployed app does not satisfy the release contract:

1. The public URL serves build `6d49b4a6a9e0158369d007cededde4e6cc6ce44e`, not the candidate.
2. The app configuration still contains an environment variable named `DATABASE_URL`. Its value was not read.
3. The public healthy revision runs three replicas with no `/data` mount. The candidate revision has one `/data`-mounted replica, but it is unhealthy and restart-looping because SQLite reports `database is locked`.
4. The live tutor/learner workflow and fresh-connection coherence test fail.

No product code was modified. No forbidden service, database, vault, unrelated app configuration, or unrelated registry repository was read, connected to, changed, or restarted. Azure reads were limited to the `sf-code-lesson-checkpoints` app/revisions/replicas/logs and the product's own `sf-code-lesson-checkpoints:bb09ce478e08` image repository path.

## Release-blocking findings

### P0 — candidate is not live

- Live `/health`: `{"build":"6d49b4a6a9e0158369d007cededde4e6cc6ce44e","status":"ok"}`.
- The live footer shows version `6d49b4a6a9e0`.
- The required command failed at build identity before exercising a lifecycle:

  ```bash
  BASE_URL=https://code-lesson-checkpoints.sociobot.in \
  EXPECTED_BUILD_SHA=bb09ce478e089a81e4836cdab24758514d5fb7c2 \
  COHERENCE_CYCLES=4 npm run test:coherence
  ```

- Effective revision state:
  - `sf-code-lesson-checkpoints--0000020`: healthy, image `:6d49b4a6a9e0`, **3 running replicas**, no volume mount.
  - `sf-code-lesson-checkpoints--0000021`: unhealthy, image `:bb09ce478e08`, 1 non-ready replica, `/data` mounted, restart count 10 at inspection.
- Candidate revision logs show state location `/data`, then `PRAGMA journal_mode = WAL` waits five seconds and exits with SQLite `(code: 5) database is locked`.

### P0 — deployed resource violates the database and topology contract

The effective `sf-code-lesson-checkpoints` template was read without reading setting values. It reports:

- environment variable names: `DATABASE_URL`, `PORT`;
- active revisions mode: `Single`;
- configured scale: minimum 1, maximum 1;
- candidate volume: Azure Files `sf-code-lesson-checkpoints-data` mounted at `/data`.

The forbidden `DATABASE_URL` reference is still present. The serving revision actually has three replicas and no `/data` mount, so one-replica SQLite persistence is not the live topology. The candidate revision cannot become ready on its mounted SQLite file. Deployed persistence under `/data` is therefore **not proven**.

### P0 — live core workflow is incoherent

- `BASE_URL=https://code-lesson-checkpoints.sociobot.in npm run test:e2e` failed after lesson creation because the learner view never displayed a **Share a run** action.
- Re-running the coherence probe against the actually served SHA failed its first 30 learner reads: **21 returned 200 and 9 returned 500**.
- Response headers also exposed different `x-checkpoint-replica` values across successive requests.

The job-to-be-done requires tutor-created checkpoints to be immediately available to the learner. The live deployment cannot guarantee that boundary.

### P1 — claims manifest does not cover all public claims

All six listed claim tests pass, but the live copy and README make additional observable claims without `.factory/claims.json` entries. Examples include **Searchable learner roster**, **Extended lesson history**, and permanent deletion of a lesson and all evidence. The claims contract requires a tagged sandbox test for each claim or removal of the claim.

## Mandatory first gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `.factory/claims.json` exists | PASS | Six entries. |
| Every exact listed claim test | PASS after documented clean install/build/start | Each command was run individually; a final all-claims run against the exact-SHA release binary also passed. |
| Cold first read | PASS | “See where the lesson got stuck.” names remote programming tutors, explains learner-run/shared evidence, and presents the first action. |
| One-click sample | PASS | **Try it with sample data** is visible on the first 390 px screen and opens `/demo`. |
| Demo banner/isolation controls | PASS | “Demo — sample data, nothing is saved,” Reset demo, and Start for real are present. |

The raw pre-install commands correctly could not import Playwright; after `npm ci`, the server also had to be built and started as documented. With the production demo entry point running, every required exact command passed:

- `npm run test:claims -- --grep @claim:demo-isolation`
- `npm run test:claims -- --grep @claim:consented-redacted-evidence`
- `npm run test:claims -- --grep @claim:offline-demo-reload`
- `npm run test:claims -- --grep @claim:json-export`
- `npm run test:claims -- --grep @claim:paid-team-checkout`
- `npm run test:claims -- --grep @claim:no-tracking`

They demonstrated isolated/resettable 24-hour demo state, consent enforcement, local/server redaction and the 8,000-character cap, offline reload, JSON export, hosted checkout, same-origin public/demo requests, and no source-file input.

## Source and image isolation evidence

### Source

- A tracked application/config search found no occurrence of the three prohibited resource names, `DATABASE_URL`, PostgreSQL URLs, or a PostgreSQL driver.
- `Cargo.toml` includes only `sqlx-core` and bundled `sqlx-sqlite`; `src/main.rs` imports only SQLite types.
- Runtime state resolves to `/data/checkpoints.db` when `/data` exists and otherwise to local `checkpoints.db`.
- The checked-in deployment contract specifies `minReplicas: 1`, `maxReplicas: 1`, `/data`, and product-owned storage `sf-code-lesson-checkpoints-data`.

### Candidate image

- Tag: `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:bb09ce478e08`.
- Registry manifest digest: `sha256:0b6007a13d059742b4d25596e206327189357fb6bda09a4212c2d4f5716563d0`.
- Image config: Linux amd64, non-root user `app`, command `code-lesson-checkpoints`, working directory `/app`, exposed port 8080, and only `PATH` in the baked environment.
- Full extracted-filesystem scan found no prohibited resource name, `DATABASE_URL`, PostgreSQL URL, `sqlx-postgres`, or `libpq` string.
- The release binary contains the full candidate SHA.
- `/data` and `/app` are owned by image UID/GID 999; the backend binary is root-owned and executable.
- Exact local production HTML, JS, and CSS matched the image byte-for-byte. JS SHA-256: `88e79331436e3eb37721719f7095251848214e03d0f002726f019a47dccecf1`; CSS SHA-256: `9fcdf8be8a7646f4f6c31deb981a073cc05b3f0897d1f67cc26698364707cad7`.

## SQLite `/data` persistence proof

The exact release binary was compiled with the full candidate SHA and run as UID/GID 999 with a newly created, empty `/data` owned by 999:

1. Startup logged `state_location: /data` and `build_identity: compiled`.
2. A synthetic lesson was created; `/data/checkpoints.db`, `-wal`, and `-shm` were owned by 999.
3. The process stopped cleanly and restarted against the same `/data`.
4. The lesson and its checkpoint were read successfully after restart.
5. Authorized deletion returned 204.

The synthetic canary files and the test `/data` directory were then removed; they are not recoverable and contained no user data. This proves the candidate binary's local `/data` behavior, but does not override the failed deployed revision.

## Local candidate verification

| Command/check | Result |
| --- | --- |
| `npm ci` | PASS; 112 packages, 0 vulnerabilities |
| `npm test` | PASS; 12 Vitest + 12 Rust tests |
| `npm run check` | PASS |
| `npm run lint` | PASS; TypeScript, rustfmt, Clippy warnings denied |
| `BUILD_SHA=<candidate> npm run build` | PASS; `dist/` produced |
| `BUILD_SHA=<candidate> cargo build --release` | PASS |
| `npm run test:e2e` | PASS locally |
| `npm run test:pwa` | PASS locally and live |
| `npm run test:package` | PASS; VSIX packaged and consumer syntax checked |
| `npm run test:load` | PASS; 200 health requests at 173 req/s |
| Local exact-SHA `COHERENCE_CYCLES=4` | PASS |
| Factory `verify-url.sh` | PASS locally (762 ms) and live (697 ms) |

Boundary/invalid API checks passed: 0 and 13 checkpoints, 101-character lesson titles, 501-character commands, malformed JSON, bodies over 64 KiB, missing lesson codes, and wrong tutor tokens returned the expected 4xx responses. The maximum 12-checkpoint lesson succeeded and was deleted. An expired demo returned a clear reset instruction.

## Live UI, accessibility, privacy, and performance

- First-read 390 px screenshot: `.factory/evidence/live-first-read-390.png`.
- Eight routes were checked at 390 × 844 and 1440 × 1000. Each returned 200, had `lang=en`, exactly one h1 and main, no horizontal overflow, and zero serious/critical axe findings.
- 200% root text did not overflow. The first Tab focuses the skip link; Enter targets `#main`. Focus style is a 3 px `#34708e` outline. Reduced motion changes smooth scrolling to `auto` and meaningful transitions to effectively zero.
- No console errors, page errors, or unexpected third-party origins occurred in the public/demo/legal route sweep. Only the explicit billing checkout/verify actions contact `api.sociobot.in`.
- Live PWA service-worker update and offline `/demo` reload passed.
- All internal links returned 200, the source link returned 200, and checkout returned the expected 303 to hosted Dodo checkout. Unknown routes return a real 404 with the designed shell.
- Response headers include CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`. An untrusted Origin receives no CORS allow-origin header. Hashed assets use one-year immutable caching.
- Exact candidate bundle: JS 42.95 kB raw / 13.88 kB gzip; CSS 28.77 kB raw / 6.87 kB gzip. Live first-load transfer measured about 110 kB.
- Lighthouse mobile report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.455 s, CLS 0.0060, TBT 0 ms, 110,358 bytes. Report: `.factory/evidence/lighthouse-live.json`.

## Rate limiting

- Product API, same client: 700 concurrent reads produced 398 normal 404s, 283 `429`s, and 19 deployment-related `500`s; every throttle had `Retry-After: 1`.
- Product API write bucket: 180 invalid writes produced 93 validation responses and 87 `429`s with `Retry-After: 1`. The approximately 90 accepted burst slots reflect three separate live 30-write buckets, not the required one replica.
- Source configuration is 100 read burst tokens replenished every 20 ms (50/s) and 30 mutation burst tokens replenished every 100 ms (10/s), per client and per replica.
- Sociobot license verification: 120 invalid-token requests produced 30 normal responses and 90 `429`s with `Retry-After: 4`; observed burst allowance is 30.

## Required re-verification

1. Remove the `DATABASE_URL` setting from the allowed app without reading or using its value.
2. Resolve the candidate revision's SQLite lock on the product-owned `/data` mount.
3. Confirm exactly one healthy, serving candidate replica with `/data` mounted and only `PORT` configured; retire the three-replica unmounted revision.
4. Confirm live `/health` returns the full candidate SHA.
5. Run four fresh-connection create/read/submit/reply/delete cycles and a revision-restart persistence canary with zero non-expected statuses.
6. Add claim entries/tests for the roster, history, and permanent-deletion claims, or remove those claims.
