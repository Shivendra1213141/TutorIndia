import { Router } from 'express';
import fs from 'node:fs';
import { z } from 'zod';
import { User, Tutor, Payment, Requirement, Application, Demo, Review } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { privatePath } from '../middleware/upload.js';
import { ah, parse, HttpError, getSettings, recomputeStatus, escapeRegex, publicTutor, refreshRating } from '../utils/helpers.js';

const r = Router();
r.use(requireAuth('admin'));

const oid = (id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new HttpError(404, 'Not found.');
  return id;
};

r.get(
  '/stats',
  ah(async (_req, res) => {
    const [tutorsActive, tutorsReview, paymentsPending, aadhaarPending, parents, reqOpen, demos, revenue] = await Promise.all([
      Tutor.countDocuments({ status: 'active' }),
      Tutor.countDocuments({ status: 'under_review' }),
      Payment.countDocuments({ status: 'pending' }),
      Tutor.countDocuments({ aadhaarStatus: 'pending' }),
      User.countDocuments({ role: 'parent' }),
      Requirement.countDocuments({ status: 'open' }),
      Demo.countDocuments(),
      Payment.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    ]);
    res.json({ tutorsActive, tutorsReview, paymentsPending, aadhaarPending, parents, reqOpen, demos, revenue: revenue[0]?.sum || 0 });
  })
);

/* ---------- Payments ---------- */
r.get(
  '/payments',
  ah(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await Payment.find(filter)
      .populate('user', 'name email phone')
      .populate('tutor', 'city aadhaarStatus status')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ items });
  })
);

r.patch(
  '/payments/:id',
  ah(async (req, res) => {
    const { action, note } = parse(z.object({ action: z.enum(['approve', 'reject']), note: z.string().max(300).default('') }), req.body);
    const p = await Payment.findById(oid(req.params.id));
    if (!p) throw new HttpError(404, 'Payment not found.');
    if (p.status !== 'pending') throw new HttpError(400, `This payment is already ${p.status}.`);
    if (action === 'reject' && !note) throw new HttpError(400, 'Add a reason so the tutor knows what to fix.');
    p.status = action === 'approve' ? 'approved' : 'rejected';
    p.note = note;
    p.reviewedBy = req.user._id;
    p.reviewedAt = new Date();
    await p.save();
    const t = await Tutor.findById(p.tutor);
    if (t) {
      t.feeSubmitted = false;
      if (action === 'approve') {
        t.feePaid = true;
        t.feePaidAt = new Date();
      }
      recomputeStatus(t);
      await t.save();
    }
    res.json({ payment: p, tutorStatus: t?.status });
  })
);

/* ---------- Tutors ---------- */
r.get(
  '/tutors',
  ah(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.aadhaar) filter.aadhaarStatus = req.query.aadhaar;
    let userIds;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
      userIds = (await User.find({ role: 'tutor', $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select('_id')).map((u) => u._id);
      filter.$or = [{ user: { $in: userIds } }, { city: rx }, { pincode: rx }];
    }
    const items = await Tutor.find(filter).populate('user', 'name email phone isBlocked').sort({ updatedAt: -1 }).limit(200);
    res.json({
      items: items.map((t) => ({
        ...publicTutor(t, { withContact: true }),
        email: t.user?.email,
        userId: t.user?._id,
        status: t.status,
        feePaid: t.feePaid,
        feeSubmitted: t.feeSubmitted,
        aadhaarStatus: t.aadhaarStatus,
        aadhaarLast4: t.aadhaarLast4,
        aadhaarNote: t.aadhaarNote,
        hasAadhaarFile: Boolean(t.aadhaarFile),
        createdAt: t.createdAt,
      })),
    });
  })
);

r.patch(
  '/tutors/:id/aadhaar',
  ah(async (req, res) => {
    const { action, note } = parse(z.object({ action: z.enum(['verify', 'reject']), note: z.string().max(300).default('') }), req.body);
    const t = await Tutor.findById(oid(req.params.id));
    if (!t) throw new HttpError(404, 'Tutor not found.');
    if (!t.aadhaarFile) throw new HttpError(400, 'This tutor has not uploaded Aadhaar yet.');
    if (action === 'reject' && !note) throw new HttpError(400, 'Add a reason so the tutor knows what to fix.');
    t.aadhaarStatus = action === 'verify' ? 'verified' : 'rejected';
    t.aadhaarNote = note;
    recomputeStatus(t);
    await t.save();
    res.json({ aadhaarStatus: t.aadhaarStatus, status: t.status });
  })
);

