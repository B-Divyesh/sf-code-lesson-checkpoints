# Adversarial first-read review 1

**Product:** Code Lesson Checkpoints

**Reviewed:** 2026-08-30 UTC

**Repository candidate:** `6a7d236cc3aa896355b182195779f431ff2ca465`

**Live build:** `d101dafe759a13c787acbbaa113dbd827f4ee491` (the intervening repository commit contains verification documentation only)

**URL:** <https://code-lesson-checkpoints.sociobot.in>

## Verdict: FAIL

The first screen and sample demo are clear and functional. All eight declared claim tests pass. The review still fails because the paid plan contains an undefined promise, the brief's VS Code companion has no visitor-installable path, public claims are missing from the claims manifest, route focus and demo heading structure do not meet the contract, and the copy audit has unresolved plain-language flags. This review has 44 findings, including 2 blocking findings.

## 1. Cold first read

Fresh contexts were opened without scrolling or retained site data.

| Viewport | What does it do? | For whom? | What should I click first? | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | Lets a tutor define coding checkpoints and lets a learner choose which run evidence to share. | Remote programming tutors and their learners. | **Try it with sample data**. | Clear; the action is fully visible at `scrollY=0`. |
| 1440 × 900 | Same answer. The paper-path illustration reinforces a sequence of local run, selected output, and reply. | Same answer. | **Try it with sample data**. | Clear; the action is visible without scrolling. |

The exact first-screen copy was “See where the lesson got stuck.” and “Remote programming tutors define runnable checkpoints. Learners run them locally and choose what evidence to share.” This passes the mandatory three-question test. F-1-20 still records that the required next-screen explanation is not placed beside the primary action.

## 2. Findings

### Blocking

#### F-1-1 — The paid plan promises undefined “Extended lesson history”

- **Location/quote:** `/pricing`, Team archive list: “Extended lesson history”; README: “small-roster history controls.”
- **Evidence:** The client stores up to 100 lesson links in `clc:archive` for every tutor before checking a license. The Team claim test seeds three local links and checks search/reload, but no copy defines what “extended” means and no test establishes a free-versus-paid history limit.
- **Why this blocks:** A visitor is asked to pay $39 for a benefit whose extent and distinction from Pair cannot be determined or verified.
- **Concrete fix:** Replace the item with the implemented result, such as “Search and reopen lesson links saved on this device,” and remove the vague README wording. If a larger retention limit is intended, state both plan limits, enforce them, and add a quantitative claim test.

#### F-1-2 — The brief's VS Code companion is not installable by a visitor

- **Location/quote:** README, “VS Code companion”; the only instruction is to open an Extension Development Host or package `extension/` with `@vscode/vsce`. The live site offers no extension download or install link.
- **Evidence:** The repository builds and packages a VSIX during testing, but no versioned VSIX is linked from the site or README and no marketplace/install URL is supplied.
- **Why this blocks:** The researched smallest useful product explicitly includes a VS Code extension. A tutor can create a lesson, but a learner cannot obtain that companion through a normal product path.
- **Concrete fix:** Publish a versioned VSIX or marketplace listing, link “Install the VS Code companion” from the learner flow and README, document its first-run connection step, and test the downloadable artifact from a clean project.

### Major — unlisted or incompletely tested claims

#### F-1-3 — The core ordered tutor/learner workflow is not a declared claim

- **Location/quote:** Landing: “Add the shell commands or tests that define progress. The learner can copy them into their own terminal.” and “Read the selected output and reflection in sequence. Reply to the exact attempt that needs a nudge.” README: “The tutor sees attempts in order and replies at the first misconception.”
- **Why:** `consented-redacted-evidence` verifies one submission and reply, but no claim names or tests ordered multi-attempt display, command copying, or identifying the first blocked checkpoint.
- **Concrete fix:** Add `lesson-workflow` to `claims.json` and a tagged browser test that creates multiple checkpoints and attempts, copies the command, verifies order, identifies the first block, and attaches a reply to that attempt. Otherwise narrow the copy to the tested behavior.

#### F-1-4 — The complete public demo description is not asserted

