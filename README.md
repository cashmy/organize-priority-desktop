# Organize Priority Desktop

This app began as a Famous.AI-generated prototype used to quickly establish a workable task-management starting point. Since that initial generation, the codebase has been actively refactored and extended locally in VS Code through hands-on development, feature work, and architectural cleanup.

The current phase is local alpha use: continue using the app day to day, refine the workflow, and strengthen the codebase based on real usage. The longer-term intent is to keep evolving the app locally and later publish it on Vercel once the product and architecture are in a better state.

The app currently runs as a React + TypeScript + Vite frontend with browser-side storage behavior, Supabase-backed persistence, and an optional Docker Desktop launch path for local desktop use.

For Windows desktop use, the app can now be launched through Docker Desktop with `launch-desktop-app.cmd`.

## Project Documentation

- [Data Persistence Overview](./docs/DATA_PERSISTENCE.md)
- [Supabase Operations, Security, and Deployment Notes](./docs/SUPABASE_OPERATIONS.md)
- [Docker Desktop Setup](./docs/DOCKER_DESKTOP_SETUP.md)
- [Task Drag and Drop Feature Note](./docs/TASK_DRAG_AND_DROP.md)
- [Task Report View Feature Note](./docs/TASK_REPORT_VIEW.md)

## Development Note

Although the project originated from a generated prototype, the repository should be treated as an evolving local application rather than a frozen generator output.