r.patch(
  '/tutors/:id/status',
  ah(async (req, res) => {
    const { action } = parse(z.object({ action: z.enum(['suspend', 'reinstate']) }), req.body);
    const t = await Tutor.findById(oid(req.params.id));
    if (!t) throw new HttpError(404, 'Tutor not found.');
    if (action === 'suspend') t.status = 'suspended';
    else {
      t.status = 'payment_pending';
      recomputeStatus(t);
    }
    await t.save();
    res.json({ status: t.status });
  })
);

/** Streams a private file (Aadhaar or payment screenshot) to the admin only. */
r.get(
  '/files/:kind/:id',
  ah(async (req, res) => {
    let name;
    if (req.params.kind === 'aadhaar') name = (await Tutor.findById(oid(req.params.id)))?.aadhaarFile;
    else if (req.params.kind === 'payment') name = (await Payment.findById(oid(req.params.id)))?.screenshot;
    if (!name) throw new HttpError(404, 'File not found.');
    const p = privatePath(name);
    if (!fs.existsSync(p)) throw new HttpError(404, 'File is missing from storage.');
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(p);
  })
);

/* ---------- Requirements & users ---------- */
r.get(
  '/requirements',
  ah(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const items = await Requirement.find(filter).populate('parent', 'name phone email').sort({ createdAt: -1 }).limit(200);
    const counts = await Application.aggregate([
      { $match: { requirement: { $in: items.map((i) => i._id) } } },
      { $group: { _id: '$requirement', n: { $sum: 1 } } },
    ]);
    const m = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json({ items: items.map((x) => ({ ...x.toObject(), applicants: m[String(x._id)] || 0 })) });
  })
);

r.delete(
  '/requirements/:id',
  ah(async (req, res) => {
    const x = await Requirement.findByIdAndDelete(oid(req.params.id));
    if (!x) throw new HttpError(404, 'Requirement not found.');
    await Application.deleteMany({ requirement: x._id });
    res.json({ ok: true });
  })
);

r.get(
  '/users',
  ah(async (req, res) => {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const items = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ items: items.map((u) => ({ ...u.toSafe(), isBlocked: u.isBlocked, createdAt: u.createdAt })) });
  })
);

r.patch(
  '/users/:id',
  ah(async (req, res) => {
    const { isBlocked } = parse(z.object({ isBlocked: z.boolean() }), req.body);
    const u = await User.findById(oid(req.params.id));
    if (!u) throw new HttpError(404, 'User not found.');
    if (u.role === 'admin') throw new HttpError(400, 'Admin accounts cannot be blocked here.');
    u.isBlocked = isBlocked;
    await u.save();
    res.json({ ok: true });
  })
);

r.delete(
  '/reviews/:id',
  ah(async (req, res) => {
    const x = await Review.findByIdAndDelete(oid(req.params.id));
    if (!x) throw new HttpError(404, 'Review not found.');
    await refreshRating(x.tutor);
    res.json({ ok: true });
  })
);

/* ---------- Settings (fee, UPI) ---------- */
r.get('/settings', ah(async (_req, res) => res.json({ settings: await getSettings() })));

r.put(
  '/settings',
  ah(async (req, res) => {
    const data = parse(
      z.object({
        registrationFee: z.coerce.number().int().min(0).max(100000),
        upiId: z.string().trim().regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, 'enter a valid UPI ID like name@okicici'),
        upiName: z.string().trim().max(60).default(''),
        supportPhone: z.string().trim().max(20).default(''),
        supportEmail: z.union([z.string().trim().email(), z.literal('')]).default(''),
      }),
      req.body
    );
    const s = await getSettings();
    Object.assign(s, data);
    await s.save();
    res.json({ settings: s });
  })
);

export default r;
