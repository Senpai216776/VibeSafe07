import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initWebSocket } from './websocket.js';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import alertRoutes from './routes/alerts.js';
import deviceApiRoutes from './routes/deviceApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-key']
}));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'VibeSafe Emergency SOS API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/v1/devices', deviceApiRoutes);

// In production: Serve frontend build if dist folder exists
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('VibeSafe Dashboard API is running. Client build not found in dev mode.');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;

// Only start listening if executed directly (not when required/imported for testing)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚨 VibeSafe Emergency SOS Server Running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint available at ws://localhost:${PORT}/ws`);
    console.log(`🔐 Device API: POST http://localhost:${PORT}/api/v1/devices/sos`);
    console.log(`====================================================`);
  });
}

export { app, server };
