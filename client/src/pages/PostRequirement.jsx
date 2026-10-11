import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { BOARDS, CLASSES, SUBJECTS, CITIES } from '../lib/constants.js';
import { Alert, ChipSelect } from '../components/ui.jsx';
import { AccountFields } from './Auth.jsx';
import { Seo } from '../lib/ssr.jsx';

const EMPTY = { studentClass: '', board: '', subjects: [], city: '', area: '', pincode: '', budget: 3000, mode: 'home', daysPerWeek: 5, preferredGender: 'any', notes: '' };

export default function PostRequirement() {
  const { user, signIn } = useAuth();
  const [f, setF] = useState(EMPTY);
  const [acct, setAcct] = useState({ name: '', phone: '', email: '', password: '' });
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setA = (k) => (e) => setAcct({ ...acct, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!f.subjects.length) return setMsg({ err: 'Pick at least one subject.' });
    setBusy(true);
    setMsg({});
    try {
      if (!user) signIn(await api('/auth/register', { method: 'POST', body: acct }));
      const d = await api('/requirements', { method: 'POST', body: f });
      setMsg({ ok: d.matchingTutors });
      setF(EMPTY);
    } catch (err) {
      setMsg({ err: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (user && user.role !== 'parent')
    return <div className="wrap page-pad"><div className="empty">Requirements are posted from parent accounts. <Link to="/tuitions">Browse tuition jobs</Link> instead.</div></div>;

  return (
    <>
      <Seo title="Post a Tuition Requirement – Find a Home Tutor Free" description="Tell us your child's class, board, subjects and locality. Verified home tutors near you apply within hours. Free for parents, with a free demo class." />
      <section className="page-hero"><div className="wrap">
        <h1>Post your tuition requirement</h1>
        <p>Verified tutors who teach your board will see it and apply. You choose whom to call. Free for parents.</p>
      </div></section>
      <div className="wrap page-pad split">
        <form className="panel stack" onSubmit={submit}>
          {msg.ok !== undefined && (
            <Alert kind="ok">
              Requirement posted. {msg.ok > 0 ? `${msg.ok} verified tutors in your area teach this class.` : 'Tutors in your area will be able to apply.'}{' '}
              Applications will appear in <Link to="/dashboard/parent">your dashboard</Link>.
            </Alert>
          )}
          <div className="form-grid">
            <div className="field"><label htmlFor="rClass">Student's class</label>
              <select id="rClass" required value={f.studentClass} onChange={set('studentClass')}>
                <option value="">Select</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select></div>
            <div className="field"><label htmlFor="rBoard">Board / exam</label>
              <select id="rBoard" required value={f.board} onChange={set('board')}>
                <option value="">Select</option>{BOARDS.map((b) => <option key={b}>{b}</option>)}
              </select></div>
            <div className="field full"><span className="label">Subjects</span>
              <ChipSelect options={SUBJECTS} value={f.subjects} onChange={(v) => setF({ ...f, subjects: v })} /></div>
            <div className="field"><label htmlFor="rCity">City</label>
              <input id="rCity" required list="rCities" value={f.city} onChange={set('city')} />
              <datalist id="rCities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div className="field"><label htmlFor="rArea">Locality</label>
              <input id="rArea" value={f.area} onChange={set('area')} placeholder="e.g. Aliganj" /></div>
            <div className="field"><label htmlFor="rPin">Pin code</label>
              <input id="rPin" required inputMode="numeric" pattern="\d{6}" title="6-digit pin code" value={f.pincode} onChange={set('pincode')} /></div>
            <div className="field"><label htmlFor="rBudget">Budget per month (₹)</label>
              <input id="rBudget" required type="number" min="0" step="100" value={f.budget} onChange={set('budget')} /></div>
            <div className="field"><label htmlFor="rMode">Mode</label>
              <select id="rMode" value={f.mode} onChange={set('mode')}>
                <option value="home">Home tuition</option><option value="online">Online</option><option value="both">Either</option>
              </select></div>
            <div className="field"><label htmlFor="rDays">Days per week</label>
              <select id="rDays" value={f.daysPerWeek} onChange={set('daysPerWeek')}>{[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d}>{d}</option>)}</select></div>
            <div className="field"><label htmlFor="rGender">Preferred tutor</label>
              <select id="rGender" value={f.preferredGender} onChange={set('preferredGender')}>
                <option value="any">No preference</option><option value="female">Female</option><option value="male">Male</option>
              </select></div>
            <div className="field full"><label htmlFor="rNotes">Notes (optional)</label>
              <textarea id="rNotes" value={f.notes} onChange={set('notes')} placeholder="Timings, weak topics, exam date…" /></div>
          </div>

          {!user && (
            <>
              <hr style={{ border: 0, borderTop: '1px dashed var(--line)', width: '100%' }} />
              <div className="row between"><h3>Your details</h3><Link className="small" to="/login?next=/post-requirement">Have an account? Log in</Link></div>
              <div className="form-grid"><AccountFields f={acct} set={setA} /></div>
              <p className="small muted">Your phone number is shared only with tutors you shortlist or book a demo with.</p>
            </>
          )}
          <Alert kind="err">{msg.err}</Alert>
          <button className="btn block" disabled={busy}>{busy ? 'Posting…' : 'Post requirement'}</button>
        </form>

        <div className="stack">
          <p className="eyebrow">What happens next</p>
          <ol className="steps">
            <li><div><h3>Tutors apply</h3><p>Aadhaar-verified tutors who teach your class see the requirement. Your name and number stay hidden.</p></div></li>
            <li><div><h3>You shortlist</h3><p>Open your dashboard, read each tutor's profile and rating, and shortlist the ones you like. Shortlisted tutors get your number.</p></div></li>
            <li><div><h3>Free demo, then decide</h3><p>Pay the tutor directly once you're happy. TutorSetu takes no commission.</p></div></li>
          </ol>
        </div>
      </div>
    </>
  );
}
