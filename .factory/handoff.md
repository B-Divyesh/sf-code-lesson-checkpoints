# Repair handoff — PASS

**Work order:** `code-lesson-checkpoints-repair-3`  
**Product repair commit:** `10c9f7a5333b563b8a7c4e4b54903d703c8ab5c1`  
**Live URL:** https://code-lesson-checkpoints.sociobot.in  
**Verified/deployed:** 2026-08-28

## Repaired verifier findings

1. **P0 — live SQLite state partitioned across replicas.** The deployed Container App is now revision `sf-code-lesson-checkpoints--0000012`, image `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:10c9f7a5333b`, with `minReplicas: 1`, `maxReplicas: 1`, Azure Files volume `code-lesson-checkpoints-data` mounted at `/data`, and `DATABASE_URL=sqlite:///data/checkpoints.db?mode=rwc&vfs=unix-dotfile`.

   The live check `BASE_URL=https://code-lesson-checkpoints.sociobot.in EXPECTED_BUILD_SHA=10c9f7a5333b563b8a7c4e4b54903d703c8ab5c1 npm run test:coherence` passed. It now spawns a separate `curl --http1.1 --no-keepalive` process for every request: 30 learner reads, 30 tutor reads, consented redacted submission, 30 post-submit reads, reply, 30 learner reads, permanent delete, and 20 final `404` reads. This is the exact routing condition that reproduced the former partition.

2. **P2 — returned valid license did not unlock until reload.** Pricing now rerenders as soon as its first valid verification verdict arrives. The 390px Playwright regression intercepts the Sociobot verification response for `/pricing?license=qa-license-token`, asserts the token is stripped, and asserts **Open Team archive** appears on that first render. It also preserves optimistic cached unlocks and daily verification caching.

## Verification evidence

Clean install and local quality gates:

- `npm ci` — 112 packages; `npm audit --omit=dev` — 0 vulnerabilities.
- `npm test` — 8 Vitest checks and 5 Rust tests passed.
- `npm run check`, `cargo fmt --all -- --check`, and `cargo clippy --all-targets --all-features -- -D warnings` passed.
- `npm run build` and `cargo build --release` passed. Production outputs: JavaScript 37.14 kB raw / 12.56 kB gzip; CSS 27.34 kB raw / 6.65 kB gzip.
- Local release binary checks passed: 390px and desktop browser/keyboard/axe flow, returned-license regression, PWA offline update, separate-process lifecycle, and 200 health requests at 812 requests/s.
- Extension consumer check passed: VSIX unpacked, archive integrity passed, declared entry existed, and `node --check` passed (6,456 bytes). `vsce` retains its pre-existing advisory that the extension manifest has no repository field and extension-local license file.

Live checks after deployment:

- `/health` returns the exact repair SHA above.
- `npm run test:coherence` passed against the public URL with the exact SHA assertion.
- `npm run test:e2e` passed against the public URL: 390px/desktop views, keyboard dialog controls, axe serious/critical checks, privacy redaction, response/reply/delete, touch targets, reduced motion, and no console errors.
- `npm run test:pwa` passed: service-worker update and offline reload notice.
- `npm run test:load` passed: 200 health requests at 357 requests/s.
- Azure control-plane readback confirms the image, single-replica scale, `/data` mount, Azure Files backing, and lock-file SQLite URL shown above.

## Deployment

Built in Azure Container Registry with `BUILD_SHA`, `GIT_SHA`, and `SOURCE_COMMIT` set to the repair commit; applied `scripts/apply-deployment-contract.sh` after updating the image. The script read back the topology before acceptance. No DNS, storage provisioning, billing, or other infrastructure configuration was changed.

## Known gaps

No Docker/Podman engine or VS Code desktop host is available in this worker, so the image was built by ACR and the VSIX was validated as a clean unpacked consumer rather than launched in an Extension Development Host. The live container, browser, PWA, public lifecycle, identity, and response paths were exercised successfully.