- **Location/quote:** README: “It opens a realistic three-checkpoint lesson with a passed run, a blocked run, redacted evidence, and a tutor reply.” and “Start for real discards the sample and opens the lesson planner.”
- **Why:** `json-export` checks three checkpoints and one blocked status. `demo-isolation` checks Reset, but does not assert the passed run, redacted output, tutor reply, or Start for real behavior.
- **Concrete fix:** Extend the tagged demo tests to assert every stated sample element, deletion of the old workspace, removal of the demo key, navigation to `/new`, and preservation of real sentinel keys.

#### F-1-5 — “Never embeds a payment provider” is unlisted

- **Location/quote:** README: “The app never embeds a payment provider.”
- **Why:** `paid-team-checkout` proves the advertised link redirects through Sociobot, but does not check built assets and network traffic for direct provider scripts or endpoints.
- **Concrete fix:** Add this wording to the paid-checkout claim and scan built HTML/JS plus the pricing request log for direct payment-provider embeds, or remove the sentence.

#### F-1-6 — The backend/security bundle is unlisted

- **Location/quote:** README bullet beginning “Rust/Axum relay with one durable SQLite state file, hashed private tutor tokens, short learner codes, validation, secure response headers, JSON logs, migrations, and graceful shutdown.”
- **Why:** These are nine independently relied-on implementation and security claims. None appears in `claims.json`.
- **Concrete fix:** Split the bullet into documented, testable properties. Add claim entries for durable SQLite state, hashed tutor authorization, response headers, migrations, and shutdown behavior; remove details that do not need to be promised publicly.

#### F-1-7 — The extension behavior is unlisted

- **Location/quote:** README: the extension “displays the exact tutor-defined command for learner confirmation, runs locally, redacts/caps output, and asks again before sharing.”
- **Why:** The redaction claim test exercises the web/API path, not a packaged extension in a temporary project.
- **Concrete fix:** Add an extension-specific claim and run the packaged extension against bundled sample input in a temporary workspace, asserting confirmation, local execution, redaction, cap, and consent. Otherwise remove the behavioral promise.

#### F-1-8 — UI reliability and accessibility promises are unlisted

- **Location/quote:** README: “Offline shell, explicit loading/empty/error states, keyboard-operable forms and dialogs, and reduced-motion treatment.”
- **Why:** The test suite covers much of this, but the sentence is absent from `claims.json`, so the manifest is not the promised inventory of public claims.
- **Concrete fix:** Add separate tagged claims for offline shell behavior and keyboard/reduced-motion behavior, or turn this into internal implementation notes outside public product copy.

#### F-1-9 — License return, cache, and restore are unlisted

- **Location/quote:** README: “Hosted-checkout license return, daily verification cache, and restore-by-token flow.”
- **Why:** `paid-team-checkout` stops at the checkout redirect. It does not test the return token, daily cache, or manual restore path.
- **Concrete fix:** Add a tagged fixture-backed license restore test that verifies return handling, cache age, invalidation, and manual restore; rewrite the sentence in plain words.

#### F-1-10 — Runtime configuration and health claims are unlisted

- **Location/quote:** README: “The container starts with only `PORT`…” and “`/health` reports the compiled build SHA and `database: "sqlite"`.”
- **Why:** These observable operational claims are tested elsewhere but absent from `claims.json`.
- **Concrete fix:** Add a runtime-identity claim that starts the release binary in a temporary directory and checks configuration, state path, build SHA, and database identity.

#### F-1-11 — Single-replica lock recovery is unlisted

- **Location/quote:** README: “The one-replica deployment retires stale mounted revisions before a new candidate starts, which lets the product safely recover from an Azure Files advisory lock without risking a second writer.”
- **Why:** A regression test exists, but no claim entry makes this operational promise independently discoverable and runnable.
- **Concrete fix:** Add a tagged deployment claim that maps to the existing regression and deployment-contract assertions, or move the statement to internal handoff documentation.

#### F-1-12 — Rate-limit behavior is unlisted

- **Location/quote:** README: “API reads are capped per client, and writes use a stricter per-client allowance. Rate-limit responses include `Retry-After`.”
- **Why:** These observable reliability promises have tests but no manifest entries.
- **Concrete fix:** Add one tagged claim that asserts separate read/write limits and a positive `Retry-After` response.

