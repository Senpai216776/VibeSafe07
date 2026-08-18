import http from 'http';
import { app } from '../src/index.js';

const PORT = 3999;
let serverInstance;

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

async function runTests() {
  console.log('🚀 Starting VibeSafe Backend Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  await new Promise((resolve) => {
    serverInstance = app.listen(PORT, resolve);
  });

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'operational', 'GET /api/health returns operational status');

    // 2. Auth Login (Admin)
    const loginRes = await request('/api/auth/login', 'POST', {
      email: 'admin@vibesafe.io',
      password: 'vibesafe123',
    });
    assert(loginRes.status === 200 && !!loginRes.data.token, 'POST /api/auth/login returns JWT session token');
    const adminToken = loginRes.data.token;

    // 3. Auth Login (Invalid Password)
    const badLogin = await request('/api/auth/login', 'POST', {
      email: 'admin@vibesafe.io',
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401, 'POST /api/auth/login rejects invalid credentials with 401');

    // 4. Register Device (Requires Admin Token)
    const testDevId = `VS-TEST-${Date.now()}`;
    const newDeviceRes = await request(
      '/api/devices',
      'POST',
      {
        id: testDevId,
        name: 'Unit Test Tracker',
        ownerName: 'Test Pilot Zoe',
        ownerPhone: '+1 (555) 777-8888',
        emergencyContactName: 'Captain James',
        emergencyContactPhone: '+1 (555) 777-9999',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      newDeviceRes.status === 201 && !!newDeviceRes.data.device && newDeviceRes.data.device.apiKey.startsWith('vs_dev_'),
      'POST /api/devices creates device with secure "vs_dev_..." API key'
    );
    const testApiKey = newDeviceRes.data.device.apiKey;

    // 5. ESP32 SOS Ingestion (Valid Device Key)
    const sosRes = await request(
      '/api/v1/devices/sos',
      'POST',
      {
        batteryLevel: 82,
        voltage: 4.05,
        wifiSignal: -59,
        gps: { lat: 37.775, lng: -122.418, accuracy: 2.8 },
        triggerType: 'unit_test_sos',
      },
      { 'x-device-key': testApiKey }
    );
    assert(
      sosRes.status === 201 && sosRes.data.success === true && !!sosRes.data.alertId,
      'POST /api/v1/devices/sos creates emergency alert with valid device key'
    );
    const alertId = sosRes.data.alertId;

    // 6. ESP32 SOS Ingestion (Missing / Invalid Key should fail with 401)
    const badSosRes = await request(
      '/api/v1/devices/sos',
      'POST',
      { batteryLevel: 50 },
      { 'x-device-key': 'invalid_fake_key' }
    );
    assert(badSosRes.status === 401, 'POST /api/v1/devices/sos rejects invalid device key with 401');

    // 7. ESP32 Heartbeat
    const hbRes = await request(
      '/api/v1/devices/heartbeat',
      'POST',
      { batteryLevel: 81, voltage: 4.02, wifiSignal: -60 },
      { 'x-device-key': testApiKey }
    );
    assert(hbRes.status === 200 && hbRes.data.status === 'ok', 'POST /api/v1/devices/heartbeat processes telemetry');

    // 8. Triage: Acknowledge Alert
    const ackRes = await request(
      `/api/alerts/${alertId}/acknowledge`,
      'POST',
      { notes: 'Test dispatcher acknowledged.' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      ackRes.status === 200 && ackRes.data.alert.status === 'acknowledged',
      'POST /api/alerts/:id/acknowledge updates alert status'
    );

    // 9. Triage: Resolve Alert
    const resRes = await request(
      `/api/alerts/${alertId}/resolve`,
      'POST',
      { resolutionType: 'resolved', notes: 'Test incident safely concluded.' },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      resRes.status === 200 && resRes.data.alert.status === 'resolved',
      'POST /api/alerts/:id/resolve closes incident successfully'
    );

    // 10. Device Key Regeneration
    const regenRes = await request(
      `/api/devices/${testDevId}/regenerate-key`,
      'POST',
      {},
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      regenRes.status === 200 && regenRes.data.apiKey.startsWith('vs_dev_') && regenRes.data.apiKey !== testApiKey,
      'POST /api/devices/:id/regenerate-key rotates device API key'
    );

    console.log(`\n==========================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed.`);
    console.log(`==========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close(() => process.exit(0));
    }
  }
}

runTests();
