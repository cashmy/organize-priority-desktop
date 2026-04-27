# Data Persistence Overview

This document summarizes where this application stores data, which backend it uses, and which browser-local keys it relies on.

## Summary

The project uses two persistence layers:

1. A hosted Supabase-compatible backend for authenticated application data.
2. Browser `localStorage` for local cache, offline queueing, UI state, theme, and auth session persistence.

The backend is configured in `src/lib/supabase.ts` and the todo/auth flows are implemented in `src/hooks/useTodos.ts` and `src/contexts/AuthContext.tsx`.

## Remote Database

The app creates its backend client with `@supabase/supabase-js`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://burrrsslozyyuevxgfja.databasepad.com';
const supabase = createClient(supabaseUrl, supabaseKey);
```

Source:

- `src/lib/supabase.ts`

### Database Type

Because the client is `@supabase/supabase-js`, the backend is a Supabase-compatible service, which is typically PostgreSQL-backed.

### Storage Location

The primary application data is not stored inside this repository as a local file.

It is stored remotely at:

- `https://burrrsslozyyuevxgfja.databasepad.com`

This endpoint appears to be a Famous/DatabasePad-hosted Supabase-compatible service.
 
## Remote Tables Used By The App

The todo flow reads and writes two backend tables:

- `categories`
- `tasks`

The relevant queries are in `src/hooks/useTodos.ts`, including:

- `supabase.from('categories').select('*')`
- `supabase.from('tasks').select('*')`
- `supabase.from('categories').insert(...)`
- `supabase.from('tasks').insert(...)`
- `supabase.from('categories').upsert(...)`
- `supabase.from('tasks').upsert(...)`
- `supabase.from('categories').delete()`
- `supabase.from('tasks').delete()`

## Expected Backend Schema

The app defines these TypeScript shapes for backend records.

### `categories`

```ts
type DbCategory = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
};
```

### `tasks`

```ts
type DbTask = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  notes: string | null;
  priority: 'high' | 'medium' | 'low';
  dow: string[];
  completed: boolean;
  order: number;
};
```

## Browser Local Storage

The app also persists local state in the browser.

### Todo Data Keys

Defined in `src/hooks/useTodos.ts`:

- `todoapp.tasks.anon`
  Stores anonymous user tasks before sign-in.
- `todoapp.categories.anon`
  Stores anonymous user categories before sign-in.
- `todoapp.collapsed.v1`
  Stores category collapsed/expanded UI state.
- `todoapp.tasks.user.<uid>`
  Stores a signed-in user's task cache in the browser.
- `todoapp.categories.user.<uid>`
  Stores a signed-in user's category cache in the browser.
- `todoapp.queue.user.<uid>`
  Stores queued offline write operations until the app reconnects.

### Theme Key

Defined in `src/components/theme-provider.tsx`:

- `theme`
  Stores the selected UI theme: `dark`, `light`, or `system`.

## Auth Session Storage

Authentication is handled through `supabase.auth` in `src/contexts/AuthContext.tsx`.

Because the client is created without custom auth storage options, Supabase client defaults apply.

In the installed client library, the default browser auth storage key is derived from the backend hostname:

```ts
const defaultStorageKey = `sb-${baseUrl.hostname.split('.')[0]}-auth-token`
```

For this project, the resulting auth key is:

- `sb-burrrsslozyyuevxgfja-auth-token`

This key is stored in browser `localStorage` and holds the persisted auth session managed by Supabase.

## How Anonymous Data Is Merged

When a user signs in and the remote account has no categories or tasks yet, the app attempts to merge anonymous local data into the hosted backend.

The flow in `src/hooks/useTodos.ts` is:

1. Read anonymous categories and tasks from `localStorage`.
2. Seed remote `categories`.
3. Seed remote `tasks`.
4. Remove the anonymous local keys.

This means anonymous browser data can become permanent remote data after sign-in.

## Practical Implications

- Primary business data lives remotely, not in a local database file.
- The browser stores caches and queued operations, so local state may temporarily differ from remote state.
- The app supports offline mutation queueing for signed-in users.
- The app stores auth session tokens in browser `localStorage` through Supabase defaults.

## Key Source Files

- `src/lib/supabase.ts`
- `src/hooks/useTodos.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/theme-provider.tsx`
- `node_modules/@supabase/supabase-js/src/SupabaseClient.ts`
- `node_modules/@supabase/auth-js/src/GoTrueClient.ts`

## Notes

- The backend URL and anon key are hard-coded in `src/lib/supabase.ts`.
- An exposed Supabase anon key is normal for browser clients, but backend access still depends on proper server-side policies.
- This document is based on code inspection only. It does not verify the live backend schema or server-side row-level security policies.