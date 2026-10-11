import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User, Tutor } from '../models/index.js';
import { HttpError, ah } from '../utils/helpers.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/** Attaches req.user when a valid token is present; never fails. */
export const optionalAuth = ah(async (req, _res, next) => {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) {
    try {
      const p = jwt.verify(h.slice(7), config.jwtSecret);
      const u = await User.findById(p.sub);
      if (u && !u.isBlocked) req.user = u;
    } catch {
      /* ignore invalid token */
    }
  }
  next();
});

export const requireAuth = (...roles) => [
  optionalAuth,
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Please log in to continue.'));
    if (roles.length && !roles.includes(req.user.role))
      return next(new HttpError(403, 'Your account type cannot do this.'));
    next();
  },
];

/** For tutor routes: loads req.tutor (their profile). */
export const loadTutor = ah(async (req, _res, next) => {
  const t = await Tutor.findOne({ user: req.user._id });
  if (!t) throw new HttpError(404, 'Tutor profile not found.');
  req.tutor = t;
  next();
});
