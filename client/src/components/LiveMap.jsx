import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { AlertOctagon, Battery, Compass, ExternalLink, ShieldCheck } from 'lucide-react';
import { BatteryBadge } from './BatteryBadge';
import { DeviceStatusBadge } from './DeviceStatusBadge';

// Create custom leaflet DivIcon for normal, offline, and SOS pins
const createCustomIcon = (status) => {
  if (status === 'sos') {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="radar-marker-container">
          <div class="radar-ping"></div>
          <div class="radar-dot"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -20],
    });
  }

  if (status === 'online') {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="normal-pin"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="offline-pin"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
};

// Component to dynamically re-center when focus location changes
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 14, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

export const LiveMap = ({ devices = [], activeAlerts = [], selectedAlert = null, onSelectAlert, height = '450px' }) => {
  // Default center: San Francisco or first active alert
  let defaultCenter = [37.7749, -122.4194];
  let zoomLevel = 13;

  if (selectedAlert && selectedAlert.lat && selectedAlert.lng) {
    defaultCenter = [selectedAlert.lat, selectedAlert.lng];
    zoomLevel = 15;
  } else if (activeAlerts.length > 0 && activeAlerts[0].lat && activeAlerts[0].lng) {
    defaultCenter = [activeAlerts[0].lat, activeAlerts[0].lng];
    zoomLevel = 14;
  } else if (devices.length > 0 && devices[0].lastLat && devices[0].lastLng) {
    defaultCenter = [devices[0].lastLat, devices[0].lastLng];
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#0B0F19] shadow-2xl" style={{ height }}>
      {/* Tactical Map Header Legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-gray-700/70 text-xs flex items-center gap-3 shadow-lg pointer-events-auto">
        <span className="font-bold text-gray-200 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-indigo-400" />
          Live GPS Radar
        </span>
        <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            Active SOS ({activeAlerts.length})
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Online
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Offline
          </span>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="rounded-2xl"
      >
        <ChangeView center={defaultCenter} zoom={zoomLevel} />

        {/* CartoDB Dark Matter Tactical Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Render Active Emergency Circles */}
        {activeAlerts.map((alert) => {
          if (!alert.lat || !alert.lng) return null;
          return (
            <React.Fragment key={`circle-${alert.id}`}>
              <Circle
                center={[alert.lat, alert.lng]}
                radius={250}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '4, 8',
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Render Device Markers */}
        {devices.map((device) => {
          const lat = device.lastLat || 37.7749;
          const lng = device.lastLng || -122.4194;
          const isSos = device.status === 'sos';

          return (
            <Marker
              key={device.id}
              position={[lat, lng]}
              icon={createCustomIcon(device.status)}
            >
              <Popup className="tactical-popup">
                <div className="p-1 min-w-[240px] text-gray-200">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-700">
                    <span className="font-mono text-xs font-bold text-gray-400">{device.id}</span>
                    <DeviceStatusBadge status={device.status} />
                  </div>

                  <div className="mt-2">
                    <h4 className="font-bold text-sm text-white">{device.ownerName}</h4>
                    <p className="text-xs text-gray-400">{device.name}</p>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/70 p-1.5 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Battery</span>
                      <BatteryBadge level={device.batteryLevel} voltage={device.voltage} />
                    </div>
                    <div className="bg-gray-800/70 p-1.5 rounded-lg">
                      <span className="text-gray-400 block text-[10px]">Wi-Fi RSSI</span>
                      <span className="font-mono text-xs text-indigo-300">{device.wifiSignal || -60} dBm</span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-xs text-gray-400">
                    <span className="block font-mono text-[11px] text-gray-300">
                      📍 {lat.toFixed(5)}, {lng.toFixed(5)}
                    </span>
                    {device.address && <p className="text-[11px] mt-0.5 text-gray-400">{device.address}</p>}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-gray-700">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Google Maps
                    </a>

                    {isSos && onSelectAlert && (
                      <button
                        onClick={() => {
                          const alert = activeAlerts.find((a) => a.deviceId === device.id);
                          if (alert) onSelectAlert(alert);
                        }}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px]"
                      >
                        Manage SOS &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
