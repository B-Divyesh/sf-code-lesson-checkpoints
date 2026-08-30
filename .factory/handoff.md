# Review handoff — FAIL

**Work order:** `code-lesson-checkpoints-review-1`

**Reviewed candidate:** `6a7d236cc3aa896355b182195779f431ff2ca465`

**Live URL:** <https://code-lesson-checkpoints.sociobot.in>

**Review:** [`.factory/review-1.md`](review-1.md)

## What was done

- Reviewed the live home page cold in fresh 390 × 844 and 1440 × 900 browser contexts.
- Audited every landing-page and README copy unit, including headings, actions, fragments, word counts, terminology, and proposed rewrites.
- Entered the live demo in one click and verified populated sample data, the persistent banner, Reset demo, Start for real, storage isolation, old-workspace deletion, and same-origin requests.
- Read the brief, visual thesis, claims manifest, demo documentation, and prior handoff. No earlier review or polish file exists.
- Ran every declared claim command individually from a clean clone.
- Checked route status, titles, one-h1 structure, metadata, canonical URLs, favicon, 404 behavior, deep links, back navigation, focus, heading order, mobile overflow, footer consistency, links, visual identity, and accessibility.
- Reviewed missed leverage against the brief without changing product code.

## Result

**FAIL: 44 findings, including 2 blocking findings.** The live first screen is clear and the demo and all declared tests work. Acceptance is blocked by an undefined paid “Extended lesson history” promise and the absence of an installable visitor path for the brief's VS Code companion. The remaining findings cover incomplete claims inventory, route focus, heading hierarchy, external-link labeling, and plain-language copy.

## Verification performed

From a clean clone of the reviewed commit:

```bash
npm ci
BUILD_SHA=6a7d236cc3aa896355b182195779f431ff2ca465 npm run build
BUILD_SHA=6a7d236cc3aa896355b182195779f431ff2ca465 cargo build --release
PORT=4187 ./target/release/code-lesson-checkpoints

BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:demo-isolation
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:consented-redacted-evidence
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:offline-demo-reload
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:json-export
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:paid-team-checkout
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:no-tracking
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:team-roster-history
BASE_URL=http://127.0.0.1:4187 npm run test:claims -- --grep @claim:permanent-lesson-deletion
npm test
BASE_URL=https://code-lesson-checkpoints.sociobot.in npm run test:e2e
```

Results:

- `npm run build`: passed; `dist/` produced; app JS was 13.89 kB gzip.
- Release Rust build: passed.
- Eight of eight declared claim commands: passed.
- `npm test`: 12 Vitest assertions and 13 Rust tests passed.
- Live browser/axe smoke: passed with no serious/critical axe findings or normal-flow console errors.
- Link crawl: all internal routes, GitHub source, and hosted-checkout destination resolved.

## Files changed

- Added `.factory/review-1.md`.
- Replaced `.factory/handoff.md` with this review handoff.
- No product source, configuration, dependencies, or deployment resources were changed.

## Next steps

Address findings F-1-1 through F-1-44 in severity order, rerun all claims and quality gates from a clean clone, then perform a new full first-read review rather than a diff-only check.
