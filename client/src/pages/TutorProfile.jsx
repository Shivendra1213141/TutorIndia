import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { CLASSES, LEVEL_LABEL, inr, fmtDate } from '../lib/constants.js';
import { Seo, ldBreadcrumbs, useSiteUrl } from '../lib/ssr.jsx';
import { fileUrl } from '../lib/api.js';
import { CITIES } from '../lib/site.js';

export const ssr = ({ params }) => [`/tutors/${params.id}`];
import { useLoad, Avatar, Stars, TrustBadges, Alert, modeLabel } from '../components/ui.jsx';

function DemoForm({ tutor }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [f, setF] = useState({ studentClass: '', subject: tutor.subjects[0] || '', preferredTime: '', message: '' });
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!user)
    return (
      <div className="stack">
        <p>Create a free parent account to book a demo. It takes under a minute.</p>
        <div className="row">
          <Link className="btn" to={`/register?next=${encodeURIComponent(loc.pathname + '#demo')}`}>Create account</Link>
          <Link className="btn ghost" to={`/login?next=${encodeURIComponent(loc.pathname + '#demo')}`}>Log in</Link>
        </div>
      </div>
    );
  if (user.role !== 'parent') return <p className="muted">Only parent accounts can book demo classes.</p>;
  if (msg.ok) return <Alert kind="ok">{msg.ok}</Alert>;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({});
    try {
      await api('/demos', { method: 'POST', body: { ...f, tutorId: tutor.id } });
      setMsg({ ok: `Demo requested. ${tutor.name.split(' ')[0]} will see your phone number and call you to fix a time. Track it in your dashboard.` });
    } catch (err) {
      setMsg({ err: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label htmlFor="dClass">Student's class</label>
          <select id="dClass" required value={f.studentClass} onChange={set('studentClass')}>
            <option value="">Select</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select></div>
        <div className="field"><label htmlFor="dSub">Subject</label>
          <select id="dSub" required value={f.subject} onChange={set('subject')}>
            {tutor.subjects.map((s) => <option key={s}>{s}</option>)}
          </select></div>
        <div className="field full"><label htmlFor="dTime">Preferred time</label>
          <input id="dTime" value={f.preferredTime} onChange={set('preferredTime')} placeholder="e.g. Weekdays after 5 pm" /></div>
        <div className="field full"><label htmlFor="dMsg">Message (optional)</label>
          <textarea id="dMsg" value={f.message} onChange={set('message')} placeholder="Anything the tutor should know" /></div>
      </div>
      <Alert kind="err">{msg.err}</Alert>
      <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Request free demo'}</button>
    </form>
  );
}

export default function TutorProfile() {
  const { id } = useParams();
  const siteUrl = useSiteUrl();
  const { data, error, loading } = useLoad(() => api(`/tutors/${id}`), [id], `/tutors/${id}`);
  const { hash } = useLocation();
  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [data, hash]);
  if (loading) return <div className="wrap page-pad"><p className="muted">Loading profile…</p></div>;
  if (error) return <div className="wrap page-pad"><Seo title="Tutor not found" noindex /><div className="empty">{error} <Link to="/tutors">Back to search</Link></div></div>;
  const { tutor: t, reviews } = data;
  const city = CITIES.find((c) => c.name.toLowerCase() === String(t.city).toLowerCase());
  const subj = t.subjects.slice(0, 3).join(', ');
  const crumbs = [['Home', '/'], ...(city ? [[`Home tuition in ${city.name}`, `/home-tuition/${city.slug}`]] : [['Find tutors', '/tutors']]), [t.name, `/tutors/${t.id}`]];
  const person = {
    '@type': 'Person',
    name: t.name,
    jobTitle: `${subj} home tutor`,
    description: t.about || `${t.qualification}, ${t.experienceYears} years of teaching experience.`,
    knowsAbout: t.subjects,
    address: { '@type': 'PostalAddress', addressLocality: t.city, postalCode: t.pincode, addressCountry: 'IN' },
    url: `${siteUrl}/tutors/${t.id}`,
    ...(t.photo ? { image: siteUrl + fileUrl(t.photo) } : {}),
  };

  return (
    <div className="wrap page-pad profile-grid">
      <Seo
        title={`${t.name} – ${subj} Home Tutor in ${t.city}`}
        description={`${t.name} teaches ${t.subjects.join(', ')} for ${t.boards.join(', ')} in ${[t.area, t.city].filter(Boolean).join(', ')}. ${t.qualification}, ${t.experienceYears} years experience.${t.ratingCount ? ` Rated ${t.ratingAvg}/5 by ${t.ratingCount} parents.` : ''} Book a free demo class.`}
        ogType="profile"
        image={t.photo ? siteUrl + fileUrl(t.photo) : undefined}
        jsonLd={[person, ldBreadcrumbs(siteUrl, crumbs)]}
      />
      <div className="stack" style={{ gap: 24 }}>
        <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
          <Avatar name={t.name} photo={t.photo} size="lg" />
          <div className="stack" style={{ gap: 8, minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.3rem)' }}>{t.name}</h1>
            <p className="muted">{t.qualification} · {t.experienceYears} years teaching · {[t.area, t.city].filter(Boolean).join(', ')}</p>
            <div className="rating">
              {t.ratingCount ? <><Stars value={t.ratingAvg} /><b className="mono">{t.ratingAvg.toFixed(1)}</b><span className="muted">({t.ratingCount} reviews)</span></> : <span className="muted">No reviews yet</span>}
            </div>
            <TrustBadges t={t} />
          </div>
        </div>

        {t.about && <div className="stack" style={{ gap: 8 }}><h3>About</h3><p style={{ whiteSpace: 'pre-line' }}>{t.about}</p></div>}

        <dl className="meta panel" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', borderTop: 0 }}>
          <div><dt>Subjects</dt><dd>{t.subjects.join(', ')}</dd></div>
          <div><dt>Boards / exams</dt><dd>{t.boards.join(', ')}</dd></div>
          <div><dt>Classes</dt><dd>{t.levels.map((l) => LEVEL_LABEL[l]).join(', ')}</dd></div>
          <div><dt>Mode</dt><dd>{modeLabel(t.mode)}</dd></div>
          <div><dt>Location</dt><dd>{t.city} <span className="mono">{t.pincode}</span></dd></div>
          <div><dt>Fee / month</dt><dd className="mono">{t.feeMin ? `from ${inr(t.feeMin)}` : 'On request'}</dd></div>
        </dl>

        <div className="stack">
          <h3>Parent reviews</h3>
          {reviews.length === 0 && <p className="muted">No reviews yet. Parents can review after a demo class.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="panel stack" style={{ gap: 6, padding: 16 }}>
              <div className="row between"><span><Stars value={r.rating} /> <b>{r.by}</b></span><span className="muted small">{fmtDate(r.at)}</span></div>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      <aside className="panel stack side" id="demo">
        <h3>Book a free demo class</h3>
        <p className="muted small">No payment to TutorSetu. You pay the tutor directly if you continue after the demo.</p>
        <DemoForm tutor={t} />
        <p className="muted small">Tip: ask to see the tutor's degree certificate during the demo. Degrees are listed as stated by the tutor.</p>
      </aside>
    </div>
  );
}
