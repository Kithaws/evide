# 🏍️ എവിടെ (Evide)

**എവിടെ (Evide)** is a real-time group ride tracking web application for friends riding motorcycles or bicycles together. Create a ride, invite friends with a unique 6-character code, share live GPS locations, and track everyone on a shared interactive dark map.

---

## 🚀 Features

- **Landing Page**: Modern minimal dark aesthetic with lime green accents, quick actions to create or join a ride.
- **Create Ride**: Generate an instant, unique 6-character ride code with ride name and destination.
- **Join Ride**: Enter your rider call-sign and ride code to join the pack instantly.
- **Live Ride Dashboard**:
  - **Interactive Dark Map**: Leaflet + OpenStreetMap (CartoDB Dark Matter) centered as the primary hero view.
  - **Dynamic Rider Markers**: Custom pulsating markers showing rider callsign, status indicator, heading direction pointer, and speed.
  - **Rider Pack List**: Sidebar showing all group members, lead/host badges, online/offline status, current activity, and a 1-click **"Focus on Map"** crosshair.
  - **Status Updates**: 1-click status switcher for **Riding** (🟢), **Refueling** (⛽), and **Taking a Break** (☕).
  - **Live GPS Sharing**: Browser Geolocation API (`navigator.geolocation.watchPosition`) with speed and accuracy telemetry.
  - **Simulated GPS Mode**: Toggle realistic simulated riding for easy multi-tab testing on desktop without needing to go outside!
  - **Ride Code Copy**: Quick 1-click copy with instant feedback.
  - **Start Ride Control**: Lead rider can signal the start of the ride to all riders in real time.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (Modern minimal dark theme + Lime green accent)
- **Icons**: Lucide React
- **Real-Time Communication**: Socket.IO Client & Server
- **Map & Geolocation**: Leaflet + OpenStreetMap tiles + Browser Geolocation API
- **Backend**: Node.js + Express + Socket.IO (In-memory ride state, no database needed for MVP)

---

## 📂 Project Structure

```
evd/
├── package.json          # Root scripts to run both client and server concurrently
├── server/               # Express + Socket.IO Backend
│   ├── package.json
│   └── src/
│       └── server.js     # In-memory ride store & real-time socket events
└── client/               # React + Vite + Tailwind Frontend
    ├── index.html        # Leaflet CSS, Dark theme configuration & fonts
    ├── vite.config.js    # Vite config with React & proxy to backend
    ├── package.json
    └── src/
        ├── App.jsx                   # Main state & socket handlers
        ├── index.css                 # Dark styling & marker animations
        ├── services/
        │   └── socket.js             # Socket.IO client instance
        ├── utils/
        │   └── markerUtils.js        # Leaflet custom DivIcon helpers
        └── components/
            ├── Navbar.jsx            # Header with code copy & ride status
            ├── LandingPage.jsx       # Hero landing page
            ├── CreateRideModal.jsx   # Create ride dialog
            ├── JoinRideModal.jsx     # Join ride dialog
            ├── LiveDashboard.jsx     # Main dashboard container
            ├── LiveMap.jsx           # Leaflet interactive map
            ├── RiderList.jsx         # Riders pack sidebar
            └── ControlsBar.jsx       # Location share & status controls
```

---

## 🏁 Quick Start & Installation

### 1. Install all dependencies

From the root directory:
```bash
npm run install:all
```

Or install separately:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run Locally

From the root directory, start both the server and client simultaneously:
```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:4000](http://localhost:4000)

---

## 🧪 Testing with Friends or Multiple Tabs

1. Open [http://localhost:3000](http://localhost:3000) in Tab 1.
2. Click **"Create New Ride"**, enter your name (e.g. `Alex (Lead)`), ride name, and click create.
3. Note or copy the 6-character ride code (e.g. `KBYD99`).
4. Open [http://localhost:3000](http://localhost:3000) in an Incognito window or Tab 2.
5. Click **"Join with Code"**, enter name (e.g. `Maya`), and paste the ride code.
6. In either tab, click **"Simulate GPS"** or **"Share My Location"** to watch the riders appear on the map in real time!
7. Change statuses between **Riding**, **Refueling**, or **Taking a Break** to see live updates across all connected screens.
