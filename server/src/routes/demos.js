import { Router } from 'express';
import { z } from 'zod';
import { Demo, Tutor, Review } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { ah, parse, HttpError, publicTutor, refreshRating } from '../utils/helpers.js';
import { CLASSES } from '../constants.js';

const r = Router();
const oid = (id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new HttpError(404, 'Not found.');
  return id;
};

/** Parent books a free demo with an active tutor. */
r.post(
  '/',
  requireAuth('parent'),
  ah(async (req, res) => {
    const body = parse(
      z.object({
        tutorId: z.string(),
        studentClass: z.enum(CLASSES),
        subject: z.string().trim().min(1).max(60),
        preferredTime: z.string().trim().max(120).default(''),
        message: z.string().max(600).default(''),
      }),
      req.body
    );
    const t = await Tutor.findOne({ _id: oid(body.tutorId), status: 'active' });
    if (!t) throw new HttpError(404, 'Tutor not found.');
    const dup = await Demo.exists({ parent: req.user._id, tutor: t._id, status: { $in: ['requested', 'accepted'] } });
    if (dup) throw new HttpError(409, 'You already have an active demo request with this tutor.');
    const d = await Demo.create({ ...body, tutor: t._id, parent: req.user._id });
    res.status(201).json({ demo: { id: d._id, status: d.status } });
  })
);

/** Parent or tutor sees their demos. Contacts are shared once the tutor accepts. */
r.get(
  '/mine',
  requireAuth('parent', 'tutor'),
  ah(async (req, res) => {
    let filter;
    if (req.user.role === 'parent') filter = { parent: req.user._id };
    else {
      const t = await Tutor.findOne({ user: req.user._id }).select('_id');
      filter = { tutor: t?._id };
    }
    const demos = await Demo.find(filter)
      .populate('parent', 'name phone')
      .populate({ path: 'tutor', populate: { path: 'user', select: 'name phone' } })
      .sort({ createdAt: -1 });
    res.json({
      items: demos.map((d) => {
        const shared = ['accepted', 'completed'].includes(d.status);
        return {
          id: d._id,
          status: d.status,
          studentClass: d.studentClass,
          subject: d.subject,
          preferredTime: d.preferredTime,
          message: d.message,
          reviewed: d.reviewed,
          at: d.createdAt,
          tutor: d.tutor ? publicTutor(d.tutor, { withContact: shared }) : null,
          // the parent initiated contact, so the tutor always sees the parent's number
          parent: req.user.role === 'tutor' ? { name: d.parent?.name, phone: d.parent?.phone } : undefined,
        };
      }),
    });
  })
);

const transitions = {
  tutor: { requested: ['accepted', 'declined'], accepted: ['completed', 'declined'] },
  parent: { requested: ['cancelled'], accepted: ['cancelled', 'completed'] },
};

r.patch(
  '/:id',
  requireAuth('parent', 'tutor'),
  ah(async (req, res) => {
    const { status } = parse(z.object({ status: z.enum(['accepted', 'declined', 'completed', 'cancelled']) }), req.body);
    const d = await Demo.findById(oid(req.params.id));
    if (!d) throw new HttpError(404, 'Demo not found.');
    if (req.user.role === 'parent' && String(d.parent) !== String(req.user._id)) throw new HttpError(404, 'Demo not found.');
    if (req.user.role === 'tutor') {
      const t = await Tutor.findOne({ user: req.user._id }).select('_id');
      if (!t || String(d.tutor) !== String(t._id)) throw new HttpError(404, 'Demo not found.');
    }
    const allowed = transitions[req.user.role][d.status] || [];
    if (!allowed.includes(status)) throw new HttpError(400, `A ${d.status} demo cannot be marked ${status}.`);
    d.status = status;
    await d.save();
    res.json({ demo: { id: d._id, status: d.status } });
  })
);

/** Parent reviews a tutor after the demo is accepted or completed. One review per demo. */
r.post(
  '/:id/review',
  requireAuth('parent'),
  ah(async (req, res) => {
    const { rating, comment } = parse(
      z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(800).default('') }),
      req.body
    );
    const d = await Demo.findOne({ _id: oid(req.params.id), parent: req.user._id });
    if (!d) throw new HttpError(404, 'Demo not found.');
    if (!['accepted', 'completed'].includes(d.status)) throw new HttpError(400, 'You can review a tutor after the demo class.');
    if (d.reviewed) throw new HttpError(409, 'You have already reviewed this demo.');
    await Review.create({ tutor: d.tutor, parent: req.user._id, demo: d._id, rating, comment });
    d.reviewed = true;
    await d.save();
    await refreshRating(d.tutor);
    res.status(201).json({ ok: true });
  })
);

export default r;
