# Adversarial first-read review 2

**Product:** Code Lesson Checkpoints

**Reviewed:** 2026-09-02 UTC

**Repository candidate:** `7165825afd3b35bd8112c7050b472ee7d5827a0f`

**Live build:** `b9ad53befbea480deff92c3d984802f55a925802`
**URL:** <https://code-lesson-checkpoints.sociobot.in>

The candidate differs from the live build only by verification documents and screenshots. Product source is identical.

## Verdict: FAIL

The core tutor/learner flow, one-click demo, privacy boundary, routes, accessibility checks, and all 12 declared claims pass. The review still has eight findings: two reopened blocking findings, two major findings, and four minor findings. The claims manifest remains incomplete, the paid “Team” feature is only a one-tutor browser-local link list, one required first-screen fact is below the desktop fold, one semantic heading is slogan-like, and two README sentences use avoidable testing jargon.

## Findings

### Blocking

#### F-1-6 — The public backend architecture claim remains unlisted

- **Exact quote/location:** README, “What is included”: “A Rust and SQLite service for lesson records.”
- **Verification:** `.factory/claims.json` has no claim for the Rust service or SQLite storage. The statement is true in the code and `/health`, but the required manifest has no independently runnable test for it.
- **Why this remains blocking:** Review 1 identified the public backend/security bundle as unlisted. The repair removed most of that bundle but retained two architecture promises without adding a claim. This is a half-fix of the earlier finding, so it is reopened with the same ID.
- **Concrete fix:** Remove the implementation-stack bullet from public copy, or add a `runtime-stack` claim whose tagged clean-sandbox test starts the release binary and verifies the Rust service and SQLite state.

#### F-1-15 — The README still overstates claims-manifest completeness

- **Exact quote/location:** README, “Test and verify”: “Each public promise and its independent command are listed in `.factory/claims.json`.”
- **Verification:** F-1-6 and F-2-1 identify public promises with no manifest entry.
- **Why this remains blocking:** The same completeness statement failed review 1. Marking it fixed did not make it true.
- **Concrete fix:** Add tagged claims for every retained public promise, then rewrite this sentence as “`.factory/claims.json` lists each public promise and the command that tests it.”

### Major

#### F-2-1 — “Responsive” is an unlisted public claim

- **Exact quote/location:** README, “What is included”: “A responsive TypeScript web app for tutors and learners.”
- **Why this matters:** A reader can rely on “responsive,” but no claim in `.factory/claims.json` names or tests responsive behavior. `npm run test:e2e` checks mobile layouts, but it is not the one tagged test required for a public claim.
- **Concrete fix:** Add a `responsive-layout` claim with a tagged test that asserts the principal routes at 390 px, desktop, and 200% text, or remove “responsive” and say “A web app for tutors and learners.”

#### F-2-2 — The brief’s paid team workflow is still missing

- **Exact quote/location:** Landing and `/pricing`: “Optional Team archive,” “For one tutor,” and “Team archive searches lesson links saved on this device.” README: “This release does not provide shared team accounts, team history, or roster management.”
- **Why this matters:** The brief funds the relay with “paid small-team history and roster controls.” A normal buyer seeing “Team archive” expects shared membership, history, and access across devices. The shipped feature is an honestly described but browser-local index for one tutor; it does not satisfy that obvious team use case.
- **Concrete fix:** Implement authenticated team membership, a shared roster, searchable server-side lesson history, roles, deletion/access controls, and cross-device sync in product-owned SQLite. Add demo fixtures and claims for membership isolation, roster search, history reopening, deletion, and sync. Until then, rename the plan “Local archive” so “Team” does not imply collaboration.

### Minor

#### F-2-3 — The three required facts do not all fit on the desktop first screen

- **Exact location:** Landing hero at 1440 × 900, `scrollY=0`, `.trust-row`.
- **Verification:** “No source uploads” and “Learners review output before sharing” end at `900.05 px`; “Free lesson planning” runs from `920.05–940.05 px` and is not visible. All three fit at 390 × 844.
- **Why this matters:** The required first-screen shape includes three visible privacy/offline/price facts. A desktop visitor must scroll to see the third.
- **Concrete fix:** Reduce the desktop hero’s top/vertical spacing or move the facts directly under the primary action. Add an assertion that every `.trust-row li` has `bottom <= innerHeight` at 1440 × 900.

