import React from 'react';
import { Compass, PlusCircle, ArrowRight, MapPin, Radio, Shield, Users, Zap } from 'lucide-react';

export default function LandingPage({ onOpenCreate, onOpenJoin }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between p-6 md:p-12 max-w-6xl mx-auto">
      {/* Hero section */}
      <div className="my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-lime-400 font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
          Real-Time GPS Group Ride Tracking
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.1]">
          എവിടെ? <br className="hidden sm:inline" />
          <span className="text-lime-400">Never get left behind.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          എവിടെ (Evide) connects your motorcycle or bicycle crew on a single live interactive map.
          Share your real-time coordinates, monitor group status, and see who is riding, refueling, or taking a break.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md">
          <button
            onClick={onOpenCreate}
            id="btn-create-ride"
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-all duration-150 shadow-lg shadow-lime-400/20 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            Create New Ride
          </button>

          <button
            onClick={onOpenJoin}
            id="btn-join-ride"
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold text-sm transition-all duration-150 active:scale-[0.98]"
          >
            <ArrowRight className="w-4 h-4" />
            Join with Code
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-800/80 pt-10">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 text-lime-400 flex items-center justify-center mb-3">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Live GPS Sync</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-normal">
              Accurate, battery-friendly location streaming directly using your browser's Geolocation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 text-lime-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Instant Crew Status</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-normal">
              One-tap status updates for Riding, Refueling, or Taking a Break so the pack knows your state.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 text-lime-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-200">Zero Signups</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-normal">
              No account creation or passwords. Spin up a 6-character code and hit the road immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-900 text-xs text-zinc-600 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>എവിടെ (Evide) &copy; 2026. Designed for motorcycle and bicycle groups.</p>
        <p className="font-mono text-[11px] text-zinc-500">Node.js + Socket.IO + Leaflet</p>
      </footer>
    </div>
  );
}
