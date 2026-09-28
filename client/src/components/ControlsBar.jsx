import React from 'react';
import { Navigation, NavigationOff, Fuel, Coffee, Compass, Activity, Play, Sparkles } from 'lucide-react';
import { STATUS_CONFIG } from '../utils/markerUtils';

export default function ControlsBar({
  isSharing,
  isSimulating,
  currentStatus,
  onToggleSharing,
  onToggleSimulating,
  onChangeStatus,
  currentCoords
}) {
  const statuses = ['Riding', 'Refueling', 'Taking a Break'];

  return (
    <div className="absolute bottom-4 left-4 right-4 md:right-auto md:left-6 z-[400] flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Main Location Sharing & Status Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl">
        {/* Share / Stop Sharing Button */}
        <button
          onClick={onToggleSharing}
          id="btn-toggle-location"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-95 ${
            isSharing
              ? 'bg-lime-400 text-black hover:bg-lime-300 shadow-lg shadow-lime-400/20'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
          }`}
        >
          {isSharing ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
              </span>
              <span>Sharing Live Location</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-zinc-400" />
              <span>Share My Location</span>
            </>
          )}
        </button>

        {/* Status Selector Options */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
          {statuses.map((status) => {
            const isSelected = currentStatus === status;
            const config = STATUS_CONFIG[status];

            return (
              <button
                key={status}
                onClick={() => onChangeStatus(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? `${config.bgBadge} font-semibold shadow-sm`
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? config.dotColor : 'bg-zinc-600'}`} />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Simulate Riding Toggle (great for desktop pair testing) */}
        <button
          onClick={onToggleSimulating}
          title="Simulate realistic movement on the road for testing without moving"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
            isSimulating
              ? 'bg-lime-950/60 text-lime-400 border border-lime-500/40'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/60'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? 'text-lime-400 animate-spin' : 'text-zinc-500'}`} />
          <span>{isSimulating ? 'Simulating Ride' : 'Simulate GPS'}</span>
        </button>
      </div>

      {/* Speedometer telemetry badge */}
      {isSharing && currentCoords && (
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-xs shadow-lg">
          <div>
            <div className="text-[9px] uppercase font-mono text-zinc-500">SPEED</div>
            <div className="font-mono font-bold text-lime-400 text-sm">
              {currentCoords.speed != null ? Math.round(currentCoords.speed * 3.6) : '0'} <span className="text-[10px] text-zinc-400">km/h</span>
            </div>
          </div>
          {currentCoords.accuracy != null && (
            <div className="border-l border-zinc-800 pl-3">
              <div className="text-[9px] uppercase font-mono text-zinc-500">GPS ACCURACY</div>
              <div className="font-mono text-zinc-300 text-xs">
                ±{Math.round(currentCoords.accuracy)}m
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
