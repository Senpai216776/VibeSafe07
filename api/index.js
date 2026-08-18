import express from 'express';
import cors from 'cors';
import authRoutes from '../server/src/routes/auth.js';
import deviceRoutes from '../server/src/routes/devices.js';
import alertRoutes from '../server/src/routes/alerts.js';
import deviceApiRoutes from '../server/src/routes/deviceApi.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-key']
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'VibeSafe Emergency SOS API (Vercel Serverless)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/v1/devices', deviceApiRoutes);

export default app;
