/** Mirrors backend BACK_END_DEFAULT_URL (use VITE_BACK_END_DEFAULT_URL in frontend .env). */
export function parseBasePath(raw = '') {
  const value = (raw || '').trim();
  if (!value) return '';

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return new URL(value).pathname.replace(/\/$/, '') || '';
  }
  return value.startsWith('/') ? value.replace(/\/$/, '') : `/${value.replace(/\/$/, '')}`;
}

const basePath = parseBasePath(import.meta.env.VITE_BACK_END_DEFAULT_URL);

export const API_BASE_PATH = basePath;
export const API_BASE_URL = basePath ? `${basePath}/api` : '/api';
export const SOCKET_IO_PATH = basePath ? `${basePath}/socket.io` : '/socket.io';
