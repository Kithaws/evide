import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory store for rides
// Map<string, Ride>
const rides = new Map();

// Helper to generate a unique 6-character code (easy to read, omitting confusing chars)
function generateRideCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rides.has(code));
  return code;
}

// REST endpoints
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>എവിടെ (Evide) Backend API</title>
        <style>
          body {
            background-color: #09090b;
            color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
            padding: 20px;
          }
          .card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 16px;
            padding: 32px;
            max-width: 480px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          }
          h1 { color: #a3e635; margin: 0 0 12px 0; font-size: 24px; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 8px 0; }
          .badge {
            display: inline-block;
            background: rgba(163, 230, 53, 0.15);
            color: #a3e635;
            border: 1px solid rgba(163, 230, 53, 0.3);
            border-radius: 9999px;
            padding: 4px 12px;
            font-size: 12px;
            font-family: monospace;
            font-weight: bold;
            margin-bottom: 16px;
          }
          .btn {
            display: inline-block;
            margin-top: 20px;
            background: #a3e635;
            color: #09090b;
            text-decoration: none;
            padding: 10px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● SERVER ONLINE</div>
          <h1>🏍️ എവിടെ (Evide) Backend</h1>
          <p>The real-time WebSocket & API server is up and running on Render!</p>
          <p style="color: #71717a; font-size: 12px;">This server powers the group ride tracking on your Vercel frontend.</p>
          <a class="btn" href="https://notsistersevide.vercel.app">Open Evide Web App</a>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRides: rides.size
  });
});

app.get('/api/rides/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const ride = rides.get(code);
  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }
  return res.json({
    code: ride.code,
    name: ride.name,
    destination: ride.destination,
    status: ride.status,
    ridersCount: Object.keys(ride.riders).length,
    activeRidersCount: Object.values(ride.riders).filter(r => r.online).length
  });
});

