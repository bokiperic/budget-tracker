<script>
  import { onMount } from 'svelte';
  import { initDatabase, isReady } from './lib/db.js';

  let dbInitialized = false;
  let error = null;

  onMount(async () => {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (e) {
      console.error('Failed to initialize database:', e);
      error = e.message;
    }
  });
</script>

<main>
  <header>
    <h1>💰 Budget Tracker</h1>
    <p class="text-muted">Track your income, expenses, and credit card payments</p>
  </header>

  {#if error}
    <div class="card error-card">
      <h3 class="text-danger">Database Error</h3>
      <p>{error}</p>
    </div>
  {:else if !dbInitialized}
    <div class="card">
      <p>Initializing database...</p>
    </div>
  {:else}
    <div class="dashboard">
      <section class="card">
        <h2>Quick Stats</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Monthly Income</span>
            <span class="stat-value">$0.00</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Expenses</span>
            <span class="stat-value">$0.00</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Savings Rate</span>
            <span class="stat-value text-success">0%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Credit Card Due</span>
            <span class="stat-value">$0.00</span>
          </div>
        </div>
      </section>

      <section class="card mt-lg">
        <h2>Add Transaction</h2>
        <form class="transaction-form">
          <div class="form-row">
            <div class="form-group">
              <label for="type">Type</label>
              <select id="type">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="credit_payment">Credit Card Payment</option>
              </select>
            </div>
            <div class="form-group">
              <label for="amount">Amount</label>
              <input type="number" id="amount" placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <input type="text" id="description" placeholder="e.g., Monthly salary, Groceries..." />
          </div>
          <div class="form-group">
            <label for="category">Category</label>
            <select id="category">
              <option value="">Select category...</option>
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="food">Food & Dining</option>
              <option value="transport">Transportation</option>
              <option value="utilities">Utilities</option>
              <option value="entertainment">Entertainment</option>
              <option value="shopping">Shopping</option>
              <option value="healthcare">Healthcare</option>
              <option value="credit_card">Credit Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" class="primary">Add Transaction</button>
        </form>
      </section>

      <section class="card mt-lg">
        <h2>Recent Transactions</h2>
        <p class="text-muted">No transactions yet. Add your first transaction above!</p>
        <!-- Transaction list will go here -->
      </section>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
  }

  header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
  }

  header h1 {
    margin-bottom: var(--spacing-xs);
  }

  .error-card {
    border-color: var(--color-danger);
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

  .transaction-form {
    margin-top: var(--spacing-md);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .transaction-form button {
    width: 100%;
    padding: var(--spacing-md);
  }

  h2 {
    margin-bottom: var(--spacing-sm);
  }
</style>
