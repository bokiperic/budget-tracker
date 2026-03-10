# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development (Tauri + Vite dev server + desktop window)
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only (no desktop window)
npm run dev
```

First build downloads ~400 Rust crates and takes several minutes. Subsequent builds are ~7 seconds.

## Architecture

**Tauri v2 desktop app** — Rust backend manages the SQLite database via `tauri-plugin-sql`; Svelte frontend communicates through Tauri's IPC bridge.

```
src/                   # Svelte frontend
  App.svelte           # Root component (dashboard, stats, transaction form)
  lib/db.js            # All SQLite operations (CRUD for all entities)
  app.css              # Global styles (CSS variables for spacing, colors)
  main.js              # Svelte entry point

src-tauri/             # Rust backend
  src/main.rs          # Tauri entry point, registers SQL plugin
  tauri.conf.json      # App config (window, build, bundle settings)
  capabilities/default.json  # Required: declares sql:allow-* permissions
  Cargo.toml           # tauri v2, tauri-plugin-sql (sqlite feature)
```

## DB Layer (`src/lib/db.js`)

Single module with a module-level `db` singleton. Call `initDatabase()` once on app mount — it creates all tables and seeds default categories.

**Tables:** `settings` (key/value), `categories`, `transactions`, `credit_cards`, `credit_card_statements`, `monthly_budgets`

**Parameterized queries use `$1, $2, ...` syntax** (not `?`), passed as the second argument array to `db.execute()` / `db.select()`.

Transaction types are constrained by CHECK: `'income' | 'expense' | 'credit_payment'`

## Tauri v2 Notes

- Capabilities file at `src-tauri/capabilities/default.json` is required — missing or wrong window label causes exit code 101
- Window label in capabilities must be `"main"` (matches the window defined in `tauri.conf.json`)
- Icons must be RGBA PNG (color_type=6), not RGB — Tauri rejects RGB PNGs at build time
