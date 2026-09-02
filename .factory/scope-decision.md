# Scope decision — paid archive

Recorded on 2026-09-01 for repair work order `code-lesson-checkpoints-repair-11`.

## Decision

This release keeps the shipped $39 local archive for one tutor. It searches private tutor links stored in that browser.

It does not implement shared team accounts, shared history, team membership, invitations, roles, or roster management. “Small-team history and roster controls” from the researched brief remain unimplemented. They are not a release claim.

## Reason

Real team controls require identity, membership, shared authorization, recovery, and a new server-side data model. Adding those during a two-defect repair would change the product’s security and privacy model.

Calling the local browser index a shared team feature would overstate its behavior. The current product remains useful for one tutor and learner pairs while that larger scope is reconsidered.

All server state in this release remains in the product-owned SQLite database under `/data`. No shared database is used.