#### F-2-4 — The process section’s semantic heading is a slogan

- **Exact quote/location:** Landing `h2`: “A record of the work, not a recording of the learner.” The visible “How it works” label is a paragraph, not a heading.
- **Why this matters:** In the screen-reader heading list, this line does not name the three-step process. It uses contrast wordplay where an out-of-context section name is required.
- **Concrete fix:** Make the `h2` “How tutors and learners use checkpoints.” Keep the record/not-recording sentence as supporting copy if needed.

#### F-2-5 — The extension test description uses compressed jargon

- **Exact quote/location:** README: “Run `npm run test:extension-host` to install the built VSIX in VS Code 1.98.2 and exercise its complete confirmation, local-run, redaction, and sharing flow.”
- **Why this matters:** “complete confirmation,” “local-run,” and “redaction” do not say what the test verifies on first read.
- **Concrete fix:** “Run `npm run test:extension-host` to install the VSIX. It verifies command review, local execution, hidden credentials, and sharing approval.”

#### F-2-6 — The prerequisite sentence calls a test a “claim”

- **Exact quote/location:** README: “On Debian or Ubuntu, install `xvfb` and `libgtk-3-0` before the extension-host claim.”
- **Why this matters:** A developer needs the command to run, not the repository’s claims-system terminology.
- **Concrete fix:** “On Debian or Ubuntu, install `xvfb` and `libgtk-3-0` before running `npm run test:extension-host`.”

## Cold first read

Fresh browser contexts were opened at both sizes. Nothing was scrolled or clicked before the answers were recorded.

| Viewport | What does it do? | For whom? | What should I click first? | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | Lets a tutor add commands or tests, then see the run results a learner chooses to share. | Remote programming tutors and their learners. | **Try it with sample data**. | Clear. Headline, audience, action, outcome, and all three facts are visible. |
| 1440 × 900 | Same answer; the paper path also signals an ordered lesson flow. | Same answer. | **Try it with sample data**. | The three core questions are clear. F-2-3 records that the third required fact is below the fold. |

The exact first-screen headline is “See where the lesson got stuck.” The supporting copy is “Remote programming tutors add commands or tests for each lesson step. Learners run them locally and choose what to share.” The primary action says “Try it with sample data,” followed by “Opens Sam’s three-checkpoint lesson in a temporary demo.” No blocking first-read ambiguity was found.

## Complete copy audit

Counts treat contractions, hyphenated terms, commands, paths, versions, and URLs as one word. Headings, labels, buttons, list items, and the meaningful image alternative are included because visitors encounter them as copy. Code blocks are commands rather than sentences and are not repeated. No unit exceeds 22 words and no banned marketing word appears.

### Live landing page