#### F-1-13 — Release-script behavior is unlisted

- **Location/quote:** README: “It builds the immutable image, applies and reads back the one-replica `/data` mount, writes a canary, restarts the revision, verifies the canary after restart, and runs repeated fresh-connection lifecycle checks.”
- **Why:** This is a broad operational claim without a claims entry. The review did not run deployment because the work order forbids infrastructure changes.
- **Concrete fix:** Move the deployment promise to internal handoff documentation, or add a non-mutating contract test that verifies each script stage and list it in `claims.json`.

#### F-1-14 — Original-artwork provenance is unlisted

- **Location/quote:** Landing footer: “Paper-path artwork generated for this product.” README: “The generated hero illustration is original project artwork…”
- **Why:** The source and provenance files exist, but this public provenance claim is not in `claims.json`.
- **Concrete fix:** Add a static provenance claim that verifies the source prompt record, generated source asset, derivatives, and absence of third-party visual assets, or remove the public claim.

#### F-1-15 — The README's claim-map completeness statement is false

- **Location/quote:** README: “`.factory/claims.json` maps each public claim to one exact browser/API regression…”
- **Why:** F-1-1 and F-1-3 through F-1-14 identify public claims with no exact manifest entry or incomplete assertions.
- **Concrete fix:** Close those gaps, then retain the sentence. Until then, rewrite it as “`.factory/claims.json` lists the currently automated product claims.”

### Minor — structure and interaction

#### F-1-16 — Route changes do not move focus to the new heading

- **Location:** Home → Demo navigation and browser Back.
- **Evidence:** After both navigations, `document.activeElement` was `BODY`; no route announcer reported the new page heading. Back restored `scrollY=0`, but not focus.
- **Why:** Keyboard and screen-reader users are not placed at, or notified of, the new route content as required.
- **Concrete fix:** On every route render or full-page arrival, set `tabindex="-1"` on the page `h1`, focus it without scrolling, and update a persistent polite route-announcement region. Add forward/back assertions.

#### F-1-17 — Demo and lesson heading levels skip from h2 to h4

- **Location:** `/demo`, attempt headings “Selected output,” “Learner note,” and “Tutor reply.” The shared `submissionMarkup` also affects real lesson routes.
- **Evidence:** The live outline is `h1 → h2 checkpoint → h4 attempt fields`; no `h3` exists between them.
- **Why:** The visual outline is not represented by the semantic heading hierarchy.
- **Concrete fix:** Make attempt field headings `h3`, or add an `h3` for the attempt and use non-heading labels below it. Add an outline assertion to the browser test.

#### F-1-18 — The external source link is not identified as external

- **Location/quote:** Every footer: “Source” links to GitHub.
- **Why:** The site-structure contract requires external links to say so; the label gives no warning that navigation leaves the product.
- **Concrete fix:** Rename it “Source on GitHub (external)” and give any decorative external-link icon an accessible label.

#### F-1-19 — The 404 heading is metaphorical

- **Location/quote:** Unknown route h1: “This path has no checkpoint.”
- **Why:** The page is designed and returns HTTP 404, but the heading does not plainly name the error out of context.
- **Concrete fix:** Use `Page not found` as the h1; retain the checkpoint language only in supporting text.

#### F-1-20 — The primary action lacks the required adjacent outcome

- **Location/quote:** First screen action: “Try it with sample data.”
- **Why:** The action is clear, but no adjacent text says what opens after the click.
- **Concrete fix:** Add “Opens Sam's three-checkpoint lesson in a temporary demo.” immediately beside or below the action.

### Minor — landing-page copy

#### F-1-21 — “Learner-owned evidence” is jargon

- **Location/quote:** Hero eyebrow: “Learner-owned evidence.”
- **Why:** A cold visitor has not yet learned what “evidence” means here.
- **Concrete fix:** “Learners choose what to share.”

#### F-1-22 — “Runnable checkpoints” is undefined on first use

