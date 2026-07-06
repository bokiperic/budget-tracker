# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Preview a production build locally
npm run preview

# Run unit tests (Vitest)
npm test
```

## Architecture

**Multi-tenant web app**: Svelte 5 + Vite frontend, Supabase (Postgres + Auth + Row Level Security) as the backend. Components use Svelte 5 runes syntax (`$state`/`$derived`/`$props`, `onclick`-style event attributes, `{@render children()}`) — use runes, not Svelte 4 legacy syntax (`on:click`, `$:`, `export let`, `<slot />`), when adding or editing components. The `session` Svelte store is intentional and fine (stores remain supported). No custom server — the frontend talks to Supabase directly via `@supabase/supabase-js`, and RLS policies enforce that each user only ever sees their own data.

```
src/
  App.svelte                    # Auth gate (Login vs. Layout+Router) — the only top-level component
  main.js                       # Svelte entry point
  app.css                       # Global styles (CSS variables for spacing, colors)
  lib/
    supabaseClient.js           # Supabase client singleton (reads VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY)
    auth.js                     # signIn / signUp / signOut wrappers
    db.js                       # All Supabase queries (CRUD for all entities) + RPC calls for aggregations
    format.js                   # formatCurrency / currentYearMonth / monthRange helpers (unit-tested in format.test.js)
    stores/session.js           # Svelte store tracking the current Supabase auth session
    components/
      Login.svelte              # Email/password sign-in + sign-up form
      Layout.svelte              # Nav bar (page links + sign-out) wrapping routed page content
    pages/
      Dashboard.svelte, Transactions.svelte, Categories.svelte, CreditCards.svelte, Budgets.svelte

supabase/
  migrations/0001_init.sql      # Schema, RLS policies, new-user category-seeding trigger, stats RPC functions
```

Routing is client-side via `svelte-spa-router` (hash-based, e.g. `#/transactions`) — pages live in `src/lib/pages/`, wired up in `App.svelte`'s `routes` map.

## DB Layer (`src/lib/db.js`)

Wraps `@supabase/supabase-js` — no raw SQL, no connection/session management (the Supabase client is a stateless singleton imported from `supabaseClient.js`). RLS handles all tenant scoping, so queries never filter by `user_id` client-side.

**Tables** (defined in `supabase/migrations/0001_init.sql`): `settings`, `categories`, `transactions`, `credit_cards`, `credit_card_statements`, `monthly_budgets` — every table has a `user_id` column defaulting to `auth.uid()` and RLS policies restricting all access to `auth.uid() = user_id`.

Transaction types are constrained by CHECK: `'income' | 'expense' | 'credit_payment'`

Aggregation queries that don't map cleanly to the Supabase query builder (`getMonthlyStats`, `getExpensesByCategory`) call Postgres RPC functions (`get_monthly_stats`, `get_expenses_by_category`) defined in the same migration file, so the aggregation runs server-side under RLS.

## Auth & Multi-Tenancy

- Auth is Supabase Auth (email/password). Session state lives in the `session` Svelte store (`src/lib/stores/session.js`), populated via `supabase.auth.getSession()` and kept in sync with `supabase.auth.onAuthStateChange`.
- `App.svelte` is a reactive gate: no session → `Login.svelte`; session present → `Layout.svelte` + router.
- New users are seeded with the same 14 default categories via a Postgres trigger (`on_auth_user_created` → `seed_default_categories()`, `security definer`) that fires on `auth.users` insert — there is no app-side seeding code.
- Required env vars (in `.env.local`, not committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The `VITE_` prefix is required for Vite to expose them to client code. The anon key is safe to expose client-side — RLS (not key secrecy) is what protects data.
- When adding a new table: give it a `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()` column, enable RLS, and add select/insert/update/delete policies restricted to `auth.uid() = user_id`, following the pattern in `0001_init.sql`.
- Deployment: static `dist/` build (e.g. Vercel/Netlify/Cloudflare Pages) — this is a pure client-rendered SPA, no server runtime needed. Add the production domain to Supabase Auth's Site URL / Redirect URLs allow-list or auth will silently fail on that domain.