| # | Copy | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Skip to content | 3 | Pass |
| 2 | Code Lesson Checkpoints | 3 | Pass |
| 3 | Demo | 1 | Pass |
| 4 | Join lesson | 2 | Pass |
| 5 | Team plan | 2 | Pass |
| 6 | Plan a lesson | 3 | Pass |
| 7 | Learners choose what to share | 5 | Pass |
| 8 | See where the lesson got stuck. | 6 | Pass |
| 9 | Remote programming tutors add commands or tests for each lesson step. | 11 | Pass |
| 10 | Learners run them locally and choose what to share. | 9 | Pass |
| 11 | Try it with sample data | 5 | Pass |
| 12 | Opens Sam’s three-checkpoint lesson in a temporary demo. | 8 | Pass |
| 13 | Plan a lesson | 3 | Pass |
| 14 | Join with a lesson code | 5 | Pass |
| 15 | No source uploads | 3 | Pass |
| 16 | Learners review output before sharing | 5 | Pass |
| 17 | Free lesson planning | 3 | Pass; F-2-3 is placement, not wording |
| 18 | A paper-cut path where a small terminal slip crosses three checkpoint steps toward a reply flag | 16 | Pass; image alternative |
| 19 | Run locally | 2 | Pass |
| 20 | Share selected output | 3 | Pass |
| 21 | Reply in context | 3 | Pass |
| 22 | How it works | 3 | Pass as visible label; see F-2-4 for heading semantics |
| 23 | A record of the work, not a recording of the learner. | 11 | F-2-4 |
| 24 | Add checkpoints | 2 | Pass |
| 25 | Add the commands or tests that define progress. | 8 | Pass |
| 26 | Learners can copy them into their own terminal. | 8 | Pass |
| 27 | Run and review | 3 | Pass |
| 28 | Learners choose Passed or Blocked. | 5 | Pass |
| 29 | They check hidden passwords and keys, then approve what leaves their computer. | 12 | Pass |
| 30 | Install the VS Code companion | 5 | Pass |
| 31 | Reply to the blocked attempt | 5 | Pass |
| 32 | Read the selected output and note in order. | 8 | Pass |
| 33 | Reply to the exact attempt that needs help. | 8 | Pass |
| 34 | What this tool does not do | 6 | Pass |
| 35 | Share lesson results, not source code. | 6 | Pass |
| 36 | No remote control, keystroke recording, source collection, automated grading, or generated answers. | 12 | Pass |
| 37 | The learner keeps the keyboard—and the context. | 8 | Pass |
| 38 | Create your first lesson | 4 | Pass |
| 39 | Optional Team archive | 3 | F-2-2 |
| 40 | Keep private tutor links together. | 5 | Pass |
| 41 | Lesson planning and sharing stay free. | 6 | Pass |
| 42 | Team archive searches lesson links saved on this device. | 9 | F-2-2 |
| 43 | $39 once | 2 | Pass |
| 44 | For one tutor | 3 | F-2-2 |
| 45 | Search by learner or lesson | 5 | Pass |
| 46 | Reopen saved tutor links | 4 | Pass |
| 47 | No recurring fee | 3 | Pass |
| 48 | See Team archive details | 4 | Pass |
| 49 | Learners choose which run results to share. | 7 | Pass |
| 50 | Privacy | 1 | Pass |
| 51 | Terms | 1 | Pass |
| 52 | Source on GitHub (external) | 4 | Pass |
| 53 | Paper-path artwork generated for this product. | 6 | Pass |
| 54 | No source code is uploaded by default. | 7 | Pass |
| 55 | Built by Param Factory · Version 0.1.0 | 7 | Pass |

### README

