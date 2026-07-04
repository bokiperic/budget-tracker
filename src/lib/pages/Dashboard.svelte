<script>
  import { onMount } from 'svelte';
  import { getMonthlyStats, getExpensesByCategory, getPendingCreditCardStatements } from '../db.js';
  import { formatCurrency, currentYearMonth } from '../format.js';

  const yearMonth = currentYearMonth();

  let stats = null;
  let expensesByCategory = [];
  let pendingStatements = [];
  let error = null;
  let loading = true;

  onMount(async () => {
    try {
      [stats, expensesByCategory, pendingStatements] = await Promise.all([
        getMonthlyStats(yearMonth),
        getExpensesByCategory(yearMonth),
        getPendingCreditCardStatements(),
      ]);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  $: creditCardDue = pendingStatements.reduce((sum, s) => sum + Number(s.total_amount), 0);
</script>

<header>
  <h1>Dashboard</h1>
  <p class="text-muted">Overview for {yearMonth}</p>
</header>

{#if error}
  <div class="card error-card">
    <h3 class="text-danger">Error</h3>
    <p>{error}</p>
  </div>
{:else if loading}
  <div class="card"><p class="text-muted">Loading…</p></div>
{:else}
  <section class="card">
    <h2>Quick Stats</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-label">Monthly Income</span>
        <span class="stat-value">{formatCurrency(stats.income)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Expenses</span>
        <span class="stat-value">{formatCurrency(stats.expenses)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Savings Rate</span>
        <span class="stat-value text-success">{stats.savingsRate.toFixed(0)}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Credit Card Due</span>
        <span class="stat-value">{formatCurrency(creditCardDue)}</span>
      </div>
    </div>
  </section>

  <section class="card mt-lg">
    <h2>Expenses by Category</h2>
    {#if expensesByCategory.length === 0}
      <p class="text-muted">No expenses recorded this month yet.</p>
    {:else}
      <ul class="category-list">
        {#each expensesByCategory as cat}
          <li>
            <span>{cat.icon} {cat.name}</span>
            <span>{formatCurrency(cat.total)}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  header {
    margin-bottom: var(--spacing-xl);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }

  .stat-item {
    text-align: center;
    padding: var(--spacing-md);
    background-color: var(--color-background);
    border-radius: var(--radius-md);
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-xs);
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .category-list {
    list-style: none;
    margin-top: var(--spacing-md);
  }

  .category-list li {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .category-list li:last-child {
    border-bottom: none;
  }

  .error-card {
    border-color: var(--color-danger);
  }
</style>
