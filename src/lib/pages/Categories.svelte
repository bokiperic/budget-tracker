<script>
  import { onMount } from "svelte";
  import {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } from "../db.js";

  let categories = $state([]);
  let error = $state(null);
  let loading = $state(true);

  let name = $state("");
  let type = $state("expense");
  let icon = $state("");
  let color = $state("#64748b");

  let editingId = $state(null);
  let editName = $state("");
  let editType = $state("expense");
  let editIcon = $state("");
  let editColor = $state("#64748b");

  async function load() {
    loading = true;
    try {
      categories = await getCategories();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function handleAdd(event) {
    event.preventDefault();
    error = null;
    try {
      await addCategory(name, type, icon || null, color || null);
      name = "";
      icon = "";
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  function startEdit(cat) {
    editingId = cat.id;
    editName = cat.name;
    editType = cat.type;
    editIcon = cat.icon || "";
    editColor = cat.color || "#64748b";
  }

  function cancelEdit() {
    editingId = null;
  }

  async function saveEdit(id) {
    error = null;
    try {
      await updateCategory(id, {
        name: editName,
        type: editType,
        icon: editIcon,
        color: editColor,
      });
      editingId = null;
      await load();
    } catch (e) {
      error = e.message;
    }
  }

  async function handleDelete(cat) {
    if (
      !window.confirm(
        `Delete category "${cat.name}"? Transactions in it will become uncategorized.`,
      )
    ) {
      return;
    }
    error = null;
    try {
      await deleteCategory(cat.id);
      await load();
    } catch (e) {
      error = e.message;
    }
  }
</script>

<header>
  <h1>Categories</h1>
</header>

{#if error}
  <div class="card error-card"><p class="text-danger">{error}</p></div>
{/if}

<section class="card">
  <h2>Add Category</h2>
  <form class="mt-md" onsubmit={handleAdd}>
    <div class="form-row">
      <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="type">Type</label>
        <select id="type" bind:value={type}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="both">Both</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="icon">Icon (emoji)</label>
        <input type="text" id="icon" bind:value={icon} maxlength="4" />
      </div>
      <div class="form-group">
        <label for="color">Color</label>
        <input type="color" id="color" bind:value={color} />
      </div>
    </div>
    <button type="submit" class="primary">Add Category</button>
  </form>
</section>

<section class="card mt-lg">
  <h2>All Categories</h2>
  {#if loading}
    <p class="text-muted">Loading…</p>
  {:else if categories.length === 0}
    <p class="text-muted">No categories yet.</p>
  {:else}
    <ul class="category-list">
      {#each categories as cat (cat.id)}
        <li>
          {#if editingId === cat.id}
            <div class="edit-row">
              <input type="text" bind:value={editName} />
              <select bind:value={editType}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="both">Both</option>
              </select>
              <input type="text" bind:value={editIcon} maxlength="4" />
              <input type="color" bind:value={editColor} />
              <button
                type="button"
                class="primary"
                onclick={() => saveEdit(cat.id)}>Save</button
              >
              <button type="button" class="secondary" onclick={cancelEdit}
                >Cancel</button
              >
            </div>
          {:else}
            <span
              >{cat.icon}
              {cat.name} <span class="text-muted">({cat.type})</span></span
            >
            <div class="row-actions">
              <button
                type="button"
                class="secondary"
                onclick={() => startEdit(cat)}>Edit</button
              >
              <button
                type="button"
                class="danger"
                onclick={() => handleDelete(cat)}>Delete</button
              >
            </div>
          {/if}
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
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .form-group {
    margin-bottom: var(--spacing-md);
  }

  .category-list {
    list-style: none;
    margin-top: var(--spacing-md);
  }

  .category-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border);
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .category-list li:last-child {
    border-bottom: none;
  }

  .row-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .edit-row {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    flex-wrap: wrap;
  }

  .error-card {
    border-color: var(--color-danger);
  }
</style>
