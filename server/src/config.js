import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.PORT || 5050),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutorsetu',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  uploadDir: path.resolve(root, process.env.UPLOAD_DIR || 'uploads'),
  clientDist: path.resolve(root, '../client/dist/client'),
  ssrEntry: path.resolve(root, '../client/dist/server/entry-server.js'),
  siteData: path.resolve(root, '../client/src/lib/site.js'),
  // Public address of the site for canonical links, sitemap and social previews (no trailing slash).
  // If empty, the address the request came in on is used.
  siteUrl: (process.env.SITE_URL || '').replace(/\/+$/, ''),
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION || '',
  admin: {
    name: process.env.ADMIN_NAME || 'Site Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@tutorsetu.in').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    phone: process.env.ADMIN_PHONE || '9000000000',
  },
  defaults: {
    registrationFee: Number(process.env.REGISTRATION_FEE || 300),
    upiId: process.env.UPI_ID || 'yourname@upi',
    upiName: process.env.UPI_NAME || 'TutorSetu',
  },
};

if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'change-this-secret-in-production') {
  console.error('JWT_SECRET must be set in production.');
  process.exit(1);
}
