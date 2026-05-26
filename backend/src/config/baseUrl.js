/**
 * BACK_END_DEFAULT_URL examples:
 *   http://localhost:3000/task-management-api
 *   /task-management-api
 */
function parseBackEndDefaultUrl() {
  const raw = (process.env.BACK_END_DEFAULT_URL || '').trim();
  if (!raw) {
    return { basePath: '', apiPrefix: '/api', socketPath: '/socket.io', publicUrl: null };
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const parsed = new URL(raw);
    const basePath = parsed.pathname.replace(/\/$/, '') || '';
    return {
      basePath,
      apiPrefix: `${basePath}/api`,
      socketPath: `${basePath}/socket.io`,
      publicUrl: `${parsed.origin}${basePath}`,
    };
  }

  const basePath = raw.startsWith('/') ? raw.replace(/\/$/, '') : `/${raw.replace(/\/$/, '')}`;
  const port = process.env.PORT || 3000;
  return {
    basePath,
    apiPrefix: `${basePath}/api`,
    socketPath: `${basePath}/socket.io`,
    publicUrl: `http://localhost:${port}${basePath}`,
  };
}

const { basePath, apiPrefix, socketPath, publicUrl } = parseBackEndDefaultUrl();

module.exports = { basePath, apiPrefix, socketPath, publicUrl, parseBackEndDefaultUrl };