- **Location/quote:** “Remote programming tutors define runnable checkpoints.” Metadata/title also says “Share runnable milestones.”
- **Why:** “Runnable” and “checkpoint” require product context before the visitor can interpret them.
- **Concrete fix:** “Remote programming tutors add commands or tests for each lesson step.” Use “Code Lesson Checkpoints — See where learners get stuck” for the title.

#### F-1-23 — “I have a lesson code” does not name the result

- **Location/quote:** Hero link: “I have a lesson code.”
- **Why:** It describes the visitor, not what the link will do.
- **Concrete fix:** “Open a lesson” or “Join with a lesson code.”

#### F-1-24 — “Output reviewed first” hides the actor and action

- **Location/quote:** Hero fact: “Output reviewed first.”
- **Why:** It does not say who reviews the output or when sharing occurs.
- **Concrete fix:** “Learners review output before sharing.”

#### F-1-25 — “The lesson trail” is a metaphorical section label

- **Location/quote:** Eyebrow above the process section: “The lesson trail.”
- **Why:** It does not name the section's purpose when read alone.
- **Concrete fix:** “How it works.”

#### F-1-26 — “Mark the milestones” is metaphorical

- **Location/quote:** First process-step heading: “Mark the milestones.”
- **Why:** The action actually adds commands or tests as checkpoints.
- **Concrete fix:** “Add checkpoints.”

#### F-1-27 — “Automatic secret redaction” is unexplained jargon

- **Location/quote:** “They choose Passed or Blocked, review automatic secret redaction, and consent before anything leaves their machine.”
- **Why:** A visitor must translate “redaction” before understanding the privacy step.
- **Concrete fix:** “Learners choose Passed or Blocked, check hidden passwords and keys, then approve what leaves their computer.”

#### F-1-28 — “Respond at the first snag” is a metaphorical heading

- **Location/quote:** Third process-step heading: “Respond at the first snag.”
- **Why:** “Snag” is less precise than the product's established “blocked” status.
- **Concrete fix:** “Reply to the blocked attempt.”

#### F-1-29 — “Reflection” conflicts with “note”

- **Location/quote:** Landing: “Read the selected output and reflection in sequence.” README: “optional reflection.” Elsewhere the field and claim use “note.”
- **Why:** One concept has two names.
- **Concrete fix:** Replace “reflection” with “note” in both locations.

#### F-1-30 — “Built-in boundary” is a decorative label

- **Location/quote:** Boundary-section label: “Built-in boundary.”
- **Why:** It does not name the section's content.
- **Concrete fix:** “What this tool does not do.”

#### F-1-31 — “A checkpoint relay. Not an IDE.” relies on jargon

- **Location/quote:** Boundary-section h2.
- **Why:** “Relay” and “IDE” make the heading harder to understand out of context.
- **Concrete fix:** “Share lesson evidence, not source code.”

#### F-1-32 — The footer repeats “execution evidence” jargon

- **Location/quote:** “Execution evidence, shared by the learner.”
- **Why:** It could describe many developer tools and does not use the page's plainest wording.
- **Concrete fix:** “Learners choose which run results to share.”

### Minor — README copy

#### F-1-33 — The opening sentence uses jargon and a metaphor

- **Quote:** “Code Lesson Checkpoints gives remote programming tutors a consent-based trail of runnable milestones.”
- **Why:** “Consent-based trail” and “runnable milestones” require interpretation.
- **Concrete fix:** “Code Lesson Checkpoints helps remote programming tutors see where a learner's code first fails.”

#### F-1-34 — The core workflow sentence has 24 words

- **Quote:** “A tutor defines commands or tests, a learner runs them locally, and the learner shares only a status, selected output, and an optional reflection.”
- **Concrete fix:** “Tutors define commands or tests. Learners run them locally and choose whether to share a status, output, and note.”

#### F-1-35 — “Useful” is an unsupported marketing adjective

- **Quote:** “The free Pair plan is useful for one tutor/learner pair.”
- **Why:** “Useful” provides no verifiable plan detail.
- **Concrete fix:** “The Pair plan is free for one tutor and one learner.”

#### F-1-36 — The backend feature bullet has 25 words

