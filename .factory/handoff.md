# Handoff — adversarial first-read review 2

## Result

**FAIL** for repository candidate `7165825afd3b35bd8112c7050b472ee7d5827a0f` and live product build `b9ad53befbea480deff92c3d984802f55a925802`.

The complete review is in [review-2.md](review-2.md). It records eight findings: two reopened blocking findings, two major findings, and four minor findings. No product code was changed.

## What was verified

- Cold live first reads at 390 × 844 and 1440 × 900
- One-click populated demo, reset, exit, 24-hour isolation, real-key sentinels, offline reload, and same-origin request log
- All 12 `claims.json` commands separately from a clean clone
- Packaged VSIX installation and end-to-end Extension Development Host behavior in VS Code 1.98.2
- All 44 review-1 findings against current live behavior and code
- Route status, titles, one-h1/main structure, metadata, canonical/OG/favicon, designed 404, deep links, Back/focus, headers, and link crawl
- Live Playwright/axe accessibility suite and `/opt/fleet/lib/verify-url.sh`
- Clean-clone `npm test`, `npm run lint`, and `npm run build`

## Reproduce

```bash
npm ci
npm run build
BUILD_SHA=$(git rev-parse HEAD) cargo build --release
PORT=8080 target/release/code-lesson-checkpoints
```

In another shell:

```bash
npm test
npm run lint
npm run test:claims
BASE_URL=https://code-lesson-checkpoints.sociobot.in npm run test:e2e
bash /opt/fleet/lib/verify-url.sh https://code-lesson-checkpoints.sociobot.in "$(mktemp -d)"
```

On Debian/Ubuntu, install `xvfb` and `libgtk-3-0` before the VS Code host claim.

## Next steps

Resolve every finding in `review-2.md`, with the claims-manifest gaps first. The existing claim tests all pass; the blocker is that two public promises are absent from the manifest. The paid one-tutor browser-local archive also remains below the brief’s shared roster/history scope.
