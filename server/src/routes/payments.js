import { Router } from 'express';
import fs from 'node:fs';
import { z } from 'zod';
import { Payment } from '../models/index.js';
import { requireAuth, loadTutor } from '../middleware/auth.js';
import { uploadPrivateDoc } from '../middleware/upload.js';
import { ah, parse, HttpError, getSettings, recomputeStatus } from '../utils/helpers.js';

const r = Router();

r.get(
  '/settings',
  ah(async (_req, res) => {
    const s = await getSettings();
    res.json({
      registrationFee: s.registrationFee,
      upiId: s.upiId,
      upiName: s.upiName,
      supportPhone: s.supportPhone,
      supportEmail: s.supportEmail,
    });
  })
);

/** Tutor submits a UPI payment screenshot + UTR for the registration fee. */
r.post(
  '/',
  requireAuth('tutor'),
  loadTutor,
  uploadPrivateDoc.single('screenshot'),
  ah(async (req, res) => {
    const t = req.tutor;
    const drop = () => req.file && fs.rm(req.file.path, { force: true }, () => {});
    try {
      if (!req.file) throw new HttpError(400, 'Upload the payment screenshot.');
      if (t.feePaid) throw new HttpError(400, 'Your registration fee is already approved.');
      if (await Payment.exists({ tutor: t._id, status: 'pending' }))
        throw new HttpError(400, 'You already have a payment under review. We will update you shortly.');
      const body = parse(
        z.object({
          upiRef: z.string().trim().regex(/^[A-Za-z0-9]{8,30}$/, 'enter the UTR / transaction ID shown in your UPI app'),
          payerUpi: z.string().trim().max(80).default(''),
        }),
        req.body
      );
      if (await Payment.exists({ upiRef: body.upiRef, status: { $ne: 'rejected' } }))
        throw new HttpError(409, 'This transaction ID has already been submitted.');
      const s = await getSettings();
      const p = await Payment.create({
        tutor: t._id,
        user: req.user._id,
        amount: s.registrationFee,
        upiRef: body.upiRef,
        payerUpi: body.payerUpi,
        screenshot: req.file.filename,
      });
      t.feeSubmitted = true;
      recomputeStatus(t);
      await t.save();
      res.status(201).json({ payment: { id: p._id, status: p.status, amount: p.amount }, status: t.status });
    } catch (e) {
      drop();
      throw e;
    }
  })
);

export default r;
