import express from 'express';
import { db } from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { broadcastEvent } from '../websocket.js';

const router = express.Router();

// Protect alert routes with user auth
router.use(authenticateUser);

// GET /api/alerts
router.get('/', (req, res) => {
  const { status, deviceId } = req.query;
  const alerts = db.getAllAlerts({ status, deviceId });
  return res.json({ alerts });
});

// GET /api/alerts/active
router.get('/active', (req, res) => {
  const alerts = db.getAllAlerts({ status: 'active' });
  return res.json({ alerts });
});

// GET /api/alerts/:id
router.get('/:id', (req, res) => {
  const alert = db.getAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  return res.json({ alert });
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', (req, res) => {
  const alert = db.getAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  if (alert.status !== 'active') {
    return res.status(400).json({ error: `Alert is already in ${alert.status} status` });
  }

  const now = new Date().toISOString();
  const userName = req.user ? req.user.name : 'Emergency Responder';

  const updatedTimeline = [
    ...(alert.timeline || []),
    {
      timestamp: now,
      action: 'Alert Acknowledged',
      actor: userName,
      details: req.body.notes || 'Dispatcher acknowledged active SOS alert.'
    }
  ];

  const updated = db.updateAlert(req.params.id, {
    status: 'acknowledged',
    acknowledgedAt: now,
    acknowledgedBy: userName,
    timeline: updatedTimeline
  });

  broadcastEvent('sos_acknowledged', { alert: updated });

  return res.json({ message: 'Alert acknowledged', alert: updated });
});

// POST /api/alerts/:id/respond
router.post('/:id/respond', (req, res) => {
  const alert = db.getAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const now = new Date().toISOString();
  const userName = req.user ? req.user.name : 'Emergency Responder';
  const dispatchNotes = req.body.notes || 'Emergency services / responder dispatched to device location.';

  const updatedTimeline = [
    ...(alert.timeline || []),
    {
      timestamp: now,
      action: 'Emergency Response Dispatched',
      actor: userName,
      details: dispatchNotes
    }
  ];

  const updated = db.updateAlert(req.params.id, {
    status: 'responded',
    timeline: updatedTimeline
  });

  broadcastEvent('sos_responded', { alert: updated });

  return res.json({ message: 'Response status updated', alert: updated });
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', (req, res) => {
  const alert = db.getAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const { resolutionType = 'resolved', notes = 'Emergency incident successfully resolved.' } = req.body;
  const now = new Date().toISOString();
  const userName = req.user ? req.user.name : 'Emergency Responder';

  const updatedTimeline = [
    ...(alert.timeline || []),
    {
      timestamp: now,
      action: resolutionType === 'false_alarm' ? 'Closed - False Alarm' : 'Incident Resolved',
      actor: userName,
      details: notes
    }
  ];

  const updated = db.updateAlert(req.params.id, {
    status: resolutionType === 'false_alarm' ? 'false_alarm' : 'resolved',
    resolvedAt: now,
    resolvedBy: userName,
    notes: alert.notes ? `${alert.notes}\n[Resolution]: ${notes}` : notes,
    timeline: updatedTimeline
  });

  // Also update device status back to online if no other active SOS
  const remainingActive = db.getActiveAlertForDevice(alert.deviceId);
  if (!remainingActive) {
    db.updateDevice(alert.deviceId, { status: 'online' });
    broadcastEvent('device_status_change', { deviceId: alert.deviceId, status: 'online' });
  }

  broadcastEvent('sos_resolved', { alert: updated });

  return res.json({ message: 'Incident marked as resolved', alert: updated });
});

// POST /api/alerts/:id/notes
router.post('/:id/notes', (req, res) => {
  const alert = db.getAlertById(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const { note } = req.body;
  if (!note) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const now = new Date().toISOString();
  const userName = req.user ? req.user.name : 'Responder';

  const updatedTimeline = [
    ...(alert.timeline || []),
    {
      timestamp: now,
      action: 'Incident Note Added',
      actor: userName,
      details: note
    }
  ];

  const updated = db.updateAlert(req.params.id, { timeline: updatedTimeline });

  broadcastEvent('sos_note_added', { alert: updated });

  return res.json({ message: 'Note added', alert: updated });
});

// GET /api/alerts/export/csv
router.get('/export/csv', (req, res) => {
  const alerts = db.getAllAlerts();
  
  const headers = [
    'Alert ID',
    'Device ID',
    'Device Name',
    'Owner Name',
    'Owner Phone',
    'Status',
    'Severity',
    'Triggered At',
    'Resolved At',
    'Resolved By',
    'Latitude',
    'Longitude',
    'Battery Level',
    'Notes'
  ];

  const rows = alerts.map(a => [
    `"${a.id}"`,
    `"${a.deviceId}"`,
    `"${a.deviceName || ''}"`,
    `"${a.ownerName || ''}"`,
    `"${a.ownerPhone || ''}"`,
    `"${a.status}"`,
    `"${a.severity}"`,
    `"${a.triggeredAt || ''}"`,
    `"${a.resolvedAt || ''}"`,
    `"${a.resolvedBy || ''}"`,
    a.lat || '',
    a.lng || '',
    `"${a.batteryLevel}%"`,
    `"${(a.notes || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=vibesafe-alerts-${Date.now()}.csv`);
  return res.send(csv);
});

export default router;
