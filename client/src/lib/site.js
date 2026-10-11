/**
 * Site-wide content and SEO data. Plain JS (no React) so the server can import it for the sitemap.
 * Edit this file to rename the brand, change cities/localities, subjects, FAQs or photos.
 */

export const BRAND = 'TutorSetu';
export const TAGLINE = 'Verified home tutors near you, KG to Class 12, JEE & NEET';
export const REGION = 'Uttar Pradesh';

/* ---------- Photos ----------
 * Run `npm run images` (in client/) once to download these into public/images/ so they are
 * served from your own domain (faster and better for image SEO). Until then the page
 * falls back to the remote Pexels URL. Pexels photos are free to use commercially.
 * To use your own photo, put it at public/images/<name>.jpg — it will be used automatically.
 */
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
export const IMAGES = {
  hero: { id: 7079148, alt: 'Home tutor teaching a child at home' },
  homework: { id: 8653950, alt: 'Tutor helping a school student with homework' },
  senior: { id: 4308095, alt: 'Home tutor explaining a concept to a senior secondary student' },
  online: { id: 4308096, alt: 'Tutor and student studying together with a laptop' },
  school: { id: 18012459, alt: 'Indian school children studying in uniform' },
  young: { id: 20556417, alt: 'Young student smiling while writing in his notebook at home' },
  classroom: { id: 14180701, alt: 'Student smiling in front of a chalkboard' },
  teacher: { id: 18870248, alt: 'Teacher helping a young student with his studies' },
};
export const imageRemote = (name, w) => px(IMAGES[name].id, w);
export const imageLocal = (name) => `/images/${name}.jpg`;

/* ---------- Cities served (each gets its own SEO landing page) ---------- */
export const CITIES = [
  { slug: 'lucknow', name: 'Lucknow', areas: ['Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Hazratganj', 'Alambagh', 'Aashiana', 'Jankipuram', 'Mahanagar', 'Rajajipuram', 'Vikas Nagar'] },
  { slug: 'kanpur', name: 'Kanpur', areas: ['Swaroop Nagar', 'Kidwai Nagar', 'Kakadeo', 'Civil Lines', 'Govind Nagar', 'Kalyanpur', 'Shyam Nagar', 'Barra', 'Arya Nagar'] },
  { slug: 'prayagraj', name: 'Prayagraj', areas: ['Civil Lines', 'George Town', 'Tagore Town', 'Naini', 'Jhunsi', 'Mumfordganj', 'Allahpur', 'Teliarganj'] },
  { slug: 'varanasi', name: 'Varanasi', areas: ['Lanka', 'Sigra', 'Bhelupur', 'Mahmoorganj', 'Cantonment', 'Sarnath', 'Shivpur', 'Pandeypur'] },
  { slug: 'agra', name: 'Agra', areas: ['Kamla Nagar', 'Dayal Bagh', 'Sanjay Place', 'Shahganj', 'Sikandra', 'Tajganj', 'Sadar Bazar'] },
  { slug: 'noida', name: 'Noida', areas: ['Sector 62', 'Sector 50', 'Sector 18', 'Sector 137', 'Sector 76', 'Greater Noida West'] },
  { slug: 'ghaziabad', name: 'Ghaziabad', areas: ['Indirapuram', 'Vaishali', 'Raj Nagar Extension', 'Kaushambi', 'Vasundhara', 'Crossings Republik'] },
  { slug: 'meerut', name: 'Meerut', areas: ['Shastri Nagar', 'Saket', 'Ganga Nagar', 'Pallavpuram', 'Meerut Cantt'] },
  { slug: 'bareilly', name: 'Bareilly', areas: ['Civil Lines', 'Rajendra Nagar', 'DD Puram', 'Izzatnagar'] },
  { slug: 'gorakhpur', name: 'Gorakhpur', areas: ['Civil Lines', 'Golghar', 'Rapti Nagar', 'Shahpur', 'Taramandal'] },
];
export const cityBySlug = (s) => CITIES.find((c) => c.slug === s);

