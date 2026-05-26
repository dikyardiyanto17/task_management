const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { UPLOAD_ROOT, ensureDir } = require('./services/fileStorage');
const { corsOrigin } = require('./config/cors');
const { basePath, apiPrefix, socketPath, publicUrl } = require('./config/baseUrl');

ensureDir(UPLOAD_ROOT);

const app = express();

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
  app.get(basePath, (_req, res) => {
    res.json({
      name: 'Task Management API',
      status: 'ok',
      api: `${apiPrefix}`,
      health: `${apiPrefix}/health`,
      socket: socketPath,
      docs: 'Use REST under /api — e.g. POST /api/auth/login',
    });
  });
  app.get(`${basePath}/`, (_req, res) => res.redirect(301, basePath));
}

app.get(`${apiPrefix}/health`, (_req, res) =>
  res.json({ status: 'ok', basePath: basePath || '/', apiPrefix, publicUrl })
);
app.use(apiPrefix, routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
