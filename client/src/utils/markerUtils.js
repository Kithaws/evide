import L from 'leaflet';

export const STATUS_CONFIG = {
  Riding: {
    label: 'Riding',
    color: '#a3e635', // Lime 400
    bgBadge: 'bg-lime-950/80 text-lime-400 border-lime-500/30',
    dotColor: 'bg-lime-400',
    iconName: 'Navigation',
  },
  Refueling: {
    label: 'Refueling',
    color: '#f59e0b', // Amber 500
    bgBadge: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
    dotColor: 'bg-amber-400',
    iconName: 'Fuel',
  },
  'Taking a Break': {
    label: 'Taking a Break',
    color: '#38bdf8', // Sky 400
    bgBadge: 'bg-sky-950/80 text-sky-400 border-sky-500/30',
    dotColor: 'bg-sky-400',
    iconName: 'Coffee',
  }
};

/**
 * Generate a styled Leaflet DivIcon for a rider
 */
export function createRiderIcon(rider, isCurrentUser = false) {
  const statusInfo = STATUS_CONFIG[rider.status] || STATUS_CONFIG['Riding'];
  const initial = (rider.name || 'R').charAt(0).toUpperCase();
  const isSharing = rider.isSharing;
  const isOnline = rider.online !== false;

  const ringClass = isSharing && isOnline ? 'rider-pulse' : '';
  const opacityClass = isOnline ? 'opacity-100' : 'opacity-50 grayscale';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-110 ${opacityClass}" style="transform: translate(-50%, -100%);">
      <!-- Rider Name & Status Tag -->
      <div class="mb-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 shadow-lg text-[11px] font-semibold text-zinc-200 whitespace-nowrap">
        <span class="w-2 h-2 rounded-full ${isOnline ? statusInfo.dotColor : 'bg-zinc-500'} ${isSharing && isOnline ? 'animate-ping' : ''}"></span>
        <span>${escapeHtml(rider.name)}</span>
        ${isCurrentUser ? '<span class="text-[9px] px-1 rounded bg-lime-400/20 text-lime-400 font-mono">YOU</span>' : ''}
      </div>

      <!-- Marker Pin Circle -->
      <div class="relative flex items-center justify-center">
        <!-- Pulse halo -->
        <div class="w-10 h-10 rounded-full flex items-center justify-center ${ringClass}" style="background-color: ${statusInfo.color}20; border: 2px solid ${statusInfo.color};">
          <div class="w-7 h-7 rounded-full bg-zinc-950 flex items-center justify-center font-bold text-xs shadow-inner" style="color: ${statusInfo.color};">
            ${initial}
          </div>
        </div>

        <!-- Heading pointer arrow if heading is present -->
        ${rider.coords?.heading != null ? `
          <div class="absolute -top-2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px]" style="border-bottom-color: ${statusInfo.color}; transform: rotate(${rider.coords.heading}deg);"></div>
        ` : ''}
      </div>

      <!-- Pin point arrow downward -->
      <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]" style="border-t-color: ${statusInfo.color};"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-rider-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
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
