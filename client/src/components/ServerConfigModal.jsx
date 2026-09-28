import React, { useState } from 'react';
import { X, Server, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { updateBackendUrl, SOCKET_URL } from '../services/socket';

export default function ServerConfigModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(() => localStorage.getItem('evide_backend_url') || SOCKET_URL);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    updateBackendUrl(url.trim());
    setSaved(true);
  };

  const isVercel = window.location.hostname.includes('vercel.app');

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Backend Server URL</h3>
            <p className="text-xs text-zinc-400">Configure your Socket.IO Node.js server</p>
          </div>
        </div>

        {isVercel && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
            <strong>Running on Vercel:</strong> Vercel hosts the frontend React app, but a separate Node.js server (e.g., on Render, Railway, or localtunnel) is needed for real-time Socket.IO.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Server URL
            </label>
            <input
              type="text"
              required
              placeholder="e.g. https://your-server.onrender.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Currently connecting to: <span className="font-mono text-zinc-300">{SOCKET_URL}</span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-semibold text-xs transition-colors shadow-lg shadow-lime-400/20"
            >
              {saved ? 'Saved! Reloading...' : 'Save & Connect'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-zinc-900 text-xs text-zinc-500 space-y-1">
          <p>Deploy the <span className="font-mono text-zinc-300">server/</span> folder to a free host like:</p>
          <div className="flex items-center gap-3 text-lime-400 font-medium pt-1">
            <a href="https://render.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
              Render <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a href="https://railway.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
              Railway <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