- **Quote:** “Rust/Axum relay with one durable SQLite state file, hashed private tutor tokens, short learner codes, validation, secure response headers, JSON logs, migrations, and graceful shutdown.”
- **Concrete fix:** “Backend: Rust, Axum, and one durable SQLite file. It hashes tutor tokens, validates input, logs JSON, applies migrations, and shuts down cleanly.”

#### F-1-37 — The extension feature bullet has 24 words

- **Quote:** “VS Code extension source under `extension/`; it displays the exact tutor-defined command for learner confirmation, runs locally, redacts/caps output, and asks again before sharing.”
- **Concrete fix:** “VS Code extension: shows the tutor's command for confirmation and runs it locally. It redacts and caps output, then asks before sharing.”

#### F-1-38 — The hosted-checkout bullet is compressed jargon

- **Quote:** “Hosted-checkout license return, daily verification cache, and restore-by-token flow.”
- **Concrete fix:** “Returning buyers can restore a license token. The app checks that token once a day.”

#### F-1-39 — The API integration sentence has 26 words

- **Quote:** “The complete API integration test creates a lesson, opens it as the learner, submits redacted evidence, reads it through the private tutor link, and deletes it.”
- **Concrete fix:** “One API test covers the complete lesson flow. It creates, opens, submits, reads, and deletes a lesson.”

#### F-1-40 — “Exact browser/API regression” is testing jargon

- **Quote:** “`.factory/claims.json` maps each public claim to one exact browser/API regression, and `.factory/demo.md` documents the clean demo entry point.”
- **Concrete fix:** “`.factory/claims.json` lists each public promise and its automated test. `.factory/demo.md` explains the isolated sample.”

#### F-1-41 — The extension-development sentence has 27 words

- **Quote:** “For local development, open the repository in VS Code and use an Extension Development Host with `extension/` as the extension root, or package that folder with `@vscode/vsce`.”
- **Concrete fix:** “Open the repository in VS Code with `extension/` as the extension root. Use an Extension Development Host or package it with `@vscode/vsce`.”

#### F-1-42 — The Dockerfile sentence has 23 words

- **Quote:** “The multi-stage Dockerfile compiles both frontend and Rust service, runs as a non-root user on port 8080, and creates a writable `/data` directory.”
- **Concrete fix:** “The multi-stage Dockerfile builds the frontend and Rust service. It runs as a non-root user on port 8080 with writable `/data`.”

#### F-1-43 — The single-replica sentence has 29 words

- **Quote:** “The one-replica deployment retires stale mounted revisions before a new candidate starts, which lets the product safely recover from an Azure Files advisory lock without risking a second writer.”
- **Concrete fix:** “Deployment retires old revisions before they share the SQLite mount. This prevents a second writer and recovers from Azure Files locks.”

#### F-1-44 — The release-script sentence has 30 words

- **Quote:** “It builds the immutable image, applies and reads back the one-replica `/data` mount, writes a canary, restarts the revision, verifies the canary after restart, and runs repeated fresh-connection lifecycle checks.”
- **Concrete fix:** “The script builds the image and checks the `/data` mount. It restarts the revision, verifies a canary, then repeats lifecycle checks.”

## 3. Complete copy audit

Counts treat contractions, slash terms, and hyphenated compounds as one word. URLs and paths count as one. Interface labels, headings, and the meaningful image alternative are included even when they are fragments.

### Live landing page

| # | Copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Code Lesson Checkpoints | 3 | — |
| 2 | Demo | 1 | — |
| 3 | Join lesson | 2 | — |
| 4 | Team plan | 2 | — |
| 5 | Plan a lesson | 3 | — |
| 6 | Learner-owned evidence | 2 | F-1-21 |
| 7 | See where the lesson got stuck. | 6 | — |
| 8 | Remote programming tutors define runnable checkpoints. | 6 | F-1-22 |
| 9 | Learners run them locally and choose what evidence to share. | 10 | — |
| 10 | Try it with sample data | 5 | F-1-20 |
| 11 | Plan a lesson | 3 | — |
| 12 | I have a lesson code | 5 | F-1-23 |
| 13 | No source uploads | 3 | — |
| 14 | Output reviewed first | 3 | F-1-24 |
| 15 | Free for one pair | 4 | — |
| 16 | A paper-cut path where a small terminal slip crosses three checkpoint steps toward a reply flag | 16 | —; this is useful image alternative text |
| 17 | Run locally | 2 | — |
| 18 | Share selected output | 3 | — |
| 19 | Reply in context | 3 | — |
| 20 | The lesson trail | 3 | F-1-25 |
| 21 | A record of the work, not a recording of the learner. | 11 | — |
| 22 | Mark the milestones | 3 | F-1-26 |
| 23 | Add the shell commands or tests that define progress. | 9 | — |
| 24 | The learner can copy them into their own terminal. | 9 | — |
| 25 | Learner runs & reviews | 3 | — |
| 26 | They choose Passed or Blocked, review automatic secret redaction, and consent before anything leaves their machine. | 16 | F-1-27 |
| 27 | Respond at the first snag | 5 | F-1-28 |
| 28 | Read the selected output and reflection in sequence. | 8 | F-1-29 |
| 29 | Reply to the exact attempt that needs a nudge. | 9 | — |
| 30 | Built-in boundary | 2 | F-1-30 |
| 31 | A checkpoint relay. | 3 | F-1-31 |
| 32 | Not an IDE. | 3 | F-1-31 |
| 33 | No remote control, keystroke recording, source collection, automated grading, or generated answers. | 12 | — |
| 34 | The learner keeps the keyboard—and the context. | 8 | — |
| 35 | Create your first lesson | 4 | — |
| 36 | Execution evidence, shared by the learner. | 6 | F-1-32 |
| 37 | Paper-path artwork generated for this product. | 6 | F-1-14 |
| 38 | No source code is uploaded by default. | 7 | — |
| 39 | Built by Param Factory · Version 0.1.0 | 8 | — |

No landing-page copy unit exceeds 22 words and no banned marketing word appears.

### README

