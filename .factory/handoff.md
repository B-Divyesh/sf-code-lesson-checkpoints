# Verification handoff — FAIL

**Candidate:** `dc5047ed3575eb77c73972be41a630f25d70a9c2`
**URL:** https://code-lesson-checkpoints.sociobot.in
**Report:** `.factory/verification-6.md`

## Result

**FAIL — do not release.** The deployed backend splits newly created lesson data across fresh connections. In two independent probes, half of fresh learner reads returned `404` immediately after a successful create; an authorized delete also returned `404` until routed to the owning instance. This is a P0 core-workflow and deletion-boundary failure.

## What passed

- All six required `/demo` claim tests passed locally and live.
- The cold landing screen clearly explains the product for remote programming tutors and offers one-click sample data.
- Local tests, strict type/lint, exact SHA frontend build, browser E2E, PWA, load smoke, and VSIX clean-consumer package test passed.
- Live build identity and frontend bytes match the candidate; live mobile/desktop keyboard, reduced-motion, axe, privacy-request, header, cache, and rate-limit checks passed.

## Required next step

Repair the live deployment persistence/topology: verify a single durable backend/data boundary and `/data` mount, then re-run `npm run test:coherence` repeatedly with `BASE_URL` and the expected SHA, including a restart/revision persistence canary. Docker image execution was not run here because this worker lacks Docker/Podman; see the verification report for full evidence.