// Socket.IO real-time handlers
io.on('connection', (socket) => {
  console.log(`[Socket] Rider connected: ${socket.id}`);

  // Create a new ride
  socket.on('create-ride', ({ userName, rideName, destination, rideCode }, callback) => {
    try {
      const trimmedName = (userName || 'Rider').trim();
      const trimmedRide = (rideName || 'Group Ride').trim();
      const trimmedDest = (destination || 'Open Road').trim();

      let code = (rideCode || '').trim().toUpperCase();
      if (!code || rides.has(code) || code.length < 4) {
        code = generateRideCode();
      }
      const newRide = {
        code,
        name: trimmedRide,
        destination: trimmedDest,
        hostId: socket.id,
        hostName: trimmedName,
        status: 'planning', // 'planning' | 'riding' | 'completed'
        createdAt: Date.now(),
        startedAt: null,
        riders: {
          [socket.id]: {
            id: socket.id,
            name: trimmedName,
            isHost: true,
            status: 'Riding', // 'Riding' | 'Refueling' | 'Taking a Break'
            isSharing: false,
            coords: null, // { lat, lng, accuracy, heading, speed, timestamp }
            online: true,
            joinedAt: Date.now(),
            lastSeen: Date.now()
          }
        }
      };

      rides.set(code, newRide);
      socket.join(`ride:${code}`);
      socket.data.currentRideCode = code;
      socket.data.userName = trimmedName;

      console.log(`[Ride Created] Code: ${code} by ${trimmedName}`);

      if (typeof callback === 'function') {
        callback({
          success: true,
          rideCode: code,
          ride: newRide,
          riderId: socket.id
        });
      }
    } catch (err) {
      console.error('[create-ride error]', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to create ride' });
      }
    }
  });

  // Join existing ride
  socket.on('join-ride', ({ userName, rideCode }, callback) => {
    try {
      const code = (rideCode || '').trim().toUpperCase();
      const trimmedName = (userName || 'Rider').trim();

      const ride = rides.get(code);
      if (!ride) {
        if (typeof callback === 'function') {
          return callback({ success: false, error: 'Ride code not found. Please check and try again.' });
        }
        return;
      }

      // Check if an existing rider with this name was previously connected (e.g. page refresh)
      const existingEntry = Object.entries(ride.riders).find(
        ([sId, r]) => r.name.toLowerCase() === trimmedName.toLowerCase() && sId !== socket.id
      );

      let prevCoords = null;
      let prevStatus = 'Riding';
      let prevIsSharing = false;
      let isHost = ride.hostId === socket.id;

      if (existingEntry) {
        const [oldSocketId, oldRider] = existingEntry;
        prevCoords = oldRider.coords;
        prevStatus = oldRider.status || 'Riding';
        prevIsSharing = oldRider.isSharing || false;
        if (oldRider.isHost || ride.hostId === oldSocketId) {
          isHost = true;
          ride.hostId = socket.id; // Transfer host to new socket
        }
        delete ride.riders[oldSocketId]; // Remove stale entry
      }

      // Add or restore rider
      ride.riders[socket.id] = {
        id: socket.id,
        name: trimmedName,
        isHost,
        status: prevStatus,
        isSharing: prevIsSharing,
        coords: prevCoords,
        online: true,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      };

      socket.join(`ride:${code}`);
      socket.data.currentRideCode = code;
      socket.data.userName = trimmedName;

      console.log(`[Rider Joined] ${trimmedName} joined ride ${code}`);

      // Notify the room
      io.to(`ride:${code}`).emit('ride-updated', ride);

      if (typeof callback === 'function') {
        callback({
          success: true,
          rideCode: code,
          ride,
          riderId: socket.id
        });
      }
    } catch (err) {
      console.error('[join-ride error]', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to join ride' });
      }
    }
  });

  // Location update from a rider
  socket.on('update-location', ({ rideCode, coords }) => {
    const code = (rideCode || socket.data.currentRideCode || '').toUpperCase();
    const ride = rides.get(code);
    if (!ride || !ride.riders[socket.id]) return;

    ride.riders[socket.id].coords = coords;
    ride.riders[socket.id].isSharing = true;
    ride.riders[socket.id].lastSeen = Date.now();
    ride.riders[socket.id].online = true;

    // Broadcast location update to other riders in the ride
    io.to(`ride:${code}`).emit('rider-location-updated', {
      riderId: socket.id,
      coords,
      isSharing: true,
      lastSeen: ride.riders[socket.id].lastSeen
    });
  });

  // Stop sharing location
  socket.on('stop-sharing-location', ({ rideCode }) => {
    const code = (rideCode || socket.data.currentRideCode || '').toUpperCase();
    const ride = rides.get(code);
    if (!ride || !ride.riders[socket.id]) return;

    ride.riders[socket.id].isSharing = false;
    ride.riders[socket.id].lastSeen = Date.now();

    io.to(`ride:${code}`).emit('rider-location-updated', {
      riderId: socket.id,
      coords: ride.riders[socket.id].coords,
      isSharing: false,
      lastSeen: ride.riders[socket.id].lastSeen
    });
  });

  // Update rider status ('Riding' | 'Refueling' | 'Taking a Break')
  socket.on('update-status', ({ rideCode, status }) => {
    const code = (rideCode || socket.data.currentRideCode || '').toUpperCase();
    const ride = rides.get(code);
    if (!ride || !ride.riders[socket.id]) return;

    ride.riders[socket.id].status = status;
    ride.riders[socket.id].lastSeen = Date.now();

    io.to(`ride:${code}`).emit('rider-status-updated', {
      riderId: socket.id,
      status
    });
  });

  // Start the ride (by host or any group member)
  socket.on('start-ride', ({ rideCode }) => {
    const code = (rideCode || socket.data.currentRideCode || '').toUpperCase();
    const ride = rides.get(code);
    if (!ride) return;

    ride.status = 'riding';
    ride.startedAt = Date.now();

    io.to(`ride:${code}`).emit('ride-started', {
      status: 'riding',
      startedAt: ride.startedAt
    });
  });

  // Leave ride
  socket.on('leave-ride', ({ rideCode }) => {
    const code = (rideCode || socket.data.currentRideCode || '').toUpperCase();
    const ride = rides.get(code);
    if (ride && ride.riders[socket.id]) {
      ride.riders[socket.id].online = false;
      ride.riders[socket.id].isSharing = false;
      socket.leave(`ride:${code}`);
      io.to(`ride:${code}`).emit('rider-left', {
        riderId: socket.id,
        riderName: ride.riders[socket.id].name
      });
      io.to(`ride:${code}`).emit('ride-updated', ride);
    }
    socket.data.currentRideCode = null;
  });

  // On Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Rider disconnected: ${socket.id}`);
    const code = socket.data.currentRideCode;
    if (code && rides.has(code)) {
      const ride = rides.get(code);
      if (ride.riders[socket.id]) {
        ride.riders[socket.id].online = false;
        ride.riders[socket.id].isSharing = false;
        ride.riders[socket.id].lastSeen = Date.now();

        io.to(`ride:${code}`).emit('rider-disconnected', {
          riderId: socket.id,
          riderName: ride.riders[socket.id].name
        });
        io.to(`ride:${code}`).emit('ride-updated', ride);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏍️ എവിടെ (Evide) server running on http://localhost:${PORT}`);
});
