const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { UPLOAD_ROOT, ensureDir } = require('./services/fileStorage');
const { corsOrigin } = require('./config/cors');

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
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many login attempts' })
);
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
