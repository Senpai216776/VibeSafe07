import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export const DeviceStatusBadge = ({ status = 'online', wifiSignal = null, showSignal = false }) => {
  if (status === 'sos') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <AlertTriangle className="w-3.5 h-3.5" />
        EMERGENCY SOS
      </span>
    );
  }

  if (status === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        Online
        {showSignal && wifiSignal && (
          <span className="text-gray-400 text-[10px] flex items-center gap-0.5 ml-1">
            <Wifi className="w-3 h-3" /> {wifiSignal} dBm
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
      <span className="w-2 h-2 rounded-full bg-gray-500" />
      Offline
      {showSignal && (
        <span className="text-gray-500 text-[10px] flex items-center gap-0.5 ml-1">
          <WifiOff className="w-3 h-3" />
        </span>
      )}
    </span>
  );
};
