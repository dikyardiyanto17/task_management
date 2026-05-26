const jwt = require('jsonwebtoken');
const db = require('../models');
const { setSocketServer } = require('../services/queue');

const onlineUsers = new Map();

function toSocketUser(user) {
  return user.get ? user.get({ plain: true }) : user;
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
    const { id, name } = socket.user;
    console.log(`[socket] connected user=${id}`);

    onlineUsers.set(id, { id, name });
    socket.join(`user:${id}`);
    io.emit('presence:update', Array.from(onlineUsers.values()));

    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('comment:typing', ({ taskId, typing }) => {
      socket.to(`task:${taskId}`).emit('comment:typing', {
        userId: id,
        name,
        typing,
      });
    });

    socket.on('disconnect', (reason) => {
      onlineUsers.delete(id);
      io.emit('presence:update', Array.from(onlineUsers.values()));
      console.log(`[socket] disconnected user=${id} reason=${reason}`);
    });
  });

  io.engine.on('connection_error', (err) => {
    console.warn('[socket] engine connection_error:', err.code, err.message);
  });
}

module.exports = { initSocket };
