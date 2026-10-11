import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { createApp } from './app.js';
import { User, Tutor } from './models/index.js';
import { getSettings } from './utils/helpers.js';

async function ensureAdmin() {
  if (await User.exists({ role: 'admin' })) return;
  await User.create({
    name: config.admin.name,
    email: config.admin.email,
    phone: config.admin.phone,
    role: 'admin',
    passwordHash: await bcrypt.hash(config.admin.password, 10),
  });
  console.log(`Admin account created: ${config.admin.email} (change the password after first login)`);
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
  await Tutor.syncIndexes(); // drops indexes no longer in the schema
  await ensureAdmin();
  await getSettings();
  const server = (await createApp()).listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE')
      console.error(`Port ${config.port} is already in use. Set a different PORT in server/.env (and the proxy in client/vite.config.js).`);
    else console.error(e);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error('Failed to start:', e.message);
  process.exit(1);
});
