import React, { useState } from 'react';
import {
  X,
  Cpu,
  Radio,
  Send,
  Battery,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Activity,
  MapPin,
  Wifi
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { api } from '../utils/api';

export const DeviceSimulatorModal = () => {
  const { isSimulatorOpen, toggleSimulator, devices, fetchData } = useAlerts();

  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id || 'VS-ESP32-C3-01');
  const [battery, setBattery] = useState(76);
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: 'ESP32-C3 Simulator initialized. Ready.' }
  ]);
  const [isSending, setIsSending] = useState(false);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  if (!isSimulatorOpen) return null;

  const addLog = (text) => {
    setLogs((prev) => [...prev.slice(-15), { time: new Date().toLocaleTimeString(), text }]);
  };

  const handleTriggerSos = async () => {
    if (!selectedDevice) {
      addLog('Error: No device selected');
      return;
    }

    setIsSending(true);
    addLog(`[ESP32-C3] Holding SOS button on GPIO 9 (1.5s debounce passed)...`);

    const voltage = (3.30 + (battery / 100) * 0.9).toFixed(2);
    const payload = {
      deviceId: selectedDevice.id,
      batteryLevel: battery,
      voltage: parseFloat(voltage),
      wifiSignal: -58,
      gps: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accuracy: 3.2,
      },
      triggerType: 'simulator_hardware_button_sos',
      notes: 'SOS triggered via VibeSafe ESP32-C3 Live Simulator',
    };

    try {
      addLog(`[HTTP] POST /api/v1/devices/sos with x-device-key...`);
      const res = await api.simulator.triggerSos(selectedDevice.apiKey, payload);
      addLog(`[HTTP 201] ✅ SOS ACKNOWLEDGED! Alert ID: ${res.alertId}`);
      fetchData();
    } catch (err) {
      addLog(`[HTTP ERROR] ❌ ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendHeartbeat = async () => {
    if (!selectedDevice) return;
    setIsSending(true);
    addLog(`[ESP32-C3] Sending 60s periodic heartbeat...`);

    const voltage = (3.30 + (battery / 100) * 0.9).toFixed(2);
    const payload = {
      batteryLevel: battery,
      voltage: parseFloat(voltage),
      wifiSignal: -62,
      gps: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
    };

    try {
      const res = await api.simulator.sendHeartbeat(selectedDevice.apiKey, payload);
      addLog(`[HTTP 200] Heartbeat OK. Device status: ${res.deviceStatus}`);
      fetchData();
    } catch (err) {
      addLog(`[HTTP ERROR] ❌ ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelSos = async () => {
    if (!selectedDevice) return;
    setIsSending(true);
    addLog(`[ESP32-C3] Cancel button pressed on GPIO 3...`);

    try {
      const res = await api.simulator.cancelSos(selectedDevice.apiKey);
      addLog(`[HTTP 200] SOS Cancelled by hardware.`);
      fetchData();
    } catch (err) {
      addLog(`[HTTP ERROR] ❌ ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const presetLocations = [
    { name: 'SF Market St', lat: 37.7749, lng: -122.4194 },
    { name: 'NYC Times Sq', lat: 40.7580, lng: -73.9855 },
    { name: 'London Eye', lat: 51.5033, lng: -0.1195 },
    { name: 'Tokyo Shibuya', lat: 35.6595, lng: 139.7004 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-indigo-950/50 to-gray-900 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                ESP32-C3 SuperMini Hardware Simulator
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-mono tracking-wider border border-indigo-500/40">
                  Virtual Device
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Test live SOS triggers, heartbeats, and GPS streams without hardware connected
              </p>
            </div>
          </div>

          <button
            onClick={toggleSimulator}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulator Controls */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Target Device Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Select Registered ESP32 Device
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} - {d.name} ({d.ownerName}) [Key: {d.apiKey ? d.apiKey.substring(0, 12) : ''}...]
                </option>
              ))}
            </select>
          </div>

          {/* Virtual Board & Big SOS Button */}
          <div className="bg-gradient-to-b from-gray-950 to-gray-900 border border-gray-800 rounded-2xl p-5 text-center shadow-inner">
            <span className="text-[11px] font-mono text-gray-400 block mb-3">
              GPIO 9 Emergency Push Switch (Simulated Hardware)
            </span>

            <div className="flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleTriggerSos}
                disabled={isSending}
                className="group relative w-32 h-32 rounded-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-black text-xl shadow-[0_0_40px_rgba(239,68,68,0.5)] border-4 border-red-400 flex flex-col items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
              >
                <AlertOctagon className="w-8 h-8 mb-1 group-hover:scale-110 transition-transform" />
                <span>SOS</span>
                <span className="text-[10px] font-normal uppercase opacity-80">Press Trigger</span>
              </button>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSendHeartbeat}
                  disabled={isSending}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Send Heartbeat
                </button>

                <button
                  type="button"
                  onClick={handleCancelSos}
                  disabled={isSending}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
                  Hardware Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Sliders: Battery & GPS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Battery Slider */}
            <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-gray-300 flex items-center gap-1">
                  <Battery className="w-4 h-4 text-emerald-400" />
                  Battery Level: {battery}%
                </span>
                <span className="font-mono text-gray-400 text-[11px]">
                  {(3.30 + (battery / 100) * 0.9).toFixed(2)}V
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* GPS Preset Picker */}
            <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4 text-red-400" />
                Simulate Location Preset
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetLocations.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      setLat(loc.lat);
                      setLng(loc.lng);
                      addLog(`GPS preset loaded: ${loc.name} [${loc.lat}, ${loc.lng}]`);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      lat === loc.lat && lng === loc.lng
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Serial Monitor Log */}
          <div className="bg-black/90 border border-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-gray-800 pb-1.5 mb-2 font-mono">
              <span className="flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                ESP32-C3 UART Serial Monitor (115200 baud)
              </span>
              <span className="text-emerald-400">● Wi-Fi Connected</span>
            </div>
            <div className="font-mono text-[11px] text-gray-300 space-y-1 max-h-28 overflow-y-auto">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500 shrink-0">[{l.time}]</span>
                  <span className={l.text.includes('ERROR') ? 'text-red-400' : l.text.includes('ACKNOWLEDGED') ? 'text-emerald-300 font-bold' : 'text-gray-300'}>
                    {l.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-end">
          <button
            onClick={toggleSimulator}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
