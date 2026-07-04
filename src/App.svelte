<script>
  import Router from 'svelte-spa-router';
  import { session } from './lib/stores/session.js';
  import Login from './lib/components/Login.svelte';
  import Layout from './lib/components/Layout.svelte';
  import Dashboard from './lib/pages/Dashboard.svelte';
  import Transactions from './lib/pages/Transactions.svelte';
  import Categories from './lib/pages/Categories.svelte';
  import CreditCards from './lib/pages/CreditCards.svelte';
  import Budgets from './lib/pages/Budgets.svelte';

  const routes = {
    '/': Dashboard,
    '/transactions': Transactions,
    '/categories': Categories,
    '/credit-cards': CreditCards,
    '/budgets': Budgets,
  };
</script>

{#if $session === undefined}
  <main class="loading-gate">
    <p class="text-muted">Loading…</p>
  </main>
{:else if $session === null}
  <Login />
{:else}
  <Layout>
    <Router {routes} />
  </Layout>
{/if}

<style>
  .loading-gate {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
  }
</style>
