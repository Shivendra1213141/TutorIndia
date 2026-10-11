import { Router } from 'express';
import fs from 'node:fs';
import { z } from 'zod';
import { Tutor, Payment, Review } from '../models/index.js';
import { requireAuth, loadTutor } from '../middleware/auth.js';
import { uploadPublicImage, uploadPrivateDoc, publicPath, privatePath } from '../middleware/upload.js';
import { ah, parse, HttpError, publicTutor, recomputeStatus, escapeRegex, getSettings } from '../utils/helpers.js';
import { tutorProfileSchema } from './auth.js';

const r = Router();
const tutorOnly = [...requireAuth('tutor'), loadTutor];

/* ---------- Public search ---------- */
r.get(
  '/',
  ah(async (req, res) => {
    const { level, board, subject, q, mode, sort = 'rating' } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
    const filter = { status: 'active' };
    if (level) filter.levels = level;
    if (board) filter.boards = board;
    if (subject) filter.subjects = subject;
    if (mode && mode !== 'any') filter.mode = { $in: [mode, 'both'] };
    if (q) {
      const s = String(q).trim();
      if (/^\d{3,6}$/.test(s)) filter.$or = [{ pincode: new RegExp('^' + s) }, { servicePincodes: new RegExp('^' + s) }];
      else {
        const rx = new RegExp(escapeRegex(s), 'i');
        filter.$or = [{ city: rx }, { area: rx }];
      }
    }
    const order = sort === 'fee' ? { feeMin: 1 } : sort === 'experience' ? { experienceYears: -1 } : { ratingAvg: -1, ratingCount: -1 };
    const [items, total] = await Promise.all([
      Tutor.find(filter).populate('user', 'name').sort(order).skip((page - 1) * limit).limit(limit),
      Tutor.countDocuments(filter),
    ]);
    res.json({ items: items.map((t) => publicTutor(t)), total, page, pages: Math.ceil(total / limit) });
  })
);

/* ---------- Tutor's own profile ---------- */
r.get(
  '/me/profile',
  tutorOnly,
  ah(async (req, res) => {
    const t = req.tutor;
    const [payments, settings] = await Promise.all([
      Payment.find({ tutor: t._id }).sort({ createdAt: -1 }).select('-screenshot'),
      getSettings(),
    ]);
    res.json({
      profile: {
        ...publicTutor(await t.populate('user', 'name phone'), { withContact: true }),
        servicePincodes: t.servicePincodes,
        aadhaarLast4: t.aadhaarLast4,
        aadhaarStatus: t.aadhaarStatus,
        aadhaarNote: t.aadhaarNote,
        feePaid: t.feePaid,
        status: t.status,
      },
      payments,
      fee: { amount: settings.registrationFee, upiId: settings.upiId, upiName: settings.upiName },
    });
  })
);

r.put(
  '/me/profile',
  tutorOnly,
  ah(async (req, res) => {
    const data = parse(tutorProfileSchema, req.body);
    Object.assign(req.tutor, data);
    await req.tutor.save();
    res.json({ ok: true });
  })
);

r.post(
  '/me/photo',
  tutorOnly,
  uploadPublicImage.single('photo'),
  ah(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose a photo to upload.');
    if (req.tutor.photo) fs.rm(publicPath(req.tutor.photo), { force: true }, () => {});
    req.tutor.photo = req.file.filename;
    await req.tutor.save();
    res.json({ photo: `/uploads/public/${req.file.filename}` });
  })
);

r.post(
  '/me/aadhaar',
  tutorOnly,
  uploadPrivateDoc.single('aadhaar'),
  ah(async (req, res) => {
    const t = req.tutor;
    const cleanup = () => req.file && fs.rm(req.file.path, { force: true }, () => {});
    if (!req.file) throw new HttpError(400, 'Upload a photo or PDF of your Aadhaar card.');
    if (t.aadhaarStatus === 'verified') {
      cleanup();
      throw new HttpError(400, 'Your Aadhaar is already verified.');
    }
    let last4;
    try {
      ({ last4 } = parse(z.object({ last4: z.string().regex(/^\d{4}$/, 'enter the last 4 digits') }), req.body));
    } catch (e) {
      cleanup();
      throw e;
    }
    if (t.aadhaarFile) fs.rm(privatePath(t.aadhaarFile), { force: true }, () => {});
    t.aadhaarFile = req.file.filename;
    t.aadhaarLast4 = last4;
    t.aadhaarStatus = 'pending';
    t.aadhaarNote = '';
    recomputeStatus(t);
    await t.save();
    res.json({ aadhaarStatus: t.aadhaarStatus, status: t.status });
  })
);

/* ---------- Public profile ---------- */
r.get(
  '/:id',
  ah(async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new HttpError(404, 'Tutor not found.');
    const t = await Tutor.findOne({ _id: req.params.id, status: 'active' }).populate('user', 'name');
    if (!t) throw new HttpError(404, 'Tutor not found.');
    const reviews = await Review.find({ tutor: t._id }).populate('parent', 'name').sort({ createdAt: -1 }).limit(20);
    res.json({
      tutor: publicTutor(t),
      reviews: reviews.map((x) => ({
        id: x._id,
        rating: x.rating,
        comment: x.comment,
        by: x.parent?.name?.split(' ')[0] || 'Parent',
        at: x.createdAt,
      })),
    });
  })
);

export default r;
