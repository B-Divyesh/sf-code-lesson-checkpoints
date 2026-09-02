# Adversarial first-read review 3

**Product:** Code Lesson Checkpoints  
**Reviewed:** 2026-09-02 UTC  
**Candidate:** `634308d817299277bc6f2563ab6c2a5e23f6556b`  
**Live URL:** <https://code-lesson-checkpoints.sociobot.in>

## Verdict: PASS

No blocking, major, or minor findings remain. The product is clear before scrolling, the sample is realistic and isolated, and all declared claims passed locally and live.

## Cold first read

Fresh browser contexts with no storage were opened without scrolling or clicking.

| Viewport | What it does | For whom | First click | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | Shows a tutor the first lesson step where a learner is blocked, using learner-selected run results. | Remote programming tutors and learners. | **Try it with sample data**. | Clear; headline, audience, action, outcome, and three facts fit. |
| 1440 × 900 | Same; the paper path reinforces the ordered flow. | Remote programming tutors and learners. | **Try it with sample data**. | Clear; all three facts end at 888 px. |

Exact hero text: “See where the lesson got stuck.” “Remote programming tutors add commands or tests for each lesson step. Learners run them locally and choose what to share.” The adjacent outcome is “Opens Sam’s three-checkpoint lesson in a temporary demo.”

## Copy audit

Counts treat contractions, hyphenated terms, paths, versions, and URLs as one word. Every landing and README sentence is at most 22 words. No banned marketing word, jargon-only heading, inconsistent core term, or wrongly named action was found.

### Landing copy

| Copy | Words |
| --- | ---: |
| Learners choose what to share | 5 |
| See where the lesson got stuck. | 6 |
| Remote programming tutors add commands or tests for each lesson step. | 11 |
| Learners run them locally and choose what to share. | 9 |
| Try it with sample data | 5 |
| Opens Sam’s three-checkpoint lesson in a temporary demo. | 8 |
| Plan a lesson | 3 |
| Join with a lesson code | 5 |
| No source uploads | 3 |
| Learners review output before sharing | 5 |
| Free lesson planning | 3 |
| How it works | 3 |
| How tutors and learners use checkpoints. | 6 |
| A record of the work, not a recording of the learner. | 11 |
| Add checkpoints | 2 |
| Add the commands or tests that define progress. | 8 |
| Learners can copy them into their own terminal. | 8 |
| Run and review | 3 |
| Learners choose Passed or Blocked. | 5 |
| They check hidden passwords and keys, then approve what leaves their computer. | 12 |
| Install the VS Code companion | 5 |
| Reply to the blocked attempt | 5 |
| Read the selected output and note in order. | 8 |
| Reply to the exact attempt that needs help. | 8 |
| What this tool does not do | 6 |
| Share lesson results, not source code. | 6 |
| No remote control, keystroke recording, source collection, automated grading, or generated answers. | 12 |
| The learner keeps the keyboard—and the context. | 8 |
| Create your first lesson | 4 |
| Optional team workspace | 3 |
| Share lesson history with your tutoring team. | 7 |
| Lesson planning and sharing stay free. | 6 |
| Team workspaces keep a shared roster and searchable lesson history. | 10 |
| $39 once | 2 |
| Invite tutors with a team code | 6 |
| Search shared lesson history | 5 |
| Reopen records on another device | 6 |
| No recurring fee | 3 |
| See team workspace details | 4 |
| Learners choose which run results to share. | 7 |
| Paper-path artwork generated for this product. | 6 |
| No source code is uploaded by default. | 7 |

Header/footer controls also pass: **Skip to content**, **Demo**, **Join lesson**, **Team plan**, **Plan a lesson**, **Privacy**, **Terms**, and **Source on GitHub (external)** accurately name their result or destination.

### README copy

