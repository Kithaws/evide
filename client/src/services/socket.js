import { io } from 'socket.io-client';

// Dynamically connect to port 4000 on whatever host the frontend was loaded from
// Works seamlessly on localhost, 127.0.0.1, LAN IP (e.g. 192.168.1.x), or deployed URLs
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const hostname = window.location.hostname || 'localhost';
const SOCKET_URL = `${protocol}//${hostname}:4000`;

console.log('[Socket] Initializing connection to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[Socket] Connected to server successfully:', socket.id);
});

socket.on('connect_error', (err) => {
  console.warn('[Socket] Connection error:', err.message);
});

export default socket;
