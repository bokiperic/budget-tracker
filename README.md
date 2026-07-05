# Budget Tracker

A personal finance web application for tracking income, expenses, and credit card payments — with per-user login and private data, deployed online.

## Features

- Track income and expenses by category
- Monitor credit card payments and due dates
- Calculate savings rates and financial statistics
- Set monthly budgets and targets
- Each user has their own private, isolated data (multi-tenant)

## Tech Stack

- **Frontend**: Svelte 5 + Vite, client-side routing via `svelte-spa-router`
- **Backend**: [Supabase](https://supabase.com/) — Postgres + Auth + Row Level Security (RLS). There is no custom server: the frontend talks to Supabase directly via `@supabase/supabase-js`, and RLS policies enforce that each user only ever sees their own data.
- **Hosting**: [Vercel](https://vercel.com/) (static build, auto-deployed from `main` via Vercel's GitHub integration)
- **CI**: GitHub Actions — build verification, code quality (`svelte-check`, ESLint, Prettier), dependency security audit, and CodeQL static analysis on every PR; Dependabot for automated dependency updates
- **Styling**: Custom CSS with CSS variables

This app was originally a Tauri desktop app (Rust + SQLite); it was migrated to a hosted, multi-tenant web app backed by Supabase so multiple people can use it via a URL with their own login.

## Auth

Sign-in is email/password via Supabase Auth. **Signups are currently invite-only** (a development-phase setting) — new accounts are created by an admin via the Supabase dashboard (Authentication → Users → Invite user) rather than self-service. This will likely change once the app is out of active development.

## Prerequisites

- [Node.js](https://nodejs.org/) (see `.nvmrc` for the pinned version)
- A [Supabase](https://supabase.com/) project (free tier is fine)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/bokiperic/budget-tracker.git
   cd budget-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a project at [supabase.com](https://supabase.com/).
   - In the SQL Editor, run the migrations in `supabase/migrations/` in order (`0001_init.sql`, then `0002_grants.sql`). These create the schema, Row Level Security policies, a trigger that seeds default categories for new users, and the aggregation RPC functions the app relies on.
   - In Authentication → Providers → Email, configure sign-in as desired (confirm email, allow/disallow public signups).
   - Grab your Project URL and anon/public key from Settings → API.

4. **Configure environment variables**

   Create a `.env.local` file in the project root (already covered by `.gitignore`):

   ```
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

5. **Run in development mode**

   ```bash
   npm run dev
   ```

6. **Build for production**

   ```bash
   npm run build
   ```

   This produces a static `dist/` build — deployable to Vercel, Netlify, Cloudflare Pages, or any static host. Remember to add the production domain to Supabase Auth's Site URL / Redirect URLs if you use OAuth or magic links.

## Project Structure

```
budget-tracker/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js       # Supabase client singleton
│   │   ├── auth.js                 # signIn / signUp / signOut wrappers
│   │   ├── db.js                   # All Supabase queries (CRUD) + RPC calls for aggregation
│   │   ├── format.js               # formatCurrency / currentYearMonth / monthRange helpers
│   │   ├── stores/
│   │   │   └── session.js          # Svelte store tracking the current auth session
│   │   ├── components/
│   │   │   ├── Login.svelte        # Email/password sign-in + sign-up form
│   │   │   └── Layout.svelte       # Nav bar (page links + sign-out) wrapping routed pages
│   │   └── pages/
│   │       ├── Dashboard.svelte
│   │       ├── Transactions.svelte
│   │       ├── Categories.svelte
│   │       ├── CreditCards.svelte
│   │       └── Budgets.svelte
│   ├── App.svelte                  # Auth gate (Login vs. Layout+Router)
│   ├── app.css                     # Global styles (CSS variables)
│   └── main.js                     # Svelte entry point
├── supabase/
│   └── migrations/
│       ├── 0001_init.sql           # Schema, RLS policies, seeding trigger, stats RPC functions
│       └── 0002_grants.sql         # Explicit GRANTs to the authenticated role
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # Build / quality / security-check jobs
│   │   └── codeql.yml              # CodeQL static analysis
│   └── dependabot.yml              # Automated dependency updates
├── public/                         # Static assets
├── index.html                      # HTML entry point
├── package.json
├── vite.config.js
├── eslint.config.js
├── .prettierrc / .prettierignore
└── .nvmrc                          # Pinned Node version
```

## Database Schema

Postgres (via Supabase), defined in `supabase/migrations/`. Every table has a `user_id` column defaulting to `auth.uid()`, with Row Level Security restricting all access to `auth.uid() = user_id`:

- **transactions**: Income, expenses, and credit card payments
- **categories**: Transaction categories (income/expense types) — 14 defaults auto-seeded per new user
- **credit_cards**: Credit card information
- **credit_card_statements**: Monthly credit card statements
- **monthly_budgets**: Budget targets by month
- **settings**: Application settings (key/value)

Two Postgres RPC functions (`get_monthly_stats`, `get_expenses_by_category`) handle aggregation queries that don't map cleanly to Supabase's query builder.

## Development

### Adding new features

1. **Pages**: Add a new Svelte component under `src/lib/pages/` and register its route in `App.svelte`'s `routes` map; add a nav link in `src/lib/components/Layout.svelte`.
2. **Database operations**: Add functions in `src/lib/db.js`, following the existing pattern of thin wrappers around `supabase.from(...)` calls.
3. **New tables**: Add a new migration file in `supabase/migrations/`, giving the table a `user_id` column (`default auth.uid()`), enabling RLS, and adding select/insert/update/delete policies restricted to `auth.uid() = user_id`.

### Useful commands

```bash
npm run dev            # Start the Vite dev server
npm run build           # Build for production
npm run preview         # Preview a production build locally
npm run check           # Run svelte-check (component diagnostics)
npm test                # Run unit tests (Vitest)
npm run lint            # Run ESLint
npm run format           # Auto-format with Prettier
npm run format:check    # Check formatting without writing
```

These same checks (plus `npm audit` and CodeQL) run automatically on every pull request via GitHub Actions.

## License

MIT
