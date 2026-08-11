/**
 * PARKING KIOSK Multi-Tenant Express Server Application Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.routes.js';
import { checkDatabaseHealth } from './config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging & Debug Trace
app.use((req, res, next) => {
  const reqId = Math.random().toString(36).substring(7);
  req.reqId = reqId;
  res.setHeader('X-Request-Id', reqId);
  console.log(`[${new Date().toISOString()}] [Req:${reqId}] ${req.method} ${req.url} TenantHeader:${req.headers['x-tenant-id'] || 'None'}`);
  next();
});

// API Routes
app.use('/api', apiRouter);

// Serve static frontend assets from d:\KIOSK
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'PARKING Multi-Tenant Engine',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route serving frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`   PARKING KIOSK Multi-Tenant Server Ready!`);
  console.log(`   Server Running on: http://localhost:${PORT}`);
  console.log(`=======================================================`);
  await checkDatabaseHealth();
});