/* ---------- Subjects (each gets its own SEO landing page) ---------- */
export const SUBJECT_PAGES = [
  { slug: 'all-subjects', name: 'All subjects', label: 'All-subject tutor', classes: 'KG to Class 8', icon: 'PencilLine',
    blurb: 'One tutor for every subject in the early years: reading, writing, maths, EVS and daily homework, with a calm routine your child can follow.',
    topics: ['Phonics and reading fluency', 'Handwriting', 'Tables and mental maths', 'EVS and GK', 'Daily homework support', 'Unit-test revision'] },
  { slug: 'maths', name: 'Maths', label: 'Maths tutor', classes: 'Class 1 to 12, JEE', icon: 'Sigma',
    blurb: 'Step-by-step maths tuition that fixes weak basics first, then builds speed with NCERT and board-pattern practice.',
    topics: ['Number system and algebra', 'Geometry and mensuration', 'Trigonometry', 'Calculus (Class 11–12)', 'Probability and statistics', 'NCERT and RD Sharma practice'] },
  { slug: 'science', name: 'Science', label: 'Science tutor', classes: 'Class 6 to 10', icon: 'FlaskConical',
    blurb: 'Science tuition that explains the why behind each chapter, with diagrams, simple experiments and regular chapter tests.',
    topics: ['Physics: motion, light, electricity', 'Chemistry: reactions, acids and bases', 'Biology: life processes', 'Diagrams and labelling', 'NCERT exemplar questions'] },
  { slug: 'english', name: 'English', label: 'English tutor', classes: 'KG to Class 12', icon: 'BookOpen',
    blurb: 'Grammar, writing and spoken English for school exams and everyday confidence, for CBSE, ICSE and UP Board students.',
    topics: ['Grammar and tenses', 'Letter, notice and essay writing', 'Reading comprehension', 'Literature chapters', 'Spoken English practice'] },
  { slug: 'hindi', name: 'Hindi', label: 'Hindi tutor', classes: 'Class 1 to 12', icon: 'Languages',
    blurb: 'Hindi vyakaran, lekhan and sahitya tuition that helps students score in board exams and write with confidence.',
    topics: ['व्याकरण (grammar)', 'निबंध और पत्र लेखन', 'गद्य और पद्य', 'अपठित गद्यांश', 'Board-pattern answers'] },
  { slug: 'social-science', name: 'Social Science', label: 'Social Science tutor', classes: 'Class 6 to 10', icon: 'Globe2',
    blurb: 'History, Geography, Civics and Economics made easy to remember, with maps, timelines and answer-writing practice.',
    topics: ['History timelines', 'Map work', 'Civics and democratic politics', 'Economics basics', 'Answer-writing technique'] },
  { slug: 'physics', name: 'Physics', label: 'Physics tutor', classes: 'Class 9 to 12, JEE, NEET', icon: 'Atom',
    blurb: 'Physics tuition focused on concepts and numericals, from board exams to JEE Main and NEET-level problem solving.',
    topics: ['Mechanics', 'Electrostatics and current', 'Optics', 'Modern physics', 'Numerical problem solving', 'Previous-year papers'] },
  { slug: 'chemistry', name: 'Chemistry', label: 'Chemistry tutor', classes: 'Class 9 to 12, JEE, NEET', icon: 'TestTubes',
    blurb: 'Physical, organic and inorganic chemistry taught with clear reaction logic, so students stop memorising blindly.',
    topics: ['Mole concept', 'Organic reaction mechanisms', 'Periodic table and bonding', 'Equilibrium', 'Numericals', 'NCERT line-by-line for NEET'] },
  { slug: 'biology', name: 'Biology', label: 'Biology tutor', classes: 'Class 9 to 12, NEET', icon: 'Leaf',
    blurb: 'Biology tuition for boards and NEET with diagrams, NCERT-based revision and regular MCQ practice.',
    topics: ['Cell biology', 'Human physiology', 'Genetics and evolution', 'Plant physiology', 'Ecology', 'NEET MCQ practice'] },
  { slug: 'accountancy', name: 'Accountancy', label: 'Accountancy tutor', classes: 'Class 11 and 12', icon: 'IndianRupee',
    blurb: 'Accountancy tuition from journal entries to partnership and company accounts, with board-pattern practice.',
    topics: ['Journal and ledger', 'Final accounts', 'Partnership accounts', 'Company accounts', 'Cash flow statement'] },
  { slug: 'economics', name: 'Economics', label: 'Economics tutor', classes: 'Class 11 and 12', icon: 'LineChart',
    blurb: 'Micro and macro economics explained with graphs and real examples, plus statistics for Class 11.',
    topics: ['Microeconomics', 'Macroeconomics', 'Statistics', 'Indian economic development', 'Numericals and diagrams'] },
  { slug: 'computer-science', name: 'Computer Science', label: 'Computer tutor', classes: 'Class 6 to 12', icon: 'Monitor',
    blurb: 'Computer Science and IP tuition with hands-on Python and practical-file help for school exams.',
    topics: ['Python programming', 'SQL and databases', 'Computer fundamentals', 'Practical file and viva', 'Project help'] },
];
export const subjectBySlug = (s) => SUBJECT_PAGES.find((x) => x.slug === s);
export const subjectSlug = (name) => SUBJECT_PAGES.find((x) => x.name === name)?.slug;

