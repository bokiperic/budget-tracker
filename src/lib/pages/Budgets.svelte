<script>
  import { onMount } from "svelte";
  import { getMonthlyBudget, setMonthlyBudget } from "../db.js";
  import { currentYearMonth } from "../format.js";

  let month = $state(currentYearMonth());
  let incomeTarget = $state("");
  let expenseLimit = $state("");
  let savingsTargetPercent = $state("");
  let error = $state(null);
  let message = $state(null);
  let loading = $state(true);

  async function load() {
    loading = true;
    error = null;
    message = null;
    try {
      const budget = await getMonthlyBudget(month);
      incomeTarget = budget?.income_target ?? "";
      expenseLimit = budget?.expense_limit ?? "";
      savingsTargetPercent = budget?.savings_target_percent ?? "";
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function handleSave(event) {
    event.preventDefault();
    error = null;
    message = null;
    try {
      await setMonthlyBudget(
        month,
        incomeTarget ? Number(incomeTarget) : null,
        expenseLimit ? Number(expenseLimit) : null,
        savingsTargetPercent ? Number(savingsTargetPercent) : null,
      );
      message = "Budget saved.";
    } catch (e) {
      error = e.message;
    }
  }
</script>

<header>
  <h1>Budgets</h1>
</header>

{#if error}
  <div class="card error-card"><p class="text-danger">{error}</p></div>
{/if}

<section class="card">
  <h2>Monthly Budget</h2>
  <div class="form-group mt-md">
    <label for="month">Month</label>
    <input type="month" id="month" bind:value={month} onchange={load} />
  </div>

  {#if loading}
    <p class="text-muted">Loading…</p>
  {:else}
    <form onsubmit={handleSave}>
      <div class="form-group">
        <label for="income-target">Income Target</label>
        <input
          type="number"
          id="income-target"
          step="0.01"
          min="0"
          bind:value={incomeTarget}
        />
      </div>
      <div class="form-group">
        <label for="expense-limit">Expense Limit</label>
        <input
          type="number"
          id="expense-limit"
          step="0.01"
          min="0"
          bind:value={expenseLimit}
        />
      </div>
      <div class="form-group">
        <label for="savings-target">Savings Target (%)</label>
        <input
          type="number"
          id="savings-target"
          step="0.1"
          min="0"
          max="100"
          bind:value={savingsTargetPercent}
        />
      </div>
      <button type="submit" class="primary">Save Budget</button>
    </form>
    {#if message}
      <p class="text-success mt-md">{message}</p>
    {/if}
  {/if}
</section>

<style>
  header {
    margin-bottom: var(--spacing-xl);
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .error-card {
    border-color: var(--color-danger);
  }
</style>