| Copy | Words |
| --- | ---: |
| Code Lesson Checkpoints helps remote programming tutors see where a learner’s code first fails. | 14 |
| Tutors add commands or tests. | 5 |
| Learners run them locally and choose whether to share a status, selected output, and note. | 15 |
| The tutor sees attempts in order and replies to the blocked attempt without taking over the learner’s screen. | 18 |
| Lesson planning and sharing are free. | 6 |
| The optional Team workspace costs $39 once. | 7 |
| It gives tutors a shared roster and searchable lesson history across devices. | 12 |
| Checkout runs on Sociobot’s hosted billing page. | 7 |
| The app never embeds a payment provider. | 7 |
| Open the isolated sample at https://code-lesson-checkpoints.sociobot.in/?demo=1. | 6 |
| It contains three checkpoints, passed and blocked runs, hidden sample credentials, a learner note, and a tutor reply. | 18 |
| Reset demo replaces the temporary workspace. | 6 |
| Start for real deletes the sample and opens the lesson planner. | 11 |
| The demo uses only the `demo:clc:workspace` browser key. | 8 |
| It never reads or changes real lesson keys. | 8 |
| An isolated sample that reloads offline after its first visit | 10 |
| JSON export and permanent lesson deletion | 6 |
| Local and server checks that hide common keys and cap output | 11 |
| A packaged VS Code companion for running tutor commands locally | 10 |
| A Team workspace with shared roster access and lesson history | 10 |
| Download Code Lesson Checkpoints 0.1.0. | 5 |
| Open the Extensions view in VS Code. | 7 |
| Choose Install from VSIX… from the view menu. | 8 |
| Select the downloaded file. | 4 |
| Run Code Lesson: Connect to Lesson and enter the six-character lesson code. | 12 |
| Run Code Lesson: Open Checkpoints to review a command before running it. | 12 |
| For extension development, open this repository with `extension/` as the extension root. | 12 |
| Run `npm run test:extension-host` to install the VSIX. | 9 |
| It verifies command review, local execution, hidden credentials, and sharing approval. | 10 |
| Requirements: Node 22+, npm 10+, current stable Rust, and a C toolchain. | 12 |
| On Debian or Ubuntu, install `xvfb` and `libgtk-3-0` before running `npm run test:extension-host`. | 14 |
| Open http://localhost:8080. | 2 |
| For frontend hot reload, run `cargo run` and `npm run dev` in separate terminals. | 12 |
| `.factory/claims.json` lists each public promise and the command that tests it. | 11 |
| The isolated sample is documented in `.factory/demo.md`. | 7 |
| Source files are never requested or uploaded. | 7 |
| Learners approve every shared run. | 5 |
| The service stores lesson steps, selected output, notes, replies, and timestamps. | 11 |
| Tutors can permanently delete the complete lesson record. | 8 |
| This product is not remote desktop software, a recorder, an automated grader, or a code generator. | 16 |
| Read the live privacy notice and terms. | 7 |
| The paper-path illustration was generated for this product. | 8 |
| Its prompt and provenance are in `.factory/design.md`. | 7 |
| Build the multi-stage image with `docker build -t code-lesson-checkpoints .`. | 6 |
| The factory release command is `scripts/deploy-release.sh <full-commit-sha>`. | 6 |
| Deployment configuration lives in `deployment/container-app.json`. | 5 |
| MIT — see LICENSE. | 4 |

Core terms remain consistent: **checkpoint**, **run results**, **note**, **lesson code**, **tutor link**, **Team workspace**, and **demo**.

## Demo, sandbox, and privacy

**Pass.** One click from `/` opens `/?demo=1`. The immediate screen at both viewports shows Sam’s populated “Debugging the weather API” lesson: three checkpoints, passed and blocked attempts, `[redacted]` evidence, a learner note, and a tutor reply. The persistent banner reads “Demo — sample data, nothing is saved” and provides **Reset demo** and **Start for real**.

Only `demo:clc:workspace` appeared in demo storage. Real `clc:*` sentinels were unchanged. Reset created a different expiring workspace and the old workspace returned 404. Start for real removed the demo key and opened `/new`. The fresh public/demo request log contained only the product origin. A fresh demo context reloaded offline after its first online visit and displayed the offline notice.

## Claims

`npm ci`, `npm run build`, a fresh local release server, and every exact command from `.factory/claims.json` were used. The VS Code host test first identified the README-listed missing `libgtk-3-0` OS library; after installing that stated test prerequisite, it passed. This was test-environment setup, not a product failure. The full production suite also passed.

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

All claim-like landing and README statements map to these tests; no unlisted public claim was found. AI is not a missing feature: code generation is an explicit non-goal, while sample data, export, shared history, and a VS Code companion are present.

## Earlier findings rechecked

Every prior finding was confirmed live and in source. “Fixed” means the reported behavior was observed, not merely marked fixed in a polish document.

