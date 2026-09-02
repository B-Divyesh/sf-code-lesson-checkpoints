# Handoff — release-blocking repair 11

## Result

The verifier’s two P1 findings are repaired with regression coverage.

- The shared-header Demo link is exactly 44 × 44 CSS pixels at 1440 px on every route.
- Every tutor-visible shared attempt shows “Learner reviewed and approved this share.”
- The API returns the consent value stored in product-owned SQLite with each attempt.

The original `web-with-backend` class remains unchanged. Rust serves the Vite frontend and uses SQLite under `/data` in production.

## Exact reproduction before repair

The unchanged deployed candidate was checked before any product edit.

- Demo measured 43 × 44 px on `/`, `/demo`, `/join`, `/new`, `/pricing`, `/team`, `/privacy`, `/terms`, and the 404 route.
- A consented live submission returned no consent field and rendered no tutor consent indicator.
- The temporary live lesson used for reproduction was deleted with HTTP 204.

The new consent claim failed against that candidate with `actual: undefined`, `expected: true`.

## Root-cause repairs

1. Header navigation links now have both `min-width: 44px` and `min-height: 44px`.
2. `SubmissionView` selects and serializes the existing `submissions.consented` SQLite column.
3. Tutor attempts render one visible approval indicator from that serialized boolean.
4. The isolated demo fixtures carry the same consent value.
5. Browser checks now inspect every visible target on all desktop routes and both 404 layouts.
6. The consent claim checks rejection, persistence, API serialization, and exact tutor-facing wording.
7. The Rust route regression checks the serialized stored consent value.

## Paid archive scope decision

The researched small-team history and roster controls are not implemented. The shipped paid feature remains a local link archive for one tutor.

Product copy now says “saved tutor links” instead of calling that list a roster. The precise decision is in [scope-decision.md](scope-decision.md).

This release adds no shared accounts, invitations, roles, shared history, or roster management. It makes no claim that those controls exist.

## Verification evidence

Clean setup and code gates:

```text
npm ci                       425 packages; 0 vulnerabilities
npm test                     12 Vitest checks; 13 Rust tests
npm run check               pass
npm run lint                pass, including rustfmt and Clippy -D warnings
npm run build               pass; dist/ produced
cargo build --release       pass
```

Product and package gates:

```text
npm run test:claims         12/12 claims pass
npm run test:e2e            pass at 390 px and 1440 px
npm run test:pwa            offline reload and service-worker update pass
npm run test:package        VSIX integrity and consumer syntax pass
npm run test:extension-host installed VSIX in VS Code 1.98.2 and passed the full run/share flow
npm run test:load           200 health requests at 789 requests/second
npm run test:coherence      3 fresh-connection create/read/submit/reply/delete cycles pass
```

The browser suite covers keyboard operation, dialogs, route focus, 200% text, reduced motion, 390 px mobile, desktop, and 404 pages. Axe reports no serious or critical findings.

The repaired local geometry check reports 44 × 44 px for Demo on all nine routes. The stored consent value is `true`, with one exact indicator per attempt.

The backend started under `env -i` with only `PATH` and `PORT=8080`. A lesson remained readable after a graceful stop and restart, then deletion returned 204.

Response checks passed for CSP, `frame-ancestors 'none'`, `nosniff`, referrer policy, immutable hashed assets, trusted CORS, denied untrusted CORS, and real 404 status. Rate-limit tests assert 429 plus `Retry-After: 1`.

Local Lighthouse results:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.2 s |
| LCP | 1.7 s |
| TBT | 0 ms |
| CLS | 0.006 |
| Transfer | 113 KiB |

Initial JavaScript is 46.55 KB raw and 14.69 KB gzip. CSS is 30.54 KB raw and 7.17 KB gzip.

Evidence is under [evidence/repair-11-local](evidence/repair-11-local): screenshots, tutor consent view, Lighthouse JSON, and the `verify-url.sh` report.

## Deploy and live identity

The final repository commit is deployed through the product-owned configuration:

```bash
scripts/deploy-release.sh "$(git rev-parse HEAD)"
```

That release command builds `sf-code-lesson-checkpoints`, applies only `sf-code-lesson-checkpoints` resources, verifies `/health`, restarts the serving revision, checks SQLite persistence, and runs four live coherence cycles.

After deployment, live `/health` reports the same complete 40-character commit as final `HEAD`. Live browser, PWA, claims, policy, and identity checks use `https://code-lesson-checkpoints.sociobot.in`.

## Known gap

The local archive does not satisfy the brief’s researched small-team monetization scope. This is an explicit scope decision, not a shipped-team claim.

Docker is unavailable in the worker. The Dockerfile contract tests pass, and the factory ACR build validates the multi-stage image during deployment.