| # | Copy | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Code Lesson Checkpoints | 3 | Pass |
| 2 | Code Lesson Checkpoints helps remote programming tutors see where a learner’s code first fails. | 14 | Pass |
| 3 | Tutors add commands or tests. | 5 | Pass |
| 4 | Learners run them locally and choose whether to share a status, selected output, and note. | 15 | Pass |
| 5 | The tutor sees attempts in order and replies to the blocked attempt without taking over the learner’s screen. | 18 | Pass |
| 6 | Lesson planning and sharing are free. | 6 | Pass |
| 7 | The optional Team archive costs $39 once. | 7 | F-2-2 |
| 8 | It searches and reopens tutor links saved on that device. | 10 | F-2-2 |
| 9 | Checkout runs on Sociobot’s hosted billing page. | 7 | Pass |
| 10 | The app never embeds a payment provider. | 7 | Pass |
| 11 | This release does not provide shared team accounts, team history, or roster management. | 13 | F-2-2 |
| 12 | The researched small-team scope remains a future product decision, documented in `.factory/scope-decision.md`. | 12 | F-2-2 |
| 13 | Try the sample | 3 | Pass |
| 14 | Open the isolated sample at https://code-lesson-checkpoints.sociobot.in/?demo=1. | 6 | Pass |
| 15 | It contains three checkpoints, passed and blocked runs, hidden sample credentials, a learner note, and a tutor reply. | 18 | Pass |
| 16 | Reset demo replaces the temporary workspace. | 6 | Pass |
| 17 | Start for real deletes the sample and opens the lesson planner. | 11 | Pass |
| 18 | The demo uses only the `demo:clc:workspace` browser key. | 8 | Pass |
| 19 | It never reads or changes real lesson keys. | 8 | Pass |
| 20 | What is included | 3 | Pass |
| 21 | A Rust and SQLite service for lesson records | 8 | F-1-6 |
| 22 | A responsive TypeScript web app for tutors and learners | 9 | F-2-1 |
| 23 | An isolated sample that reloads offline after its first visit | 10 | Pass |
| 24 | JSON export and permanent lesson deletion | 6 | Pass |
| 25 | Local and server checks that hide common keys and cap output | 11 | Pass |
| 26 | A packaged VS Code companion for running tutor commands locally | 10 | Pass |
| 27 | Install the VS Code companion | 5 | Pass |
| 28 | Download Code Lesson Checkpoints 0.1.0. | 5 | Pass |
| 29 | Open the Extensions view in VS Code. | 7 | Pass |
| 30 | Choose Install from VSIX… from the view menu. | 8 | Pass |
| 31 | Select the downloaded file. | 4 | Pass |
| 32 | Run Code Lesson: Connect to Lesson and enter the six-character lesson code. | 12 | Pass |
| 33 | Run Code Lesson: Open Checkpoints to review a command before running it. | 12 | Pass |
| 34 | For extension development, open this repository with `extension/` as the extension root. | 12 | Pass |
| 35 | Run `npm run test:extension-host` to install the built VSIX in VS Code 1.98.2 and exercise its complete confirmation, local-run, redaction, and sharing flow. | 21 | F-2-5 |
| 36 | Run locally | 2 | Pass |
| 37 | Requirements: Node 22+, npm 10+, current stable Rust, and a C toolchain. | 12 | Pass |
| 38 | On Debian or Ubuntu, install `xvfb` and `libgtk-3-0` before the extension-host claim. | 12 | F-2-6 |
| 39 | Open http://localhost:8080. | 2 | Pass |
| 40 | For frontend hot reload, run `cargo run` and `npm run dev` in separate terminals. | 12 | Pass |
| 41 | Test and verify | 3 | Pass |
| 42 | Each public promise and its independent command are listed in `.factory/claims.json`. | 11 | F-1-15 |
| 43 | The isolated sample is documented in `.factory/demo.md`. | 7 | Pass |
| 44 | Privacy and product boundaries | 4 | Pass |
| 45 | Source files are never requested or uploaded. | 7 | Pass |
| 46 | Learners approve every shared run. | 5 | Pass |
| 47 | The service stores lesson steps, selected output, notes, replies, and timestamps. | 11 | Pass |
| 48 | Tutors can permanently delete the complete lesson record. | 8 | Pass |
| 49 | This product is not remote desktop software, a recorder, an automated grader, or a code generator. | 16 | Pass |
| 50 | Read the live privacy notice and terms. | 7 | Pass |
| 51 | The paper-path illustration was generated for this product. | 8 | Pass |
| 52 | Its prompt and provenance are in `.factory/design.md`. | 7 | Pass |
| 53 | Deploy | 1 | Pass |
| 54 | Build the multi-stage image with `docker build -t code-lesson-checkpoints .`. | 6 | Pass |
| 55 | The factory release command is `scripts/deploy-release.sh <full-commit-sha>`. | 6 | Pass |
| 56 | Deployment configuration lives in `deployment/container-app.json`. | 5 | Pass |
| 57 | License | 1 | Pass |
| 58 | MIT — see LICENSE. | 4 | Pass |

### Terminology check

| Concept | Term used | Result |
| --- | --- | --- |
| Tutor-defined command or test | checkpoint | Consistent |
| Learner-selected status and output | run results | Consistent |
| Learner explanation | note | Consistent |
| Six-character learner access | lesson code | Consistent |
| Private tutor access | tutor link | Consistent |
| Isolated sample workspace | demo | Consistent |
| Paid local link index | Team archive | Internally consistent, but misleading against “For one tutor”; F-2-2 |

Buttons and links use result-naming actions. No button is labeled “Submit,” “Go,” or “Continue.”

## Demo and sandbox

**Pass.** The first click from `/` opens `/?demo=1`. At 390 × 844 and `scrollY=0`, the first demo screen already shows Sam’s “Debugging the weather API” lesson, three checkpoints, passed and blocked runs, selected output with `[redacted]`, a note, and a tutor reply.

The persistent banner says “Demo — sample data, nothing is saved” and includes **Reset demo** and **Start for real**. Two real-storage sentinel keys remained byte-for-byte unchanged. The only demo key was `demo:clc:workspace`. Reset created a different workspace and the old backend workspace returned 404. Start for real opened `/new`, removed the demo key, and retained the real sentinels. The complete public/demo request log contained only `https://code-lesson-checkpoints.sociobot.in`.

