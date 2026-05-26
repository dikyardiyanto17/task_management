<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { on, getSocket } from '../services/socket';

const auth = useAuthStore();
const router = useRouter();
const onlineUsers = ref([]);

onMounted(() => {
  if (getSocket()) {
    on('presence:update', (users) => {
      onlineUsers.value = users;
    });
  }
});

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="logo">TaskFlow</router-link>
      <nav class="nav">
        <router-link to="/">Dashboard</router-link>
      </nav>
      <div class="header-right">
        <span class="presence hide-mobile" :title="`${onlineUsers.length} online`">
          {{ onlineUsers.length }} online
        </span>
        <span class="user-name">{{ auth.user?.name }}</span>
        <button class="btn btn-ghost" @click="handleLogout">Logout</button>
      </div>
    </div>
  </header>
  <main class="main">
    <router-view />
  </main>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text);
  text-decoration: none;
}
.nav a {
  color: var(--muted);
  text-decoration: none;
  margin-right: 1rem;
}
.nav a.router-link-active {
  color: var(--primary);
}
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.presence {
  font-size: 0.8rem;
  color: var(--success);
}
.user-name {
  color: var(--muted);
  font-size: 0.9rem;
}
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
</style>
