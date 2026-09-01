# Sample-data demo

- URL: `https://code-lesson-checkpoints.sociobot.in/?demo=1` (local: `http://localhost:8080/?demo=1`)
- Entry point: the first-screen **Try it with sample data** action opens the demo in one click.
- Sample: Sam's “Debugging the weather API” lesson has three checkpoints, one passed run, one blocked run with hidden credentials, a note, and a tutor reply.
- Isolation: the backend provisions a random `demo_workspaces` record with a 24-hour expiry. It never writes demo rows to real lesson tables. The browser uses only `demo:clc:workspace`; real `clc:*` and `sb_license:*` keys are not read or changed.
- Reset: **Reset demo** deletes the current expiring demo workspace and local demo key, then provisions a fresh workspace.
- Exit: **Start for real** discards the demo workspace and opens the real lesson planner. Demo data is never offered as real data.
- Offline: after one online visit, the service worker and the namespaced browser copy let `/demo` reload offline. The offline notice explains that sharing updates needs a connection.

Run `npm run test:claims -- --grep @claim:demo-isolation` for the isolation and reset regression. Run `npm run test:claims -- --grep @claim:offline-demo-reload` for the offline regression.
