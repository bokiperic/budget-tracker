<script>
  import { onMount } from "svelte";
  import {
    getTransactions,
    addTransaction,
    deleteTransaction,
    getCategories,
  } from "../db.js";
  import { formatCurrency } from "../format.js";

  const PAGE_SIZE = 50;

  let transactions = $state([]);
  let categories = $state([]);
  let hasMore = $state(false);
  let error = $state(null);
  let loading = $state(true);

  let type = $state("expense");
  let amount = $state("");
  let description = $state("");
  let categoryId = $state("");
  let date = $state(new Date().toISOString().slice(0, 10));

  async function load() {
    loading = true;
    try {
      // Fetch one row beyond the page size to know if more pages exist.
      const [txns, cats] = await Promise.all([
        getTransactions(PAGE_SIZE + 1),
        getCategories(),
      ]);
      hasMore = txns.length > PAGE_SIZE;
      transactions = txns.slice(0, PAGE_SIZE);
      categories = cats;
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function loadMore() {
    error = null;
    try {
      const more = await getTransactions(PAGE_SIZE + 1, transactions.length);
      hasMore = more.length > PAGE_SIZE;
      transactions = [...transactions, ...more.slice(0, PAGE_SIZE)];
    } catch (e) {
      error = e.message;
    }
  }

  onMount(load);

  async function handleSubmit(event) {
    event.preventDefault();
    error = null;
    try {
      await addTransaction(
        type,
        Number(amount),
        description || null,
        categoryId || null,
        date,
      );
      amount = "";
      description = "";
      categoryId = "";
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleDelete(t) {
    const label = t.description || t.type;
    if (!window.confirm(`Delete "${label}" (${formatCurrency(t.amount)})?`)) {
      return;
    }
    error = null;
    try {
      await deleteTransaction(t.id);
      await load();
    } catch (e) {
      error = e.message;
    }
  }
</script>

<header>
  <h1>Transactions</h1>
</header>

{#if error}
  <div class="card error-card"><p class="text-danger">{error}</p></div>
{/if}

<section class="card">
  <h2>Add Transaction</h2>
  <form class="transaction-form" onsubmit={handleSubmit}>
    <div class="form-row">
      <div class="form-group">
        <label for="type">Type</label>
        <select id="type" bind:value={type}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="credit_payment">Credit Card Payment</option>
        </select>
      </div>
      <div class="form-group">
        <label for="amount">Amount</label>
        <input
          type="number"
          id="amount"
          placeholder="0.00"
          step="0.01"
          min="0"
          bind:value={amount}
          required
        />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="description">Description</label>
        <input
          type="text"
          id="description"
          placeholder="e.g., Monthly salary, Groceries..."
          bind:value={description}
        />
      </div>
      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" bind:value={date} />
      </div>
    </div>
    <div class="form-group">
      <label for="category">Category</label>
      <select id="category" bind:value={categoryId}>
        <option value="">Select category...</option>
        {#each categories as cat (cat.id)}
          <option value={cat.id}>{cat.icon} {cat.name}</option>
        {/each}
      </select>
    </div>
    <button type="submit" class="primary">Add Transaction</button>
  </form>
</section>

<section class="card mt-lg">
  <h2>Recent Transactions</h2>
  {#if loading}
    <p class="text-muted">Loading…</p>
  {:else if transactions.length === 0}
    <p class="text-muted">
      No transactions yet. Add your first transaction above!
    </p>
  {:else}
    <ul class="transaction-list">
      {#each transactions as t (t.id)}
        <li>
          <div>
            <span class="tx-desc"
              >{t.category?.icon ?? "💰"} {t.description || t.type}</span
            >
            <span class="text-muted tx-date">{t.date}</span>
          </div>
          <div class="tx-right">
            <span
              class="tx-amount"
              class:text-success={t.type === "income"}
              class:text-danger={t.type !== "income"}
            >
              {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
            </span>
            <button
              type="button"
              class="secondary"
              onclick={() => handleDelete(t)}>Delete</button
            >
          </div>
        </li>
      {/each}
    </ul>
    {#if hasMore}
      <button type="button" class="secondary load-more" onclick={loadMore}
        >Load more</button
      >
    {/if}
  {/if}
</section>

<style>
  header {
    margin-bottom: var(--spacing-xl);
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
    margin-top: var(--spacing-sm);
  }

  .transaction-list {
    list-style: none;
    margin-top: var(--spacing-md);
  }

  .transaction-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-md);
  }

  .transaction-list li:last-child {
    border-bottom: none;
  }

  .tx-desc {
    display: block;
    font-weight: 500;
  }

  .tx-date {
    font-size: 0.8rem;
  }

  .tx-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .tx-amount {
    font-weight: 600;
  }

  .load-more {
    width: 100%;
    margin-top: var(--spacing-md);
  }

  .error-card {
    border-color: var(--color-danger);
  }
</style>
