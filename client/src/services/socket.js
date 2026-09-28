import { io } from 'socket.io-client';

function getBackendUrl() {
  // 1. Environment variable if set in Vercel / .env
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // 2. Custom backend URL saved by user in localStorage
  const savedUrl = localStorage.getItem('evide_backend_url');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim();
  }

  // 3. Localhost development
  const hostname = window.location.hostname || 'localhost';
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }

  // 4. Default fallback for LAN or same-domain port 4000
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${hostname}:4000`;
}

export const SOCKET_URL = getBackendUrl();
console.log('[Socket] Connecting to backend at:', SOCKET_URL);

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

export function updateBackendUrl(newUrl) {
  if (!newUrl) return;
  const cleaned = newUrl.trim().replace(/\/$/, '');
  localStorage.setItem('evide_backend_url', cleaned);
  window.location.reload();
}

export default socket;
