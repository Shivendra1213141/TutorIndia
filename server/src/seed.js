/**
 * npm run seed        -> creates the admin account and default settings
 * npm run seed:demo   -> also adds sample tutors and tuition requirements (marked isSample)
 * npm run seed -- --clear-demo -> removes sample data
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User, Tutor, Requirement } from './models/index.js';
import { getSettings } from './utils/helpers.js';
import { levelForClass } from './constants.js';

const SAMPLE_TUTORS = [
  ['Rajesh Tiwari', 'male', 'M.Sc. Physics', 9, ['senior', 'comp'], ['UP Board', 'CBSE', 'JEE'], ['Physics', 'Maths'], 'Lucknow', 'Aliganj', '226024', 4500, 4.9, 61],
  ['Priya Srivastava', 'female', 'B.Ed.', 6, ['found'], ['CBSE', 'ICSE', 'UP Board'], ['All subjects', 'English'], 'Lucknow', 'Indira Nagar', '226016', 2200, 4.8, 44],
  ['Ankit Gupta', 'male', 'B.Tech, IIT (BHU)', 4, ['comp'], ['JEE', 'CBSE'], ['Maths', 'Physics'], 'Varanasi', 'Lanka', '221005', 7000, 4.9, 38],
  ['Neha Saxena', 'female', 'M.Sc. Zoology', 7, ['senior', 'comp'], ['CBSE', 'UP Board', 'NEET'], ['Biology', 'Chemistry'], 'Kanpur', 'Swaroop Nagar', '208002', 5000, 4.7, 52],
  ['Imran Khan', 'male', 'M.Com', 8, ['senior'], ['UP Board', 'CBSE', 'ICSE'], ['Accountancy', 'Economics'], 'Kanpur', 'Kidwai Nagar', '208011', 3500, 4.6, 29],
  ['Kavita Pandey', 'female', 'B.Sc., B.Ed.', 5, ['middle'], ['ICSE', 'CBSE'], ['Maths', 'Science', 'English'], 'Prayagraj', 'Civil Lines', '211001', 2800, 4.8, 33],
  ['Vivek Chaurasia', 'male', 'B.Sc. Maths', 3, ['middle', 'senior'], ['UP Board'], ['Maths', 'Science'], 'Prayagraj', 'Naini', '211008', 2000, 4.5, 17],
  ['Shalini Verma', 'female', 'M.A. English', 10, ['middle', 'senior'], ['ICSE', 'CBSE'], ['English'], 'Lucknow', 'Hazratganj', '226001', 3200, 4.9, 70],
];

const SAMPLE_REQS = [
  ['Class 12', 'UP Board', ['Physics'], 'Lucknow', 'Aliganj', '226024', 4000, 'home', 5],
  ['Class 3', 'CBSE', ['All subjects'], 'Kanpur', 'Swaroop Nagar', '208002', 2000, 'home', 6],
  ['JEE dropper', 'JEE', ['Maths'], 'Varanasi', 'Lanka', '221005', 7500, 'both', 4],
  ['Class 8', 'ICSE', ['Maths', 'Science'], 'Prayagraj', 'Civil Lines', '211001', 2800, 'home', 3],
  ['Class 11', 'CBSE', ['Accountancy'], 'Kanpur', 'Kidwai Nagar', '208011', 3000, 'online', 3],
  ['NEET dropper', 'NEET', ['Biology'], 'Lucknow', 'Indira Nagar', '226016', 5500, 'home', 5],
];

async function run() {
  await mongoose.connect(config.mongoUri);
  await Tutor.syncIndexes();
  const args = process.argv.slice(2);

  if (!(await User.exists({ role: 'admin' }))) {
    await User.create({
      name: config.admin.name,
      email: config.admin.email,
      phone: config.admin.phone,
      role: 'admin',
      passwordHash: await bcrypt.hash(config.admin.password, 10),
    });
    console.log(`Admin created: ${config.admin.email} / ${config.admin.password}`);
  } else console.log('Admin already exists.');
  const s = await getSettings();
  console.log(`Settings: fee ₹${s.registrationFee}, UPI ${s.upiId}`);

  if (args.includes('--clear-demo')) {
    const users = await User.find({ email: /@sample\.tutorsetu\.in$/ }).select('_id');
    await Tutor.deleteMany({ isSample: true });
    await Requirement.deleteMany({ parent: { $in: users.map((u) => u._id) } });
    await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
    console.log('Sample data removed.');
  }

  if (args.includes('--demo')) {
    const hash = await bcrypt.hash('Sample@123', 10);
    for (const [i, t] of SAMPLE_TUTORS.entries()) {
      const email = `tutor${i + 1}@sample.tutorsetu.in`;
      if (await User.exists({ email })) continue;
      const u = await User.create({ name: t[0], email, phone: `98${String(10000000 + i).slice(0, 8)}`, role: 'tutor', passwordHash: hash });
      await Tutor.create({
        user: u._id, gender: t[1], qualification: t[2], experienceYears: t[3], levels: t[4], boards: t[5], subjects: t[6],
        city: t[7], area: t[8], pincode: t[9], feeMin: t[10], ratingAvg: t[11], ratingCount: t[12],
        about: `${t[3]} years of teaching ${t[6].join(' and ')} to ${t[5].join(', ')} students in ${t[7]}.`,
        mode: 'home', feePaid: true, aadhaarStatus: 'verified', aadhaarLast4: '0000', status: 'active', isSample: true,
      });
    }
    const pEmail = 'parent@sample.tutorsetu.in';
    let parent = await User.findOne({ email: pEmail });
    if (!parent) parent = await User.create({ name: 'Sample Parent', email: pEmail, phone: '9876500000', role: 'parent', passwordHash: hash });
    if (!(await Requirement.exists({ parent: parent._id }))) {
      for (const q of SAMPLE_REQS) {
        await Requirement.create({
          parent: parent._id, studentClass: q[0], level: levelForClass(q[0]), board: q[1], subjects: q[2],
          city: q[3], area: q[4], pincode: q[5], budget: q[6], mode: q[7], daysPerWeek: q[8],
        });
      }
    }
    console.log('Sample tutors and requirements added (password for sample accounts: Sample@123).');
  }
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
