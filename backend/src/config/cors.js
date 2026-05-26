const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

function getAllowedOrigins() {
  const origins = new Set(DEFAULT_ORIGINS);
  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL);
  }
  return [...origins];
}

/** Express/socket.io origin callback — allows missing Origin (same-origin tools). */
function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (getAllowedOrigins().includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS not allowed for origin: ${origin}`));
}

module.exports = { getAllowedOrigins, corsOrigin };
