import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/client';
import { connectSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || '');
  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    connectSocket(data.token);
    return data;
  }

  async function fetchMe() {
    const { data } = await api.get('/auth/me');
    user.value = data.user;
    if (token.value) connectSocket(token.value);
    return data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    disconnectSocket();
  }

  function init() {
    if (token.value) fetchMe().catch(() => logout());
  }

  return { user, token, isAuthenticated, login, logout, fetchMe, init };
});
