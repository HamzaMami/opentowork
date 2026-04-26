import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { collectDefaultMetrics, register } from 'prom-client';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import clientProfileRoutes from './routes/profiles/client.js';
import freelancerProfileRoutes from './routes/profiles/freelancer.js';
import adminProfileRoutes from './routes/profiles/admin.js';
import walletRoutes from './routes/wallet.js';
import chatRoutes from './routes/chat.js';
import contactRoutes from './routes/contact.js';
import jobsRoutes from './routes/jobs.js';

dotenv.config();

collectDefaultMetrics({ register });

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mongoStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile/client', clientProfileRoutes);
app.use('/api/profile/freelancer', freelancerProfileRoutes);
app.use('/api/profile/admin', adminProfileRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/jobs', jobsRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: mongoStates[mongoose.connection.readyState] || 'unknown'
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;