import { io } from 'socket.io-client';
import { SOCKET_IO_PATH } from '../utils/apiBase';
import { usePresenceStore } from '../stores/presence';

let socket = null;
let lastToken = null;
let connectedAt = 0;
let presenceRetryTimer = null;

function clearPresenceRetry() {
  if (presenceRetryTimer) {
    clearTimeout(presenceRetryTimer);
    presenceRetryTimer = null;
  }
}

function requestPresenceSync() {
  if (socket?.connected) {
    socket.emit('presence:request');
  }
}

function schedulePresenceRetries() {
  clearPresenceRetry();
  [200, 600, 1500].forEach((ms) => {
    setTimeout(() => requestPresenceSync(), ms);
  });
}

function bindCoreHandlers(sock) {
  const presence = usePresenceStore();

  sock.off('presence:update');
  sock.on('presence:update', (users) => {
    const list = Array.isArray(users) ? users : [];
    if (list.length === 0 && Date.now() - connectedAt < 1000) {
      schedulePresenceRetries();
      return;
    }
    presence.setOnline(list);
  });

  sock.off('connect');
  sock.on('connect', () => {
    connectedAt = Date.now();
    console.info('[socket] connected', sock.id);
    requestPresenceSync();
    schedulePresenceRetries();
  });

  sock.off('disconnect');
  sock.on('disconnect', (reason) => {
    console.info('[socket] disconnect:', reason);
    clearPresenceRetry();
  });

  sock.off('connect_error');
  sock.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err.message);
  });
}

export function connectSocket(token) {
  if (!token) return null;

  if (socket?.connected && lastToken === token) {
    requestPresenceSync();
    schedulePresenceRetries();
    return socket;
  }

  lastToken = token;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  socket = io(url, {
    auth: { token },
    path: SOCKET_IO_PATH,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  bindCoreHandlers(socket);

  return socket;
}

export function disconnectSocket() {
  clearPresenceRetry();
  lastToken = null;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  usePresenceStore().reset();
}

export function getSocket() {
  return socket;
}

export function on(event, handler) {
  socket?.on(event, handler);
}

export function off(event, handler) {
  socket?.off(event, handler);
}

export function emit(event, data) {
  socket?.emit(event, data);
}
