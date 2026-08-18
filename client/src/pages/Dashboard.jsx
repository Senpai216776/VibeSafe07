import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldCheck,
  Cpu,
  BatteryCharging,
  Clock,
  MapPin,
  Radio,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  Compass
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { LiveMap } from '../components/LiveMap';
import { BatteryBadge } from '../components/BatteryBadge';
import { DeviceStatusBadge } from '../components/DeviceStatusBadge';
import { AddDeviceModal } from '../components/AddDeviceModal';

export const Dashboard = () => {
  const {
    alerts,
    activeAlerts,
    devices,
    stats,
    setSelectedAlert,
    fetchData,
    toggleSimulator,
  } = useAlerts();

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [mapFocusAlert, setMapFocusAlert] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Emergency Command Dashboard
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time telemetry and distress monitoring for ESP32-C3 SuperMini safety wearables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={toggleSimulator}
            className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            Hardware Simulator
          </button>

          <button
            onClick={() => setIsAddDeviceOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Emergencies */}
        <div className={`p-4 rounded-2xl border transition-all ${
          stats.activeSosCount > 0
            ? 'bg-gradient-to-br from-red-950/80 to-gray-900 border-red-500 shadow-xl shadow-red-950/40 animate-pulse'
            : 'bg-gray-900/70 border-gray-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active SOS Alerts</span>
            <div className={`p-2 rounded-xl ${
              stats.activeSosCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${
              stats.activeSosCount > 0 ? 'text-red-400' : 'text-white'
            }`}>
              {stats.activeSosCount}
            </span>
            <span className="text-xs text-gray-400">
              {stats.activeSosCount === 1 ? 'emergency' : 'emergencies'}
            </span>
          </div>
        </div>

        {/* Online Devices */}
        <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Online Fleet</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.onlineDevices}</span>
            <span className="text-xs text-gray-400">/ {stats.totalDevices} connected</span>
          </div>
        </div>

        {/* Average Battery */}
        <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fleet Battery Avg</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BatteryCharging className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.avgBattery}%</span>
            <span className="text-xs text-emerald-400 font-medium">Health Good</span>
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resolved Incidents</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.resolvedCount}</span>
            <span className="text-xs text-gray-400">logged</span>
          </div>
        </div>
      </div>

      {/* Active Emergencies Action Section */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              Immediate Response Required ({activeAlerts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  setSelectedAlert(alert);
                  setMapFocusAlert(alert);
                }}
                className="group relative p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-gray-900 border-2 border-red-500/80 shadow-2xl cursor-pointer hover:border-red-400 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-950/60 animate-bounce">
                      <AlertOctagon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.2 bg-black/60 rounded text-red-300 font-bold border border-red-800">
                          {alert.deviceId}
                        </span>
                        <span className="text-[11px] font-mono text-gray-300">
                          ⏱ {new Date(alert.triggeredAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{alert.ownerName}</h3>
                      <p className="text-xs text-red-300 flex items-center gap-1 mt-0.5">
                        📞 {alert.ownerPhone || 'No direct phone'}
                      </p>
                    </div>
                  </div>

                  <BatteryBadge level={alert.batteryLevel} voltage={alert.voltage} />
                </div>

                <div className="mt-3 pt-3 border-t border-red-900/60 flex items-center justify-between text-xs">
                  <span className="text-gray-300 flex items-center gap-1 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)}
                  </span>

                  <span className="text-red-300 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Manage SOS &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Tactical Map (2 cols) & Fleet Status (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Radar Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Live Interactive Location Radar
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              OpenStreetMap + GPS Telemetry
            </span>
          </div>

          <LiveMap
            devices={devices}
            activeAlerts={activeAlerts}
            selectedAlert={mapFocusAlert}
            onSelectAlert={(alert) => setSelectedAlert(alert)}
            height="480px"
          />
        </div>

        {/* Right 1 Col: Registered Devices Fleet List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Device Fleet Telemetry
            </h2>
            <span className="text-xs font-mono text-gray-400">{devices.length} Devices</span>
          </div>

          <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-3 space-y-2.5 max-h-[480px] overflow-y-auto">
            {devices.map((device) => {
              const isSos = device.status === 'sos';
              return (
                <div
                  key={device.id}
                  onClick={() => setMapFocusAlert(device.status === 'sos' ? activeAlerts.find(a => a.deviceId === device.id) : null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSos
                      ? 'bg-red-950/40 border-red-500/80 shadow-md hover:border-red-400'
                      : 'bg-gray-950/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-300">{device.id}</span>
                        <DeviceStatusBadge status={device.status} />
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{device.ownerName}</h4>
                      <p className="text-[11px] text-gray-400">{device.name}</p>
                    </div>

                    <BatteryBadge level={device.batteryLevel} voltage={device.voltage} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className="text-indigo-400 hover:text-indigo-300 font-medium">
                      Locate on Map &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
      />
    </div>
  );
};
