import React, { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, User, Compass, ArrowRight, KeyRound, RefreshCw, Copy, Check } from 'lucide-react';

function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export default function CreateRideModal({ isOpen, onClose, onCreateRide, isLoading }) {
  const [userName, setUserName] = useState('');
  const [rideName, setRideName] = useState('');
  const [destination, setDestination] = useState('');
  const [rideCode, setRideCode] = useState(() => generateRandomCode());
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Generate a fresh code whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setRideCode(generateRandomCode());
      setCopied(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rideCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = () => {
    setRideCode(generateRandomCode());
    setCopied(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('Please enter your rider name');
      return;
    }
    if (!rideName.trim()) {
      setError('Please give your ride a name');
      return;
    }
    setError('');
    onCreateRide({
      userName: userName.trim(),
      rideName: rideName.trim(),
      destination: destination.trim() || 'Open Horizon',
      rideCode: rideCode.trim().toUpperCase()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-7 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create a Ride</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Your unique room code is generated and ready</p>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Generated Room Code Display Card */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-lime-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-lime-400" />
                <span>Generated Room Code</span>
              </span>
              <span className="text-[10px] font-mono text-lime-400 bg-lime-950/80 px-2 py-0.5 rounded-full border border-lime-500/30">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-zinc-950 px-3.5 py-2 rounded-lg border border-zinc-800 text-center font-mono font-extrabold text-lg tracking-widest text-lime-400 select-all">
                {rideCode}
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerateCode}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="Generate another code"
              >
                <RefreshCw className="w-4 h-4 text-lime-400" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Friends can use this code to join your ride.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Your Name / Rider Call-sign <span className="text-lime-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                maxLength={25}
                placeholder="e.g. Alex Hunter"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 focus:ring-1 focus:ring-lime-400/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Ride Name <span className="text-lime-400">*</span>
            </label>
            <div className="relative">
              <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                maxLength={40}
                placeholder="e.g. Sunday Morning Canyon Run"
                value={rideName}
                onChange={(e) => setRideName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 focus:ring-1 focus:ring-lime-400/80 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Destination / Route (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                maxLength={50}
                placeholder="e.g. Lookout Summit Cafe"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400/80 focus:ring-1 focus:ring-lime-400/80 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-semibold text-sm transition-all duration-150 shadow-lg shadow-lime-400/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Starting Ride Room...
                </span>
              ) : (
                <>
                  <span>Create Ride & Launch Map</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
