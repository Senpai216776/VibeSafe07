import React, { useState } from 'react';
import { X, Plus, Key, Copy, Check, Cpu, CheckCircle } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

export const AddDeviceModal = ({ isOpen, onClose }) => {
  const { registerDevice } = useAlerts();

  const [formData, setFormData] = useState({
    id: `VS-ESP32-C3-0${Math.floor(Math.random() * 90) + 10}`,
    name: '',
    ownerName: '',
    ownerPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  });

  const [createdDevice, setCreatedDevice] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName) {
      setError('Please provide Device Name and Assigned Holder Name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await registerDevice(formData);
      setCreatedDevice(res.device);
    } catch (err) {
      setError(err.message || 'Failed to register device.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Register New ESP32-C3 Device</h3>
              <p className="text-xs text-gray-400">Generate secure API keys for a new wearable device</p>
            </div>
          </div>

          <button
            onClick={() => {
              setCreatedDevice(null);
              onClose();
            }}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form or Success Screen */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/60 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          {createdDevice ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-base text-white">ESP32 Device Registered!</h4>
                <p className="text-xs text-gray-300">
                  Unique hardware token generated. Copy this device key into your ESP32-C3 firmware sketch.
                </p>
              </div>

              <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Device API Key (Keep Private)</span>
                  <button
                    onClick={() => handleCopy(createdDevice.apiKey)}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
                <div className="p-2 bg-black/60 rounded border border-gray-800 font-mono text-xs text-yellow-300 select-all break-all">
                  {createdDevice.apiKey}
                </div>
              </div>

              <div className="bg-gray-950 border border-gray-800 p-3.5 rounded-xl text-xs space-y-2">
                <span className="font-bold text-gray-300 block">Arduino Firmware Configuration:</span>
                <pre className="p-2.5 bg-black/80 rounded font-mono text-[11px] text-gray-300 overflow-x-auto">
{`const char* DEVICE_ID = "${createdDevice.id}";
const char* DEVICE_API_KEY = "${createdDevice.apiKey}";`}
                </pre>
              </div>

              <button
                onClick={() => {
                  setCreatedDevice(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
              >
                Done & View Devices
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Device Hardware ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Device Name / Form Factor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya - Hiking Clip"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Assigned Holder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Holder Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Primary Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Guardian Name & Relationship"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 111-2222"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-gray-300 font-semibold mb-1">Medical / Hardware Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lithium 400mAh battery, wearable lanyard, asthma medication carrier"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Registering...' : 'Register Device'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
