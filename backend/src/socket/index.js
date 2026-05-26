const jwt = require('jsonwebtoken');
const db = require('../models');
const { setSocketServer } = require('../services/queue');

/** userId -> { name, socketIds: Set } */
const onlineByUser = new Map();

function toSocketUser(user) {
  return user.get ? user.get({ plain: true }) : user;
}

function getPresenceList() {
  return Array.from(onlineByUser.entries()).map(([id, { name }]) => ({
    id: Number(id),
    name,
  }));
}

function addSocket(socket) {
  const { id, name } = socket.user;
  const key = String(id);
  if (!onlineByUser.has(key)) {
    onlineByUser.set(key, { name, socketIds: new Set() });
  }
  onlineByUser.get(key).socketIds.add(socket.id);
}

function removeSocket(socket) {
  const key = String(socket.user.id);
  const entry = onlineByUser.get(key);
  if (!entry) return;
  entry.socketIds.delete(socket.id);
  if (entry.socketIds.size === 0) {
    onlineByUser.delete(key);
  }
}

function broadcastPresence(io) {
  const list = getPresenceList();
  io.emit('presence:update', list);
}

function sendPresenceTo(socket) {
  socket.emit('presence:update', getPresenceList());
}

function initSocket(io) {
  setSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      if (!process.env.JWT_SECRET) {
        return next(new Error('JWT_SECRET is not configured'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.User.findByPk(payload.id, {
        attributes: ['id', 'name', 'email', 'role'],
      });
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = toSocketUser(user);
      next();
    } catch (err) {
      const message = err.name === 'JsonWebTokenError' ? 'Invalid token' : err.message;
      console.warn('[socket] auth failed:', message);
      next(new Error(message));
    }
  });

  io.on('connection', (socket) => {
    const { id } = socket.user;
    console.log(`[socket] connected user=${id} socket=${socket.id}`);

    addSocket(socket);
    socket.join(`user:${id}`);

    sendPresenceTo(socket);
    socket.broadcast.emit('presence:update', getPresenceList());

    socket.on('presence:request', () => {
      sendPresenceTo(socket);
    });

    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('comment:typing', ({ taskId, typing }) => {
      socket.to(`task:${taskId}`).emit('comment:typing', {
        userId: socket.user.id,
        name: socket.user.name,
        typing,
      });
    });

    socket.on('disconnect', (reason) => {
      removeSocket(socket);
      socket.broadcast.emit('presence:update', getPresenceList());
      console.log(`[socket] disconnected user=${id} reason=${reason}`);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.warn('[socket] engine connection_error:', err.code, err.message);
  });
}

module.exports = { initSocket };