| # | Copy | Words | Flag |
| ---: | --- | ---: | --- |
| 1 | Code Lesson Checkpoints | 3 | — |
| 2 | Code Lesson Checkpoints gives remote programming tutors a consent-based trail of runnable milestones. | 13 | F-1-33 |
| 3 | A tutor defines commands or tests, a learner runs them locally, and the learner shares only a status, selected output, and an optional reflection. | 24 | F-1-29, F-1-34 |
| 4 | The tutor sees attempts in order and replies at the first misconception—without taking over the learner’s screen. | 18 | — |
| 5 | The free Pair plan is useful for one tutor/learner pair. | 10 | F-1-35 |
| 6 | A $39 one-time Team archive license adds small-roster history controls through the Sociobot billing service. | 15 | F-1-1 |
| 7 | The app never embeds a payment provider. | 7 | F-1-5 |
| 8 | Try the isolated sample at the demo URL. | 6 | — |
| 9 | It opens a realistic three-checkpoint lesson with a passed run, a blocked run, redacted evidence, and a tutor reply. | 19 | F-1-4 |
| 10 | Reset demo provisions a fresh 24-hour workspace. | 7 | — |
| 11 | Start for real discards the sample and opens the lesson planner. | 11 | F-1-4 |
| 12 | Demo state uses only the `demo:clc:workspace` browser key and never enters the real lesson tables. | 15 | — |
| 13 | What is included | 3 | — |
| 14 | Rust/Axum relay with one durable SQLite state file, hashed private tutor tokens, short learner codes, validation, secure response headers, JSON logs, migrations, and graceful shutdown | 25 | F-1-6, F-1-36 |
| 15 | Vite/TypeScript responsive web app for planning, joining, submitting evidence, responding, and deleting records | 13 | — |
| 16 | VS Code extension source under `extension/`; it displays the exact tutor-defined command for learner confirmation, runs locally, redacts/caps output, and asks again before sharing | 24 | F-1-7, F-1-37 |
| 17 | Local secret-pattern redaction plus a second server-side pass; 8,000-character output cap | 12 | — |
| 18 | Offline shell, explicit loading/empty/error states, keyboard-operable forms and dialogs, and reduced-motion treatment | 12 | F-1-8 |
| 19 | Hosted-checkout license return, daily verification cache, and restore-by-token flow | 9 | F-1-9, F-1-38 |
| 20 | Run locally | 2 | — |
| 21 | Requirements: Node 22+, npm 10+, Rust 1.85+ and a C toolchain. | 11 | — |
| 22 | Open the local URL. | 2 | — |
| 23 | For frontend hot reload, run `cargo run` and `npm run dev` in separate terminals, then open the Vite URL. | 17 | — |
| 24 | The container starts with only `PORT`; its state file is `/data/checkpoints.db` when the durable mount exists, otherwise `checkpoints.db` for local development. | 21 | F-1-10 |
| 25 | `/health` reports the compiled build SHA and `database: "sqlite"`. | 9 | F-1-10 |
| 26 | Test and verify | 3 | — |
| 27 | The complete API integration test creates a lesson, opens it as the learner, submits redacted evidence, reads it through the private tutor link, and deletes it. | 26 | F-1-39 |
| 28 | `.factory/claims.json` maps each public claim to one exact browser/API regression, and `.factory/demo.md` documents the clean demo entry point. | 18 | F-1-15, F-1-40 |
| 29 | VS Code companion | 3 | — |
| 30 | The compiled extension entry is `extension/dist/extension.js`. | 6 | — |
| 31 | For local development, open the repository in VS Code and use an Extension Development Host with `extension/` as the extension root, or package that folder with `@vscode/vsce`. | 27 | F-1-2, F-1-41 |
| 32 | The learner invokes Code Lesson: Connect to Lesson, enters the six-character code, and then uses Code Lesson: Open Checkpoints. | 19 | — |
| 33 | Privacy and product boundaries | 4 | — |
| 34 | Source files are never requested or uploaded. | 7 | — |
| 35 | The relay stores lesson titles, optional learner names, checkpoint definitions, selected output, notes, replies, and timestamps. | 16 | — |
| 36 | Tutors can permanently delete the complete record. | 7 | — |
| 37 | See `/privacy` and `/terms` in the running product. | 8 | — |
| 38 | This is not a remote desktop, browser IDE, monitoring recorder, automated grader, or code generator. | 15 | — |
| 39 | The generated hero illustration is original project artwork; prompt and provenance are recorded in `.factory/design.md` and `assets/src/hero-paper-path.json`. | 17 | F-1-14 |
| 40 | Deployment | 1 | — |
| 41 | The multi-stage Dockerfile compiles both frontend and Rust service, runs as a non-root user on port 8080, and creates a writable `/data` directory. | 23 | F-1-42 |
| 42 | `deployment/container-app.json` mounts the product-owned `sf-code-lesson-checkpoints-data` share at `/data` and pins the service to one replica. | 15 | F-1-10 |
| 43 | Lesson records, tutor authorization hashes, deletion, and demo workspaces persist in `/data/checkpoints.db`. | 12 | F-1-10 |
| 44 | SQLite uses rollback-journal (`DELETE`) mode rather than WAL. | 8 | F-1-11 |
| 45 | The one-replica deployment retires stale mounted revisions before a new candidate starts, which lets the product safely recover from an Azure Files advisory lock without risking a second writer. | 29 | F-1-11, F-1-43 |
| 46 | API reads are capped per client, and writes use a stricter per-client allowance. | 13 | F-1-12 |
| 47 | Rate-limit responses include `Retry-After`. | 4 | F-1-12 |
| 48 | The only release command is `scripts/deploy-release.sh <full-commit-sha>`. | 7 | — |
| 49 | It builds the immutable image, applies and reads back the one-replica `/data` mount, writes a canary, restarts the revision, verifies the canary after restart, and runs repeated fresh-connection lifecycle checks. | 30 | F-1-13, F-1-44 |
| 50 | The documented `test:coherence` command repeats the public probe. | 17 | F-1-13 |
| 51 | DNS, durable-share provisioning, and billing registration remain factory-managed outside this repository. | 11 | — |
| 52 | License | 1 | — |
| 53 | MIT — see LICENSE. | 3 | — |

The README has eight units above the 22-word hard cap: rows 3, 14, 16, 27, 31, 41, 45, and 49. Its headings are descriptive and make sense out of context. No banned marketing word appears; F-1-35 flags the separate subjective adjective “useful.”

