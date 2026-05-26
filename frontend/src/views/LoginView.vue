<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const email = ref('alice@example.com');
const password = ref('password123');
const loading = ref(false);
const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();

async function submit() {
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    toast.show('Welcome back!', 'success');
    router.push('/');
  } catch (e) {
    toast.show(e.response?.data?.message || 'Login failed', 'error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="card login-card">
      <h1>Task Management</h1>
      <p class="subtitle">Sign in to continue</p>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      <p class="hint">Demo: alice@example.com / password123</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 400px;
}
.login-card h1 {
  margin-bottom: 0.25rem;
}
.subtitle {
  color: var(--muted);
  margin-bottom: 1.5rem;
}
.btn-block {
  width: 100%;
  margin-top: 0.5rem;
}
.hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--muted);
  text-align: center;
}
</style>
