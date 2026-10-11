import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, Tutor } from '../models/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { ah, parse, HttpError } from '../utils/helpers.js';
import { LEVELS, BOARDS, MODES } from '../constants.js';

const r = Router();

const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'enter a valid 10-digit mobile number');
const base = {
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone,
  password: z.string().min(8, 'must be at least 8 characters').max(100),
};

async function createUser(data, role) {
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new HttpError(409, 'An account with this email already exists. Please log in.');
  return User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    role,
    passwordHash: await bcrypt.hash(data.password, 10),
  });
}

r.post(
  '/register',
  ah(async (req, res) => {
    const data = parse(z.object(base), req.body);
    const user = await createUser(data, 'parent');
    res.status(201).json({ token: signToken(user), user: user.toSafe() });
  })
);

export const tutorProfileSchema = z.object({
  gender: z.enum(['male', 'female', 'other', '']).default(''),
  qualification: z.string().trim().min(2).max(160),
  experienceYears: z.coerce.number().min(0).max(60).default(0),
  about: z.string().max(1500).default(''),
  subjects: z.array(z.string()).min(1, 'pick at least one subject'),
  levels: z.array(z.enum(LEVELS)).min(1, 'pick at least one class group'),
  boards: z.array(z.enum(BOARDS)).min(1, 'pick at least one board'),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().max(80).default(''),
  pincode: z.string().regex(/^\d{6}$/, 'must be 6 digits'),
  servicePincodes: z.array(z.string().regex(/^\d{6}$/)).max(20).default([]),
  mode: z.enum(MODES).default('home'),
  feeMin: z.coerce.number().min(0).max(100000).default(0),
});

r.post(
  '/register-tutor',
  ah(async (req, res) => {
    const acct = parse(z.object(base), req.body);
    const profile = parse(tutorProfileSchema, req.body);
    const user = await createUser(acct, 'tutor');
    try {
      await Tutor.create({ ...profile, user: user._id });
    } catch (e) {
      await User.deleteOne({ _id: user._id });
      throw e;
    }
    res.status(201).json({ token: signToken(user), user: user.toSafe() });
  })
);

r.post(
  '/login',
  ah(async (req, res) => {
    const { email, password } = parse(z.object({ email: z.string().email(), password: z.string().min(1) }), req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new HttpError(401, 'Email or password is incorrect.');
    if (user.isBlocked) throw new HttpError(403, 'This account has been blocked. Contact support.');
    res.json({ token: signToken(user), user: user.toSafe() });
  })
);

r.get(
  '/me',
  requireAuth(),
  ah(async (req, res) => res.json({ user: req.user.toSafe() }))
);

r.post(
  '/change-password',
  requireAuth(),
  ah(async (req, res) => {
    const { current, next } = parse(
      z.object({ current: z.string().min(1), next: base.password }),
      req.body
    );
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect.');
    user.passwordHash = await bcrypt.hash(next, 10);
    await user.save();
    res.json({ ok: true });
  })
);

export default r;
