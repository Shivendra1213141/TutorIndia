import { CITIES as SITE_CITIES } from './site.js';

export const LEVELS = [
  { id: 'found', label: 'KG – Class 5', title: 'Foundational', points: ['All-subject tutors', 'Homework help', 'Reading & phonics', 'Mental maths'] },
  { id: 'middle', label: 'Class 6 – 8', title: 'Middle school', points: ['CBSE, ICSE, UP Board aligned', 'Maths, Science, English', 'Unit-test preparation'] },
  { id: 'senior', label: 'Class 9 – 12', title: 'Secondary & Sr. Secondary', points: ['PCMB specialists', 'Accountancy, Economics', 'Board-pattern practice papers'] },
  { id: 'comp', label: '11th · 12th · Dropper', title: 'JEE / NEET', points: ['Problem-solving technique', 'Speed & mock-test strategy', 'Foundation batches'] },
];
export const LEVEL_LABEL = { found: 'KG – Class 5', middle: 'Class 6 – 8', senior: 'Class 9 – 12', comp: 'JEE / NEET' };
export const BOARDS = ['UP Board', 'CBSE', 'ICSE', 'JEE', 'NEET'];
export const SUBJECTS = [
  'All subjects', 'Maths', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Economics', 'Business Studies', 'Computer Science',
];
export const CLASSES = [
  'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8',
  'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE dropper', 'NEET dropper',
];
export const MODE_LABEL = { home: 'Home tuition', online: 'Online', both: 'Home or online' };
export const CITIES = SITE_CITIES.map((c) => c.name);

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const ago = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const days = Math.floor(s / 86400);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};
export const initials = (n = '') => n.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
