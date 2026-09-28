import React, { useState, useEffect, useRef } from 'react';
import LiveMap from './LiveMap';
import RiderList from './RiderList';
import ControlsBar from './ControlsBar';
import socket from '../services/socket';
import { Users, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function LiveDashboard({
  ride,
  currentRiderId,
  isHost,
  onStartRide,
  onUpdateRide
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Riding');
  const [currentCoords, setCurrentCoords] = useState(null);
  const [focusedRiderId, setFocusedRiderId] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const watchIdRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const simCoordsRef = useRef(null);

  // Initialize status from server ride info
  useEffect(() => {
    if (ride?.riders && currentRiderId && ride.riders[currentRiderId]) {
      const myRider = ride.riders[currentRiderId];
      if (myRider.status) setCurrentStatus(myRider.status);
      if (myRider.isSharing) setIsSharing(true);
      if (myRider.coords) setCurrentCoords(myRider.coords);
    }
  }, [ride?.code, currentRiderId]);

  // Handle Real Geolocation Tracking
  const startRealGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoError(null);

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const coords = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 10,
          heading: heading != null ? Math.round(heading) : 0,
          speed: speed != null ? speed : 0, // meters per second
          timestamp: position.timestamp || Date.now()
        };

        setCurrentCoords(coords);
        setIsSharing(true);

        socket.emit('update-location', {
          rideCode: ride.code,
          coords
        });
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
        setGeoError(`Location access: ${err.message}. (You can use the 'Simulate GPS' button for testing!)`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );

    watchIdRef.current = watchId;
  };

  const stopRealGeolocation = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Handle Simulated Riding (Movement along a realistic curve)
  const startSimulation = () => {
    stopRealGeolocation();
    setIsSimulating(true);
    setIsSharing(true);
    setGeoError(null);

    // If we don't have coords yet, start near a nice route (e.g., California Highway 1 / Bay Area)
    let current = currentCoords || {
      lat: 37.7749 + (Math.random() - 0.5) * 0.02,
      lng: -122.4194 + (Math.random() - 0.5) * 0.02,
      accuracy: 5,
      heading: 45,
      speed: 12.5, // ~45 km/h
      timestamp: Date.now()
    };
    simCoordsRef.current = current;

    // Emit initial
    socket.emit('update-location', {
      rideCode: ride.code,
      coords: current
    });
    setCurrentCoords(current);

    simulationIntervalRef.current = setInterval(() => {
      if (!simCoordsRef.current) return;
      const prev = simCoordsRef.current;

      // Move forward slightly in heading direction with slight curve
      const angleRad = (prev.heading * Math.PI) / 180;
      const step = 0.0003; // ~33 meters every 2 seconds = ~60 km/h
      const dLat = Math.cos(angleRad) * step;
      const dLng = Math.sin(angleRad) * step;

      // Add a slight bend to make the ride realistic
      const newHeading = (prev.heading + (Math.random() - 0.48) * 10 + 360) % 360;
      const newSpeed = 10 + Math.random() * 4; // 36-50 km/h

      const nextCoords = {
        lat: prev.lat + dLat,
        lng: prev.lng + dLng,
        accuracy: 4,
        heading: Math.round(newHeading),
        speed: newSpeed,
        timestamp: Date.now()
      };

      simCoordsRef.current = nextCoords;
      setCurrentCoords(nextCoords);

      socket.emit('update-location', {
        rideCode: ride.code,
        coords: nextCoords
      });
    }, 2000);
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  // Toggle Sharing
  const handleToggleSharing = () => {
    if (isSharing) {
      stopRealGeolocation();
      stopSimulation();
      setIsSharing(false);
      socket.emit('stop-sharing-location', { rideCode: ride.code });
    } else {
      // Start real GPS
      startRealGeolocation();
    }
  };

  // Toggle Simulated Riding
  const handleToggleSimulating = () => {
    if (isSimulating) {
      stopSimulation();
      setIsSharing(false);
      socket.emit('stop-sharing-location', { rideCode: ride.code });
    } else {
      startSimulation();
    }
  };

  // Change Rider Status
  const handleChangeStatus = (newStatus) => {
    setCurrentStatus(newStatus);
    socket.emit('update-status', {
      rideCode: ride.code,
      status: newStatus
    });
  };

  // Clean up watchers on unmount
  useEffect(() => {
    return () => {
      stopRealGeolocation();
      stopSimulation();
    };
  }, []);

  const riders = ride?.riders || {};

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Geo Error Warning Banner if location was denied or unavailable */}
      {geoError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] max-w-lg w-[90%] px-4 py-3 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{geoError}</span>
          </div>
          <button
            onClick={() => setGeoError(null)}
            className="p-1 rounded hover:bg-amber-900/50 text-amber-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <div className="flex-1 relative h-full">
        <LiveMap
          riders={riders}
          currentRiderId={currentRiderId}
          focusedRiderId={focusedRiderId}
          onClearFocus={() => setFocusedRiderId(null)}
        />

        {/* Floating Bottom Control Bar */}
        <ControlsBar
          isSharing={isSharing}
          isSimulating={isSimulating}
          currentStatus={currentStatus}
          onToggleSharing={handleToggleSharing}
          onToggleSimulating={handleToggleSimulating}
          onChangeStatus={handleChangeStatus}
          currentCoords={currentCoords}
        />

        {/* Mobile toggle button to view rider list */}
        <button
          onClick={() => setIsMobileListOpen(true)}
          className="lg:hidden absolute top-4 right-4 z-[400] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-200 backdrop-blur-md shadow-lg"
        >
          <Users className="w-4 h-4 text-lime-400" />
          <span>Pack ({Object.keys(riders).length})</span>
        </button>
      </div>

      {/* Desktop Sidebar: Rider List */}
      <div className="hidden lg:block w-80 xl:w-96 h-full shrink-0">
        <RiderList
          ride={ride}
          riders={riders}
          currentRiderId={currentRiderId}
          isHost={isHost}
          onStartRide={onStartRide}
          onFocusRider={(id) => setFocusedRiderId(id)}
        />
      </div>

      {/* Mobile Drawer for Rider List */}
      {isMobileListOpen && (
        <div className="lg:hidden fixed inset-0 z-[500] flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm h-full bg-zinc-950 flex flex-col relative shadow-2xl border-l border-zinc-800">
            <button
              onClick={() => setIsMobileListOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <RiderList
              ride={ride}
              riders={riders}
              currentRiderId={currentRiderId}
              isHost={isHost}
              onStartRide={onStartRide}
              onFocusRider={(id) => {
                setFocusedRiderId(id);
                setIsMobileListOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
