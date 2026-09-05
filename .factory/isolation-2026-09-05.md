# Isolation cleanup report — 2026-09-05

Work order: `code-lesson-checkpoints-isolation-1`

## Scope and result

The unused secret named `code-lesson-checkpoints-database-url` was removed only from Azure Container App `sf-code-lesson-checkpoints` in resource group `sociobot`. Its value was never requested, read, logged, or copied. No other service, database, vault, image, revision, or product resource was accessed or changed.

## Names-only configuration evidence

| Check | Before | After |
| --- | --- | --- |
| App secret names | `code-lesson-checkpoints-database-url` | None |
| Target secret references | None | None |
| Active revision | `sf-code-lesson-checkpoints--0000034` | `sf-code-lesson-checkpoints--0000034` |
| Active image | `sociobotregistry.azurecr.io/sf-code-lesson-checkpoints:f1c8a0df6799` | Same |
| Running replica | `sf-code-lesson-checkpoints--0000034-68794cb5d8-vgx42` | Same |
| Replica count | 1 | 1 |
| Environment variable names | `PORT` | `PORT` |
| Volume and storage names | `lesson-data`, `sf-code-lesson-checkpoints-data` | Same |
| Volume mount | `/data` | `/data` |
| Scale | Minimum 1, maximum 1 | Same |

The active revision remained healthy, active, and at 100% traffic. The image, revision, replica, environment names, volume, mount, storage, and scale were preserved. No rebuild, restart, or source-code change was performed.

## Public health evidence

| Check | Before | After |
| --- | --- | --- |
| URL | `https://code-lesson-checkpoints.sociobot.in/health` | Same |
| HTTPS status | 200 | 200 |
| TLS verification | Passed | Passed |
| Service status | `ok` | `ok` |
| Database identity | `sqlite` | `sqlite` |
| Build SHA | `f1c8a0df67993a27ea66397b147e9ffaa8f986a4` | `f1c8a0df67993a27ea66397b147e9ffaa8f986a4` |

## Verification boundary

Cloud reads were limited to names and non-secret configuration metadata for `sf-code-lesson-checkpoints`, its own revisions, and its own replica. The public `/health` endpoint was checked before and after the change. Product tests and builds were intentionally not run because this work order prohibited rebuilding or changing product code.
