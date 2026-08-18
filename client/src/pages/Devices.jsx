import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Phone,
  Wifi,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { BatteryBadge } from '../components/BatteryBadge';
import { DeviceStatusBadge } from '../components/DeviceStatusBadge';
import { AddDeviceModal } from '../components/AddDeviceModal';

export const Devices = () => {
  const {
    devices,
    deleteDevice,
    regenerateDeviceKey,
    updateDevice,
    toggleSimulator,
  } = useAlerts();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copiedKeys, setCopiedKeys] = useState({});
  const [editingDevice, setEditingDevice] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const toggleKeyVisibility = (id) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedKeys((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedKeys((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleRegenerateKey = async (id) => {
    if (window.confirm('Are you sure you want to regenerate this device API key? The ESP32-C3 hardware will require updating with the new key.')) {
      await regenerateDeviceKey(id);
    }
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm(`Are you sure you want to remove device ${id}? Telemetry and future alerts will be rejected.`)) {
      await deleteDevice(id);
    }
  };

  const handleStartEdit = (device) => {
    setEditingDevice(device.id);
    setEditFormData({
      name: device.name,
      ownerName: device.ownerName,
      ownerPhone: device.ownerPhone || '',
      emergencyContactName: device.emergencyContactName || '',
      emergencyContactPhone: device.emergencyContactPhone || '',
      notes: device.notes || '',
    });
  };

  const handleSaveEdit = async (id) => {
    await updateDevice(id, editFormData);
    setEditingDevice(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-indigo-400" />
            Registered ESP32-C3 Devices
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage wearable hardware nodes, private device authentication keys, and emergency contacts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimulator}
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Radio className="w-4 h-4 text-yellow-400" />
            Test Device Ping
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Device
          </button>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {devices.map((device) => {
          const isKeyRevealed = revealedKeys[device.id];
          const isCopied = copiedKeys[device.id];
          const isEditing = editingDevice === device.id;

          return (
            <div
              key={device.id}
              className={`p-5 rounded-2xl border transition-all ${
                device.status === 'sos'
                  ? 'bg-red-950/40 border-red-500/80 shadow-xl'
                  : 'bg-gray-900/70 border-gray-800 hover:border-gray-700'
              }`}
            >
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-white">Edit Device: {device.id}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-gray-400 block mb-1">Device Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Holder Name</label>
                      <input
                        type="text"
                        value={editFormData.ownerName}
                        onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-gray-400 block mb-1">Holder Phone</label>
                      <input
                        type="text"
                        value={editFormData.ownerPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, ownerPhone: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Emergency Contact Phone</label>
                      <input
                        type="text"
                        value={editFormData.emergencyContactPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded p-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingDevice(null)}
                      className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(device.id)}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal View */
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/60 text-gray-300 border border-gray-800">
                          {device.id}
                        </span>
                        <DeviceStatusBadge status={device.status} wifiSignal={device.wifiSignal} showSignal={true} />
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">{device.name}</h3>
                      <p className="text-xs text-gray-400">Assigned to: <strong className="text-gray-200">{device.ownerName}</strong></p>
                    </div>

                    <BatteryBadge level={device.batteryLevel} voltage={device.voltage} showVoltage={true} />
                  </div>

                  {/* Contact & Last Ping Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950/70 p-3 rounded-xl border border-gray-800/80">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Emergency Guardian</span>
                      <span className="font-medium text-gray-200">{device.emergencyContactName || 'None'}</span>
                      <div className="text-emerald-400 text-[11px] font-mono">{device.emergencyContactPhone || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Last Heartbeat / Location</span>
                      <span className="font-mono text-gray-300 text-[11px]">
                        {new Date(device.lastSeen).toLocaleTimeString()}
                      </span>
                      <div className="text-[10px] text-gray-400 truncate">
                        {device.lastLat?.toFixed(4)}, {device.lastLng?.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Device API Key Box */}
                  <div className="bg-black/80 border border-gray-800 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Key className="w-3 h-3 text-yellow-400" />
                        Hardware API Key
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleKeyVisibility(device.id)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {isKeyRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isKeyRevealed ? 'Hide' : 'Reveal'}</span>
                        </button>
                        <button
                          onClick={() => handleCopyKey(device.id, device.apiKey)}
                          className="hover:text-white flex items-center gap-1 text-indigo-400"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-yellow-300 select-all truncate">
                      {isKeyRevealed ? device.apiKey : `${device.apiKey?.substring(0, 10)}••••••••••••••••`}
                    </div>
                  </div>

                  {/* Notes if any */}
                  {device.notes && (
                    <p className="text-[11px] text-gray-400 italic">
                      Note: {device.notes}
                    </p>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleRegenerateKey(device.id)}
                      className="text-xs text-gray-400 hover:text-yellow-400 flex items-center gap-1 transition-colors"
                      title="Regenerate Hardware Key"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Rotate Key
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(device)}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-1.5 bg-gray-800 hover:bg-red-900/60 text-gray-400 hover:text-red-300 rounded-lg text-xs transition-colors"
                        title="Delete Device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
