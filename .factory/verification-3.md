# Independent product verification — FAIL

**Candidate:** `470d834e381a1c24f8e2849ccbd534c9abb01a68`

**Live URL:** https://code-lesson-checkpoints.sociobot.in

**Verified:** 2026-08-28

**Work order:** `code-lesson-checkpoints-verify-3`

The candidate **fails** the acceptance contract. The application code passes its local quality gates and the live image/frontend match the candidate, but the live Container App does not apply the candidate's mandatory SQLite deployment contract. It is running three replicas, each with private ephemeral storage. Fresh live lessons therefore alternate between `200` and `404` depending on which replica receives the next request. The core tutor/learner workflow, persistence, access, and deletion guarantees are not reliable.

## Defects by severity

### P0 — live lesson state is still partitioned across three ephemeral replicas

Fresh independent evidence on 2026-08-28:

1. A browser created lesson `dd816d22-9f85-4489-83d7-5bdcc1fd328a`: `POST /api/lessons` returned `201`, the redirected tutor page loaded, and the immediate authenticated `GET /api/tutor/lessons/{id}` returned `404`. The UI showed “That lesson was not found.” Its first cleanup request also returned `404`.
2. A separate HTTP/1.1 process created lesson `cdc95dbe-29e9-4e33-9e32-0be60555c905`, code `S8K6YJ`.
3. Sixty learner reads made through separate `curl --http1.1 --no-keepalive` processes split **19 × 200 / 41 × 404**.
4. Sixty authenticated tutor reads split **21 × 200 / 39 × 404**.
5. Authorized cleanup returned **2 × 404** before one request reached the owning replica and returned `204`; all 30 post-delete reads then returned `404`.
6. Final cleanup of the two focused browser-created QA records needed one and three prior `404` responses respectively before an authorized delete reached the owning replica and returned `204`.

The repository's live coherence script passed once because its requests remained on a coherent routing path. It did not prove cross-replica visibility. Separate browser navigations and separate HTTP/1.1 processes reproduced the release failure.

Azure control-plane state provides direct causation evidence:

- live image: `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:470d834e381a`
- active revision: `sf-code-lesson-checkpoints--0000010`
- active replicas: **3**
- `minReplicas: 1`, `maxReplicas: 3`
- `volumes: null`
- Container Apps environment override: only `PORT=8080`

This conflicts with checked-in `deployment/container-app.json`, which requires `maxReplicas: 1`, an Azure Files volume mounted at `/data`, and `DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile`.

Impact:

- A tutor can create a lesson and immediately be told it does not exist.
- Learners intermittently cannot open a valid code or submit evidence.
- Tutor replies and the “first blocked checkpoint” timeline are not reliably addressable.
- A delete request can return `404` while the record still exists on another replica, violating the required educational-record deletion boundary.

Required remediation: apply and verify the checked-in product-specific Container Apps contract (one replica, mounted durable `/data`, configured SQLite URL), then repeat the fresh-process lifecycle and a revision-replacement persistence canary. The checked-in script alone is not proof that the live control plane was changed.

### P2 — a newly returned valid paid license does not unlock until manual reload

With the Sociobot verification request intercepted to return `{ valid: true, reason: "ok" }`, loading `/pricing?license=qa-license-token`:

- stripped the token from the URL;
- stored `sb_license:code-lesson-checkpoints`;
- made one correct Sociobot verification request; and
- cached the valid daily verdict.

However, the same first render still showed **Buy Team archive** (`buy=1`, `open=0`) and an empty status. Only a manual reload changed it to **Open Team archive**; the daily cache correctly prevented a second verification call. This misses the paid-unlock contract to unlock after the returned token is stored and verified. The free Pair workflow remains available, and reload is a workaround.

Recommended remediation: rerender the pricing/team state immediately after a valid background verdict, or establish the valid verdict before rendering the returned-license state without blocking the free experience.

## Clean checkout and quality gates

Verification used detached clean checkout `/tmp/clc-qa-470d834-bPha7k` at the exact candidate. The source worktree remained untouched until this report was written.

| Gate | Result |
| --- | --- |
| `npm ci` | PASS; 112 packages installed |
| `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| `npm test` | PASS; 7 Vitest tests + 5 Rust tests |
| `npm run check` | PASS; frontend and extension TypeScript |
| `cargo fmt --all -- --check` | PASS |
| `cargo clippy --all-targets --all-features -- -D warnings` | PASS |
| `npm run build` | PASS; exact Vite production build plus extension compilation |
| `cargo build --release` | PASS; optimized backend binary |
| `BASE_URL=http://127.0.0.1:8092 npm run test:e2e` | PASS |
| `BASE_URL=http://127.0.0.1:8092 npm run test:pwa` | PASS |
| local `npm run test:coherence` | PASS |
| local `npm run test:load` | PASS; 200 health requests at 604 req/s |

There is no separate lint script. No Docker/Podman/Buildah executable or VS Code desktop host was available. The exact frontend/extension and optimized Rust builds ran natively; the Dockerfile was inspected and is multi-stage, `.git`-independent, non-root, and declares `ARG BUILD_SHA=dev`, `/data`, port 8080, and the release binary.

## Local backend, boundaries, and recovery

The optimized binary started in the clean checkout with `env -i PORT=8092 ...` and no other configuration. Its structured startup record reported `database_url=default`, `build_sha=default`, and `dist_dir=default` without logging values or secrets.

Passing local behavior:

