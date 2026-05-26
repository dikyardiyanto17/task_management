/** Vite `base` option — e.g. /task-management/ (see VITE_APP_BASE_PATH). */
export const APP_BASE = import.meta.env.BASE_URL;

export function appPath(path = '') {
  const segment = String(path).replace(/^\//, '');
  return `${APP_BASE}${segment}`;
}
