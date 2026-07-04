<script>
  import { link } from 'svelte-spa-router';
  import { signOut } from '../auth.js';
</script>

<div class="app-shell">
  <nav class="card">
    <div class="nav-brand">💰 Budget Tracker</div>
    <div class="nav-links">
      <a href="/" use:link>Dashboard</a>
      <a href="/transactions" use:link>Transactions</a>
      <a href="/categories" use:link>Categories</a>
      <a href="/credit-cards" use:link>Credit Cards</a>
      <a href="/budgets" use:link>Budgets</a>
    </div>
    <button type="button" class="secondary" on:click={signOut}>Sign Out</button>
  </nav>

  <main>
    <slot />
  </main>
</div>

<style>
  .app-shell {
    max-width: 1000px;
    margin: 0 auto;
  }

  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
    flex-wrap: wrap;
  }

  .nav-brand {
    font-weight: 600;
    font-size: 1.1rem;
  }

  .nav-links {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .nav-links a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .nav-links a:hover {
    color: var(--color-primary);
  }

  main {
    padding-bottom: var(--spacing-xl);
  }
</style>
