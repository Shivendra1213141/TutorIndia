import { BOARDS, SUBJECTS, CITIES, LEVEL_LABEL } from '../lib/constants.js';
import { ChipSelect } from './ui.jsx';

export const EMPTY_PROFILE = {
  gender: '', qualification: '', experienceYears: 0, about: '', subjects: [], levels: [], boards: [],
  city: '', area: '', pincode: '', servicePincodes: '', mode: 'home', feeMin: 2000,
};

/** Converts form state to API payload. */
export const toPayload = (p) => ({
  ...p,
  experienceYears: Number(p.experienceYears) || 0,
  feeMin: Number(p.feeMin) || 0,
  servicePincodes: String(p.servicePincodes || '').split(/[\s,]+/).filter((x) => /^\d{6}$/.test(x)),
});

export function checkProfile(p) {
  if (!p.subjects.length) return 'Pick at least one subject.';
  if (!p.levels.length) return 'Pick at least one class group.';
  if (!p.boards.length) return 'Pick at least one board or exam.';
  return '';
}

export default function TutorProfileFields({ p, setP }) {
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  return (
    <div className="form-grid">
      <div className="field full"><label htmlFor="tQual">Highest qualification</label>
        <input id="tQual" required value={p.qualification} onChange={set('qualification')} placeholder="e.g. M.Sc. Physics, Lucknow University" />
        <span className="hint">Shown on your profile as stated by you.</span></div>
      <div className="field"><label htmlFor="tExp">Teaching experience (years)</label>
        <input id="tExp" type="number" min="0" max="60" value={p.experienceYears} onChange={set('experienceYears')} /></div>
      <div className="field"><label htmlFor="tGender">Gender</label>
        <select id="tGender" value={p.gender} onChange={set('gender')}>
          <option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
        </select></div>
      <div className="field full"><span className="label">Subjects you teach</span>
        <ChipSelect options={SUBJECTS} value={p.subjects} onChange={(v) => setP({ ...p, subjects: v })} /></div>
      <div className="field full"><span className="label">Classes</span>
        <ChipSelect options={Object.keys(LEVEL_LABEL)} labels={LEVEL_LABEL} value={p.levels} onChange={(v) => setP({ ...p, levels: v })} /></div>
      <div className="field full"><span className="label">Boards / exams</span>
        <ChipSelect options={BOARDS} value={p.boards} onChange={(v) => setP({ ...p, boards: v })} /></div>
      <div className="field"><label htmlFor="tCity">City</label>
        <input id="tCity" required list="tCities" value={p.city} onChange={set('city')} />
        <datalist id="tCities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></div>
      <div className="field"><label htmlFor="tArea">Locality</label>
        <input id="tArea" value={p.area} onChange={set('area')} placeholder="e.g. Civil Lines" /></div>
      <div className="field"><label htmlFor="tPin">Your pin code</label>
        <input id="tPin" required inputMode="numeric" pattern="\d{6}" title="6-digit pin code" value={p.pincode} onChange={set('pincode')} /></div>
      <div className="field"><label htmlFor="tPins">Other pin codes you can travel to</label>
        <input id="tPins" value={p.servicePincodes} onChange={set('servicePincodes')} placeholder="226016, 226024" /></div>
      <div className="field"><label htmlFor="tMode">Teaching mode</label>
        <select id="tMode" value={p.mode} onChange={set('mode')}>
          <option value="home">Home tuition</option><option value="online">Online</option><option value="both">Both</option>
        </select></div>
      <div className="field"><label htmlFor="tFee">Starting fee per month (₹)</label>
        <input id="tFee" type="number" min="0" step="100" value={p.feeMin} onChange={set('feeMin')} /></div>
      <div className="field full"><label htmlFor="tAbout">About you</label>
        <textarea id="tAbout" maxLength={1500} value={p.about} onChange={set('about')} placeholder="How you teach, results of past students, timings you are free…" /></div>
    </div>
  );
}
