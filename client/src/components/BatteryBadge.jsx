import React from 'react';
import { Battery, BatteryCharging, BatteryWarning } from 'lucide-react';

export const BatteryBadge = ({ level = 100, voltage = 4.2, showVoltage = false, size = 'sm' }) => {
  let color = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
  let barColor = 'bg-emerald-500';

  if (level <= 20) {
    color = 'text-red-400 bg-red-950/40 border-red-800/60 animate-pulse';
    barColor = 'bg-red-500';
  } else if (level <= 50) {
    color = 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    barColor = 'bg-amber-500';
  }

  const isCompact = size === 'sm';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${color}`}>
      {level <= 20 ? (
        <BatteryWarning className="w-3.5 h-3.5" />
      ) : (
        <Battery className="w-3.5 h-3.5" />
      )}
      <span>{level}%</span>
      {showVoltage && voltage && (
        <span className="text-gray-400 text-[11px] font-sans">({voltage}V)</span>
      )}
    </div>
  );
};
