import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';
import { emergencyAudio } from '../utils/audioAlert';
import { useAuth } from './AuthContext';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState(null);

  const wsRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Active alerts (in 'active' or 'acknowledged' status)
  const activeAlerts = alerts.filter(
    (a) => a.status === 'active' || a.status === 'acknowledged' || a.status === 'responded'
  );

  // Compute Dashboard KPIs
  const stats = {
    activeSosCount: activeAlerts.length,
    totalDevices: devices.length,
    onlineDevices: devices.filter((d) => d.status === 'online' || d.status === 'sos').length,
    offlineDevices: devices.filter((d) => d.status === 'offline').length,
    avgBattery: devices.length
      ? Math.round(devices.reduce((acc, d) => acc + (d.batteryLevel || 0), 0) / devices.length)
      : 100,
    resolvedCount: alerts.filter((a) => a.status === 'resolved' || a.status === 'false_alarm').length,
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [alertsRes, devicesRes] = await Promise.all([
        api.alerts.getAll().catch(() => ({ alerts: [] })),
        api.devices.getAll().catch(() => ({ devices: [] })),
      ]);

      if (alertsRes && alertsRes.alerts) {
        setAlerts(alertsRes.alerts);
      }
      if (devicesRes && devicesRes.devices) {
        setDevices(devicesRes.devices);
      }
    } catch (err) {
      console.warn('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Audio siren control based on active alerts
  useEffect(() => {
    if (activeAlerts.length > 0 && !isSirenMuted) {
      emergencyAudio.playSiren();
    } else {
      emergencyAudio.stop();
    }
  }, [activeAlerts.length, isSirenMuted]);

  // Setup WebSocket & polling fallback
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();

    // Setup WebSocket
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          console.log('[AlertContext] WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWsMessage(data);
          } catch (e) {
            // Ignore
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Try reconnecting in 4s
          setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch (err) {
        setWsConnected(false);
      }
    };

    connectWs();

    // Fallback polling interval every 6s
    pollIntervalRef.current = setInterval(() => {
      fetchData();
    }, 6000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isAuthenticated, fetchData]);

  // Handle incoming real-time WS events
  const handleWsMessage = (msg) => {
    const { type, payload } = msg;

    if (type === 'sos_triggered') {
      const { alert, device } = payload;
      setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
      if (device) {
        setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, ...device, status: 'sos' } : d)));
      }
      // Play emergency chime & show notification
      emergencyAudio.playSingleChime();
      setNotificationToast({
        title: '🚨 EMERGENCY SOS TRIGGERED!',
        message: `Device ${alert.deviceId} (${alert.ownerName}) has triggered an SOS alert!`,
        alertId: alert.id,
        timestamp: new Date().toLocaleTimeString(),
        type: 'sos',
      });
    } else if (type === 'sos_updated' || type === 'sos_acknowledged' || type === 'sos_responded' || type === 'sos_resolved') {
      const { alert, device } = payload;
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));
      if (device) {
        setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, ...device } : d)));
      }
      if (type === 'sos_resolved') {
        setNotificationToast({
          title: '✅ SOS Incident Resolved',
          message: `Alert ${alert.id} for ${alert.ownerName} was marked as resolved.`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'success',
        });
      }
    } else if (type === 'device_heartbeat') {
      const { deviceId, batteryLevel, voltage, wifiSignal, lastSeen, lat, lng, status } = payload;
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? { ...d, batteryLevel, voltage, wifiSignal, lastSeen, lastLat: lat, lastLng: lng, status }
            : d
        )
      );
    } else if (type === 'device_registered') {
      setDevices((prev) => [payload.device, ...prev.filter((d) => d.id !== payload.device.id)]);
    } else if (type === 'device_updated') {
      setDevices((prev) => prev.map((d) => (d.id === payload.device.id ? payload.device : d)));
    } else if (type === 'device_deleted') {
      setDevices((prev) => prev.filter((d) => d.id !== payload.deviceId));
    }
  };

  // Actions
  const acknowledgeAlert = async (alertId, notes = '') => {
    try {
      const res = await api.alerts.acknowledge(alertId, notes);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      return res.alert;
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      throw err;
    }
  };

  const respondAlert = async (alertId, notes = '') => {
    try {
      const res = await api.alerts.respond(alertId, notes);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      return res.alert;
    } catch (err) {
      console.error('Failed to update response:', err);
      throw err;
    }
  };

  const resolveAlert = async (alertId, resolutionType = 'resolved', notes = '') => {
    try {
      const res = await api.alerts.resolve(alertId, resolutionType, notes);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      fetchData(); // Refresh device statuses
      return res.alert;
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      throw err;
    }
  };

  const addAlertNote = async (alertId, note) => {
    try {
      const res = await api.alerts.addNote(alertId, note);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      return res.alert;
    } catch (err) {
      console.error('Failed to add note:', err);
      throw err;
    }
  };

  const toggleMute = () => {
    const nextMute = !isSirenMuted;
    setIsSirenMuted(nextMute);
    emergencyAudio.setMuted(nextMute);
  };

  const toggleSimulator = () => {
    setIsSimulatorOpen((prev) => !prev);
  };

  const registerDevice = async (deviceData) => {
    const res = await api.devices.create(deviceData);
    setDevices((prev) => [res.device, ...prev]);
    return res;
  };

  const updateDevice = async (id, updates) => {
    const res = await api.devices.update(id, updates);
    setDevices((prev) => prev.map((d) => (d.id === id ? res.device : d)));
    return res;
  };

  const deleteDevice = async (id) => {
    await api.devices.delete(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const regenerateDeviceKey = async (id) => {
    const res = await api.devices.regenerateKey(id);
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, apiKey: res.apiKey } : d))
    );
    return res;
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        activeAlerts,
        devices,
        stats,
        loading,
        wsConnected,
        isSirenMuted,
        selectedAlert,
        isSimulatorOpen,
        notificationToast,
        setSelectedAlert,
        setNotificationToast,
        fetchData,
        acknowledgeAlert,
        respondAlert,
        resolveAlert,
        addAlertNote,
        toggleMute,
        toggleSimulator,
        registerDevice,
        updateDevice,
        deleteDevice,
        regenerateDeviceKey,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
