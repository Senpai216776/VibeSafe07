import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/database.json');

// Ensure data folder exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed template
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('vibesafe123', salt);
  const responderPassword = bcrypt.hashSync('responder123', salt);

  return {
    users: [
      {
        id: 'usr_admin_1',
        email: 'admin@vibesafe.io',
        password: adminPassword,
        name: 'Chief Commander Sarah Vance',
        role: 'admin',
        phone: '+1 (555) 911-0199',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'usr_resp_2',
        email: 'responder@vibesafe.io',
        password: responderPassword,
        name: 'Alex Rivera (Emergency Response)',
        role: 'responder',
        phone: '+1 (555) 911-0244',
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
      }
    ],
    devices: [
      {
        id: 'VS-ESP32-C3-01',
        name: 'Elena - Personal Pendant',
        ownerName: 'Elena Rostova',
        ownerPhone: '+1 (555) 234-8890',
        emergencyContactName: 'Marcus Rostova (Spouse)',
        emergencyContactPhone: '+1 (555) 234-8891',
        apiKey: 'vs_dev_9f83a84b02e77b194d4a89c0',
        batteryLevel: 28,
        voltage: 3.58,
        wifiSignal: -64,
        status: 'sos', // active emergency
        lastSeen: new Date(Date.now() - 45 * 1000).toISOString(),
        lastLat: 37.7749,
        lastLng: -122.4194,
        lastAccuracy: 4.5,
        address: '742 Market St, San Francisco, CA',
        notes: 'ESP32-C3 SuperMini with Lithium-Ion 500mAh & Neo-6M GPS. Carried on lanyard.',
        createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'VS-ESP32-C3-02',
        name: 'David - Trekking Clip',
        ownerName: 'David Chen',
        ownerPhone: '+1 (555) 432-1122',
        emergencyContactName: 'Linda Chen (Sister)',
        emergencyContactPhone: '+1 (555) 432-9988',
        apiKey: 'vs_dev_1c4e72390fca9e3381ab92f1',
        batteryLevel: 89,
        voltage: 4.12,
        wifiSignal: -58,
        status: 'online',
        lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        lastLat: 37.7833,
        lastLng: -122.4167,
        lastAccuracy: 3.2,
        address: 'Union Square, San Francisco, CA',
        notes: 'ESP32-C3 clip device with haptic vibration feedback and dual SOS buttons.',
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'VS-ESP32-C3-03',
        name: 'Grandpa Arthur - Home Safety',
        ownerName: 'Arthur Pendelton (Age 82)',
        ownerPhone: '+1 (555) 876-5544',
        emergencyContactName: 'Clara Pendelton (Daughter)',
        emergencyContactPhone: '+1 (555) 876-1123',
        apiKey: 'vs_dev_88bb99cc1122334455667788',
        batteryLevel: 72,
        voltage: 3.98,
        wifiSignal: -72,
        status: 'online',
        lastSeen: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        lastLat: 37.7651,
        lastLng: -122.4416,
        lastAccuracy: 5.0,
        address: 'Twin Peaks Neighborhood, San Francisco, CA',
        notes: 'Fall detection enabled via MPU6050 + SOS tactile button.',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'VS-ESP32-C3-04',
        name: 'Sophia - Campus Keyring',
        ownerName: 'Sophia Miller',
        ownerPhone: '+1 (555) 345-6789',
        emergencyContactName: 'Officer Bradley (Campus Security)',
        emergencyContactPhone: '+1 (555) 345-0000',
        apiKey: 'vs_dev_44332211aabbccddeeff0011',
        batteryLevel: 14,
        voltage: 3.42,
        wifiSignal: -88,
        status: 'offline',
        lastSeen: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        lastLat: 37.7599,
        lastLng: -122.4148,
        lastAccuracy: 8.0,
        address: 'Mission District, San Francisco, CA',
        notes: 'Low battery alert triggered 4 hours ago. Device powered down.',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ],
    alerts: [
      {
        id: 'ALT-9082',
        deviceId: 'VS-ESP32-C3-01',
        deviceName: 'Elena - Personal Pendant',
        ownerName: 'Elena Rostova',
        ownerPhone: '+1 (555) 234-8890',
        emergencyContactName: 'Marcus Rostova (Spouse)',
        emergencyContactPhone: '+1 (555) 234-8891',
        status: 'active', // active, acknowledged, responded, resolved, false_alarm
        severity: 'critical',
        triggeredAt: new Date(Date.now() - 95 * 1000).toISOString(), // ~1.5 min ago
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        resolvedBy: null,
        lat: 37.7749,
        lng: -122.4194,
        accuracy: 4.5,
        address: '742 Market St, San Francisco, CA',
        batteryLevel: 28,
        voltage: 3.58,
        triggerType: 'hardware_button_sos',
        notes: 'Emergency button held for 2 seconds. Device transmitted SOS with GPS lock.',
        timeline: [
          {
            timestamp: new Date(Date.now() - 95 * 1000).toISOString(),
            action: 'SOS Triggered by ESP32-C3 SuperMini',
            actor: 'Device VS-ESP32-C3-01',
            details: 'SOS signal received via Wi-Fi REST API. GPS: 37.7749, -122.4194'
          }
        ]
      },
      {
        id: 'ALT-8841',
        deviceId: 'VS-ESP32-C3-02',
        deviceName: 'David - Trekking Clip',
        ownerName: 'David Chen',
        ownerPhone: '+1 (555) 432-1122',
        emergencyContactName: 'Linda Chen (Sister)',
        emergencyContactPhone: '+1 (555) 432-9988',
        status: 'resolved',
        severity: 'high',
        triggeredAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
        acknowledgedAt: new Date(Date.now() - 28 * 3600 * 1000 + 40000).toISOString(),
        acknowledgedBy: 'Chief Commander Sarah Vance',
        resolvedAt: new Date(Date.now() - 27 * 3600 * 1000).toISOString(),
        resolvedBy: 'Alex Rivera (Emergency Response)',
        lat: 37.7885,
        lng: -122.4072,
        accuracy: 3.0,
        address: 'Montgomery St, Financial District, SF',
        batteryLevel: 94,
        voltage: 4.15,
        triggerType: 'hardware_button_sos',
        notes: 'Accidental trigger during bag retrieval. Owner confirmed safe after dispatch call.',
        timeline: [
          {
            timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
            action: 'SOS Triggered',
            actor: 'Device VS-ESP32-C3-02',
            details: 'SOS button pressed.'
          },
          {
            timestamp: new Date(Date.now() - 28 * 3600 * 1000 + 40000).toISOString(),
            action: 'Alert Acknowledged',
            actor: 'Sarah Vance',
            details: 'Dispatcher contacted emergency contacts.'
          },
          {
            timestamp: new Date(Date.now() - 27 * 3600 * 1000).toISOString(),
            action: 'Resolved - False Alarm',
            actor: 'Alex Rivera',
            details: 'Verified owner safety via direct phone call. Incident closed.'
          }
        ]
      }
    ],
    telemetry: []
  };
};

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('Could not read DB file, using initial data:', err.message);
      this.data = getInitialData();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving DB file:', err.message);
    }
  }

  // Users
  getUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // Devices
  getAllDevices() {
    // Update online/offline status dynamically based on lastSeen (offline if > 5 minutes)
    const now = Date.now();
    return this.data.devices.map(d => {
      const lastSeenMs = new Date(d.lastSeen).getTime();
      const isRecent = (now - lastSeenMs) < 5 * 60 * 1000;
      let status = d.status;
      if (status !== 'sos') {
        status = isRecent ? 'online' : 'offline';
      }
      return { ...d, status };
    });
  }

  getDeviceById(id) {
    return this.data.devices.find(d => d.id === id);
  }

  getDeviceByApiKey(key) {
    return this.data.devices.find(d => d.apiKey === key);
  }

  createDevice(device) {
    this.data.devices.push(device);
    this.save();
    return device;
  }

  updateDevice(id, updates) {
    const idx = this.data.devices.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.data.devices[idx] = { ...this.data.devices[idx], ...updates };
    this.save();
    return this.data.devices[idx];
  }

  deleteDevice(id) {
    const idx = this.data.devices.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.data.devices.splice(idx, 1);
    this.save();
    return true;
  }

  // Alerts
  getAllAlerts(filter = {}) {
    let alerts = [...this.data.alerts];
    if (filter.status) {
      if (filter.status === 'active') {
        alerts = alerts.filter(a => a.status === 'active' || a.status === 'acknowledged');
      } else {
        alerts = alerts.filter(a => a.status === filter.status);
      }
    }
    if (filter.deviceId) {
      alerts = alerts.filter(a => a.deviceId === filter.deviceId);
    }
    // Sort descending by triggeredAt
    return alerts.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  getAlertById(id) {
    return this.data.alerts.find(a => a.id === id);
  }

  getActiveAlertForDevice(deviceId) {
    return this.data.alerts.find(a => a.deviceId === deviceId && (a.status === 'active' || a.status === 'acknowledged'));
  }

  createAlert(alert) {
    this.data.alerts.unshift(alert);
    this.save();
    return alert;
  }

  updateAlert(id, updates) {
    const idx = this.data.alerts.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.data.alerts[idx] = { ...this.data.alerts[idx], ...updates };
    this.save();
    return this.data.alerts[idx];
  }

  // Telemetry
  logTelemetry(entry) {
    this.data.telemetry.push({
      ...entry,
      id: 'tel_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    });
    // Keep max 500 telemetry logs
    if (this.data.telemetry.length > 500) {
      this.data.telemetry = this.data.telemetry.slice(-500);
    }
    this.save();
  }

  getTelemetryForDevice(deviceId, limit = 50) {
    return this.data.telemetry
      .filter(t => t.deviceId === deviceId)
      .slice(-limit);
  }

  // Reset database for testing
  reset() {
    this.data = getInitialData();
    this.save();
  }
}

export const db = new Database();
