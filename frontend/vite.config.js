import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

function resolveBasePath(env) {
  const raw = env.VITE_BACK_END_DEFAULT_URL || '/task-management-api';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return new URL(raw).pathname.replace(/\/$/, '') || '';
  }
  return raw.startsWith('/') ? raw.replace(/\/$/, '') : `/${raw.replace(/\/$/, '')}`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = resolveBasePath(env);
  const backendTarget = env.VITE_BACKEND_TARGET || 'http://localhost:3000';

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        [`${basePath}/api`]: { target: backendTarget, changeOrigin: true },
        [`${basePath}/socket.io`]: {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
