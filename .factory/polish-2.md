# Polish round 2

Source reports: `.factory/review-1.md` and `.factory/review-2.md`.
Local evidence: `.factory/evidence/polish-2/home-desktop.png`, `home-mobile.png`, and `demo-mobile.png`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Defined the $39 paid result as the shared Team workspace. | `@claim:paid-team-checkout`; `/pricing` |
| F-1-2 | Kept the versioned downloadable VSIX and install path. | `@claim:vscode-companion-download` |
| F-1-3 | Kept ordered checkpoints, copied commands, first block, and replies. | `@claim:lesson-workflow` |
| F-1-4 | Kept the fully populated isolated sample, reset, exit, and sentinel checks. | `@claim:demo-isolation`; `demo-mobile.png` |
| F-1-5 | Kept the hosted Sociobot checkout scan. | `@claim:paid-team-checkout` |
| F-1-6 | Removed the public Rust/SQLite architecture promise rather than leaving it unlisted. | README audit; `npm test` |
| F-1-7 | Kept the packaged companion and its host-flow regression. | `@claim:vscode-companion-download` |
| F-1-8 | Kept focused offline and keyboard/reduced-motion tests without an unlisted public bundle. | `@claim:offline-demo-reload`; `npm run test:e2e` |
| F-1-9 | Kept fixture-backed license return, cache, restore, and revocation coverage. | `@claim:license-restore` |
| F-1-10 | Kept runtime details out of visitor copy. | README audit; `npm test` |
| F-1-11 | Kept Azure Files recovery details out of visitor copy. | README audit; `npm test` |
| F-1-12 | Kept rate-limit implementation details out of visitor copy. | `npm test` rate-limit tests |
| F-1-13 | Kept release behavior out of visitor claims. | README audit |
| F-1-14 | Kept artwork provenance and its claim test. | `@claim:original-artwork` |
| F-1-15 | The manifest now matches every retained public promise. | `tests/claims-manifest.test.ts`; all 12 claim commands |
| F-1-16 | Kept History API h1 focus and route announcement. | `npm run test:e2e` |
| F-1-17 | Kept real h2/h3 lesson outlines. | `npm run test:e2e` |
| F-1-18 | Kept the external-link label. | `npm run test:e2e` |
| F-1-19 | Kept the designed plain-language 404. | `npm run test:e2e` |
| F-1-20 | Kept the adjacent sample outcome. | `home-mobile.png`; `@claim:demo-isolation` |
| F-1-21 | Kept plain learner-choice wording. | `.factory/copy-audit.md` |
| F-1-22 | Kept commands/tests explained on first use. | `home-desktop.png` |
| F-1-23 | Kept the result-naming join action. | `home-mobile.png` |
| F-1-24 | Kept explicit learner output review wording. | `home-desktop.png` |
| F-1-25 | Kept the visible How it works label. | `home-desktop.png` |
| F-1-26 | Kept Add checkpoints wording. | `.factory/copy-audit.md` |
| F-1-27 | Kept plain hidden-password/key wording. | `.factory/copy-audit.md` |
| F-1-28 | Kept Reply to the blocked attempt wording. | `.factory/copy-audit.md` |
| F-1-29 | Kept note terminology. | `.factory/copy-audit.md` |
| F-1-30 | Kept a plain privacy-boundary label. | `home-mobile.png` |
| F-1-31 | Kept the source-code boundary heading. | `home-mobile.png` |
| F-1-32 | Kept plain footer wording. | `npm run test:e2e` |
| F-1-33 | Kept the tutor-first README opening. | `.factory/copy-audit.md` |
| F-1-34 | Kept short workflow sentences and note terminology. | `.factory/copy-audit.md` |
| F-1-35 | Replaced the paid local index with concrete shared team behavior. | README; `@claim:team-roster-history` |
| F-1-36 | Removed the unlisted backend bundle. | README audit |
| F-1-37 | Kept split companion install and behavior copy. | README; `@claim:vscode-companion-download` |
| F-1-38 | Kept plain license restore copy. | `@claim:license-restore` |
| F-1-39 | Kept API-test jargon out of README. | README audit |
| F-1-40 | Kept the claims explanation in plain words. | README audit |
| F-1-41 | Rewrote the extension-host sentence in concrete words. | README audit |
| F-1-42 | Kept the short Docker build instruction. | README audit |
| F-1-43 | Kept single-replica implementation detail out of public copy. | README audit |
| F-1-44 | Kept release-script behavior out of public copy. | README audit |
| F-2-1 | Removed the untested responsive implementation claim. | README audit; `npm run test:e2e` still tests layouts |
| F-2-2 | Implemented SQLite-backed shared Team workspaces: owner/member tokens, invite code, shared history, cross-device open, replies, and owner removal. | `@claim:team-roster-history`; `/team` |
| F-2-3 | Shifted the desktop hero copy so all three facts fit at 1440 × 900. | `npm run test:e2e`; `home-desktop.png` |
| F-2-4 | Made the process h2 “How tutors and learners use checkpoints.” | `home-desktop.png`; `npm run test:e2e` |
| F-2-5 | Rewrote the extension test description in direct language. | README audit |
| F-2-6 | Rewrote the Linux prerequisite in direct language. | README audit |

## Verification

- `npm test`, `npm run build`, `npm run lint`, `npm run test:claims`, `npm run test:e2e`, `npm run test:pwa`, `npm run test:load`, and `npm run test:package` passed locally.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:8080 .factory/evidence/polish-2` passed with no console errors, one h1, language, main landmark, and complete image alternatives.
- Playwright axe integration in `npm run test:e2e` passed on all principal mobile and desktop routes. The standalone Axe CLI could not locate a system Chrome binary, so the installed Playwright browser integration is the recorded axe evidence.
