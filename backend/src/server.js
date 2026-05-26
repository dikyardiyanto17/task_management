require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./models');
const { initSocket } = require('./socket');
const { connectRedis, closeRedis } = require('./config/redis');
const { initQueue, closeQueue, setSocketServer } = require('./services/queue');
const { getAllowedOrigins } = require('./config/cors');
const { socketPath, publicUrl, apiPrefix, basePath } = require('./config/baseUrl');

const PORT = process.env.PORT || 3000;

async function start() {
  await db.sequelize.authenticate();
  try {
    await connectRedis();
    await initQueue();
  } catch (err) {
    console.warn('[Redis] unavailable, using in-memory fallbacks:', err.message);
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    path: socketPath,
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: false,
  });
  app.set('io', io);
  setSocketServer(io);
  initSocket(io);

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    if (basePath) {
      console.log(`Base URL (BACK_END_DEFAULT_URL): ${publicUrl}`);
    }
    console.log(`REST mounted at: ${apiPrefix}`);
    console.log(`Socket.IO path:    ${socketPath}`);
  });
}

async function shutdown() {
  await closeQueue();
  await closeRedis();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
