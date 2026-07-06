---
name: verify
description: Drive the budget-tracker SPA end-to-end in a headless browser with the Supabase backend mocked at the network layer.
---

# Verifying budget-tracker changes

This is a pure client-side SPA (Vite + Svelte 5) talking directly to Supabase.
Frontend changes can be verified end-to-end **without real credentials** by
mocking Supabase at the network layer in Playwright.

## Recipe

1. `npm run dev` (background) → serves on http://localhost:5173.
2. Install Playwright + Chromium in the scratchpad dir (not the project).
3. In the Playwright script:
   - Read `VITE_SUPABASE_URL` from `.env.local` to get the Supabase host and
     project ref (never print them).
   - `context.route()` everything on that host. Answer OPTIONS preflights with
     CORS headers (`access-control-allow-origin: *` plus allow-headers for
     `authorization, apikey, content-type, prefer, range, accept-profile,
     x-client-info`). All JSON responses need those CORS headers too.
   - **Logged-in state**: seed `localStorage["sb-<ref>-auth-token"]` with a fake
     Session object (`access_token`, `refresh_token`, `expires_at` in the
     future, `user:{id,...}`) via `addInitScript` — supabase-js reads it locally
     and never validates the JWT, so the auth gate opens without network.
   - **Pagination**: supabase-js v2 `.range()` sends `offset`/`limit` as query
     params (not a `Range` header) — parse `u.searchParams.get("offset")`.
   - `.single()`/`.maybeSingle()` expect an object body, list queries an array.
   - Endpoints the app hits: `/auth/v1/{token,signup,logout,user}`,
     `/rest/v1/{transactions,categories,credit_cards,credit_card_statements,monthly_budgets,settings}`,
     `/rest/v1/rpc/{get_monthly_stats,get_expenses_by_category}`.
4. A known-good full drive script (login errors, all five pages, pagination,
   confirm dialogs, sign-out) exists from the Svelte 5 runes migration —
   pattern: capture requests into an array, assert on method/path/body.

## Flows worth driving

- Logged-out: Login renders, Sign In/Sign Up toggle, submit → error message
  shown **without page navigation** (preventDefault).
- Dashboard: Quick Stats numbers from `get_monthly_stats`, Credit Card Due is
  derived from pending statements.
- Transactions: 51 mocked rows → 50 shown + "Load more"; add form POST body;
  Delete → confirm dialog (dismiss = no DELETE, accept = DELETE).
- Categories: Edit → inline edit row appears, Cancel removes it.
- Budgets: inputs prefilled from mock, Save → upsert POST + "Budget saved."
- Credit Cards: card + pending statement render, Mark Paid → PATCH.
- Sign Out → back to Login (session store round-trip).

## Gotchas

- `page.on("pageerror")` — collect and fail on any; Svelte runtime errors
  (e.g. mutating non-$state vars) surface here, not in request failures.
- Check `curl -s -o /dev/null -w "%{http_code}" localhost:5173` before driving.
