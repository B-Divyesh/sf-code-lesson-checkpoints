# Review tutor checkpoint sharing workflow — PASS

- **Work order:** `code-lesson-checkpoints-review-4`
- **Reviewed:** 2026-09-05 UTC
- **Implementation candidate:** `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`
- **Documentation baseline:** `7f0448e2663f9d718f47176351b12548ab38c483`
- **Live URL:** <https://code-lesson-checkpoints.sociobot.in>

## Verdict

**PASS — zero findings at every severity and zero untested public claims.**

No product code was changed. The live health response names the implementation candidate. Commits after that candidate contain only review, verification, handoff, and scoped isolation records. A candidate-aware local build matched all 24 non-VSIX live files byte-for-byte; the downloaded live VSIX passed its installed consumer workflow.

## First screen

Fresh browser contexts were opened without stored state, scrolling, or prior navigation.

| Viewport | Job | Audience | First action | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 phone | See where the lesson got stuck. | Remote programming tutors and learners. | **Try it with sample data**. | Clear. The outcome and all three facts fit before scrolling. |
| 1440 × 900 desktop | See where the lesson got stuck. | Remote programming tutors and learners. | **Try it with sample data**. | Clear. The outcome and all three facts fit before scrolling. |

The exact audience text is: “Remote programming tutors add commands or tests for each lesson step. Learners run them locally and choose what to share.” The adjacent outcome says the action opens Sam’s three-checkpoint temporary demo. The visible facts are **No source uploads**, **Learners review output before sharing**, and **Free lesson planning**.

Screenshots are in `/work/.evidence/review-4/first-read-phone.png` and `first-read-desktop.png`.

## Sample workflow and isolation

**Pass.** One click opened `/?demo=1` on phone and desktop. The first demo screen was already populated with Sam’s “Debugging the weather API” lesson, three ordered checkpoints, a passed run, a blocked run, `Authorization: [redacted]`, a learner note, and a tutor reply. It identified checkpoint 2 as the first block.

The label **“Demo — sample data, nothing is saved”** remained present with **Reset demo** and **Start for real**. Reset created a different 24-hour workspace and the old workspace returned the expected HTTP 404. Real `clc:*` sentinels were unchanged. Start for real removed the demo key, preserved the real sentinels, and opened `/new`. Public and demo traffic stayed on the product origin.

## Declared claims

`npm ci` was run in a detached clean checkout of the documentation baseline. The README-listed Ubuntu VS Code host prerequisite was installed before measuring the extension claim. Every exact command in `.factory/claims.json` passed individually against the clean local production server. The combined suite then passed against the live URL.

| Claim | Clean local command | Live suite |
| --- | --- | --- |
| `demo-isolation` | Pass | Pass |
| `lesson-workflow` | Pass | Pass |
| `consented-redacted-evidence` | Pass | Pass |
| `offline-demo-reload` | Pass | Pass |
| `json-export` | Pass | Pass |
| `paid-team-checkout` | Pass | Pass |
| `license-restore` | Pass | Pass |
| `team-roster-history` | Pass | Pass |
| `privacy-boundaries` | Pass | Pass |
| `permanent-lesson-deletion` | Pass | Pass |
| `vscode-companion-download` | Pass | Pass |
| `original-artwork` | Pass | Pass |

The VS Code claim downloaded the live versioned VSIX, installed it in VS Code 1.98.2, showed the exact command before execution, ran the local fixture, hid its credential, asked before sharing, and checked the submitted payload. Landing, application, legal, and README copy were cross-checked against the manifest. No unlisted, false, partial, or untested public claim was found.

## Normal, invalid, boundary, and recovery paths

