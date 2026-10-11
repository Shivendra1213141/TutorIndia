export const LEVELS = ['found', 'middle', 'senior', 'comp'];
export const LEVEL_LABELS = {
  found: 'KG – Class 5',
  middle: 'Class 6 – 8',
  senior: 'Class 9 – 12',
  comp: 'JEE / NEET',
};
export const BOARDS = ['UP Board', 'CBSE', 'ICSE', 'JEE', 'NEET'];
export const SUBJECTS = [
  'All subjects', 'Maths', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Economics', 'Business Studies', 'Computer Science',
];
export const CLASSES = [
  'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8',
  'Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE dropper', 'NEET dropper',
];
export const MODES = ['home', 'online', 'both'];

export function levelForClass(c) {
  if (c === 'KG') return 'found';
  if (/dropper/i.test(c)) return 'comp';
  const n = Number(String(c).replace(/\D/g, ''));
  if (n <= 5) return 'found';
  if (n <= 8) return 'middle';
  return 'senior';
}
