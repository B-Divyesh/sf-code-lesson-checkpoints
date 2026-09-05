# Handoff — scoped isolation cleanup

## Result

Removed the unused `code-lesson-checkpoints-database-url` secret only from `sf-code-lesson-checkpoints`. No secret value was requested or exposed, and no product code was changed.

## Verification

- The target secret name is absent after cleanup, with no target references in the app configuration or its revisions.
- Active revision `sf-code-lesson-checkpoints--0000034`, image `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:f1c8a0df6799`, and the single running replica are unchanged.
- Environment-variable names, one-replica scale, and product-owned `/data` volume configuration are unchanged.
- `https://code-lesson-checkpoints.sociobot.in/health` returned HTTPS 200 with successful TLS verification before and after.
- Build SHA remained `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`; health continued to report `status: ok` and `database: sqlite`.
- Full redacted evidence is in `.factory/isolation-2026-09-05.md` and copied to `/work/.evidence/isolation-report.md`.

## Commands to re-verify

Use names-only queries for the scoped app and request the public health endpoint. Do not request secret values.

## Known gaps

None. Product tests and builds were not run because the work order explicitly limited this task to configuration cleanup and prohibited rebuilding or changing product code.
