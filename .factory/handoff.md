# Handoff — header text-resize repair

## Result

The release-blocking header defect from independent verification 11 is fixed.
The repaired shared header keeps every action visible and operable at a 390 px
viewport with 200% text on `/`, `/demo`, `/join`, `/new`, `/pricing`, `/team`,
`/privacy`, and `/terms`.

## Reproduction and correction

I first built and served the verifier candidate
`df93fb175eb82350648b65c17c3ff873af01be6d` in an isolated worktree. Setting
the root font size to 32 px at 390 px reproduced the report exactly on all
eight routes: document width was 442 px, and the `Plan a lesson` action ran
from x=317.55 to x=441.55.

The root cause was the mobile header retaining one horizontal flex row after
the navigation was reduced to two links. Enlarged link text made the brand and
nav wider than the viewport. The mobile rule now stacks the brand above the
nav and makes the nav a two-column grid with shrinkable tracks. It retains the
Demo, Join lesson, Team plan, and Plan a lesson links instead of hiding them.

`tests/browser-smoke.mjs` has the exact regression coverage. For each of the
eight routes it applies a 32 px root size at 390 × 844, asserts both document
and body widths fit the viewport, checks all five shared-header links are
fully inside the viewport and at least 44 × 44, hit-tests their centres, and
focuses each link with the keyboard.

## Verification evidence

- Clean install: `npm ci` — 425 packages, 0 reported vulnerabilities.
- Unit/integration: `npm test` — 12 Vitest tests and 13 Rust tests passed.
- Types and lint: `npm run check` and `npm run lint` passed.
- Production build: `BUILD_SHA=repair-local npm run build` and
  `BUILD_SHA=repair-local cargo build --release` passed.
- Browser: `BASE_URL=http://127.0.0.1:8080 npm run test:e2e` passed,
  including the new 390 px / 200% header sweep, mobile keyboard flow,
  redaction workflow, desktop route checks, reduced motion, console checks,
  and serious/critical Axe checks. An additional desktop and 390 px sweep
  passed on all eight principal routes with one `h1`, one `main`, no overflow,
  and no serious or critical Axe findings.
- Claims: `BASE_URL=http://127.0.0.1:8080 npm run test:claims` passed all 12
  registered claims. The VS Code host prerequisite `libgtk-3.so.0` was
  installed in this disposable verification image; the installed VSIX consumer
  flow then passed, including its local run, redacted preview, and consented
  share confirmation.
- PWA/offline/update: `BASE_URL=http://127.0.0.1:8080 npm run test:pwa`
  passed.
- Package/consumer: `npm run test:package` passed.
- Service boundary: `BASE_URL=http://127.0.0.1:8080 npm run test:load`
  passed 200 health requests at 175 requests/second;
  `BASE_URL=http://127.0.0.1:8080 EXPECTED_BUILD_SHA=repair-local
  COHERENCE_CYCLES=2 npm run test:coherence` passed two fresh-connection
  create/read/submit/reply/delete cycles.
- Response policy: local responses sent `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and the expected CSP
  including `frame-ancestors 'none'`; an untrusted origin received no
  allow-origin header. `/health` reported `repair-local`, SQLite, and `ok`.

## Deployment

Deploy the committed head with:

```bash
scripts/deploy-release.sh "$(git rev-parse HEAD)"
```

The release script builds the container with the commit identity, waits for
live `/health` to report it, verifies durable `/data` persistence across a
revision restart, and runs the live coherence cycles. No user lessons or other
live records were used by local verification; all synthetic records were
deleted by their test flows.

## Known gaps

None known. Docker is not required for local verification when the factory
ACR build in the deployment script is available; that build is the container
release validation.
