import mongoose from 'mongoose';
import { LEVELS, BOARDS, MODES } from '../constants.js';

const { Schema, model, Types } = mongoose;
const ref = (name, required = true) => ({ type: Types.ObjectId, ref: name, required });

/* ---------- User ---------- */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['parent', 'tutor', 'admin'], required: true },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);
userSchema.methods.toSafe = function () {
  return { id: this._id, name: this.name, email: this.email, phone: this.phone, role: this.role };
};
export const User = model('User', userSchema);

/* ---------- Tutor profile ---------- */
const tutorSchema = new Schema(
  {
    user: { ...ref('User'), unique: true },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    qualification: { type: String, required: true, trim: true }, // stated by tutor, not verified
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    about: { type: String, default: '', maxlength: 1500 },
    subjects: [{ type: String }],
    levels: [{ type: String, enum: LEVELS }],
    boards: [{ type: String, enum: BOARDS }],
    city: { type: String, required: true, trim: true },
    area: { type: String, default: '', trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    servicePincodes: [{ type: String, match: /^\d{6}$/ }],
    mode: { type: String, enum: MODES, default: 'home' },
    feeMin: { type: Number, default: 0, min: 0 },
    photo: { type: String, default: '' }, // public file name

    aadhaarLast4: { type: String, default: '' }, // full Aadhaar number is never stored
    aadhaarFile: { type: String, default: '' }, // private file name
    aadhaarStatus: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    aadhaarNote: { type: String, default: '' },

    feePaid: { type: Boolean, default: false },
    feeSubmitted: { type: Boolean, default: false }, // a payment proof is awaiting review
    feePaidAt: Date,
    status: { type: String, enum: ['payment_pending', 'under_review', 'active', 'suspended'], default: 'payment_pending' },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true }
);
tutorSchema.index({ status: 1, city: 1 });
// MongoDB can't put two array fields in one compound index, so each array gets its own.
tutorSchema.index({ status: 1, levels: 1 });
tutorSchema.index({ status: 1, boards: 1 });
tutorSchema.index({ status: 1, subjects: 1 });
export const Tutor = model('Tutor', tutorSchema);

/* ---------- Payment proof (UPI screenshot) ---------- */
const paymentSchema = new Schema(
  {
    tutor: ref('Tutor'),
    user: ref('User'),
    purpose: { type: String, default: 'registration' },
    amount: { type: Number, required: true },
    upiRef: { type: String, required: true, trim: true }, // UTR / transaction id
    payerUpi: { type: String, default: '', trim: true },
    screenshot: { type: String, required: true }, // private file name
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    note: { type: String, default: '' },
    reviewedBy: ref('User', false),
    reviewedAt: Date,
  },
  { timestamps: true }
);
export const Payment = model('Payment', paymentSchema);

/* ---------- Requirement posted by parent ---------- */
const requirementSchema = new Schema(
  {
    parent: ref('User'),
    studentClass: { type: String, required: true },
    level: { type: String, enum: LEVELS, required: true },
    board: { type: String, enum: BOARDS, required: true },
    subjects: [{ type: String, required: true }],
    city: { type: String, required: true, trim: true },
    area: { type: String, default: '', trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    budget: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: MODES, default: 'home' },
    daysPerWeek: { type: Number, default: 5, min: 1, max: 7 },
    preferredGender: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
    notes: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);
requirementSchema.index({ status: 1, createdAt: -1 });
export const Requirement = model('Requirement', requirementSchema);

/* ---------- Tutor application to a requirement ---------- */
const applicationSchema = new Schema(
  {
    requirement: ref('Requirement'),
    tutor: ref('Tutor'),
    message: { type: String, default: '', maxlength: 600 },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected'], default: 'applied' },
  },
  { timestamps: true }
);
applicationSchema.index({ requirement: 1, tutor: 1 }, { unique: true });
export const Application = model('Application', applicationSchema);

/* ---------- Demo class request ---------- */
const demoSchema = new Schema(
  {
    parent: ref('User'),
    tutor: ref('Tutor'),
    studentClass: { type: String, required: true },
    subject: { type: String, required: true },
    preferredTime: { type: String, default: '' },
    message: { type: String, default: '', maxlength: 600 },
    status: { type: String, enum: ['requested', 'accepted', 'declined', 'completed', 'cancelled'], default: 'requested' },
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export const Demo = model('Demo', demoSchema);

/* ---------- Review ---------- */
const reviewSchema = new Schema(
  {
    tutor: ref('Tutor'),
    parent: ref('User'),
    demo: { ...ref('Demo'), unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 800 },
  },
  { timestamps: true }
);
export const Review = model('Review', reviewSchema);

/* ---------- Site settings (single document) ---------- */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    registrationFee: { type: Number, required: true, min: 0 },
    upiId: { type: String, required: true },
    upiName: { type: String, default: '' },
    supportPhone: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
  },
  { timestamps: true }
);
export const Settings = model('Settings', settingsSchema);
