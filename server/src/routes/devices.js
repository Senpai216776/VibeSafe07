import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { broadcastEvent } from '../websocket.js';

const router = express.Router();

// Protect all device management routes with JWT
router.use(authenticateUser);

// GET /api/devices
router.get('/', (req, res) => {
  const devices = db.getAllDevices();
  return res.json({ devices });
});

// GET /api/devices/:id
router.get('/:id', (req, res) => {
  const device = db.getDeviceById(req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  const telemetry = db.getTelemetryForDevice(req.params.id, 50);
  const activeAlert = db.getActiveAlertForDevice(req.params.id);

  return res.json({
    device,
    telemetry,
    activeAlert
  });
});

// POST /api/devices (Register new ESP32 device)
router.post('/', (req, res) => {
  const {
    id,
    name,
    ownerName,
    ownerPhone,
    emergencyContactName,
    emergencyContactPhone,
    notes = ''
  } = req.body;

  if (!id || !name || !ownerName) {
    return res.status(400).json({ error: 'Device ID, device name, and owner name are required.' });
  }

  const existing = db.getDeviceById(id);
  if (existing) {
    return res.status(409).json({ error: `A device with ID "${id}" is already registered.` });
  }

  // Generate cryptographically secure device API key
  const apiKey = 'vs_dev_' + crypto.randomBytes(16).toString('hex');

  const newDevice = {
    id: id.trim().toUpperCase(),
    name: name.trim(),
    ownerName: ownerName.trim(),
    ownerPhone: ownerPhone ? ownerPhone.trim() : '',
    emergencyContactName: emergencyContactName ? emergencyContactName.trim() : '',
    emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : '',
    apiKey,
    batteryLevel: 100,
    voltage: 4.20,
    wifiSignal: -50,
    status: 'online',
    lastSeen: new Date().toISOString(),
    lastLat: 37.7749,
    lastLng: -122.4194,
    lastAccuracy: 5.0,
    address: 'Awaiting first GPS lock',
    notes,
    createdAt: new Date().toISOString()
  };

  db.createDevice(newDevice);

  broadcastEvent('device_registered', { device: newDevice });

  return res.status(201).json({
    message: 'ESP32 Device registered successfully',
    device: newDevice,
    setupPayload: {
      deviceId: newDevice.id,
      apiKey: newDevice.apiKey,
      sosEndpoint: '/api/v1/devices/sos',
      heartbeatEndpoint: '/api/v1/devices/heartbeat'
    }
  });
});

// PUT /api/devices/:id
router.put('/:id', (req, res) => {
  const updates = req.body;
  // Don't allow changing apiKey or id via regular update
  delete updates.apiKey;
  delete updates.id;

  const updated = db.updateDevice(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Device not found' });
  }

  broadcastEvent('device_updated', { device: updated });

  return res.json({ message: 'Device updated successfully', device: updated });
});

// POST /api/devices/:id/regenerate-key
router.post('/:id/regenerate-key', (req, res) => {
  const newApiKey = 'vs_dev_' + crypto.randomBytes(16).toString('hex');
  const updated = db.updateDevice(req.params.id, { apiKey: newApiKey });
  if (!updated) {
    return res.status(404).json({ error: 'Device not found' });
  }

  return res.json({
    message: 'Device API Key regenerated. Update your ESP32-C3 firmware with the new key.',
    apiKey: newApiKey
  });
});

// DELETE /api/devices/:id
router.delete('/:id', (req, res) => {
  const deleted = db.deleteDevice(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Device not found' });
  }

  broadcastEvent('device_deleted', { deviceId: req.params.id });

  return res.json({ message: 'Device removed successfully' });
});

export default router;
