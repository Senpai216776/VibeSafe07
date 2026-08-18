import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

export const ToastNotification = () => {
  const { notificationToast, setNotificationToast, setSelectedAlert, alerts } = useAlerts();

  useEffect(() => {
    if (!notificationToast) return;
    const timer = setTimeout(() => {
      setNotificationToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [notificationToast, setNotificationToast]);

  if (!notificationToast) return null;

  const isSos = notificationToast.type === 'sos';

  const handleClick = () => {
    if (notificationToast.alertId) {
      const found = alerts.find((a) => a.id === notificationToast.alertId);
      if (found) setSelectedAlert(found);
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-bounce-short">
      <div
        className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.02] ${
          isSos
            ? 'bg-red-950/90 border-red-500 text-red-100 shadow-red-950/80 animate-pulse-glow'
            : 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
        }`}
        onClick={handleClick}
      >
        <div className="p-2 rounded-lg bg-black/40 shrink-0">
          {isSos ? (
            <AlertCircle className="w-6 h-6 text-red-400 animate-spin-slow" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-white tracking-wide">{notificationToast.title}</h4>
            <span className="text-[11px] opacity-70 font-mono">{notificationToast.timestamp}</span>
          </div>
          <p className="text-xs mt-1 opacity-90 leading-relaxed">{notificationToast.message}</p>
          {isSos && (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-300">
              <span>Click to view incident location & triage &rarr;</span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNotificationToast(null);
          }}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-black/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
