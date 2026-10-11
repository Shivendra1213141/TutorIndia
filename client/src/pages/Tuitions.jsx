import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LEVELS, BOARDS, SUBJECTS, inr, ago } from '../lib/constants.js';
import { useLoad, Alert, Modal, modeLabel } from '../components/ui.jsx';
import { Seo } from '../lib/ssr.jsx';

const feedKey = (f) => '/requirements/feed' + qs(f);
export const ssr = ({ search }) => [feedKey(Object.fromEntries(new URLSearchParams(search)))];

export default function Tuitions() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(params);
  const page = Number(f.page || 1);
  const fk = feedKey(f);
  const feed = useLoad(() => api(fk), [fk, user?.id], fk);
  const me = useLoad(() => (user?.role === 'tutor' ? api('/tutors/me/profile') : Promise.resolve(null)), [user?.id]);
  const [applying, setApplying] = useState(null);
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState({});

  const set = (k, v) => {
    const n = new URLSearchParams(params);
    v ? n.set(k, v) : n.delete(k);
    n.delete('page');
    setParams(n);
  };
  const active = me.data?.profile.status === 'active';

  const apply = async () => {
    setMsg({});
    try {
      await api(`/requirements/${applying.id}/apply`, { method: 'POST', body: { message } });
      setApplying(null);
      setMessage('');
      setMsg({ ok: 'Applied. The parent sees your profile and phone number. If they shortlist you, their number appears in your dashboard.' });
      feed.reload();
    } catch (e) {
      setMsg({ err: e.message });
    }
  };

  return (
    <>
      <Seo
        title={`Home Tuition Jobs${f.q ? ` in ${f.q}` : ''} – Teaching Jobs for Tutors`}
        description="Latest home tuition jobs posted by parents for KG to Class 12, UP Board, CBSE, ICSE, JEE and NEET. Register as a tutor and apply. No commission on your fees."
        path="/tuitions"
      />
      <section className="page-hero"><div className="wrap">
        <h1>Home tuition jobs{f.q ? ` in ${f.q}` : ''}</h1>
        <p>Open requirements posted by parents. Approved tutors can apply in one tap. No commission on your fees.</p>
      </div></section>
      <div className="wrap page-pad stack">
        {!user && <Alert kind="info">Want to apply? <Link to="/become-a-tutor">Register as a tutor</Link> or <Link to="/login?next=/tuitions">log in</Link>.</Alert>}
        {user?.role === 'tutor' && me.data && !active && (
          <Alert kind="warn">Your profile isn't live yet, so you can browse but not apply. <Link to="/dashboard/tutor">Finish payment and Aadhaar verification</Link>.</Alert>
        )}
        <Alert kind="ok">{msg.ok}</Alert>

        <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, padding: 14 }}>
          <div className="field"><label htmlFor="jq">City, area or pin</label>
            <input id="jq" defaultValue={f.q || ''} onKeyDown={(e) => e.key === 'Enter' && set('q', e.currentTarget.value.trim())} onBlur={(e) => e.target.value.trim() !== (f.q || '') && set('q', e.target.value.trim())} /></div>
          <div className="field"><label htmlFor="jl">Class</label>
            <select id="jl" value={f.level || ''} onChange={(e) => set('level', e.target.value)}>
              <option value="">Any</option>{LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id === 'comp' ? 'JEE / NEET' : l.label}</option>)}
            </select></div>
          <div className="field"><label htmlFor="jb">Board</label>
            <select id="jb" value={f.board || ''} onChange={(e) => set('board', e.target.value)}>
              <option value="">Any</option>{BOARDS.map((b) => <option key={b}>{b}</option>)}
            </select></div>
          <div className="field"><label htmlFor="js">Subject</label>
            <select id="js" value={f.subject || ''} onChange={(e) => set('subject', e.target.value)}>
              <option value="">Any</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select></div>
        </div>

        <div className="list">
          <div className="list-item" style={{ alignItems: 'center' }}>
            <div className="row"><h3>Available tuitions</h3><span className="live">Live</span></div>
            <span className="muted small">{feed.data ? `${feed.data.total} open` : ''}</span>
          </div>
          {feed.loading && <div className="list-item"><p className="muted">Loading…</p></div>}
          {feed.error && <div className="list-item"><p className="muted">{feed.error}</p></div>}
          {feed.data?.items.length === 0 && <div className="list-item"><p className="muted">No open tuitions match these filters right now.</p></div>}
          {feed.data?.items.map((j) => (
            <div className="list-item" key={j.id}>
              <div className="stack" style={{ gap: 4 }}>
                <h4>{j.studentClass} · {j.subjects.join(', ')} · {j.board}</h4>
                <p className="sub">{[j.area, j.city].filter(Boolean).join(', ')} <span className="mono">{j.pincode}</span></p>
                <p className="sub">{j.daysPerWeek} days/week · {modeLabel(j.mode)}{j.preferredGender !== 'any' ? ` · ${j.preferredGender} tutor preferred` : ''} · <span suppressHydrationWarning>posted {ago(j.createdAt)}</span>{j.applicants ? ` · ${j.applicants} applied` : ''}</p>
                {j.notes && <p className="small">{j.notes}</p>}
              </div>
              <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
                <div className="fee">{inr(j.budget)}<small>per month</small></div>
                {user?.role === 'tutor' &&
                  (j.applied ? <span className="badge">✓ Applied</span> : <button className="btn sm" disabled={!active} onClick={() => { setApplying(j); setMsg({}); }}>Apply</button>)}
              </div>
            </div>
          ))}
        </div>
        {feed.data?.pages > 1 && (
          <div className="pager">
            <button className="btn ghost sm" disabled={page <= 1} onClick={() => { const n = new URLSearchParams(params); n.set('page', page - 1); setParams(n); }}>Previous</button>
            <span className="mono">{page} / {feed.data.pages}</span>
            <button className="btn ghost sm" disabled={page >= feed.data.pages} onClick={() => { const n = new URLSearchParams(params); n.set('page', page + 1); setParams(n); }}>Next</button>
          </div>
        )}
      </div>

      {applying && (
        <Modal title={`Apply: ${applying.studentClass} ${applying.subjects.join(', ')}`} onClose={() => setApplying(null)}>
          <p className="muted small">{applying.city} · budget {inr(applying.budget)}/month</p>
          <div className="field"><label htmlFor="am">Short message to the parent (optional)</label>
            <textarea id="am" maxLength={600} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your experience with this class and board, when you can start…" /></div>
          <Alert kind="err">{msg.err}</Alert>
          <button className="btn" onClick={apply}>Send application</button>
        </Modal>
      )}
    </>
  );
}