- The local and live browser suites created a lesson, joined it, opened the evidence dialog with Enter and Space, closed it with Escape, shared a blocked run, hid a credential, displayed stored consent, sent a tutor reply, reloaded both views, and permanently deleted the lesson.
- A nonexistent lesson code showed “Lesson unavailable” and told the learner what to do. **Check another code** returned to the form, and a valid code then opened a newly created lesson without reloading the site.
- Missing consent was rejected. An incorrect tutor token was rejected. An 8,100-character output was redacted and capped. A request over the 64 KiB body limit returned 413. A malformed first `X-Forwarded-For` hop returned 400.
- The product origin received the expected CORS allowance; an unrelated origin received no allow-origin header.
- License return, URL stripping, restore, one-day cache, and invalid-license removal passed with fixture responses. Hosted checkout returned the expected redirect and no payment provider was embedded.
- Deletion removed checkpoints, runs, notes, and replies; subsequent learner and tutor reads returned the expected 404.

## Accessibility, privacy, offline, and site structure

- Playwright Axe found zero serious or critical violations on home, demo, join, lesson setup, pricing, team, privacy, terms, lesson views, the evidence dialog, and the designed 404 at phone and desktop sizes.
- Keyboard order, skip links, Enter, Space, Escape, dialog focus/return, Back/Forward heading focus, route announcements, visible focus, 44 px targets, and heading order passed.
- Every principal route remained usable at 390 px with root text doubled. No horizontal overflow or clipped header action appeared. Reduced motion removed meaningful transitions and smooth scrolling.
- The service worker updated successfully. After the first visit, the sample reloaded offline and explained that sharing updates needs a connection.
- Public and demo flows made only same-origin requests. No tracker, third-party analytics, media capture, file upload, source upload, remote-control SDK, or external script ran.
- `/`, `/demo`, `/join`, `/new`, `/pricing`, `/team`, `/privacy`, and `/terms` returned 200 with route-specific titles, descriptions, canonicals, one h1, `lang="en"`, and one main landmark.
- Privacy and Terms loaded, internal actions worked, and the versioned VSIX resolved. `robots.txt` links the sitemap, which lists all eight public routes.
- An unknown route deliberately returned HTTP 404 and rendered the product’s **Page not found** screen with a return-home link. This expected status is not a defect.
- The worker URL verifier found no console errors, missing image alternatives, or unnamed buttons.

## Backend and runtime

- Live `/health` returned 200 with `status: ok`, `database: sqlite`, and build `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`.
- Two live fresh-connection create/read/submit/reply/delete cycles passed. A separate local production process created a lesson, stopped, restarted on the same SQLite file, read the lesson, deleted it, and confirmed 404 cleanup.
- Team owner/member contexts shared only their Team workspace. The member reopened shared history on another device; only the owner could remove roster access; the removed member then received 403.
- A live burst of 180 reads produced 115 expected 404 responses and 65 rate limits. A burst of 70 invalid writes produced 30 validation responses and 40 rate limits. Every 429 included `Retry-After: 1`.
- Secure response headers include `X-Content-Type-Options`, `Referrer-Policy`, and a response-header CSP with `frame-ancestors 'none'`.

## Quality and performance

- `npm test`: pass — 12 frontend/unit checks and 13 Rust checks.
- `npm run check` and `npm run lint`: pass.
- `BUILD_SHA=<candidate> npm run build`: pass; `dist/` and the versioned VSIX were produced.
- `npm run test:package`: pass.
- `npm run test:e2e`: pass locally and live.
- `npm run test:pwa`: pass locally and live.
- `npm run test:load`: pass — 200 health requests at 256 requests per second.
- `npm run test:coherence`: pass locally and for two live cycles.
- App JavaScript is 15.90 kB gzip; CSS is 7.33 kB gzip. The phone AVIF hero is 15.9 kB.
- Fresh live mobile Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.5 s, CLS 0.006, total blocking time 0 ms.

## Earlier findings

Every earlier finding was rechecked in the current live runtime and unchanged candidate source.

