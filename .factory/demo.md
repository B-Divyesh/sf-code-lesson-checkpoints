# Sample-data demo

- URL: `https://code-lesson-checkpoints.sociobot.in/demo` (local: `http://localhost:8080/demo`)
- Entry point: the first-screen **Try it with sample data** action opens the demo in one click.
- Sample: Sam's “Debugging the weather API” lesson has three runnable checkpoints, one passed run, one blocked run with redacted output, and a tutor reply.
- Isolation: the backend provisions a random in-memory workspace with a 24-hour expiry. It never writes demo rows to SQLite. The browser caches the sample only under `demo:clc:workspace`; real `clc:*` lesson and `sb_license:*` keys are not read or changed.
- Reset: **Reset demo** deletes the current in-memory workspace and local demo key, then provisions a fresh workspace.
- Exit: **Start for real** discards the demo workspace and opens the real lesson planner. Demo data is never offered as real data.
- Offline: after one online visit, the service worker and the namespaced browser copy let `/demo` reload offline. The offline notice explains that sharing updates needs a connection.

Run `npm run test:claims -- --grep @claim:demo-isolation` for the isolation and reset regression. Run `npm run test:claims -- --grep @claim:offline-demo-reload` for the offline regression.
