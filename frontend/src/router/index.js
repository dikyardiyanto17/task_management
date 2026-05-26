import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'tasks/:id', name: 'task-detail', component: () => import('../views/TaskDetailView.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) return '/login';
    if (!auth.user) {
      try {
        await auth.fetchMe();
      } catch {
        await auth.logout();
        return '/login';
      }
    }
  }

  if (to.meta.guest && auth.isAuthenticated) return '/';
  return true;
});

export default router;
