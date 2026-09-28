import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CreateRideModal from './components/CreateRideModal';
import JoinRideModal from './components/JoinRideModal';
import LiveDashboard from './components/LiveDashboard';
import socket from './services/socket';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { playNotificationChime } from './utils/soundUtils';

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [ride, setRide] = useState(null);
  const [currentRiderId, setCurrentRiderId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Show temporary toast message
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // URL query param support: if someone opens ?code=ABC123, open the join modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && !ride) {
      setIsJoinOpen(true);
    }
  }, [ride]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setCurrentRiderId(socket.id);

      // Check for saved session to auto-rejoin if page was refreshed
      try {
        const savedSession = localStorage.getItem('evide_session');
        if (savedSession) {
          const { rideCode, userName: savedName } = JSON.parse(savedSession);
          if (rideCode && savedName) {
            socket.emit('join-ride', { userName: savedName, rideCode }, (res) => {
              if (res && res.success) {
                setRide(res.ride);
                setUserName(savedName);
                showToast(`Reconnected to ride "${res.ride.name}"`, 'success');
              } else {
                localStorage.removeItem('evide_session');
              }
            });
          }
        }
      } catch (e) {
        console.warn('Session parse error:', e);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onRideUpdated = (updatedRide) => {
      setRide(updatedRide);
    };

    const onRiderLocationUpdated = ({ riderId, coords, isSharing, lastSeen }) => {
      setRide((prev) => {
        if (!prev || !prev.riders || !prev.riders[riderId]) return prev;
        return {
          ...prev,
          riders: {
            ...prev.riders,
            [riderId]: {
              ...prev.riders[riderId],
              coords,
              isSharing,
              lastSeen: lastSeen || Date.now(),
              online: true
            }
          }
        };
      });
    };

    const onRiderStatusUpdated = ({ riderId, status }) => {
      setRide((prev) => {
        if (!prev || !prev.riders || !prev.riders[riderId]) return prev;
        const riderName = prev.riders[riderId]?.name || 'A rider';
        showToast(`${riderName} is now ${status}`, 'info');
        playNotificationChime('status');
        return {
          ...prev,
          riders: {
            ...prev.riders,
            [riderId]: {
              ...prev.riders[riderId],
              status,
              lastSeen: Date.now()
            }
          }
        };
      });
    };

    const onRideStarted = ({ status, startedAt }) => {
      showToast('Ride has officially started! Safe riding everyone.', 'success');
      playNotificationChime('start');
      setRide((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status,
          startedAt
        };
      });
    };

    const onRiderLeft = ({ riderName }) => {
      if (riderName) {
        showToast(`${riderName} left the ride group`, 'info');
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ride-updated', onRideUpdated);
    socket.on('rider-location-updated', onRiderLocationUpdated);
    socket.on('rider-status-updated', onRiderStatusUpdated);
    socket.on('ride-started', onRideStarted);
    socket.on('rider-left', onRiderLeft);

    if (socket.connected) {
      setIsConnected(true);
      setCurrentRiderId(socket.id);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ride-updated', onRideUpdated);
      socket.off('rider-location-updated', onRiderLocationUpdated);
      socket.off('rider-status-updated', onRiderStatusUpdated);
      socket.off('ride-started', onRideStarted);
      socket.off('rider-left', onRiderLeft);
    };
  }, [currentRiderId]);

  // Create Ride Action
  const handleCreateRide = ({ userName, rideName, destination }) => {
    setIsLoading(true);
    setUserName(userName);

    socket.emit('create-ride', { userName, rideName, destination }, (res) => {
      setIsLoading(false);
      if (res && res.success) {
        setRide(res.ride);
        setCurrentRiderId(res.riderId);
        setIsCreateOpen(false);
        showToast(`Ride "${res.ride.name}" created! Code: ${res.rideCode}`, 'success');
        
        // Save session for seamless page refresh recovery
        localStorage.setItem('evide_session', JSON.stringify({ rideCode: res.rideCode, userName }));

        // Update URL query
        window.history.pushState({}, '', `?code=${res.rideCode}`);
      } else {
        alert(res?.error || 'Failed to create ride. Please try again.');
      }
    });
  };

  // Join Ride Action
  const handleJoinRide = ({ userName, rideCode }) => {
    setIsLoading(true);
    setUserName(userName);

    socket.emit('join-ride', { userName, rideCode }, (res) => {
      setIsLoading(false);
      if (res && res.success) {
        setRide(res.ride);
        setCurrentRiderId(res.riderId);
        setIsJoinOpen(false);
        showToast(`Joined ride "${res.ride.name}" successfully!`, 'success');
        
        // Save session for seamless page refresh recovery
        localStorage.setItem('evide_session', JSON.stringify({ rideCode: res.rideCode, userName }));

        window.history.pushState({}, '', `?code=${res.rideCode}`);
      } else {
        alert(res?.error || 'Could not join ride. Please check the ride code.');
      }
    });
  };

  // Start Ride Action
  const handleStartRide = () => {
    if (!ride) return;
    socket.emit('start-ride', { rideCode: ride.code });
  };

  // Leave Ride Action
  const handleLeaveRide = () => {
    if (!ride) return;
    if (window.confirm('Are you sure you want to leave this group ride?')) {
      socket.emit('leave-ride', { rideCode: ride.code });
      setRide(null);
      localStorage.removeItem('evide_session');
      window.history.pushState({}, '', window.location.pathname);
      showToast('You have left the ride.', 'info');
    }
  };

  const isHost = ride?.hostId === currentRiderId;
  const currentRider = ride?.riders?.[currentRiderId];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 shadow-2xl text-xs font-medium text-zinc-200 backdrop-blur-md animate-fade-in">
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-lime-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-zinc-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        ride={ride}
        currentRider={currentRider}
        isConnected={isConnected}
        onLeaveRide={handleLeaveRide}
      />

      {/* Main Content: Landing Page OR Live Dashboard */}
      <main className="flex-1 flex flex-col">
        {!ride ? (
          <LandingPage
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenJoin={() => setIsJoinOpen(true)}
          />
        ) : (
          <LiveDashboard
            ride={ride}
            currentRiderId={currentRiderId}
            isHost={isHost}
            onStartRide={handleStartRide}
            onUpdateRide={setRide}
          />
        )}
      </main>

      {/* Modals */}
      <CreateRideModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRide={handleCreateRide}
        isLoading={isLoading}
      />

      <JoinRideModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRide={handleJoinRide}
        isLoading={isLoading}
      />
    </div>
  );
}
