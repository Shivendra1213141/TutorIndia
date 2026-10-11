import { Router } from 'express';
import { z } from 'zod';
import { Requirement, Application, Tutor } from '../models/index.js';
import { requireAuth, optionalAuth, loadTutor } from '../middleware/auth.js';
import { ah, parse, HttpError, publicTutor, escapeRegex } from '../utils/helpers.js';
import { BOARDS, CLASSES, MODES, levelForClass } from '../constants.js';

const r = Router();
const oid = (id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new HttpError(404, 'Not found.');
  return id;
};

const reqSchema = z.object({
  studentClass: z.enum(CLASSES),
  board: z.enum(BOARDS),
  subjects: z.array(z.string().trim().min(1)).min(1, 'pick at least one subject'),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().max(80).default(''),
  pincode: z.string().regex(/^\d{6}$/, 'must be 6 digits'),
  budget: z.coerce.number().min(0).max(200000),
  mode: z.enum(MODES).default('home'),
  daysPerWeek: z.coerce.number().int().min(1).max(7).default(5),
  preferredGender: z.enum(['any', 'male', 'female']).default('any'),
  notes: z.string().max(1000).default(''),
});

/** Feed shown to tutors. Parent identity and phone are never included. */
function feedItem(x, extra = {}) {
  return {
    id: x._id,
    studentClass: x.studentClass,
    level: x.level,
    board: x.board,
    subjects: x.subjects,
    city: x.city,
    area: x.area,
    pincode: x.pincode,
    budget: x.budget,
    mode: x.mode,
    daysPerWeek: x.daysPerWeek,
    preferredGender: x.preferredGender,
    notes: x.notes,
    status: x.status,
    createdAt: x.createdAt,
    ...extra,
  };
}

/* ---------- Parent: post & manage ---------- */
r.post(
  '/',
  requireAuth('parent'),
  ah(async (req, res) => {
    const data = parse(reqSchema, req.body);
    const openCount = await Requirement.countDocuments({ parent: req.user._id, status: 'open' });
    if (openCount >= 10) throw new HttpError(400, 'You can have up to 10 open requirements. Close an old one first.');
    const doc = await Requirement.create({ ...data, level: levelForClass(data.studentClass), parent: req.user._id });
    const matches = await Tutor.countDocuments({
      status: 'active',
      levels: doc.level,
      $or: [{ city: new RegExp('^' + escapeRegex(doc.city) + '$', 'i') }, { pincode: doc.pincode }, { servicePincodes: doc.pincode }],
    });
    res.status(201).json({ requirement: feedItem(doc), matchingTutors: matches });
  })
);

r.get(
  '/mine',
  requireAuth('parent'),
  ah(async (req, res) => {
    const reqs = await Requirement.find({ parent: req.user._id }).sort({ createdAt: -1 });
    const apps = await Application.find({ requirement: { $in: reqs.map((x) => x._id) } })
      .populate({ path: 'tutor', populate: { path: 'user', select: 'name phone' } })
      .sort({ createdAt: -1 });
    res.json({
      items: reqs.map((x) =>
        feedItem(x, {
          applications: apps
            .filter((a) => String(a.requirement) === String(x._id) && a.tutor)
            .map((a) => ({
              id: a._id,
              status: a.status,
              message: a.message,
              at: a.createdAt,
              tutor: publicTutor(a.tutor, { withContact: true }),
            })),
        })
      ),
    });
  })
);

r.patch(
  '/:id',
  requireAuth('parent'),
  ah(async (req, res) => {
    const { status } = parse(z.object({ status: z.enum(['open', 'closed']) }), req.body);
    const x = await Requirement.findOneAndUpdate({ _id: oid(req.params.id), parent: req.user._id }, { status }, { new: true });
    if (!x) throw new HttpError(404, 'Requirement not found.');
    res.json({ requirement: feedItem(x) });
  })
);

/* ---------- Public feed for tutors ---------- */
r.get(
  '/feed',
  optionalAuth,
  ah(async (req, res) => {
    const { q, level, board, subject } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const filter = { status: 'open' };
    if (level) filter.level = level;
    if (board) filter.board = board;
    if (subject) filter.subjects = subject;
    if (q) {
      const s = String(q).trim();
      if (/^\d{3,6}$/.test(s)) filter.pincode = new RegExp('^' + s);
      else {
        const rx = new RegExp(escapeRegex(s), 'i');
        filter.$or = [{ city: rx }, { area: rx }];
      }
    }
    const [items, total] = await Promise.all([
      Requirement.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Requirement.countDocuments(filter),
    ]);
    let appliedSet = new Set();
    const counts = await Application.aggregate([
      { $match: { requirement: { $in: items.map((i) => i._id) } } },
      { $group: { _id: '$requirement', n: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    if (req.user?.role === 'tutor') {
      const t = await Tutor.findOne({ user: req.user._id }).select('_id');
      if (t) {
        const mine = await Application.find({ tutor: t._id, requirement: { $in: items.map((i) => i._id) } }).select('requirement');
        appliedSet = new Set(mine.map((m) => String(m.requirement)));
      }
    }
    res.json({
      items: items.map((x) => feedItem(x, { applied: appliedSet.has(String(x._id)), applicants: countMap[String(x._id)] || 0 })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  })
);

/* ---------- Tutor applies ---------- */
r.post(
  '/:id/apply',
  requireAuth('tutor'),
  loadTutor,
  ah(async (req, res) => {
    if (req.tutor.status !== 'active')
      throw new HttpError(403, 'Your profile must be approved before you can apply. Finish payment and Aadhaar verification first.');
    const { message } = parse(z.object({ message: z.string().max(600).default('') }), req.body);
    const x = await Requirement.findOne({ _id: oid(req.params.id), status: 'open' });
    if (!x) throw new HttpError(404, 'This tuition is no longer open.');
    try {
      const a = await Application.create({ requirement: x._id, tutor: req.tutor._id, message });
      res.status(201).json({ application: { id: a._id, status: a.status } });
    } catch (e) {
      if (e.code === 11000) throw new HttpError(409, 'You have already applied to this tuition.');
      throw e;
    }
  })
);

/* ---------- Applications ---------- */
export const applications = Router();

applications.get(
  '/mine',
  requireAuth('tutor'),
  loadTutor,
  ah(async (req, res) => {
    const apps = await Application.find({ tutor: req.tutor._id })
      .populate({ path: 'requirement', populate: { path: 'parent', select: 'name phone' } })
      .sort({ createdAt: -1 });
    res.json({
      items: apps
        .filter((a) => a.requirement)
        .map((a) => ({
          id: a._id,
          status: a.status,
          message: a.message,
          at: a.createdAt,
          requirement: feedItem(a.requirement),
          // parent contact is revealed only after the parent shortlists the tutor
          parent:
            a.status === 'shortlisted'
              ? { name: a.requirement.parent?.name, phone: a.requirement.parent?.phone }
              : null,
        })),
    });
  })
);

applications.patch(
  '/:id',
  requireAuth('parent'),
  ah(async (req, res) => {
    const { status } = parse(z.object({ status: z.enum(['shortlisted', 'rejected', 'applied']) }), req.body);
    const a = await Application.findById(oid(req.params.id)).populate('requirement', 'parent');
    if (!a || String(a.requirement?.parent) !== String(req.user._id)) throw new HttpError(404, 'Application not found.');
    a.status = status;
    await a.save();
    res.json({ application: { id: a._id, status: a.status } });
  })
);

export default r;
