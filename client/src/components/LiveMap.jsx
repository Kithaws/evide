import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { createRiderIcon, STATUS_CONFIG } from '../utils/markerUtils';
import { Maximize2, Layers, Key, Check, X, ShieldAlert, Navigation } from 'lucide-react';

export default function LiveMap({ riders, currentRiderId, focusedRiderId, onClearFocus }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const tileLayerRef = useRef(null);
  const hasInitialFitRef = useRef(false);

  // Map theme mode: 'osm-dark' (default, free, no key), 'osm-light' (free, no key), 'mapbox' (with key)
  const [mapTheme, setMapTheme] = useState(() => localStorage.getItem('evide_map_theme') || 'osm-dark');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('evide_map_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [autoFollow, setAutoFollow] = useState(false);

  // Function to create and attach the appropriate tile layer
  const applyTileLayer = (mapInstance, theme, key) => {
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let options = {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    };

    if (theme === 'mapbox' && key.trim()) {
      url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${key.trim()}`;
      options.attribution = '&copy; <a href="https://www.mapbox.com/">Mapbox</a>';
      options.tileSize = 512;
      options.zoomOffset = -1;
      options.className = '';
    } else if (theme === 'osm-light') {
      options.className = '';
    } else {
      // Default: OpenStreetMap with clean dark filter (100% Free, NO API KEY REQUIRED, NO WATERMARKS)
      options.className = 'dark-map-tiles';
    }

    const newLayer = L.tileLayer(url, options).addTo(mapInstance);
    tileLayerRef.current = newLayer;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Check if any rider already has coordinates
    const existingCoords = Object.values(riders || {}).find(r => r.coords?.lat != null)?.coords;

    // Default center (Kerala / local region: 10.8505, 76.2711) or existing rider coordinates
    const initialLat = existingCoords?.lat || 10.8505;
    const initialLng = existingCoords?.lng || 76.2711;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: existingCoords ? 14 : 12,
      zoomControl: false,
      attributionControl: false
    });

    // Automatically locate user's real GPS position on startup and center map
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (mapRef.current && !hasInitialFitRef.current) {
            mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
          }
        },
        (err) => console.log('Initial location lookup:', err.message),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }

    // Apply the chosen tile layer
    applyTileLayer(map, mapTheme, apiKey);

    // Zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer when theme or API key changes
  useEffect(() => {
    if (!mapRef.current) return;
    applyTileLayer(mapRef.current, mapTheme, apiKey);
  }, [mapTheme, apiKey]);

  // Sync rider markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const activeRiderIds = new Set();
    const validCoords = [];

    Object.entries(riders || {}).forEach(([id, rider]) => {
      if (!rider.coords || rider.coords.lat == null || rider.coords.lng == null) return;

      activeRiderIds.add(id);
      const latLng = [rider.coords.lat, rider.coords.lng];
      validCoords.push(latLng);

      const isCurrent = id === currentRiderId;
      const icon = createRiderIcon(rider, isCurrent);

      const statusInfo = STATUS_CONFIG[rider.status] || STATUS_CONFIG['Riding'];
      const speedText = rider.coords.speed != null 
        ? `${Math.round(rider.coords.speed * 3.6)} km/h` 
        : '0 km/h';

      const popupContent = `
        <div style="min-width: 170px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #f4f4f5; font-size: 13px;">${escapeHtml(rider.name)}</strong>
            ${isCurrent ? '<span style="background: rgba(163, 230, 53, 0.2); color: #a3e635; font-size: 9px; padding: 2px 6px; border-radius: 9999px; font-weight: bold;">YOU</span>' : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${statusInfo.color};"></span>
            <span style="font-size: 12px; color: ${statusInfo.color}; font-weight: 600;">${statusInfo.label}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #09090b; padding: 6px 8px; border-radius: 6px; font-size: 11px; color: #a1a1aa;">
            <div>
              <div style="font-size: 9px; text-transform: uppercase;">Speed</div>
              <div style="color: #f4f4f5; font-weight: 600;">${speedText}</div>
            </div>
            <div>
              <div style="font-size: 9px; text-transform: uppercase;">GPS</div>
              <div style="color: ${rider.isSharing ? '#a3e635' : '#71717a'}; font-weight: 600;">${rider.isSharing ? 'Live' : 'Paused'}</div>
            </div>
          </div>
        </div>
      `;

      if (currentMarkers.has(id)) {
        const marker = currentMarkers.get(id);
        marker.setLatLng(latLng);
        marker.setIcon(icon);
        marker.setPopupContent(popupContent);
      } else {
        const marker = L.marker(latLng, { icon, riseOnHover: true })
          .bindPopup(popupContent, { offset: [0, -32] })
          .addTo(map);
        currentMarkers.set(id, marker);
      }
    });

    // Remove old markers
    for (const [id, marker] of currentMarkers.entries()) {
      if (!activeRiderIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Auto fit bounds initially when markers appear
    if (!hasInitialFitRef.current && validCoords.length > 0) {
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 14, { animate: true });
      } else {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
      hasInitialFitRef.current = true;
    }

    // Auto follow current rider if enabled
    if (autoFollow && currentRiderId && riders?.[currentRiderId]?.coords?.lat != null) {
      const myCoords = riders[currentRiderId].coords;
      map.panTo([myCoords.lat, myCoords.lng], { animate: true, duration: 0.8 });
    }
  }, [riders, currentRiderId, autoFollow]);

  // Focus on specific rider when requested
  useEffect(() => {
    if (!focusedRiderId || !mapRef.current) return;
    const rider = riders?.[focusedRiderId];
    if (rider?.coords?.lat != null && rider?.coords?.lng != null) {
      mapRef.current.setView([rider.coords.lat, rider.coords.lng], 16, { animate: true });
      const marker = markersRef.current.get(focusedRiderId);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [focusedRiderId, riders]);

  // Recenter / Fit All Riders button action
  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const validCoords = Object.values(riders || {})
      .filter(r => r.coords?.lat != null && r.coords?.lng != null)
      .map(r => [r.coords.lat, r.coords.lng]);

    if (validCoords.length === 0) return;
    if (validCoords.length === 1) {
      map.setView(validCoords[0], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  const handleSaveApiKey = () => {
    const cleaned = tempApiKey.trim();
    setApiKey(cleaned);
    localStorage.setItem('evide_map_api_key', cleaned);
    if (cleaned) {
      setMapTheme('mapbox');
      localStorage.setItem('evide_map_theme', 'mapbox');
    }
    setIsSettingsOpen(false);
  };

  const handleChangeTheme = (newTheme) => {
    setMapTheme(newTheme);
    localStorage.setItem('evide_map_theme', newTheme);
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Overlay Top Controls */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2">
        <button
          onClick={handleFitAll}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 text-xs font-medium text-zinc-200 backdrop-blur-md shadow-lg transition-colors"
          title="Fit all group members on map"
        >
          <Maximize2 className="w-3.5 h-3.5 text-lime-400" />
          <span>Fit All Riders</span>
        </button>

        {/* Map Layers / API Key Settings Button */}
        <button
          onClick={() => {
            setTempApiKey(apiKey);
            setIsSettingsOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/80 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-lg transition-colors"
          title="Map Layer & API Key Settings"
        >
          <Layers className="w-3.5 h-3.5 text-lime-400" />
          <span>Map Settings</span>
        </button>

        {/* Auto-Follow Me Toggle Button */}
        <button
          onClick={() => setAutoFollow(!autoFollow)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium backdrop-blur-md shadow-lg transition-all ${
            autoFollow
              ? 'bg-lime-950/90 border-lime-400/50 text-lime-400 shadow-lime-400/10'
              : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800/80 text-zinc-300'
          }`}
          title="Automatically center the map on your movement"
        >
          <Navigation className={`w-3.5 h-3.5 ${autoFollow ? 'text-lime-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="hidden sm:inline">Follow Me:</span>
          <span>{autoFollow ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Map Layer / API Key Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-lime-400" />
              <span>Map Layer & API Settings</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Select your preferred map style or supply your custom Mapbox/Leaflet API key.
            </p>

            {/* Layer Choices */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleChangeTheme('osm-dark')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                  mapTheme === 'osm-dark'
                    ? 'bg-lime-950/40 border-lime-500/50 text-lime-400'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="font-semibold">OpenStreetMap Dark (Default)</div>
                  <div className="text-[10px] text-zinc-400">100% Free • No API Key Required • No Watermarks</div>
                </div>
                {mapTheme === 'osm-dark' && <Check className="w-4 h-4 text-lime-400 shrink-0" />}
              </button>

              <button
                onClick={() => handleChangeTheme('osm-light')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                  mapTheme === 'osm-light'
                    ? 'bg-lime-950/40 border-lime-500/50 text-lime-400'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="font-semibold">OpenStreetMap Standard</div>
                  <div className="text-[10px] text-zinc-400">Standard light street map • No API Key Required</div>
                </div>
                {mapTheme === 'osm-light' && <Check className="w-4 h-4 text-lime-400 shrink-0" />}
              </button>

              <button
                onClick={() => handleChangeTheme('mapbox')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                  mapTheme === 'mapbox'
                    ? 'bg-lime-950/40 border-lime-500/50 text-lime-400'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <div>
                  <div className="font-semibold">Mapbox Dark (Optional)</div>
                  <div className="text-[10px] text-zinc-400">High-performance vector tiles • Requires API token</div>
                </div>
                {mapTheme === 'mapbox' && <Check className="w-4 h-4 text-lime-400 shrink-0" />}
              </button>
            </div>

            {/* Custom Mapbox / API Key Input */}
            <div className="border-t border-zinc-800/80 pt-3">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-lime-400" />
                <span>Mapbox / Custom API Key (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="pk.eyJ1..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-lime-400 transition-colors"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                If provided, Evide will load high-resolution Mapbox tiles using this token.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded-lg bg-lime-400 text-black font-semibold text-xs hover:bg-lime-300 transition-colors shadow-md shadow-lime-400/20"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
