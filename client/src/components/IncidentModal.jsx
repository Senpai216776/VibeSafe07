import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  UserCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { BatteryBadge } from './BatteryBadge';

export const IncidentModal = () => {
  const { selectedAlert, setSelectedAlert, acknowledgeAlert, respondAlert, resolveAlert, addAlertNote } = useAlerts();

  const [newNote, setNewNote] = useState('');
  const [resolveType, setResolveType] = useState('resolved');
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!selectedAlert) return null;

  const alert = selectedAlert;
  const isResolved = alert.status === 'resolved' || alert.status === 'false_alarm';

  const handleAcknowledge = async () => {
    setLoadingAction(true);
    try {
      const updated = await acknowledgeAlert(alert.id, 'Acknowledged in Command Center');
      setSelectedAlert(updated);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDispatch = async () => {
    setLoadingAction(true);
    try {
      const updated = await respondAlert(alert.id, 'Emergency team dispatched to GPS coordinates.');
      setSelectedAlert(updated);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setLoadingAction(true);
    try {
      const updated = await addAlertNote(alert.id, newNote.trim());
      setSelectedAlert(updated);
      setNewNote('');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResolve = async () => {
    setLoadingAction(true);
    try {
      const updated = await resolveAlert(alert.id, resolveType, resolveNotes || 'Incident concluded.');
      setSelectedAlert(updated);
      setShowResolveConfirm(false);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b ${
          isResolved
            ? 'bg-emerald-950/40 border-emerald-800/60'
            : 'bg-red-950/60 border-red-800/60'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${
                isResolved
                  ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300'
                  : 'bg-red-900/50 border-red-500 text-red-300 animate-pulse'
              }`}>
                {isResolved ? <ShieldCheck className="w-7 h-7" /> : <AlertOctagon className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-black/50 text-gray-300 border border-gray-700">
                    Incident #{alert.id}
                  </span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    alert.status === 'active'
                      ? 'bg-red-500 text-white animate-pulse'
                      : alert.status === 'acknowledged'
                      ? 'bg-amber-500 text-black font-semibold'
                      : alert.status === 'responded'
                      ? 'bg-blue-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {alert.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{alert.ownerName}</h2>
                <p className="text-xs text-gray-400 font-mono">
                  Device: {alert.deviceId} ({alert.deviceName})
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedAlert(null)}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-800/70 border border-gray-700 p-3 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">Triggered Time</span>
              <span className="text-xs font-mono text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                {new Date(alert.triggeredAt).toLocaleString()}
              </span>
            </div>

            <div className="bg-gray-800/70 border border-gray-700 p-3 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">Battery at Incident</span>
              <BatteryBadge level={alert.batteryLevel} voltage={alert.voltage} showVoltage={true} />
            </div>

            <div className="bg-gray-800/70 border border-gray-700 p-3 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">Trigger Method</span>
              <span className="text-xs font-mono text-yellow-300">
                {alert.triggerType || 'Hardware Button SOS'}
              </span>
            </div>
          </div>

          {/* Emergency Contacts & Location Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contacts */}
            <div className="bg-gray-800/50 border border-gray-700/80 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                Emergency Contacts
              </h3>
              <div className="space-y-2 text-xs">
                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-700/50">
                  <span className="text-gray-400 block">Device Holder:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-semibold text-white">{alert.ownerName}</span>
                    <a
                      href={`tel:${alert.ownerPhone}`}
                      className="text-emerald-400 hover:underline font-mono text-xs font-bold"
                    >
                      {alert.ownerPhone || 'N/A'}
                    </a>
                  </div>
                </div>

                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-700/50">
                  <span className="text-gray-400 block">Primary Guardian / Contact:</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-semibold text-white">{alert.emergencyContactName || 'N/A'}</span>
                    <a
                      href={`tel:${alert.emergencyContactPhone}`}
                      className="text-emerald-400 hover:underline font-mono text-xs font-bold"
                    >
                      {alert.emergencyContactPhone || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Location */}
            <div className="bg-gray-800/50 border border-gray-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-400" />
                  Latest GPS Coordinates
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="font-mono text-white bg-gray-900/80 p-2 rounded-lg border border-gray-700">
                    LAT: {alert.lat} | LNG: {alert.lng}
                    {alert.accuracy && <span className="text-gray-400 text-[11px] block">Accuracy: ±{alert.accuracy}m</span>}
                  </div>
                  {alert.address && (
                    <p className="text-xs text-gray-300 mt-2">
                      📍 {alert.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${alert.lat},${alert.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Timeline Audit Log */}
          <div className="bg-gray-800/40 border border-gray-700/80 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Incident Audit Timeline
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-700 pl-8">
              {(alert.timeline || []).map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-gray-900" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{item.action}</span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      {item.actor && (
                        <span className="text-[11px] px-1.5 py-0.2 bg-gray-700 text-gray-300 rounded font-medium">
                          {item.actor}
                        </span>
                      )}
                    </div>
                    {item.details && <p className="text-gray-300 mt-0.5 text-xs">{item.details}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Append Note Form */}
            {!isResolved && (
              <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-gray-700 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add responder update / dispatch notes..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loadingAction || !newNote.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Resolve Section / Form */}
          {showResolveConfirm && !isResolved && (
            <div className="bg-gray-800 border-2 border-emerald-600 rounded-xl p-4 space-y-3 animate-fade-in">
              <h4 className="text-sm font-bold text-emerald-400">Close & Resolve Emergency Incident</h4>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="resolveType"
                    value="resolved"
                    checked={resolveType === 'resolved'}
                    onChange={() => setResolveType('resolved')}
                  />
                  <span>Incident Resolved (Assistance Rendered)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="resolveType"
                    value="false_alarm"
                    checked={resolveType === 'false_alarm'}
                    onChange={() => setResolveType('false_alarm')}
                  />
                  <span>False Alarm (User Confirmed Safe)</span>
                </label>
              </div>

              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Resolution summary and closing notes..."
                rows={2}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResolveConfirm(false)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Close Incident
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-gray-950 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setSelectedAlert(null)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl"
          >
            Close Window
          </button>

          {!isResolved && (
            <div className="flex items-center gap-2">
              {alert.status === 'active' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={loadingAction}
                  className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  Acknowledge
                </button>
              )}

              {alert.status !== 'responded' && (
                <button
                  onClick={handleDispatch}
                  disabled={loadingAction}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Dispatch Help
                </button>
              )}

              {!showResolveConfirm && (
                <button
                  onClick={() => setShowResolveConfirm(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve Emergency
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