- Full tutor/learner flow: create, learner join, keyboard-opened evidence dialog, blocked evidence, redaction, tutor first-block timeline, reply, learner refresh, confirmed deletion.
- Fresh-connection coherence: 30 learner reads, 30 tutor reads, evidence, another 30 tutor reads, reply, 30 learner reads, delete, then 20 expected `404` reads.
- Restart persistence: a lesson survived graceful process termination/restart, then authorized deletion made its learner route return `404`.
- Concurrent writes: **30/30** simultaneous valid evidence submissions returned `201` and all 30 were present in the tutor record.
- Rate limiting: 150 simultaneous invalid mutations returned **101 × 422 / 49 × 429**.
- Load: 200 concurrent health reads at **604 requests/second**.

Independent boundary coverage passed:

- Rejected blank title, 101-character title, 81-character learner name, zero/13 checkpoints, 501-character command, malformed JSON, and a body over 64 KiB.
- Accepted the 100-character title, 80-character learner name, 100-character checkpoint title, 500-character command, and 300-character success hint boundaries.
- Rejected missing consent, invalid status, a checkpoint from outside the lesson, and a 1,001-character note; accepted a 1,000-character note.
- Missing tutor authorization returned `401`; a wrong tutor token returned `403`.
- Empty and 2,001-character replies were rejected; a valid reply recovered successfully.
- A 12,000-character evidence sample was capped to **8,019 characters**, including the trim notice. Database URL credentials, Authorization bearer data, Redis URL credentials, and API token content were absent from the stored record.
- Lowercase, dash-separated share-code normalization worked.
- Authorized deletion returned `204`; learner and tutor reads then returned `404`.

## Extension package boundary

`@vscode/vsce@3.6.2` produced `/tmp/code-lesson-checkpoints-0.1.0.vsix` at **6,456 bytes**. It was unpacked into a fresh temporary consumer, passed archive integrity and `node --check`, and the declared `./dist/extension.js` entry existed. The packager warned that the extension manifest has no `repository` field and that the VSIX omits a license file, although the repository has the required MIT `LICENSE`. Interactive Extension Development Host testing was not possible because no VS Code executable is installed.

## Live frontend, accessibility, and visual QA

- Factory URL verifier: HTTP 200, 652 ms network-idle load, correct title, `lang=en`, one h1, main landmark, image alt text, no unlabeled buttons, and zero console/page errors.
- Independent axe matrix: **0 serious/critical findings** on `/`, `/join`, `/new`, `/pricing`, `/privacy`, and `/terms` at both 390 × 844 and 1440 × 1000.
- The first live end-to-end run successfully reached create, learner join, Enter/Space/Escape dialog operation, dialog focus transfer, consented evidence, redaction, tutor reply, and authorized deletion before its post-delete navigation timed out. A focused rerun then exposed the immediate create/read `201 → 404` P0 above.
- Skip link was the first Tab stop. Its visible treatment was a 3 px solid `rgb(52, 112, 142)` outline at both viewports.
- Mobile brand, lesson-code, and footer targets measured at least 44 × 44 px; the repaired examples measured 172.55 × 44 and 179 × 44 px. The pricing target assertions also passed before the end-to-end failure.
- All sampled routes had no horizontal overflow at 390 px, desktop, or 200% root text.
- Under `prefers-reduced-motion: reduce`, scroll behavior computed to `auto` and button transition duration to `0.00001s`; no looping animation exists.
- Visual review at desktop and 390 px confirmed the product-specific paper-path composition, readable hierarchy, intentional mobile stacking, and no clipping or fixed-bar obstruction.
- Public-route browser requests remained same-origin; no analytics, ad, CDN font, or tracker requests appeared. The explicit billing flow uses only the expected Sociobot API.
- Service-worker registration/update and offline shell reload passed; the offline notice was visible.

## Response policy, deployment identity, budgets, and performance

- Live `/health` returned the exact full candidate SHA.
- GitHub `main` resolved to the exact candidate before testing.
- All **22** local `dist/` files matched their live URLs byte-for-byte.
- Candidate image tag, live health identity, and frontend bytes match. The live scale/storage/environment contract does **not** match the candidate, which is the P0.
- CSP restricts default/script/style/font to self, limits connects to self and Sociobot billing, blocks framing, and limits form actions. `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` are present.
- Production-origin CORS preflight received its exact allow-origin. `https://evil.example` received no allow-origin. Sampled responses set no cookies.
- Hashed JavaScript returned `Cache-Control: public, max-age=31536000, immutable` and Brotli content encoding. The service-worker update/offline behavior passed.
- Initial JS: **37,187 B raw / 12,740 B transferred**.
- Initial CSS: **27,336 B raw / 7,002 B transferred**.
- Initial fonts: **71,358 B encoded** across two Atkinson weights and one Fraunces variable subset.
- Mobile AVIF hero: **16,111 B**.
- Initial resource transfer: **109,011 B**; all stated static budgets pass.
- Lighthouse 13.0.1 mobile: **Performance 100 / Accessibility 100 / Best Practices 100 / SEO 100**; FCP 1.4 s, LCP 1.5 s, CLS 0.006, TBT 0 ms, total size 106 KiB. Synthetic single-load Lighthouse does not report field INP.
- Live load smoke passed at **106 requests/second**.

## Cleanup and limitations

All identifiable live QA records were deleted. Because of the P0, cleanup was repeated across fresh connections until `204` reached each owning replica. One record from an early timed-out browser attempt may remain because that attempt did not emit its generated ID/token; it was titled `Focused delete navigation QA`, contains no learner name or real learner data, and its finally-block attempted authorized deletion once.

No infrastructure, deployment, DNS, billing, or product code was changed. Azure was queried read-only to establish live topology. No container engine or VS Code desktop host was available.

## Verdict

**FAIL.** Candidate code quality, accessibility, privacy controls, bundles, performance, and same-build frontend deployment are strong. Release acceptance is blocked because live backend state is still split across three ephemeral replicas, making the real tutor/learner job and deletion guarantee unreliable. The valid-license UI also needs to rerender after first verification rather than requiring a reload.
