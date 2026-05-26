import { io } from 'socket.io-client';
import { SOCKET_IO_PATH } from '../utils/apiBase';

let socket = null;
const listeners = new Map();

/**
 * Connect via the Vite dev server (same origin) so /socket.io is proxied to the API.
 * Set VITE_SOCKET_URL only when the API is on a different host in production.
 */
export function connectSocket(token) {
  if (!token) return null;

  if (socket) {
    socket.auth = { token };
    if (socket.connected) return socket;
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

  socket.on('connect', () => {
    console.info('[socket] connected', socket.id);
    socket.emit('presence:request');
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.info('[socket] disconnect:', reason);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  listeners.clear();
}

export function getSocket() {
  return socket;
}

export function on(event, handler) {
  if (!socket) return;
  socket.on(event, handler);
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(handler);
}

export function off(event, handler) {
  socket?.off(event, handler);
}

export function emit(event, data) {
  socket?.emit(event, data);
}
