import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import multer from 'multer';
import mongoose from 'mongoose';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import tutorRoutes from './routes/tutors.js';
import paymentRoutes from './routes/payments.js';
import requirementRoutes, { applications } from './routes/requirements.js';
import demoRoutes from './routes/demos.js';
import adminRoutes from './routes/admin.js';
import { BOARDS, SUBJECTS, CLASSES, LEVEL_LABELS } from './constants.js';
import { seoRoutes, frontendRoutes, INTERNAL_TOKEN } from './seo.js';

export async function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.use(cors({ origin: config.clientOrigin.split(','), credentials: false }));
  app.use(compression());
  app.use(express.json({ limit: '200kb' }));

  const internal = (req) => req.get('x-internal') === INTERNAL_TOKEN; // server-side rendering calls
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }));
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, skip: internal }));

  // Only profile photos are public. Aadhaar and payment files are served via /api/admin/files.
  app.use('/uploads/public', express.static(path.join(config.uploadDir, 'public'), { maxAge: '7d' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
  app.get('/api/meta', (_req, res) => res.json({ boards: BOARDS, subjects: SUBJECTS, classes: CLASSES, levels: LEVEL_LABELS }));
  app.use('/api/auth', authRoutes);
  app.use('/api/tutors', tutorRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/requirements', requirementRoutes);
  app.use('/api/applications', applications);
  app.use('/api/demos', demoRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

  seoRoutes(app);
  // In production, serve the built React app (server-rendered) from the same server.
  await frontendRoutes(app);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    let status = err.status || 500;
    let message = err.message || 'Something went wrong.';
    if (err instanceof multer.MulterError) {
      status = 400;
      message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' : message;
    } else if (err.name === 'ValidationError') {
      status = 400;
      message = Object.values(err.errors)[0]?.message || message;
    } else if (err.code === 11000) {
      status = 409;
      message = 'This record already exists.';
    }
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Server error. Please try again.' : message });
  });

  return app;
}
