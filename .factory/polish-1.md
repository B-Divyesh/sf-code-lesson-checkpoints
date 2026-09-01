# Polish round 1

Source review: `.factory/review-1.md` at `e82c687edcfbef6e46ba8ed4427b2212ee6d4fb4`.
Local screenshots: `.factory/evidence/polish-1/home-mobile.png`, `home-desktop.png`, and `demo-mobile.png`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced “Extended lesson history” with “Reopen tutor links saved on this device” everywhere. | `@claim:team-roster-history`; `/pricing`; `/terms` |
| F-1-2 | Build now creates a versioned VSIX. Landing, learner entry, and README link to it with install steps. | `@claim:vscode-companion-download`; `npm run test:package` |
| F-1-3 | Added an ordered three-checkpoint workflow test covering copy, first block, attempts, and reply. | `@claim:lesson-workflow` |
| F-1-4 | Demo claim now checks all sample content, old-workspace deletion, exit, and real-key preservation. | `@claim:demo-isolation` |
| F-1-5 | Kept the no-embed wording and added built-asset and request-origin checks. | `@claim:paid-team-checkout` |
| F-1-6 | Removed the public bundle of internal backend implementation promises. | README copy audit; `npm test` still covers the backend |
| F-1-7 | Narrowed public extension wording to tested behavior and added package inspection. | `@claim:vscode-companion-download`; `npm run test:package` |
| F-1-8 | Removed the bundled README promise; retained focused offline and browser accessibility tests. | `@claim:offline-demo-reload`; `npm run test:e2e` |
| F-1-9 | Added fixture-backed return, URL stripping, manual restore, daily cache, and revocation coverage. Cache is bound to its token. | `@claim:license-restore` |
| F-1-10 | Removed visitor-facing runtime identity promises and kept operational checks in the test suite. | `npm test`; `/health` deployment check |
| F-1-11 | Removed the Azure Files recovery promise from public copy. | `npm test` regression remains internal |
| F-1-12 | Removed rate-limit implementation copy from public marketing. | Rust rate-limit tests in `npm test` |
| F-1-13 | Moved release behavior out of public claims; README now names only the release command. | `npm run test:coherence`; deployment script |
| F-1-14 | Added a provenance claim for source, prompt, date, and shipped derivatives. | `@claim:original-artwork` |
| F-1-15 | Rebuilt the manifest so every retained public promise has one exact command. | `tests/claims-manifest.test.ts`; 12 individual claim commands |
| F-1-16 | Added History API navigation, popstate restoration, h1 focus, and a polite route announcer. | `npm run test:e2e` forward/back focus assertions |
| F-1-17 | Changed attempt field headings from h4 to h3. | `npm run test:e2e` heading assertion; demo screenshot |
| F-1-18 | Renamed the footer link to “Source on GitHub (external)”. | `npm run test:e2e` 404/footer assertion |
| F-1-19 | Changed the 404 h1 to “Page not found”. | `npm run test:e2e` real 404 assertion |
| F-1-20 | Added the adjacent outcome “Opens Sam’s three-checkpoint lesson in a temporary demo.” | mobile screenshot; `@claim:demo-isolation` |
| F-1-21 | Replaced “Learner-owned evidence” with “Learners choose what to share”. | `.factory/copy-audit.md` |
| F-1-22 | Explained lesson steps as commands or tests and replaced the title wording. | home title/metadata checks in `npm run test:e2e` |
| F-1-23 | Replaced “I have a lesson code” with “Join with a lesson code”. | mobile screenshot |
| F-1-24 | Replaced passive copy with “Learners review output before sharing”. | mobile screenshot |
| F-1-25 | Replaced “The lesson trail” with “How it works”. | `.factory/copy-audit.md` |
| F-1-26 | Replaced “Mark the milestones” with “Add checkpoints”. | `.factory/copy-audit.md` |
| F-1-27 | Explained redaction as checking hidden passwords and keys. | `.factory/copy-audit.md`; `@claim:consented-redacted-evidence` |
| F-1-28 | Replaced “Respond at the first snag” with “Reply to the blocked attempt”. | `.factory/copy-audit.md` |
| F-1-29 | Uses “note” consistently in the site, README, and extension. | repository text scan; `.factory/copy-audit.md` |
| F-1-30 | Replaced “Built-in boundary” with “What this tool does not do”. | mobile screenshot |
| F-1-31 | Replaced the jargon heading with “Share lesson results, not source code.” | mobile screenshot |
| F-1-32 | Footer now says “Learners choose which run results to share.” | `npm run test:e2e`; mobile screenshot |
| F-1-33 | README opens with the tutor’s job and first failure. | README; `.factory/copy-audit.md` |
| F-1-34 | Split the workflow into short sentences and standardized “note”. | README; `.factory/copy-audit.md` |
| F-1-35 | Replaced “useful” with concrete free and paid behavior. | README; `/pricing` |
| F-1-36 | Removed the long implementation-feature bullet. | README copy audit |
| F-1-37 | Split and narrowed extension behavior; added install steps. | README; `@claim:vscode-companion-download` |
| F-1-38 | Rewrote license restore in plain words. | `/pricing`; `@claim:license-restore` |
| F-1-39 | Removed the long API-test description. | README copy audit |
| F-1-40 | Rewrote claim documentation in plain words. | README; `tests/claims-manifest.test.ts` |
| F-1-41 | Split extension-development instructions into two short sentences. | README copy audit |
| F-1-42 | Replaced the long Docker implementation sentence with one build instruction. | README copy audit |
| F-1-43 | Removed the public single-replica lock-recovery promise. | README copy audit; internal regression still passes |
| F-1-44 | Removed the public release-script behavior promise. | README copy audit; deployment verification remains in handoff |

## Local verification

- `npm test`: 12 Vitest and 13 Rust tests passed.
- `npm run build`: passed; `dist/` contains the app and versioned VSIX; app JS is 14.38 kB gzip.
- `npm run test:claims`: all 12 claims passed.
- `npm run lint`: TypeScript, rustfmt, and Clippy passed.
- `npm run test:package`: packaged consumer inspection passed.
- `npm run test:e2e`: mobile/desktop, routing, focus, headings, metadata, 404, keyboard, console, privacy, and axe passed.
- `npm run test:pwa`: update and offline sample reload passed.
- `npm run test:load`: 200 health requests at 566 requests/second.

## Live verification

- <https://code-lesson-checkpoints.sociobot.in> returned the corrected first screen, metadata, legal links, and installable VSIX.
- <https://code-lesson-checkpoints.sociobot.in/?demo=1> opened the isolated populated sample with its banner, reset, and exit controls.
- All 12 claim commands passed independently against the live URL.
- The release persistence check passed four fresh create/read/submit/reply/delete cycles.
- The worker URL verifier reported no console errors and complete title/lang/main/image-alt basics.
- Live Lighthouse scored 100 performance, 100 accessibility, 100 best practices, and 100 SEO.