## 4. Demo and sandbox result

**Pass.** The first click from the live home page opened `/demo` and immediately showed Sam's “Debugging the weather API” lesson, three checkpoints, a 1/3 progress indicator, one passed run, the blocked checkpoint at position 2, selected output, notes, and replies. The sticky banner showed “Demo — sample data, nothing is saved,” **Reset demo**, and **Start for real**.

In a fresh 390 px context, two sentinel real keys were written before entry. Demo created only `demo:clc:workspace`; Reset replaced its UUID and the old backend workspace returned 404; Start for real opened `/new` and removed the demo key. Both sentinel real keys were unchanged. All public/demo requests were same-origin. The only console 404 during the custom audit was the intentional read of the deleted old demo workspace; the full live browser smoke test reported no console errors.

## 5. Claims result

The clean clone was `6a7d236cc3aa896355b182195779f431ff2ca465`. A production frontend/extension build and release Rust build completed before the local server started. Every exact command from `.factory/claims.json` was then run individually against that clean server.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | Separate demo key, real sentinels unchanged, Reset issued a new workspace ID. |
| `consented-redacted-evidence` | PASS | Unconsented submission rejected; secret removed; output capped; note/reply round-trip passed. |
| `offline-demo-reload` | PASS | A new browser context reloaded the populated sample offline and showed offline state. |
| `json-export` | PASS | Download parsed as JSON with the sample title, three checkpoints, and blocked evidence. |
| `paid-team-checkout` | PASS | $39 one-time copy present; Sociobot endpoint returned 303 to hosted Dodo checkout. |
| `no-tracking` | PASS | Public/demo request origins were same-origin and no file input existed. |
| `team-roster-history` | PASS | Three local records rendered, filtered, and remained after reload. |
| `permanent-lesson-deletion` | PASS | Learner and tutor reads both returned 404 after deletion. |

No declared claim test failed. F-1-1 and F-1-3 through F-1-15 concern public wording that the manifest does not fully list or prove.

## 6. Prior-review history

No earlier `.factory/review-*.md` or `.factory/polish-*.md` file exists. The sole earlier handoff was read in full. Its stated product checks were independently sampled again: the cold first read, demo isolation/reset/exit, all eight claims, local tests/build, live browser flow, routes, metadata, links, mobile overflow, same-origin traffic, and accessibility scan all passed. Its only noted environment gap was an unavailable Docker executable during the earlier verification; it did not identify a product defect or finding ID to retest.

## 7. Structure, accessibility, and link checks

- All public routes returned 200; an unknown route returned HTTP 404 with the product header, footer, and a home action.
- Every checked route had exactly one h1, a route-specific title, a matching canonical URL, OG title, description, product social image, favicon, and no 390 px horizontal overflow.
- `robots.txt` and `sitemap.xml` exist; the sitemap lists all eight public routes.
- All discovered internal links, the GitHub source link, and the hosted-checkout link resolved successfully. F-1-18 concerns labeling, not reachability.
- Header/footer structure is consistent. Privacy, Terms, Param Factory, and version/build identity are present.
- The paper-cut checkpoint path, warm paper palette, serif/display pairing, hard offset shadows, and generated diorama are product-specific rather than a generic SaaS template.
- The live Playwright/axe suite passed at mobile and desktop sizes with no serious or critical violations and no normal-flow console errors. F-1-16 and F-1-17 are manual semantic failures outside that automated threshold.

## 8. Missed leverage

F-1-2 is the concrete missed-leverage finding. The brief and repository imply an in-editor learner workflow, but visitors can only see source-development instructions. AI assistance is not warranted: code generation is an explicit non-goal, and the core teaching loop benefits from learner-owned reasoning. JSON export exists; import would be useful only after the paid history promise and extension distribution are made precise.

## What would make this perfect

Resolve every finding above, with priority on making the paid distinction honest and giving learners a real extension installation path. Then complete the claims inventory, rerun each tagged claim from a clean clone, and add focused regressions for route focus, heading order, extension installation, and the revised copy. A subsequent cold review should have zero copy, claim, structure, demo, or scope findings before changing the verdict to PASS.
