import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

/** Frontend app URL path, e.g. /task-management/ (VITE_APP_BASE_PATH). */
function resolveAppBase(env) {
  const raw = env.VITE_APP_BASE_PATH || '/';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const path = new URL(raw).pathname.replace(/\/$/, '') || '';
    return path ? `${path}/` : '/';
  }
  if (raw === '/') return '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

/** API path prefix, e.g. /task-management-api (VITE_BACK_END_DEFAULT_URL). */
function resolveApiBasePath(env) {
  const raw = env.VITE_BACK_END_DEFAULT_URL || '/task-management-api';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return new URL(raw).pathname.replace(/\/$/, '') || '';
  }
  return raw.startsWith('/') ? raw.replace(/\/$/, '') : `/${raw.replace(/\/$/, '')}`;
}

/** Proxy target = origin only (scheme + host + port). */
function resolveBackendTarget(env) {
  const raw = env.VITE_BACKEND_TARGET || 'http://localhost:3000';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return new URL(raw).origin;
  }
  return raw;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBase = resolveAppBase(env);
  const apiBasePath = resolveApiBasePath(env);
  const backendTarget = resolveBackendTarget(env);

  return {
    base: appBase,
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        [`${apiBasePath}/api`]: { target: backendTarget, changeOrigin: true },
        [`${apiBasePath}/socket.io`]: {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