| Earlier ID | Current disposition and proof |
| --- | --- |
| F-1-1 | Fixed — the $39 result is the tested shared Team workspace. |
| F-1-2 | Fixed — the live VSIX downloaded, installed, and completed the host flow. |
| F-1-3 | Fixed — ordered checkpoints, command copy, first block, attempts, and reply passed. |
| F-1-4 | Fixed — all sample elements, reset, exit, and real-key sentinels passed. |
| F-1-5 | Fixed — checkout is Sociobot-hosted and the embed scan passed. |
| F-1-6 | Fixed — the unlisted public architecture wording remains removed. |
| F-1-7 | Fixed — packaged extension execution, redaction, and approval passed. |
| F-1-8 | Fixed — the unlisted reliability bundle remains removed; focused checks passed. |
| F-1-9 | Fixed — return, cache, restore, and revocation passed. |
| F-1-10 | Fixed — visitor-facing runtime implementation claims remain removed. |
| F-1-11 | Fixed — Azure Files recovery wording remains internal. |
| F-1-12 | Fixed — rate-limit implementation wording remains internal; runtime behavior passed. |
| F-1-13 | Fixed — release behavior remains outside visitor claims. |
| F-1-14 | Fixed — dated prompt, source, and derivatives passed provenance checks. |
| F-1-15 | Fixed — every retained public promise has one manifest entry and test. |
| F-1-16 | Fixed — forward, Back, and Forward focus and announce the route h1. |
| F-1-17 | Fixed — lesson attempt headings do not skip levels. |
| F-1-18 | Fixed — the source link says it is external. |
| F-1-19 | Fixed — the designed 404 uses “Page not found.” |
| F-1-20 | Fixed — the concrete demo outcome is adjacent to the primary action. |
| F-1-21 | Fixed — learner-choice wording remains plain. |
| F-1-22 | Fixed — commands and tests explain checkpoints on first use. |
| F-1-23 | Fixed — “Join with a lesson code” names the result. |
| F-1-24 | Fixed — the output-review fact names the learner and action. |
| F-1-25 | Fixed — the process heading names how tutors and learners use checkpoints. |
| F-1-26 | Fixed — the step says “Add checkpoints.” |
| F-1-27 | Fixed — the copy explains hidden passwords and keys. |
| F-1-28 | Fixed — the reply heading names the blocked attempt. |
| F-1-29 | Fixed — “note” remains the consistent term. |
| F-1-30 | Fixed — the boundary label states what the tool does not do. |
| F-1-31 | Fixed — the section plainly says results are shared, not source code. |
| F-1-32 | Fixed — the footer states that learners choose shared run results. |
| F-1-33 | Fixed — README opens with the tutor’s job and first failure. |
| F-1-34 | Fixed — README workflow sentences are short and use “note.” |
| F-1-35 | Fixed — free and paid behavior is concrete. |
| F-1-36 | Fixed — the long public backend bundle remains removed. |
| F-1-37 | Fixed — companion install and tested behavior are clear. |
| F-1-38 | Fixed — license restore wording is plain and its flow passed. |
| F-1-39 | Fixed — the long API-test sentence remains removed. |
| F-1-40 | Fixed — claims documentation uses direct words. |
| F-1-41 | Fixed — extension-host instructions remain short and concrete. |
| F-1-42 | Fixed — Docker instructions remain direct. |
| F-1-43 | Fixed — single-replica recovery detail remains internal. |
| F-1-44 | Fixed — release-script behavior remains outside public claims. |
| F-2-1 | Fixed — the untested “responsive” public claim remains removed. |
| F-2-2 | Fixed — shared roster/history, cross-device access, and owner removal passed live. |
| F-2-3 | Fixed — all three facts fit at 1440 × 900. |
| F-2-4 | Fixed — the semantic h2 names the process. |
| F-2-5 | Fixed — the VSIX test description remains direct. |
| F-2-6 | Fixed — the Linux prerequisite names the command to run. |

## Missed leverage and evidence

No missing obvious feature was found. The brief’s extension, export, shared history, roster controls, isolation, and deletion paths are present. AI assistance is not warranted because generated answers are an explicit non-goal and learner reasoning is central to the product.

Fresh screenshots, Lighthouse JSON, and URL-verifier output are under `/work/.evidence/review-4/`. This report is copied to `/work/.evidence/qa-report.md`; the matching machine result is `/work/.evidence/qa-result.json`.
