import React, { useState } from 'react';
import { Compass, Copy, Check, LogOut, Radio, Users, MapPin } from 'lucide-react';

export default function Navbar({ ride, currentRider, isConnected, onLeaveRide }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!ride?.code) return;
    navigator.clipboard.writeText(ride.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-lime-400 text-black flex items-center justify-center font-black shadow-lg shadow-lime-400/20">
          <Compass className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-white flex items-baseline gap-1.5">
              <span>എവിടെ</span>
              <span className="text-[10px] font-mono text-lime-400 font-bold tracking-wider">EVIDE</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
              LIVE GPS
            </span>
          </div>
        </div>
      </div>

      {/* Center ride info if inside a ride */}
      {ride && (
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Ride Code:</span>
            <span className="font-mono font-bold text-sm tracking-widest text-lime-400">{ride.code}</span>
            <button
              onClick={handleCopyCode}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Copy Ride Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {ride.destination && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 max-w-[200px] truncate">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{ride.destination}</span>
            </div>
          )}
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <button
          onClick={onOpenServerConfig}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-400 transition-colors"
          title="Click to check or configure backend server URL"
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-lime-400 ring-2 ring-lime-400/20' : 'bg-red-500 ring-2 ring-red-500/20 animate-pulse'}`} />
          <span className="text-[11px] font-mono text-zinc-300">{isConnected ? 'ONLINE' : 'OFFLINE (Config)'}</span>
        </button>

        {/* If inside ride: mobile copy code & leave ride button */}
        {ride && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-lime-400"
            >
              <span>{ride.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            </button>

            <button
              onClick={onLeaveRide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/60 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
