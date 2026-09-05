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

Verification 16 passed with zero findings and zero untested public claims. No product code was changed.

The implementation reviewed was `f1c8a0df67993a27ea66397b147e9ffaa8f986a4`; the documentation and scoped cleanup report are at `171dbfc00dd3c1ec5abb17ea188e105b88609d00`.

From a clean checkout, `npm ci`, `npm test`, `npm run check`, `npm run lint`, `npm run build`, every individual claim command, package inspection, VS Code 1.98.2 host flow, browser, PWA, load, and coherence tests passed. The live claim suite, browser/PWA/coherence flows, fresh phone and desktop sample, route and legal-page checks, expected 404, privacy, keyboard/focus, reduced motion, SQLite restart persistence, Team/tutor isolation, and live 429/`Retry-After` allowances passed. A candidate-aware local build matched 24 non-VSIX live files byte-for-byte.

On Debian or Ubuntu, install the README-listed `xvfb` and `libgtk-3-0` before running `npm run test:extension-host`. The live sample is https://code-lesson-checkpoints.sociobot.in/?demo=1.

The standalone Axe CLI has a ChromeDriver version mismatch with the preinstalled Playwright Chromium; the repository's Playwright Axe integration ran successfully across the checked routes.