The clean-sandbox offline claim registered the service worker, loaded the demo, took its browser context offline, reloaded the populated lesson, and displayed the offline notice.

## Claims

A clean local clone at candidate `7165825` was installed and built before testing. Each command from `.factory/claims.json` was run separately against its fresh local SQLite service. VS Code’s documented Linux host library was absent initially; after installing `libgtk-3-0`, the exact claim ran to completion. That setup error occurred before product execution and is not counted as a claim failure.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | Three populated checkpoints, ~24-hour isolated workspace, reset/delete/exit, real sentinels unchanged. |
| `lesson-workflow` | PASS | Ordered checkpoints and attempts, clipboard command, first block, exact reply, cleanup. |
| `consented-redacted-evidence` | PASS | Missing consent and wrong tutor token rejected; secret hidden; output capped; consent visible; reply round-trip. |
| `offline-demo-reload` | PASS | Fresh context reloaded the populated demo offline. |
| `json-export` | PASS | Downloaded JSON parsed with the sample title, three checkpoints, and blocked attempt. |
| `paid-team-checkout` | PASS | Exact $39 once copy; Sociobot returned 303 to hosted checkout; no embedded provider. |
| `license-restore` | PASS | Return token, URL stripping, manual restore, daily cache, and invalidation passed with fixtures. |
| `team-roster-history` | PASS | Three browser-local tutor links filtered, opened, and persisted after reload. |
| `privacy-boundaries` | PASS | Same-origin public/demo requests; no upload, capture, tracker, analytics, or remote-control code. |
| `permanent-lesson-deletion` | PASS | Learner and tutor reads returned 404 after deletion. |
| `vscode-companion-download` | PASS | Live VSIX downloaded, installed in VS Code 1.98.2, ran a local fixture, redacted output, and required sharing confirmation. |
| `original-artwork` | PASS | Dated prompt, source image, and shipped AVIF/WebP/social derivatives exist. |

No declared claim is untested or failing. F-1-6 and F-2-1 are unlisted claims, and F-1-15 is the resulting false completeness statement.

## Earlier findings, rechecked live and in code

| Earlier ID | Result in this review | Evidence |
| --- | --- | --- |
| F-1-1 | Fixed | Paid copy now states browser-local search/reopen behavior and $39 once; tagged claim passes. |
| F-1-2 | Fixed | Versioned live VSIX installs and completes its host test. |
| F-1-3 | Fixed | `lesson-workflow` checks order, copy, first block, attempts, reply, and cleanup. |
| F-1-4 | Fixed | `demo-isolation` checks every sample element, reset, exit, and sentinels. |
| F-1-5 | Fixed | Checkout claim scans assets/requests and confirms Sociobot-hosted redirect. |
| F-1-6 | **Reopened — BLOCKING** | The shorter Rust/SQLite architecture statement is still public and unlisted. |
| F-1-7 | Fixed | Packaged extension and real Extension Development Host flow pass. |
| F-1-8 | Fixed | The earlier bundled accessibility/offline sentence is gone; focused offline and browser tests pass. New responsive-copy issue is F-2-1. |
| F-1-9 | Fixed | Fixture-backed return, cache, restore, and invalidation checks pass. |
| F-1-10 | Fixed | Visitor-facing runtime identity promises were removed. |
| F-1-11 | Fixed | Azure Files recovery promise was removed from public copy. |
| F-1-12 | Fixed | Rate-limit implementation promise was removed from public copy. |
| F-1-13 | Fixed | Public release-script behavior promise was removed. |
| F-1-14 | Fixed | `original-artwork` passes against prompt, source, date, and derivatives. |
| F-1-15 | **Reopened — BLOCKING** | The completeness sentence remains false while F-1-6 and F-2-1 are unlisted. |
| F-1-16 | Fixed | Forward, Back, and Forward focus the route h1; polite announcer is present. |
| F-1-17 | Fixed | Demo attempt fields use h3; no h2-to-h4 skip remains. |
| F-1-18 | Fixed | Footer says “Source on GitHub (external).” |
| F-1-19 | Fixed | Unknown routes return HTTP 404 with h1 “Page not found.” |
| F-1-20 | Fixed | The sample action has an adjacent, concrete outcome sentence. |
| F-1-21 | Fixed | Hero label says “Learners choose what to share.” |
| F-1-22 | Fixed | First use explains commands/tests; title says what the product does. |
| F-1-23 | Fixed | Action says “Join with a lesson code.” |
| F-1-24 | Fixed | Fact says “Learners review output before sharing.” |
| F-1-25 | Fixed | Visible section label says “How it works.” F-2-4 concerns the semantic h2. |
| F-1-26 | Fixed | Step heading says “Add checkpoints.” |
| F-1-27 | Fixed | Copy explains hidden passwords and keys. |
| F-1-28 | Fixed | Step heading says “Reply to the blocked attempt.” |
| F-1-29 | Fixed | Site and README use “note.” |
| F-1-30 | Fixed | Label says “What this tool does not do.” |
| F-1-31 | Fixed | Heading says “Share lesson results, not source code.” |
| F-1-32 | Fixed | Footer says learners choose which run results to share. |
| F-1-33 | Fixed | README opens with the tutor’s job and first failure. |
| F-1-34 | Fixed | Workflow is split into short sentences and uses “note.” |
| F-1-35 | Fixed | Free/paid behavior is concrete; “useful” is gone. |
| F-1-36 | Fixed | The old 25-word backend bundle is gone. F-1-6 covers the retained unlisted architecture claim. |
| F-1-37 | Fixed | Extension behavior is split, narrowed, downloadable, and tested. |
| F-1-38 | Fixed | Restore copy is plain and the restore claim passes. |
| F-1-39 | Fixed | Long API-test sentence was removed. |
| F-1-40 | Fixed | “Exact browser/API regression” is gone. |
| F-1-41 | Fixed | Development setup is split and below the hard cap; new jargon is F-2-5. |
| F-1-42 | Fixed | Long Docker implementation sentence was replaced by one build command. |
| F-1-43 | Fixed | Single-replica recovery promise was removed from public copy. |
| F-1-44 | Fixed | Release-script behavior promise was removed from public copy. |

