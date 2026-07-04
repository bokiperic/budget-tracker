# Budget Tracker

---

This is just an initial readme file. The app is still in the process of POC, so it isn't ready for use. Also features list needs to be updated after initial development is done. These are just currently planned features.

---

A personal finance application for tracking income, expenses, and credit card payments. Built with Tauri, Svelte, and SQLite.

## Features

- Track income and expenses by category
- Monitor credit card payments and due dates
- Calculate savings rates and financial statistics
- Set monthly budgets and targets
- All data stored locally in SQLite database

## Tech Stack

- **Frontend**: Svelte 4 + Vite
- **Backend**: Tauri (Rust)
- **Database**: SQLite (via tauri-plugin-sql)
- **Styling**: Custom CSS with CSS variables

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific dependencies for Tauri:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Microsoft Visual Studio C++ Build Tools, WebView2
  - **Linux**: See [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux)

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

3. **Run in development mode**

   ```bash
   npm run tauri dev
   ```

   This will start both the Vite dev server and the Tauri application.

4. **Build for production**

   ```bash
   npm run tauri build
   ```

   This creates platform-specific installers in `src-tauri/target/release/bundle/`.

## Project Structure

```
budget-tracker/
├── src/                    # Svelte frontend source
│   ├── lib/               # Utilities and components
│   │   └── db.js          # Database operations
│   ├── App.svelte         # Main application component
│   ├── app.css            # Global styles
│   └── main.js            # Entry point
├── src-tauri/             # Tauri backend
│   ├── src/
│   │   └── main.rs        # Rust entry point
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json           # Node.js dependencies
├── vite.config.js         # Vite configuration
└── svelte.config.js       # Svelte configuration
```

## Database Schema

The application uses SQLite with the following tables:

- **transactions**: Income, expenses, and credit card payments
- **categories**: Transaction categories (income/expense types)
- **credit_cards**: Credit card information
- **credit_card_statements**: Monthly credit card statements
- **monthly_budgets**: Budget targets by month
- **settings**: Application settings

## Development

### Adding new features

1. **Frontend components**: Add Svelte components in `src/lib/`
2. **Database operations**: Add functions in `src/lib/db.js`
3. **Native functionality**: Add Rust commands in `src-tauri/src/main.rs`

### Useful commands

```bash
# Start development server only (without Tauri)
npm run dev

# Build frontend only
npm run build

# Run Tauri in development
npm run tauri dev

# Build production app
npm run tauri build
```

## License

MIT
