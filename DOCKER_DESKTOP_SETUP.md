# Docker Desktop Setup

This app can be built into a static frontend container and run under Docker Desktop without keeping a separate terminal open.

## Runtime Model

- The container serves the compiled Vite frontend through `nginx`.
- Application data is still stored in browser `localStorage` and in Supabase.
- The container does not host the database or replace Supabase.

## Required Environment Variables

Create a local `.env` file from `.env.example` and provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These values are compiled into the frontend build, so changes require a rebuild.

## Start With Docker Desktop

```bash
docker compose up -d --build
```

The app will be available at `http://localhost:8085`.

## One-Click Windows Launch

For normal desktop use on Windows, you can double-click `launch-desktop-app.cmd`.

That wrapper will:

- start Docker Desktop if it is not already running
- run `docker compose up -d`
- wait for the app health check on port `8085`
- open the app in the default browser

If you need to rebuild the image after changing source or environment values, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\launch-desktop-app.ps1 -Build
```

## Stop The Container

```bash
docker compose down
```

## Notes

- Docker uses port `8085` so normal Vite development on `3000` or `8080` can still happen independently.
- Because browser storage is origin-scoped, `http://localhost:8085` will have separate localStorage from other local ports.
- Direct reloads on routes like `/report` are supported through the `nginx` SPA fallback.