## Structure, routing, links, and accessibility

- `/`, `/demo`, `/join`, `/new`, `/pricing`, `/team`, `/privacy`, and `/terms` return 200. An unknown deep link returns a designed HTTP 404 with a home action.
- Each checked route has one h1, one main landmark, `lang="en"`, route-specific title/description/canonical/OG metadata, product social image, SVG favicon, touch icon, consistent header/footer, Privacy, and Terms.
- The home title is 53 characters and follows “Product — what it does.” Route titles follow “Route — Product.”
- History navigation focuses the new h1 and announces route changes. Back restores the home route and h1 focus.
- All discovered internal routes and the VSIX return 200. The GitHub source returns 200. The Sociobot checkout returns the expected 303. No dead link was found.
- Response headers include `X-Content-Type-Options`, `Referrer-Policy`, and a CSP with `frame-ancestors 'none'`; there were no normal-route console errors.
- The live Playwright/axe suite passed all principal routes at mobile and desktop sizes, keyboard/dialog behavior, visible focus, touch targets, 200% text, and no horizontal overflow. `/opt/fleet/lib/verify-url.sh` returned no errors and confirmed title, language, one h1, main, and image alternatives.
- The paper-cut diorama, warm paper palette, serif/Hyperlegible pairing, status stamps, and hard offset shadows are recognizably product-specific, not a generic SaaS template.
- F-2-3 and F-2-4 are the remaining structure issues.

## Missed leverage

F-2-2 is the concrete missed-leverage issue: the brief calls for paid small-team history and roster controls, while the product only keeps one tutor’s private links in one browser. Shared roster/history sync is the obvious next capability. AI assistance is not warranted because code generation is an explicit non-goal and the teaching loop depends on learner reasoning. JSON export exists; no runtime model or provider key is embedded.

## What would make this perfect

Close the two manifest gaps and make the completeness sentence true. Replace the one-tutor “Team archive” with the brief’s secure shared roster/history workflow, or use a non-team name until that exists. Fit all three facts inside the desktop first screen, make the process h2 name the process, and rewrite the two jargon-heavy README sentences. Then rerun all 12 claim commands, the live accessibility suite, the link crawl, demo isolation/reset/offline checks, and a new cold first-read review. PASS requires zero remaining findings.