| Earlier ID | Result | Evidence |
| --- | --- | --- |
| F-1-1 | Fixed | Defined $39 shared Team result. |
| F-1-2 | Fixed | Downloadable VSIX installs and runs. |
| F-1-3 | Fixed | Ordered workflow/copy/first-block/reply claim passes. |
| F-1-4 | Fixed | Full demo/reset/exit/sentinel claim passes. |
| F-1-5 | Fixed | Hosted checkout/no embed claim passes. |
| F-1-6 | Fixed | Unlisted backend architecture copy removed. |
| F-1-7 | Fixed | Packaged companion flow passes. |
| F-1-8 | Fixed | Untested public bundle removed; focused checks retained. |
| F-1-9 | Fixed | License return/cache/revocation checks pass. |
| F-1-10 | Fixed | Runtime identity copy removed. |
| F-1-11 | Fixed | Azure Files recovery copy removed. |
| F-1-12 | Fixed | Rate-limit implementation copy removed. |
| F-1-13 | Fixed | Release behavior is not a visitor claim. |
| F-1-14 | Fixed | Artwork provenance claim passes. |
| F-1-15 | Fixed | Manifest-completeness text is true. |
| F-1-16 | Fixed | History navigation focuses/announces the h1. |
| F-1-17 | Fixed | Demo headings no longer skip levels. |
| F-1-18 | Fixed | External source link is labelled. |
| F-1-19 | Fixed | Designed plain-language 404 works. |
| F-1-20 | Fixed | Sample outcome is adjacent to its action. |
| F-1-21 | Fixed | Learner-choice wording is plain. |
| F-1-22 | Fixed | Commands/tests explained on first use. |
| F-1-23 | Fixed | Lesson-code action names its result. |
| F-1-24 | Fixed | Output review wording is explicit. |
| F-1-25 | Fixed | Process h2 names the process. |
| F-1-26 | Fixed | Step says “Add checkpoints.” |
| F-1-27 | Fixed | Copy names hidden passwords/keys. |
| F-1-28 | Fixed | Reply action names blocked attempt. |
| F-1-29 | Fixed | “Note” remains consistent. |
| F-1-30 | Fixed | Privacy boundary has a plain label. |
| F-1-31 | Fixed | Boundary heading names source-code sharing. |
| F-1-32 | Fixed | Footer states learner-selected results. |
| F-1-33 | Fixed | README opens with tutor job. |
| F-1-34 | Fixed | README workflow is short and consistent. |
| F-1-35 | Fixed | Paid result is concrete. |
| F-1-36 | Fixed | Long backend bundle removed. |
| F-1-37 | Fixed | Companion instructions are clear and tested. |
| F-1-38 | Fixed | Restore wording is plain and tested. |
| F-1-39 | Fixed | API-test jargon removed. |
| F-1-40 | Fixed | Claims explanation is direct. |
| F-1-41 | Fixed | Extension-host description is direct. |
| F-1-42 | Fixed | Docker copy is direct. |
| F-1-43 | Fixed | Single-replica recovery is not public copy. |
| F-1-44 | Fixed | Release-script behavior is not public copy. |
| F-2-1 | Fixed | Unlisted responsive implementation claim removed. |
| F-2-2 | Fixed | Shared roster/history and owner removal claim passes. |
| F-2-3 | Fixed | Three facts fit at 1440 × 900. |
| F-2-4 | Fixed | Process h2 is descriptive. |
| F-2-5 | Fixed | VSIX test words are direct. |
| F-2-6 | Fixed | Linux prerequisite names its command. |

## Structure and accessibility

**Pass.** `/`, `/demo`, `/join`, `/new`, `/pricing`, `/team`, `/privacy`, and `/terms` returned 200. Unknown deep links return the designed 404. Each checked route has one h1, one main landmark, `lang="en"`, route metadata, canonical, OG/Twitter image, favicon, and a consistent header/footer with Privacy and Terms. Crawled internal links, VSIX, source link, and hosted checkout resolved.

The live browser suite passed route focus/announcement, back navigation, skip link, keyboard dialogs, 44 px targets, 200% text, reduced motion, mobile overflow, and serious/critical axe checks. `verify-url.sh` reported no console errors and confirmed title, language, h1, main, image alternatives, and labelled buttons. The paper-cut diorama is distinctive and matches `.factory/design.md`.

## What would make this perfect

No further product change is identified. Keep the existing clean-sandbox claim suite, live smoke suite, and 390 px cold-read review mandatory for future changes, especially around demo isolation, Team access, and the VSIX.
