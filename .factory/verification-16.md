# Verify tutor checkpoint sharing workflow — PASS

- **Work order:** `code-lesson-checkpoints-verify-16`
- **Implementation candidate:** `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`
- **Documentation and isolation report SHA:** `171dbfc00dd3c1ec5abb17ea188e105b88609d00`
- **Live URL:** https://code-lesson-checkpoints.sociobot.in
- **Verified:** 2026-09-05 UTC

## Verdict

**PASS.** There are zero findings at every severity and zero untested public claims. The live product is the reviewed implementation candidate. The later commit records the scoped secret cleanup and does not change the product image or source.

## First screen and sample

Fresh 390 × 844 phone and 1440 × 900 desktop contexts were opened at `/` with no stored state and without scrolling.

- **Job:** See where the lesson got stuck.
- **Audience:** Remote programming tutors and learners.
- **First action:** Try it with sample data. Its adjacent text says it opens Sam’s three-checkpoint temporary demo.

The live page had no console or page errors. One click opened the populated sample with three ordered checkpoints, passed and blocked runs, redacted sample output, a learner note, a tutor reply, and the persistent label **“Demo — sample data, nothing is saved.”** Reset demo created a new temporary workspace; Start for real removed only the `demo:clc:workspace` key and opened the lesson planner. Real-storage sentinels remained unchanged. The sample is isolated from real lesson rows and its old workspace returned 404 after reset.

## Claims

`npm ci` was run from the clean checkout. `libgtk-3-0`, the README-listed Linux prerequisite for the VS Code host, was then installed before measuring the extension-host claim. Every exact command in `.factory/claims.json` passed individually against the local production server and the combined live claim suite passed against the live URL.

| Claim | Result |
| --- | --- |
| `demo-isolation` | Pass |
| `lesson-workflow` | Pass |
| `consented-redacted-evidence` | Pass |
| `offline-demo-reload` | Pass |
| `json-export` | Pass |
| `paid-team-checkout` | Pass |
| `license-restore` | Pass |
| `team-roster-history` | Pass |
| `privacy-boundaries` | Pass |
| `permanent-lesson-deletion` | Pass |
| `vscode-companion-download` | Pass |
| `original-artwork` | Pass |

The VS Code claim installed the versioned VSIX in a VS Code 1.98.2 Extension Development Host, showed the local command before execution, ran its fixture, hid the fixture credential, asked before sharing, and checked the sent payload. The public landing and README copy were cross-checked against the manifest; no unlisted promise was found.

## Product checks

- `npm test`: pass — 12 frontend/unit checks and 13 Rust checks.
- `npm run check` and `npm run lint`: pass.
- `BUILD_SHA=<candidate> npm run build`: pass. `dist/` and the versioned VSIX were produced; app JavaScript is 15.90 kB gzip and CSS is 7.33 kB gzip.
- `npm run test:package`: pass.
- Local and live `npm run test:e2e`, `npm run test:pwa`, and `npm run test:coherence`: pass.
- Local `npm run test:load`: pass — 200 health requests at 755 requests per second.
- The worker URL verifier passed on the live home page: HTTP 200, title, `lang=en`, one h1, `main`, complete image alternatives, labelled buttons, and no console errors.

The standalone Axe CLI could not run with the preinstalled Playwright Chromium: its bundled ChromeDriver supports Chrome 152 while that browser is Chrome 145. This is a tool-version mismatch, not an untested check. The product's Playwright Axe integration ran successfully on home, demo, join, new, pricing, team, privacy, terms, lesson forms, dialogs, and the expected 404 at phone and desktop sizes with zero serious or critical violations.

Keyboard, focus, visible focus, Enter, Space, Escape, dialog focus return, Back/Forward route focus, and the polite route announcement passed. All visible interactive targets were at least 44 × 44 px. The eight principal routes kept every header action visible, focusable, and clickable at 390 px with root text doubled. Reduced motion removes meaningful transitions. Service-worker update and offline sample reload show the expected offline notice. Privacy checks saw only same-origin public/demo requests; no tracker, media capture, file upload, source upload, or remote-control SDK was present.

Each checked route has its own title, description, canonical URL, one h1 and main landmark. Privacy and terms load, internal links work, and the deliberate unknown-route HTTP 404 renders the product's "Page not found" screen with a working return-home action. The 404 is expected behavior, not a defect.

## Backend checks

Live `/health` returned HTTPS 200 with `status: ok`, `database: sqlite`, and the full implementation SHA `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`.

The tenant and authorization paths are exercised by the passed team-roster, consent, deletion, and tutor-token claim flows: separate owner/member contexts share only their Team workspace, a non-owner cannot remove roster access, a wrong tutor token is rejected, and deleted records return 404.

A local production process created a lesson, was stopped, restarted, read the same lesson successfully, and deleted the fixture. This proves SQLite restart persistence using the documented working-directory fallback when `/data` is absent. The deployed product's health remains SQLite-backed after its scoped cleanup.

Live rate-limit probes used 180 unknown-code reads and 70 invalid writes from one client. Reads returned 114 expected 404s and 66 `429`s; writes returned 3 validation responses and 67 `429`s. Every limited response had `Retry-After: 1`.

## Candidate and earlier findings

The live health SHA is the implementation candidate. A candidate-aware local production build matched all 24 non-VSIX live files byte-for-byte. The live claim suite also installed and exercised the downloaded VSIX.

All earlier findings were rechecked. `review-3.md`'s complete disposition list remains correct: **F-1-1 through F-1-44** and **F-2-1 through F-2-6** are fixed. This verification re-ran their relevant evidence: paid price and hosted checkout, VSIX consumer flow, ordered checkpoint/reply workflow, demo reset and isolation, claim completeness, route focus and headings, labelled source link, 404, plain wording, README wording, responsive 200% text, shared Team roster/history with owner removal, and documented Linux prerequisites. No finding reopened.

## Scope and evidence

No product code was changed. The scoped isolation cleanup reported by `.factory/isolation-2026-09-05.md` remains consistent with live health: the unused named secret was removed without reading it, while the image, revision, replica, volume, environment, build SHA, HTTPS health, and SQLite status stayed unchanged.

URL-verifier output is in `/work/.evidence/verification-16-url/`. The complete report is copied to `/work/.evidence/qa-report.md`; its matching machine result is `/work/.evidence/qa-result.json`.
