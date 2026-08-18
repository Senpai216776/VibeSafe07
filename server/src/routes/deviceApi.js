import express from 'express';
import { db } from '../db.js';
import { authenticateDevice } from '../middleware/deviceAuth.js';
import { broadcastEvent } from '../websocket.js';

const router = express.Router();

// Device Auth required for all hardware ingestion endpoints
router.use(authenticateDevice);

// POST /api/v1/devices/sos (ESP32 Emergency SOS Trigger)
router.post('/sos', (req, res) => {
  const device = req.device;
  const {
    batteryLevel = device.batteryLevel,
    voltage = device.voltage,
    wifiSignal = device.wifiSignal,
    gps = {},
    triggerType = 'hardware_button_sos',
    notes = 'Emergency button pressed on ESP32-C3 device.'
  } = req.body;

  const lat = gps.lat !== undefined ? gps.lat : device.lastLat;
  const lng = gps.lng !== undefined ? gps.lng : device.lastLng;
  const accuracy = gps.accuracy !== undefined ? gps.accuracy : device.lastAccuracy;
  const now = new Date().toISOString();

  // Check if there is already an active alert for this device
  let activeAlert = db.getActiveAlertForDevice(device.id);

  if (activeAlert) {
    // Update existing active alert with latest telemetry and coordinates
    const updatedTimeline = [
      ...(activeAlert.timeline || []),
      {
        timestamp: now,
        action: 'SOS Coordinates / Telemetry Updated',
        actor: `Device ${device.id}`,
        details: `Updated GPS: [${lat}, ${lng}], Battery: ${batteryLevel}%, RSSI: ${wifiSignal}dBm`
      }
    ];

    activeAlert = db.updateAlert(activeAlert.id, {
      latestLat: lat,
      latestLng: lng,
      latestBattery: batteryLevel,
      batteryLevel,
      voltage,
      wifiSignal,
      timeline: updatedTimeline
    });

    db.updateDevice(device.id, {
      status: 'sos',
      batteryLevel,
      voltage,
      wifiSignal,
      lastSeen: now,
      lastLat: lat,
      lastLng: lng,
      lastAccuracy: accuracy
    });

    db.logTelemetry({
      deviceId: device.id,
      lat,
      lng,
      batteryLevel,
      voltage,
      wifiSignal,
      type: 'sos_update'
    });

    broadcastEvent('sos_updated', { alert: activeAlert, device });

    return res.json({
      success: true,
      alertId: activeAlert.id,
      status: 'updated',
      timestamp: now,
      message: 'Active SOS alert coordinates and battery updated.'
    });
  }

  // Create new active SOS alert
  const alertId = 'ALT-' + Math.floor(1000 + Math.random() * 9000);
  const newAlert = {
    id: alertId,
    deviceId: device.id,
    deviceName: device.name,
    ownerName: device.ownerName,
    ownerPhone: device.ownerPhone,
    emergencyContactName: device.emergencyContactName,
    emergencyContactPhone: device.emergencyContactPhone,
    status: 'active',
    severity: 'critical',
    triggeredAt: now,
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    lat,
    lng,
    accuracy,
    address: req.body.address || `${lat.toFixed(5)}, ${lng.toFixed(5)} (GPS Lock)`,
    batteryLevel,
    voltage,
    wifiSignal,
    triggerType,
    notes,
    timeline: [
      {
        timestamp: now,
        action: 'SOS Emergency Signal Received',
        actor: `ESP32-C3 Device (${device.id})`,
        details: `Emergency signal transmitted over Wi-Fi REST API. Battery: ${batteryLevel}%, Coordinates: [${lat}, ${lng}]`
      }
    ]
  };

  db.createAlert(newAlert);

  // Update device status
  db.updateDevice(device.id, {
    status: 'sos',
    batteryLevel,
    voltage,
    wifiSignal,
    lastSeen: now,
    lastLat: lat,
    lastLng: lng,
    lastAccuracy: accuracy
  });

  db.logTelemetry({
    deviceId: device.id,
    lat,
    lng,
    batteryLevel,
    voltage,
    wifiSignal,
    type: 'sos_trigger'
  });

  // Broadcast instantly to all connected web clients via WebSocket
  broadcastEvent('sos_triggered', { alert: newAlert, device });

  return res.status(201).json({
    success: true,
    alertId: newAlert.id,
    status: 'emergency_dispatched',
    timestamp: now,
    message: 'EMERGENCY SOS ALERT RECEIVED. Responders notified.',
    deviceOwner: device.ownerName,
    emergencyContact: device.emergencyContactName
  });
});

// POST /api/v1/devices/heartbeat (ESP32 Periodic Status Ping)
router.post('/heartbeat', (req, res) => {
  const device = req.device;
  const {
    batteryLevel = device.batteryLevel,
    voltage = device.voltage,
    wifiSignal = device.wifiSignal,
    gps = {}
  } = req.body;

  const lat = gps.lat !== undefined ? gps.lat : device.lastLat;
  const lng = gps.lng !== undefined ? gps.lng : device.lastLng;
  const accuracy = gps.accuracy !== undefined ? gps.accuracy : device.lastAccuracy;
  const now = new Date().toISOString();

  // If device is not currently in SOS, keep it online
  const currentStatus = device.status === 'sos' ? 'sos' : 'online';

  const updatedDevice = db.updateDevice(device.id, {
    status: currentStatus,
    batteryLevel,
    voltage,
    wifiSignal,
    lastSeen: now,
    lastLat: lat,
    lastLng: lng,
    lastAccuracy: accuracy
  });

  db.logTelemetry({
    deviceId: device.id,
    lat,
    lng,
    batteryLevel,
    voltage,
    wifiSignal,
    type: 'heartbeat'
  });

  broadcastEvent('device_heartbeat', {
    deviceId: device.id,
    batteryLevel,
    voltage,
    wifiSignal,
    lastSeen: now,
    lat,
    lng,
    status: currentStatus
  });

  return res.json({
    success: true,
    status: 'ok',
    serverTime: now,
    deviceStatus: currentStatus,
    command: currentStatus === 'sos' ? 'BEEP_SOS' : 'NORMAL'
  });
});

// POST /api/v1/devices/cancel-sos (User pressed cancel on physical hardware)
router.post('/cancel-sos', (req, res) => {
  const device = req.device;
  const now = new Date().toISOString();

  const activeAlert = db.getActiveAlertForDevice(device.id);
  if (activeAlert) {
    const updatedTimeline = [
      ...(activeAlert.timeline || []),
      {
        timestamp: now,
        action: 'Cancelled from Physical Device',
        actor: `Device ${device.id}`,
        details: 'User held cancel button on ESP32 hardware.'
      }
    ];

    const resolved = db.updateAlert(activeAlert.id, {
      status: 'resolved',
      resolvedAt: now,
      resolvedBy: 'User (Hardware Cancel)',
      notes: `${activeAlert.notes}\n[User Cancel]: Cancelled via device physical button.`,
      timeline: updatedTimeline
    });

    db.updateDevice(device.id, { status: 'online' });

    broadcastEvent('sos_resolved', { alert: resolved });
  }

  return res.json({ success: true, message: 'SOS cancelled' });
});

export default router;
