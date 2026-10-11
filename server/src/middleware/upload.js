import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config.js';
import { HttpError } from '../utils/helpers.js';

const IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
const DOC = [...IMAGE, 'application/pdf'];

function make(folder, types) {
  const dir = path.join(config.uploadDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.bin';
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) =>
      types.includes(file.mimetype)
        ? cb(null, true)
        : cb(new HttpError(400, `Unsupported file type. Allowed: ${types.map((t) => t.split('/')[1]).join(', ')}`)),
  });
}

/** Public: profile photos. Private: Aadhaar and payment screenshots (admin-only download). */
export const uploadPublicImage = make('public', IMAGE);
export const uploadPrivateDoc = make('private', DOC);
export const privatePath = (name) => path.join(config.uploadDir, 'private', path.basename(name));
export const publicPath = (name) => path.join(config.uploadDir, 'public', path.basename(name));
