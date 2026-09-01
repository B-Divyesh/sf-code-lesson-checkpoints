# Handoff — verification 10 repair

## Result

Release blockers from report commit `aaf8002edb9fdd25e22bc7c064dc669730f7b047`
were reproduced against candidate `20e2ae20eb70f84fc1a571c2ebee6045fa9b8d22`
and repaired. No brief, artifact-class, storage, privacy, or passing workflow
behavior changed.

The release source is the final repository commit containing this handoff.
The deployment check requires live `/health.build` to equal that full commit.

## Repairs and exact regressions

1. Removed “about 2 minutes” from `/new`. The mobile browser suite asserts
   the exact replacement label and rejects a duration promise.
2. Added the required landing-page Team archive section after the product
   boundary section. It states `$39 once`, one tutor, device-local search and
   reopening, and no recurring fee. Its action opens `/pricing`, not checkout.
   The paid claim proves the landing copy, the live details route, the hosted
   checkout redirect, and the absence of embedded payment code.
3. Made the compact Team plan link and every listed target at least 44 by 44:
   the VSIX link, blocked-checkpoint link, command-copy control, and skip link.
   The browser suite also scans every visible link, button, input, textarea,
   and summary on all principal 390 px routes for undersized targets.
4. Replaced VSIX string inspection as the behavioral proof. The claim now
   installs the built VSIX into pinned VS Code 1.98.2, activates its real
   command in an Extension Development Host, confirms the displayed command,
   runs a local fixture, verifies the redacted preview, confirms sharing, and
   checks the submitted payload. The production build cannot enable the test
   interaction seam without the isolated test-host environment flag.
5. Skip-link activation now focuses `<main>` on `/join` and every route. The
   exact `/join` keyboard regression asserts focus, not only scroll position.
6. Route announcements now normalize visual line breaks. The regression
   asserts “Page changed: Plan your next code lesson.” exactly.

Evidence screenshots and reports are in `.factory/evidence/repair-9/`.

## Clean local verification

- `npm ci`: 425 packages, 0 reported vulnerabilities.
- `npm test`: 12 Vitest assertions and 13 Rust tests passed.
- `npm run check` and `npm run lint`: TypeScript, rustfmt, and Clippy passed
  with warnings denied.
- `npm run build`: `dist/` and the versioned VSIX were produced. Initial JS is
  46.43 KB raw / 14.69 KB gzip; CSS is 30.15 KB raw / 7.11 KB gzip.
- `npm run test:claims`: all 12 registered claims passed, including the real
  packaged-extension host flow.
- `npm run test:package`: the fresh VSIX entry, license, files, and consumer
  JavaScript syntax passed.
- `npm run test:e2e`: mobile and desktop semantics, all listed target sizes,
  keyboard focus, exact announcements, create/share/reply/delete, privacy,
  and console checks passed.
- `npm run test:pwa`: service-worker update and isolated offline demo reload
  passed.
- `npm run test:coherence` with two local cycles: fresh-connection
  create/read/submit/reply/delete passed.
- `npm run test:load`: 200 health requests completed at 690 requests/second.
- The backend admitted 30 simultaneous invalid writes, then returned 50
  `429` responses; every limited response included `Retry-After: 1`.
- `/opt/fleet/lib/verify-url.sh`: title, language, one heading, main landmark,
  image alt text, desktop/mobile rendering, and zero console errors passed.
- Axe CLI 4.10.3 found 0 violations on the landing page. The Playwright Axe
  pass found zero serious or critical issues across every principal route at
  desktop and 390 px.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.4 s, LCP 1.7 s, TBT 0 ms, CLS 0.007, transfer 113 KiB.
- Security headers, real 404 status, untrusted-origin CORS denial, immutable
  hashed caching, reduced motion, 200% text resize, and same-origin-only public
  and demo requests passed.

## Run the verification

```bash
npm ci
npm test
npm run check
npm run lint
npm run build
cargo build --release
npm run test:claims
npm run test:package
npm run test:extension-host
BASE_URL=http://127.0.0.1:8080 npm run test:e2e
BASE_URL=http://127.0.0.1:8080 npm run test:pwa
BASE_URL=http://127.0.0.1:8080 npm run test:coherence
BASE_URL=http://127.0.0.1:8080 npm run test:load
```

Linux extension-host verification needs Xvfb and GTK 3. VS Code 1.98.2 is
downloaded once into ignored `.vscode-test/` state.

## Deployment and live verification

Deployment uses only `deployment/container-app.json` and
`scripts/deploy-release.sh`. The target is `sf-code-lesson-checkpoints`, one
replica, with SQLite under its existing `/data` mount. No other service,
database, vault, storage account, DNS setting, billing setting, or secret was
read or changed.

The release procedure builds the exact source commit in ACR, applies the
product-owned one-replica mount contract, restarts the serving revision,
proves a SQLite canary survives that restart, and runs four coherence cycles.
Post-deploy acceptance checks `/health`, the live browser/PWA/claims suite,
security and cache headers, response limits, the checkout redirect, and live
desktop/mobile rendering.

The repair image built successfully in ACR (build `ch1q7`, digest
`sha256:216ef222b70ea2ffe87933eff013e1ad959462941f4ddba56a9544a982d6bb46`).
Revision `sf-code-lesson-checkpoints--0000029` reported repair source
`2923d7366dafe67735038c1e4c8f25bbc3e94f65`. A real lesson survived its
revision restart and all 24 post-restart authenticated reads. Four live
coherence cycles and the complete live browser, PWA, and 12-claim suites
passed. The live URL verifier found no console errors, and Axe found zero
violations. Live Lighthouse mobile scored 100 for Performance, Accessibility,
Best Practices, and SEO, with 1.46 s LCP, 0 ms TBT, 0.007 CLS, and 108.8 KiB
transferred. A live 80-request write burst returned 30 `429` responses; all 30
included `Retry-After`.

## Known gaps

- Docker is unavailable in this worker. The Dockerfile contract tests pass,
  and the complete multi-stage container build passed in ACR.
- The independent verifier reported one harmless `Recovery path lesson`
  fixture in durable state. Its private deletion token is unavailable. It
  contains no personal information and is not reachable without its code.
