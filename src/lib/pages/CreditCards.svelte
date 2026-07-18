<script>
  import { onMount } from "svelte";
  import {
    getCreditCards,
    addCreditCard,
    deleteCreditCard,
    getPendingCreditCardStatements,
    addCreditCardStatement,
    markStatementPaid,
  } from "../db.js";
  import { formatCurrency } from "../format.js";

  let cards = $state([]);
  let statements = $state([]);
  let error = $state(null);
  let loading = $state(true);

  let name = $state("");
  let lastFour = $state("");
  let creditLimit = $state("");
  let billingDay = $state("");
  let dueDay = $state("");

  let stCardId = $state("");
  let stStatementDate = $state("");
  let stDueDate = $state("");
  let stTotal = $state("");
  let stMinPayment = $state("");

  async function load() {
    loading = true;
    try {
      [cards, statements] = await Promise.all([
        getCreditCards(),
        getPendingCreditCardStatements(),
      ]);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function handleAddCard(event) {
    event.preventDefault();
    error = null;
    try {
      await addCreditCard(
        name,
        lastFour || null,
        creditLimit ? Number(creditLimit) : null,
        billingDay ? Number(billingDay) : null,
        dueDay ? Number(dueDay) : null,
      );
      name = "";
      lastFour = "";
      creditLimit = "";
      billingDay = "";
      dueDay = "";
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleDeleteCard(card) {
    if (
      !window.confirm(
        `Delete card "${card.name}"? Its statements will also be deleted.`,
      )
    ) {
      return;
    }
    error = null;
    try {
      await deleteCreditCard(card.id);
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleAddStatement(event) {
    event.preventDefault();
    error = null;
    try {
      await addCreditCardStatement(
        stCardId,
        stStatementDate,
        stDueDate,
        Number(stTotal),
        stMinPayment ? Number(stMinPayment) : null,
      );
      stCardId = "";
      stStatementDate = "";
      stDueDate = "";
      stTotal = "";
      stMinPayment = "";
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleMarkPaid(id) {
    error = null;
    try {
      await markStatementPaid(id);
      await load();
    } catch (e) {
      error = e.message;
    }
  }
</script>

<header>
  <h1>Credit Cards</h1>
</header>

{#if error}
  <div class="card error-card"><p class="text-danger">{error}</p></div>
{/if}

<section class="card">
  <h2>Add Credit Card</h2>
  <form class="mt-md" onsubmit={handleAddCard}>
    <div class="form-row">
      <div class="form-group">
        <label for="cc-name">Name</label>
        <input type="text" id="cc-name" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="cc-last-four">Last 4 Digits</label>
        <input
          type="text"
          id="cc-last-four"
          maxlength="4"
          bind:value={lastFour}
        />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="cc-limit">Credit Limit</label>
        <input
          type="number"
          id="cc-limit"
          step="0.01"
          min="0"
          bind:value={creditLimit}
        />
      </div>
      <div class="form-group">
        <label for="cc-billing">Billing Day</label>
        <input
          type="number"
          id="cc-billing"
          min="1"
          max="31"
          bind:value={billingDay}
        />
      </div>
      <div class="form-group">
        <label for="cc-due">Due Day</label>
        <input type="number" id="cc-due" min="1" max="31" bind:value={dueDay} />
      </div>
    </div>
    <button type="submit" class="primary">Add Card</button>
  </form>
</section>

<section class="card mt-lg">
  <h2>Your Cards</h2>
  {#if loading}
    <p class="text-muted">Loading…</p>
  {:else if cards.length === 0}
    <p class="text-muted">No credit cards yet.</p>
  {:else}
    <ul class="row-list">
      {#each cards as c (c.id)}
        <li>
          <span
            >{c.name}
            {c.last_four_digits ? `•••• ${c.last_four_digits}` : ""}</span
          >
          <span class="text-muted"
            >{c.credit_limit
              ? formatCurrency(c.credit_limit) + " limit"
              : ""}</span
          >
          <button
            type="button"
            class="danger"
            onclick={() => handleDeleteCard(c)}>Delete</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</section>

<section class="card mt-lg">
  <h2>Add Statement</h2>
  <form class="mt-md" onsubmit={handleAddStatement}>
    <div class="form-group">
      <label for="st-card">Card</label>
      <select id="st-card" bind:value={stCardId} required>
        <option value="">Select card...</option>
        {#each cards as c (c.id)}
          <option value={c.id}>{c.name}</option>
        {/each}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="st-statement-date">Statement Date</label>
        <input
          type="date"
          id="st-statement-date"
          bind:value={stStatementDate}
          required
        />
      </div>
      <div class="form-group">
        <label for="st-due-date">Due Date</label>
        <input type="date" id="st-due-date" bind:value={stDueDate} required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="st-total">Total Amount</label>
        <input
          type="number"
          id="st-total"
          step="0.01"
          min="0"
          bind:value={stTotal}
          required
        />
      </div>
      <div class="form-group">
        <label for="st-min">Minimum Payment</label>
        <input
          type="number"
          id="st-min"
          step="0.01"
          min="0"
          bind:value={stMinPayment}
        />
      </div>
    </div>
    <button type="submit" class="primary">Add Statement</button>
  </form>
</section>

<section class="card mt-lg">
  <h2>Pending Statements</h2>
  {#if statements.length === 0}
    <p class="text-muted">No pending statements.</p>
  {:else}
    <ul class="row-list">
      {#each statements as s (s.id)}
        <li>
          <span>{s.credit_card?.name} due {s.due_date}</span>
          <span class="text-danger">{formatCurrency(s.total_amount)}</span>
          <button
            type="button"
            class="secondary"
            onclick={() => handleMarkPaid(s.id)}>Mark Paid</button
          >
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  header {
    margin-bottom: var(--spacing-xl);
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-md);
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .row-list {
    list-style: none;
    margin-top: var(--spacing-md);
  }

  .row-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .row-list li:last-child {
    border-bottom: none;
  }

  .error-card {
    border-color: var(--color-danger);
  }
</style>
