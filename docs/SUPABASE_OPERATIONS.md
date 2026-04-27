# Supabase Operations, Security, and Deployment Notes

This document describes the operational and security implications of the current Supabase-compatible setup used by this project.

It is based on code inspection of the frontend application. It does not validate the live backend configuration, row-level security policies, database backups, or hosting controls.

## Current Architecture

The application is a browser-based React/Vite frontend that talks directly to a hosted Supabase-compatible backend.

Current client configuration:

- Backend URL is hard-coded in `src/lib/supabase.ts`
- Publishable anonymous key is hard-coded in `src/lib/supabase.ts`
- The browser authenticates users with `supabase.auth`
- The browser reads and writes `tasks` and `categories` directly through the Supabase client
- The browser persists auth session state in `localStorage`

There is no evidence in this repository of a server-side application layer that mediates database access.

## What This Means Operationally

In the current model, the deployed frontend bundle contains everything needed to connect to the hosted backend as an anonymous browser client.

That has a few direct consequences:

- The backend URL is public to every user of the application.
- The anonymous Supabase key is public to every user of the application.
- Access control must be enforced by backend policies, not by hiding frontend configuration.
- Environment separation is weak because the current project does not appear to use environment variables for backend configuration.

This is a normal pattern for Supabase-backed frontend apps, but it only remains safe if the backend is configured correctly.

## Security Implications

### 1. The anon key is not secret

The key embedded in `src/lib/supabase.ts` appears to be an anonymous client key. That is expected for browser-based Supabase apps.

Implication:

- Treat the anon key as public.
- Do not rely on the key itself for protection.
- Do not place elevated privileges behind the anon key.

### 2. Row-level security is the real control boundary

Because the browser directly issues reads and writes against `tasks` and `categories`, backend authorization must depend on row-level security and authenticated user context.

At minimum, the live backend should ensure:

- Anonymous users cannot read or mutate protected rows unless explicitly intended.
- Authenticated users can only read and mutate their own rows.
- `user_id` cannot be abused to target another user's data.
- Inserts, updates, and deletes are all policy-constrained.

This repository does not contain the actual SQL policies, so they are not verifiable from code inspection alone.

### 3. Auth session tokens are stored in localStorage

The app uses Supabase auth defaults, which persist session state in browser `localStorage`.

Implication:

- Any successful XSS bug in the frontend could expose auth tokens stored in the browser.
- Frontend dependency hygiene and output sanitization matter because session persistence is browser-readable.

Operational mitigations typically include:

- Strict content security policy
- Avoiding unsafe HTML injection
- Dependency review and patching
- Careful handling of any markdown or rich text rendering

### 4. Hard-coded backend configuration reduces deployment safety

The backend URL and anon key are embedded directly in `src/lib/supabase.ts` rather than sourced from environment variables.

Implication:

- Development, staging, and production are harder to separate safely.
- Accidental deployment against the wrong backend becomes more likely.
- Rotating keys requires code changes and a frontend redeploy.
- Forking or reusing the repository can unintentionally point another deployment at the same live backend.

## Deployment Implications

### Frontend deployment model

This app is suitable for static hosting because it is a Vite frontend that calls the backend directly from the browser.

Typical hosting options include:

- Vercel
- Netlify
- GitHub Pages with additional SPA routing handling
- Static object storage plus CDN

Because the application is frontend-only, deployment safety depends heavily on external backend governance.

### Environment management

The current setup appears to use a single hard-coded backend target.

Recommended operational pattern:

- Use environment variables such as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Maintain separate backend projects for development, staging, and production
- Ensure each environment has isolated auth users, tables, policies, and monitoring

### Key rotation

If the anon key needs rotation, the current setup requires:

1. Updating the value in source
2. Rebuilding the frontend
3. Redeploying the frontend

That is operationally workable, but less clean than environment-based rotation.

### Incident response

Because clients connect directly to the backend, incident response should assume:

- The URL and anon key are already exposed
- Abuse prevention must happen at the backend policy and rate-limit layers
- Audit logs and auth logs are critical for detecting misuse

## Reliability and Data Operations

### Offline queueing

The app queues write operations in browser `localStorage` while offline and drains them when connectivity returns.

Operational implications:

- Client and server state can temporarily diverge.
- Conflict handling is minimal from the visible code.
- Support and debugging should account for delayed sync behavior.

### Anonymous-to-authenticated migration

Anonymous local data is merged into the remote backend on first authenticated sync when the remote account is empty.

Operational implications:

- A user's first login may trigger data creation in the backend.
- Support workflows should know that local browser state can seed remote account state.
- If the browser storage is cleared before sign-in, anonymous tasks are lost.

### Backups and recovery

This repository contains no backup or restore automation.

That means backup posture depends entirely on the hosted backend platform and its configuration.

Operational questions that should be answered outside this repo:

- Are automated database backups enabled?
- What is the retention period?
- Is point-in-time recovery available?
- How are auth records backed up?
- Who has operator access to restore data?

## Minimum Recommended Controls

For a production deployment, the following should exist even though they are not verifiable from this repository:

- Row-level security enabled on all exposed tables
- Policies that bind every row to the authenticated user
- Separate development and production backend projects
- Environment-variable-based frontend configuration
- HTTPS everywhere
- Monitoring and audit logging on auth and database activity
- A documented key rotation process
- A documented backup and restore process
- A content security policy appropriate for a token-bearing SPA

## Recommended Codebase Improvements

If this project is going to be maintained or deployed seriously, the first practical improvements should be:

1. Move the backend URL and anon key into environment variables.
2. Document the required backend tables and row-level security policies.
3. Add an environment matrix for development, staging, and production.
4. Add a short incident-response section describing what to rotate and where to inspect logs.

## Source Anchors

- `src/lib/supabase.ts`
- `src/hooks/useTodos.ts`
- `src/contexts/AuthContext.tsx`
- `docs/DATA_PERSISTENCE.md`

## Bottom Line

The current design is compatible with a normal Supabase frontend architecture, but it is only operationally safe if the hosted backend is treated as the true security boundary.

The frontend bundle should be assumed public. The anon key should be assumed public. The backend policies, auth configuration, observability, and environment isolation are what determine whether this deployment is safe and maintainable.