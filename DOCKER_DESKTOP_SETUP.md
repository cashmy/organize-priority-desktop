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

## Stop The Container

```bash
docker compose down
```

## Notes

- Docker uses port `8085` so normal Vite development on `3000` or `8080` can still happen independently.
- Because browser storage is origin-scoped, `http://localhost:8085` will have separate localStorage from other local ports.
- Direct reloads on routes like `/report` are supported through the `nginx` SPA fallback.