<script>
  import { signIn, signUp } from "../auth.js";

  let email = $state("");
  let password = $state("");
  let mode = $state("signIn"); // 'signIn' | 'signUp'
  let error = $state(null);
  let message = $state(null);
  let loading = $state(false);

  async function handleSubmit(event) {
    event.preventDefault();
    error = null;
    message = null;
    loading = true;
    try {
      if (mode === "signIn") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        message = "Check your email to confirm your account, then sign in.";
        mode = "signIn";
      }
    } catch (e) {
      error = /signups? (are )?(not allowed|disabled)/i.test(e.message)
        ? "Signups are currently invite-only. Contact the app admin for access."
        : e.message;
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    mode = mode === "signIn" ? "signUp" : "signIn";
    error = null;
    message = null;
  }
</script>

<div class="login-wrapper">
  <div class="card login-card">
    <h1>💰 Budget Tracker</h1>
    <p class="text-muted">
      {mode === "signIn" ? "Sign in to your account" : "Create an account"}
    </p>

    {#if error}
      <p class="text-danger mt-md">{error}</p>
    {/if}
    {#if message}
      <p class="text-success mt-md">{message}</p>
    {/if}

    <form onsubmit={handleSubmit} class="mt-lg">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          autocomplete="email"
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          minlength="6"
          autocomplete={mode === "signIn" ? "current-password" : "new-password"}
        />
      </div>
      <button type="submit" class="primary" disabled={loading}>
        {loading ? "Please wait…" : mode === "signIn" ? "Sign In" : "Sign Up"}
      </button>
    </form>

    <p class="text-muted mt-md toggle-row">
      {mode === "signIn"
        ? "Don't have an account?"
        : "Already have an account?"}
      <button type="button" class="secondary" onclick={toggleMode}>
        {mode === "signIn" ? "Sign Up" : "Sign In"}
      </button>
    </p>
  </div>
</div>

<style>
  .login-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
  }

  .login-card {
    width: 100%;
    max-width: 380px;
    text-align: center;
  }

  .login-card form {
    text-align: left;
  }

  .login-card form button.primary {
    width: 100%;
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }
</style>
