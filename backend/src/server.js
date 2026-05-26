require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const db = require('./models');
const { initSocket } = require('./socket');
const { getAllowedOrigins } = require('./config/cors');

const PORT = process.env.PORT || 3000;

async function start() {
  await db.sequelize.authenticate();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: false,
  });
  app.set('io', io);
  initSocket(io);

  server.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
