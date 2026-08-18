import React, { useState, useEffect } from 'react';
import { AlertOctagon, Volume2, VolumeX, ShieldAlert, CheckCircle, Navigation, Radio } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { BatteryBadge } from './BatteryBadge';

export const EmergencyBanner = () => {
  const {
    activeAlerts,
    isSirenMuted,
    toggleMute,
    acknowledgeAlert,
    resolveAlert,
    setSelectedAlert,
  } = useAlerts();

  const [elapsed, setElapsed] = useState('');

  const currentAlert = activeAlerts[0];

  useEffect(() => {
    if (!currentAlert) return;

    const updateTimer = () => {
      const start = new Date(currentAlert.triggeredAt).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - start) / 1000);

      if (diffSec < 60) {
        setElapsed(`${diffSec}s ago`);
      } else {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        setElapsed(`${mins}m ${secs}s ago`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [currentAlert]);

  if (activeAlerts.length === 0 || !currentAlert) {
    return null;
  }

  const isAcknowledged = currentAlert.status === 'acknowledged' || currentAlert.status === 'responded';

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white shadow-2xl border-b-4 border-red-500 animate-pulse-glow z-30">
      {/* Animated warning stripe overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Left: Critical Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/40 rounded-xl border border-red-300/40 shrink-0 flex items-center justify-center">
              <AlertOctagon className="w-7 h-7 text-yellow-300 animate-bounce" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-black text-xs uppercase tracking-wider">
                  CRITICAL SOS ALERT
                </span>
                <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded text-red-200">
                  {currentAlert.deviceId}
                </span>
                <span className="text-xs font-mono text-white/80">⏱ {elapsed}</span>
                {activeAlerts.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-950 text-white font-bold text-xs border border-red-400">
                    +{activeAlerts.length - 1} more emergency
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
                <span className="text-white text-base font-bold">
                  {currentAlert.ownerName}
                </span>
                <span className="text-red-200 text-xs flex items-center gap-1">
                  📞 {currentAlert.ownerPhone || 'No direct phone'}
                </span>
                <span className="text-red-200 text-xs flex items-center gap-1">
                  🚨 Contact: {currentAlert.emergencyContactName} ({currentAlert.emergencyContactPhone})
                </span>
                <BatteryBadge level={currentAlert.batteryLevel} voltage={currentAlert.voltage} />
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
            {/* Siren Toggle */}
            <button
              onClick={toggleMute}
              title={isSirenMuted ? 'Unmute siren alarm' : 'Mute emergency siren'}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSirenMuted
                  ? 'bg-black/40 text-yellow-200 hover:bg-black/60'
                  : 'bg-yellow-400 text-black hover:bg-yellow-300 animate-pulse'
              }`}
            >
              {isSirenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSirenMuted ? 'Alarm Muted' : 'Siren Active'}</span>
            </button>

            {/* Acknowledge Button */}
            {!isAcknowledged && (
              <button
                onClick={() => acknowledgeAlert(currentAlert.id, 'Acknowledged via top emergency bar.')}
                className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                Acknowledge SOS
              </button>
            )}

            {/* View on Map / Details */}
            <button
              onClick={() => setSelectedAlert(currentAlert)}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-white/30"
            >
              <Navigation className="w-3.5 h-3.5" />
              Incident Map & Logs
            </button>

            {/* Resolve Button */}
            <button
              onClick={() => resolveAlert(currentAlert.id, 'resolved', 'Resolved by operator.')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
