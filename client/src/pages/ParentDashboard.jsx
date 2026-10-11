import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { inr, ago } from '../lib/constants.js';
import { useLoad, Alert, StatusBadge, Avatar, Stars, Modal, modeLabel } from '../components/ui.jsx';

export function ChangePassword() {
  const [f, setF] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    setMsg({});
    try {
      await api('/auth/change-password', { method: 'POST', body: f });
      setF({ current: '', next: '' });
      setMsg({ ok: 'Password changed.' });
    } catch (err) {
      setMsg({ err: err.message });
    }
  };
  return (
    <form className="panel stack" style={{ maxWidth: 440 }} onSubmit={submit}>
      <h3>Change password</h3>
      <div className="field"><label htmlFor="cp1">Current password</label>
        <input id="cp1" type="password" required autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></div>
      <div className="field"><label htmlFor="cp2">New password</label>
        <input id="cp2" type="password" required minLength={8} autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></div>
      <Alert kind="ok">{msg.ok}</Alert>
      <Alert kind="err">{msg.err}</Alert>
      <button className="btn">Update password</button>
    </form>
  );
}

function Requirements() {
  const { data, error, loading, reload } = useLoad(() => api('/requirements/mine'), []);
  const [err, setErr] = useState('');
  const act = async (fn) => {
    setErr('');
    try {
      await fn();
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <Alert kind="err">{error}</Alert>;
  if (!data.items.length)
    return <div className="empty">You haven't posted a requirement yet. <Link to="/post-requirement">Post one now</Link> and tutors will apply.</div>;

  return (
    <div className="stack">
      <Alert kind="err">{err}</Alert>
      {data.items.map((r) => (
        <div className="panel stack" key={r.id}>
          <div className="row between">
            <div className="stack" style={{ gap: 4 }}>
              <h3>{r.studentClass} · {r.subjects.join(', ')} · {r.board}</h3>
              <p className="muted small">{[r.area, r.city].filter(Boolean).join(', ')} {r.pincode} · {inr(r.budget)}/month · {modeLabel(r.mode)} · posted {ago(r.createdAt)}</p>
            </div>
            <div className="row">
              <StatusBadge s={r.status} />
              <button className="btn ghost sm" onClick={() => act(() => api(`/requirements/${r.id}`, { method: 'PATCH', body: { status: r.status === 'open' ? 'closed' : 'open' } }))}>
                {r.status === 'open' ? 'Close' : 'Reopen'}
              </button>
            </div>
          </div>
          <h4>{r.applications.length} tutor{r.applications.length === 1 ? '' : 's'} applied</h4>
          {r.applications.length === 0 && <p className="muted small">No applications yet. Tutors in your area are notified when they open the tuition feed.</p>}
          <div className="list">
            {r.applications.map((a) => (
              <div className="list-item" key={a.id}>
                <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <Avatar name={a.tutor.name} photo={a.tutor.photo} />
                  <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                    <h4><Link to={`/tutors/${a.tutor.id}`}>{a.tutor.name}</Link></h4>
                    <p className="sub">{a.tutor.qualification} · {a.tutor.experienceYears} yrs · {a.tutor.ratingCount ? <><Stars value={a.tutor.ratingAvg} /> {a.tutor.ratingAvg}</> : 'new'}</p>
                    {a.message && <p className="small">"{a.message}"</p>}
                    {a.status === 'shortlisted' && <p className="small">Phone: <b className="mono">{a.tutor.phone}</b></p>}
                  </div>
                </div>
                <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
                  <StatusBadge s={a.status} />
                  {a.status !== 'shortlisted' && <button className="btn sm ok" onClick={() => act(() => api(`/applications/${a.id}`, { method: 'PATCH', body: { status: 'shortlisted' } }))}>Shortlist</button>}
                  {a.status === 'applied' && <button className="btn sm danger" onClick={() => act(() => api(`/applications/${a.id}`, { method: 'PATCH', body: { status: 'rejected' } }))}>Not interested</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewModal({ demo, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const submit = async () => {
    try {
      await api(`/demos/${demo.id}/review`, { method: 'POST', body: { rating, comment } });
      onDone();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal title={`Review ${demo.tutor.name}`} onClose={onClose}>
      <div className="toggle-chips" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-pressed={rating === n} onClick={() => setRating(n)}>{'★'.repeat(n)}</button>)}
      </div>
      <div className="field"><label htmlFor="rc">What was the demo like? (optional)</label>
        <textarea id="rc" maxLength={800} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      <Alert kind="err">{err}</Alert>
      <button className="btn" onClick={submit}>Post review</button>
    </Modal>
  );
}

function Demos() {
  const { data, error, loading, reload } = useLoad(() => api('/demos/mine'), []);
  const [reviewing, setReviewing] = useState(null);
  const [err, setErr] = useState('');
  const act = async (id, status) => {
    setErr('');
    try {
      await api(`/demos/${id}`, { method: 'PATCH', body: { status } });
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <Alert kind="err">{error}</Alert>;
  if (!data.items.length) return <div className="empty">No demo classes booked yet. <Link to="/tutors">Find a tutor</Link> and book a free demo.</div>;
  return (
    <div className="stack">
      <Alert kind="err">{err}</Alert>
      <div className="list">
        {data.items.map((d) => (
          <div className="list-item" key={d.id}>
            <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
              {d.tutor && <Avatar name={d.tutor.name} photo={d.tutor.photo} />}
              <div className="stack" style={{ gap: 4 }}>
                <h4>{d.tutor ? <Link to={`/tutors/${d.tutor.id}`}>{d.tutor.name}</Link> : 'Tutor removed'} · {d.studentClass} {d.subject}</h4>
                <p className="sub">Requested {ago(d.at)}{d.preferredTime ? ` · ${d.preferredTime}` : ''}</p>
                {d.tutor?.phone && <p className="small">Tutor's phone: <b className="mono">{d.tutor.phone}</b></p>}
                {d.status === 'requested' && <p className="small muted">The tutor has your number and will call to confirm.</p>}
              </div>
            </div>
            <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
              <StatusBadge s={d.status} />
              {['requested', 'accepted'].includes(d.status) && <button className="btn sm danger" onClick={() => act(d.id, 'cancelled')}>Cancel</button>}
              {d.status === 'accepted' && <button className="btn sm ghost" onClick={() => act(d.id, 'completed')}>Demo done</button>}
              {['accepted', 'completed'].includes(d.status) && !d.reviewed && <button className="btn sm" onClick={() => setReviewing(d)}>Rate tutor</button>}
              {d.reviewed && <span className="small muted">Reviewed</span>}
            </div>
          </div>
        ))}
      </div>
      {reviewing && <ReviewModal demo={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); reload(); }} />}
    </div>
  );
}

const TABS = [['requirements', 'My requirements'], ['demos', 'Demo classes'], ['account', 'Account']];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'requirements';
  return (
    <div className="wrap page-pad stack" style={{ gap: 22 }}>
      <div className="row between">
        <div><p className="eyebrow">Parent dashboard</p><h1 style={{ fontSize: '1.9rem' }}>Namaste, {user.name.split(' ')[0]}</h1></div>
        <div className="row"><Link className="btn ghost" to="/tutors">Find tutors</Link><Link className="btn" to="/post-requirement">Post requirement</Link></div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}>{l}</button>)}
      </div>
      {tab === 'requirements' && <Requirements />}
      {tab === 'demos' && <Demos />}
      {tab === 'account' && <ChangePassword />}
    </div>
  );
}
