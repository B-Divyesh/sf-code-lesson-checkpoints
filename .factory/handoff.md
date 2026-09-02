# Handoff — polish round 2

## Result

The repair at `HEAD` closes every finding in `.factory/review-1.md` and `.factory/review-2.md`.

The paid feature is now a real shared Team workspace backed by product SQLite:

- an owner creates a team and receives an invite code;
- tutors join with that code and receive a separate hashed access token;
- tutors add lessons they already control to shared, searchable history;
- members can reopen records and reply in context from another device;
- only the owner can remove a tutor, which immediately revokes that token.

The landing first screen now fits all three facts at 1440 × 900, the process h2 names the process, and the README no longer makes unlisted stack or responsive claims. The one-click `?demo=1` sandbox, persistent banner, reset, exit, local namespace, and offline reload remain intact.

## How to run

```bash
npm ci
npm run build
cargo run
```

Open `http://localhost:8080`. The sample is at `/?demo=1`.

## Verification

Passed locally from a clean dependency install:

- `npm test` — 12 Vitest and 13 Rust tests.
- `npm run build` — `dist/` built; initial application JavaScript is 15.87 kB gzip.
- `npm run lint` — TypeScript, rustfmt, and Clippy.
- `npm run test:claims` — all 12 claim commands, including the packaged VS Code host flow.
- `npm run test:e2e` — mobile/desktop routes, metadata, history focus, 200% text, axe integration, keyboard, 404, and the 1440 × 900 fact-fit check.
- `npm run test:pwa`, `npm run test:load` (200 health requests at 693 req/s), and `npm run test:package`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:8080 .factory/evidence/polish-2` — no console errors; title, lang, h1, main, and alt checks passed.

Evidence screenshots are in `.factory/evidence/polish-2/`. The standalone Axe CLI could not locate a system Chrome binary; the existing Playwright Axe integration passed on every principal route.

## Deploy

Deploy the committed `HEAD` only:

```bash
scripts/deploy-release.sh "$(git rev-parse HEAD)"
```

This uses `deployment/container-app.json`, deploys only `sf-code-lesson-checkpoints`, mounts the existing `/data` share, and runs the durable-state coherence probe.

## Known gaps

None. Team access is intentionally token-based rather than an account system: no email address, source file, or payment card data is stored by this product.