/* ---------- FAQs (also published as FAQPage structured data) ---------- */
export const homeFaqs = (fee) => [
  ['How do I find a home tutor near me?', 'Search by class, board, subject and your city or pin code, or post your requirement for free. Verified tutors who teach your class apply, and you choose whom to call.'],
  ['Is the first demo class free?', 'Yes. Every tutor on the platform offers a free demo class. You pay the tutor directly only if you decide to continue.'],
  ['How are tutors verified?', 'Our team checks every tutor\'s Aadhaar card before their profile goes live. Qualifications are shown as stated by the tutor, so ask to see certificates during the demo.'],
  ['Which boards and classes do you cover?', 'KG to Class 12 for UP Board, CBSE and ICSE, plus JEE Main, JEE Advanced and NEET preparation for Class 11, 12 and droppers.'],
  ['How much does home tuition cost?', 'Fees are set by each tutor and depend on the class, subject and days per week. Typical fees start around ₹1,500 a month for primary classes and go higher for Class 11–12 and JEE/NEET.'],
  ['I am a teacher. How do I get home tuitions?', `Register as a tutor, upload your Aadhaar and pay a one-time ₹${fee ?? 300} registration fee by UPI. Once approved, you can apply to tuition requirements near you. We take no commission on your fees.`],
];

export const cityFaqs = (c) => [
  [`How do I find a home tutor in ${c.name}?`, `Search tutors in ${c.name} by class, board and subject, or post your requirement. Tutors who live near ${c.areas.slice(0, 3).join(', ')} and other localities can apply within hours.`],
  [`What is the fee for home tuition in ${c.name}?`, `Most home tutors in ${c.name} charge from ₹1,500 to ₹3,000 a month for primary classes, ₹2,500 to ₹5,000 for Class 9–12, and more for JEE and NEET. Each tutor lists their starting fee on their profile.`],
  [`Do you have UP Board tutors in ${c.name}?`, `Yes. You can filter tutors in ${c.name} by UP Board, CBSE or ICSE, and by JEE or NEET for competitive exam preparation.`],
  [`Are female home tutors available in ${c.name}?`, 'Yes. When you post a requirement you can choose a female tutor preference, and each profile shows the tutor\'s details before you book a demo.'],
];

export const LEVEL_PAGES = [
  { id: 'found', image: 'young', label: 'KG – Class 5', title: 'Foundational', points: ['All-subject tutors', 'Homework help', 'Reading & phonics', 'Mental maths'] },
  { id: 'middle', image: 'school', label: 'Class 6 – 8', title: 'Middle school', points: ['CBSE, ICSE, UP Board aligned', 'Maths, Science, English', 'Unit-test preparation'] },
  { id: 'senior', image: 'senior', label: 'Class 9 – 12', title: 'Board exams', points: ['PCMB specialists', 'Accountancy, Economics', 'Board-pattern practice papers'] },
  { id: 'comp', image: 'online', label: '11th · 12th · Dropper', title: 'JEE / NEET', points: ['Problem-solving technique', 'Speed & mock-test strategy', 'Foundation batches'] },
];
