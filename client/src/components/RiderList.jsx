import React, { useState } from 'react';
import { Copy, Check, Users, Navigation, Play, MapPin, Fuel, Coffee, Compass, Crosshair, ChevronRight } from 'lucide-react';
import { STATUS_CONFIG } from '../utils/markerUtils';

export default function RiderList({
  ride,
  riders,
  currentRiderId,
  isHost,
  onStartRide,
  onFocusRider,
  className = ''
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!ride?.code) return;
    navigator.clipboard.writeText(ride.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riderList = Object.values(riders || {});
  const activeCount = riderList.filter(r => r.online !== false).length;
  const sharingCount = riderList.filter(r => r.isSharing).length;

  return (
    <aside className={`flex flex-col h-full bg-zinc-950 border-l border-zinc-800/80 ${className}`}>
      {/* Ride Overview Card */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="font-bold text-base text-white tracking-tight leading-tight">
              {ride?.name || 'Group Ride'}
            </h2>
            {ride?.destination && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span className="truncate">{ride.destination}</span>
              </div>
            )}
          </div>
          
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
            ride?.status === 'riding' 
              ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            {ride?.status === 'riding' ? 'IN PROGRESS' : 'PLANNING'}
          </span>
        </div>

        {/* Ride Code Copy Card */}
        <div className="mt-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Ride Code</div>
            <div className="text-sm font-mono font-bold tracking-widest text-lime-400">{ride?.code}</div>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Start Ride button for Host if ride not yet started */}
        {ride?.status !== 'riding' && (
          <button
            onClick={onStartRide}
            id="btn-start-ride"
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-semibold text-xs transition-all duration-150 shadow-md shadow-lime-400/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Ride for Group</span>
          </button>
        )}
      </div>

      {/* Group Stats strip */}
      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <span>{activeCount} {activeCount === 1 ? 'Rider' : 'Riders'} online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
          <span>{sharingCount} sharing GPS</span>
        </div>
      </div>

      {/* Riders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider mb-2">
          Riders in Pack ({riderList.length})
        </div>

        {riderList.map((rider) => {
          const isCurrentUser = rider.id === currentRiderId;
          const statusInfo = STATUS_CONFIG[rider.status] || STATUS_CONFIG['Riding'];
          const isOnline = rider.online !== false;
          const hasCoords = rider.coords?.lat != null;
          const speedKmH = rider.coords?.speed != null ? Math.round(rider.coords.speed * 3.6) : null;

          return (
            <div
              key={rider.id}
              className={`p-3 rounded-xl border transition-all ${
                isCurrentUser
                  ? 'bg-zinc-900/90 border-lime-400/40 ring-1 ring-lime-400/20'
                  : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Rider Identity */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-zinc-800"
                      style={{ color: statusInfo.color }}
                    >
                      {(rider.name || 'R').charAt(0).toUpperCase()}
                    </div>
                    {/* Online Dot */}
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                        isOnline ? 'bg-lime-400' : 'bg-zinc-600'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-zinc-100 truncate">
                        {rider.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-lime-400/20 text-lime-400">
                          YOU
                        </span>
                      )}
                      {rider.isHost && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-zinc-800 text-zinc-400">
                          LEAD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? statusInfo.dotColor : 'bg-zinc-600'}`}></span>
                        <span className="text-[11px]">{isOnline ? statusInfo.label : 'Offline'}</span>
                      </span>

                      {speedKmH != null && rider.isSharing && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-[11px] font-mono text-zinc-300">{speedKmH} km/h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Focus Map Action Button */}
                {hasCoords && (
                  <button
                    onClick={() => onFocusRider(rider.id)}
                    className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    title="Center rider on map"
                  >
                    <Crosshair className="w-4 h-4 text-lime-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
