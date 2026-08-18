import { db } from '../db.js';

export const authenticateDevice = (req, res, next) => {
  // Check x-device-key header or Authorization header (Bearer vs_dev_...)
  let apiKey = req.headers['x-device-key'];
  if (!apiKey && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    apiKey = req.headers.authorization.split(' ')[1];
  }

  if (!apiKey) {
    return res.status(401).json({
      error: 'Device Authentication Failed. Missing x-device-key header or Bearer token.'
    });
  }

  const device = db.getDeviceByApiKey(apiKey);
  if (!device) {
    return res.status(401).json({
      error: 'Invalid Device API Key. Device is not authorized on VibeSafe platform.'
    });
  }

  req.device = device;
  next();
};
