import { Settings, Review, Tutor } from '../models/index.js';
import { config } from '../config.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Wrap async route handlers so thrown errors reach the error middleware. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Parse a zod schema or throw a 400 with the first readable message. */
export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new HttpError(400, `${i.path.join('.') || 'input'}: ${i.message}`);
  }
  return r.data;
}

export async function getSettings() {
  let s = await Settings.findOne({ key: 'global' });
  if (!s) s = await Settings.create({ key: 'global', ...config.defaults });
  return s;
}

/** A tutor is listed only when the fee is approved and Aadhaar is verified. */
export function recomputeStatus(t) {
  if (t.status === 'suspended') return t.status;
  if (t.feePaid && t.aadhaarStatus === 'verified') t.status = 'active';
  else if (t.feePaid || t.feeSubmitted || t.aadhaarStatus === 'pending') t.status = 'under_review';
  else t.status = 'payment_pending';
  return t.status;
}

export async function refreshRating(tutorId) {
  const rows = await Review.find({ tutor: tutorId }).select('rating').lean();
  const n = rows.length;
  const avg = n ? rows.reduce((a, r) => a + r.rating, 0) / n : 0;
  await Tutor.updateOne({ _id: tutorId }, { ratingAvg: Math.round(avg * 10) / 10, ratingCount: n });
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Public view of a tutor: never includes Aadhaar data or phone. */
export function publicTutor(t, { withContact = false } = {}) {
  const u = t.user || {};
  return {
    id: t._id,
    name: u.name,
    phone: withContact ? u.phone : undefined,
    gender: t.gender,
    qualification: t.qualification,
    experienceYears: t.experienceYears,
    about: t.about,
    subjects: t.subjects,
    levels: t.levels,
    boards: t.boards,
    city: t.city,
    area: t.area,
    pincode: t.pincode,
    mode: t.mode,
    feeMin: t.feeMin,
    photo: t.photo ? `/uploads/public/${t.photo}` : '',
    aadhaarVerified: t.aadhaarStatus === 'verified',
    ratingAvg: t.ratingAvg,
    ratingCount: t.ratingCount,
    isSample: t.isSample,
    memberSince: t.createdAt,
  };
}
