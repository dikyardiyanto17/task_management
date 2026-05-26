const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { UPLOAD_ROOT, ensureDir } = require('./services/fileStorage');
const { corsOrigin } = require('./config/cors');
const {
  basePath,
  apiPrefix,
  socketPath,
  publicUrl,
  publicBasePath,
} = require('./config/baseUrl');

function buildApiInfo() {
  const pub = basePath || publicBasePath;
  const api = pub ? `${pub}/api` : apiPrefix;
  const socket = pub ? `${pub}/socket.io` : socketPath;
  return {
    name: 'Task Management API',
    status: 'ok',
    publicBase: pub || '/',
    api,
    health: `${api}/health`,
    socket,
  };
}

ensureDir(UPLOAD_ROOT);

const app = express();

if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(
  `${apiPrefix}/auth/login`,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many login attempts' })
);
app.use(apiPrefix, rateLimit({ windowMs: 60 * 1000, max: 200 }));

if (basePath) {
  app.get(basePath, (_req, res) => res.json(buildApiInfo()));
  app.get(`${basePath}/`, (_req, res) => res.redirect(301, basePath));
}

// Nginx proxy_pass http://127.0.0.1:3000/ strips prefix → GET /task-management-api becomes GET /
if (!basePath) {
  app.get('/', (_req, res) => res.json(buildApiInfo()));
}

app.get(`${apiPrefix}/health`, (_req, res) =>
  res.json({
    status: 'ok',
    ...buildApiInfo(),
    internal: { basePath: basePath || '/', apiPrefix, publicUrl },
  })
);
app.use(apiPrefix, routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
