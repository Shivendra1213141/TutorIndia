import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, fetchFileUrl, qs } from '../lib/api.js';
import { inr, ago } from '../lib/constants.js';
import { useLoad, Alert, StatusBadge, Modal } from '../components/ui.jsx';
import { ChangePassword } from './ParentDashboard.jsx';

/** Loads a private file with the admin token and shows it. */
function FileViewer({ path, title, onClose, children }) {
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let url;
    fetchFileUrl(path).then((f) => { url = f.url; setFile(f); }).catch((e) => setErr(e.message));
    return () => url && URL.revokeObjectURL(url);
  }, [path]);
  return (
    <Modal title={title} onClose={onClose}>
      {err && <Alert kind="err">{err}</Alert>}
      {!file && !err && <p className="muted">Loading file…</p>}
      {file && (file.type === 'application/pdf'
        ? <a className="btn ghost" href={file.url} target="_blank" rel="noreferrer">Open PDF in new tab</a>
        : <img src={file.url} alt={title} />)}
      {children}
    </Modal>
  );
}

function DecisionForm({ onApprove, onReject, approveLabel = 'Approve' }) {
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const run = async (fn) => {
    setErr('');
    try {
      await fn(note);
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="field"><label htmlFor="dn">Reason (required to reject, shown to the tutor)</label>
        <input id="dn" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Amount not received / image unclear" /></div>
      <Alert kind="err">{err}</Alert>
      <div className="row">
        <button className="btn ok" onClick={() => run(onApprove)}>{approveLabel}</button>
        <button className="btn danger" onClick={() => run(onReject)}>Reject</button>
      </div>
    </div>
  );
}

function Overview({ go }) {
  const { data, error } = useLoad(() => api('/admin/stats'), []);
  if (error) return <Alert kind="err">{error}</Alert>;
  if (!data) return <p className="muted">Loading…</p>;
  const tiles = [
    ['Payments to review', data.paymentsPending, 'payments', data.paymentsPending > 0],
    ['Aadhaar to verify', data.aadhaarPending, 'tutors', data.aadhaarPending > 0],
    ['Live tutors', data.tutorsActive, 'tutors'],
    ['Tutors under review', data.tutorsReview, 'tutors'],
    ['Parents', data.parents, 'users'],
    ['Open requirements', data.reqOpen, 'requirements'],
    ['Demo requests', data.demos],
    ['Fees collected', inr(data.revenue), 'payments'],
  ];
  return (
    <div className="stats">
      {tiles.map(([l, v, tab, attn]) => (
        <button key={l} className={`stat ${attn ? 'attn' : ''}`} style={{ textAlign: 'left', cursor: tab ? 'pointer' : 'default' }} onClick={() => tab && go(tab)}>
          <span className="eyebrow">{l}</span><b>{v}</b>
        </button>
      ))}
    </div>
  );
}

function Payments() {
  const [status, setStatus] = useState('pending');
  const { data, error, loading, reload } = useLoad(() => api('/admin/payments' + qs({ status })), [status]);
  const [view, setView] = useState(null);
  const decide = (action) => async (note) => {
    await api(`/admin/payments/${view._id}`, { method: 'PATCH', body: { action, note } });
    setView(null);
    reload();
  };
  return (
    <div className="stack">
      <div className="row">
        {['pending', 'approved', 'rejected', ''].map((s) => <button key={s} className={`btn sm ${status === s ? '' : 'ghost'}`} onClick={() => setStatus(s)}>{s || 'All'}</button>)}
      </div>
      {error && <Alert kind="err">{error}</Alert>}
      {loading && <p className="muted">Loading…</p>}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tutor</th><th>Amount</th><th>UTR</th><th>Payer UPI</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.items.length === 0 && <tr><td colSpan="7" className="muted">Nothing here.</td></tr>}
              {data.items.map((p) => (
                <tr key={p._id}>
                  <td>{p.user?.name}<br /><span className="muted small">{p.user?.phone} · {p.user?.email}</span></td>
                  <td className="mono">{inr(p.amount)}</td>
                  <td className="mono">{p.upiRef}</td>
                  <td>{p.payerUpi || '—'}</td>
                  <td>{ago(p.createdAt)}</td>
                  <td><StatusBadge s={p.status} />{p.note && <div className="small muted">{p.note}</div>}</td>
                  <td><button className="btn sm ghost" onClick={() => setView(p)}>{p.status === 'pending' ? 'Review' : 'View'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view && (
        <FileViewer path={`/admin/files/payment/${view._id}`} title={`Payment from ${view.user?.name}`} onClose={() => setView(null)}>
          <p>Expected <b>{inr(view.amount)}</b> · UTR <b className="mono">{view.upiRef}</b>. Match the UTR in your bank or UPI app before approving.</p>
          {view.status === 'pending' && <DecisionForm onApprove={decide('approve')} onReject={decide('reject')} approveLabel="Approve payment" />}
        </FileViewer>
      )}
    </div>
  );
}

function Tutors() {
  const [f, setF] = useState({ status: '', aadhaar: 'pending', q: '' });
  const { data, error, loading, reload } = useLoad(() => api('/admin/tutors' + qs(f)), [f.status, f.aadhaar, f.q]);
  const [view, setView] = useState(null);
  const [err, setErr] = useState('');
  const verify = (action) => async (note) => {
    await api(`/admin/tutors/${view.id}/aadhaar`, { method: 'PATCH', body: { action, note } });
    setView(null);
    reload();
  };
  const setStatus = async (t, action) => {
    setErr('');
    try {
      await api(`/admin/tutors/${t.id}/status`, { method: 'PATCH', body: { action } });
      reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div className="stack">
      <div className="row">
        <select aria-label="Aadhaar status" value={f.aadhaar} onChange={(e) => setF({ ...f, aadhaar: e.target.value })} className="btn ghost sm">
          <option value="">Any Aadhaar status</option><option value="pending">Aadhaar pending</option><option value="verified">Aadhaar verified</option><option value="rejected">Aadhaar rejected</option><option value="not_submitted">Not submitted</option>
        </select>
        <select aria-label="Profile status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="btn ghost sm">
          <option value="">Any profile status</option><option value="active">Live</option><option value="under_review">Under review</option><option value="payment_pending">Payment due</option><option value="suspended">Suspended</option>
        </select>
        <input aria-label="Search tutors" placeholder="Search name, phone, city…" defaultValue={f.q} onKeyDown={(e) => e.key === 'Enter' && setF({ ...f, q: e.currentTarget.value })} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', background: 'var(--card)' }} />
      </div>
      <Alert kind="err">{err || error}</Alert>
      {loading && <p className="muted">Loading…</p>}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tutor</th><th>Teaches</th><th>City</th><th>Fee</th><th>Aadhaar</th><th>Profile</th><th></th></tr></thead>
            <tbody>
              {data.items.length === 0 && <tr><td colSpan="7" className="muted">No tutors match.</td></tr>}
              {data.items.map((t) => (
                <tr key={t.id}>
                  <td>{t.status === 'active' ? <Link to={`/tutors/${t.id}`}>{t.name}</Link> : t.name}<br /><span className="muted small">{t.phone} · {t.email}</span><br /><span className="small">{t.qualification}</span></td>
                  <td className="small">{t.subjects.join(', ')}<br /><span className="muted">{t.boards.join(', ')}</span></td>
                  <td>{t.city}<br /><span className="mono small">{t.pincode}</span></td>
                  <td>{t.feePaid ? <StatusBadge s="approved" /> : t.feeSubmitted ? <StatusBadge s="pending" /> : <span className="badge neutral">Unpaid</span>}</td>
                  <td><StatusBadge s={t.aadhaarStatus} />{t.aadhaarLast4 && <div className="mono small">XXXX {t.aadhaarLast4}</div>}</td>
                  <td><StatusBadge s={t.status} /></td>
                  <td>
                    <div className="stack" style={{ gap: 6 }}>
                      {t.hasAadhaarFile && <button className="btn sm ghost" onClick={() => setView(t)}>Aadhaar</button>}
                      {t.status === 'suspended'
                        ? <button className="btn sm ghost" onClick={() => setStatus(t, 'reinstate')}>Reinstate</button>
                        : <button className="btn sm danger" onClick={() => setStatus(t, 'suspend')}>Suspend</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view && (
        <FileViewer path={`/admin/files/aadhaar/${view.id}`} title={`Aadhaar: ${view.name}`} onClose={() => setView(null)}>
          <p>Check that the name matches <b>{view.name}</b> and the number ends in <b className="mono">{view.aadhaarLast4}</b>.</p>
          {view.aadhaarStatus !== 'verified' && <DecisionForm onApprove={verify('verify')} onReject={verify('reject')} approveLabel="Mark verified" />}
        </FileViewer>
      )}
    </div>
  );
}

function Requirements() {
  const { data, error, loading, reload } = useLoad(() => api('/admin/requirements'), []);
  const [confirm, setConfirm] = useState(null);
  const del = async () => {
    await api(`/admin/requirements/${confirm._id}`, { method: 'DELETE' });
    setConfirm(null);
    reload();
  };
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <Alert kind="err">{error}</Alert>;
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Requirement</th><th>Parent</th><th>Location</th><th>Budget</th><th>Applicants</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.items.length === 0 && <tr><td colSpan="7" className="muted">No requirements yet.</td></tr>}
            {data.items.map((r) => (
              <tr key={r._id}>
                <td>{r.studentClass} · {r.subjects.join(', ')}<br /><span className="muted small">{r.board} · {ago(r.createdAt)}</span></td>
                <td>{r.parent?.name}<br /><span className="muted small">{r.parent?.phone}</span></td>
                <td>{r.city}<br /><span className="mono small">{r.pincode}</span></td>
                <td className="mono">{inr(r.budget)}</td>
                <td className="mono">{r.applicants}</td>
                <td><StatusBadge s={r.status} /></td>
                <td><button className="btn sm danger" onClick={() => setConfirm(r)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm && (
        <Modal title="Delete requirement?" onClose={() => setConfirm(null)}>
          <p>This removes "{confirm.studentClass} · {confirm.subjects.join(', ')}" and all its applications. This cannot be undone.</p>
          <div className="row"><button className="btn danger" onClick={del}>Delete</button><button className="btn ghost" onClick={() => setConfirm(null)}>Keep</button></div>
        </Modal>
      )}
    </>
  );
}

function Users() {
  const [role, setRole] = useState('parent');
  const { data, error, loading, reload } = useLoad(() => api('/admin/users' + qs({ role })), [role]);
  const toggle = async (u) => {
    await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { isBlocked: !u.isBlocked } });
    reload();
  };
  return (
    <div className="stack">
      <div className="row">{['parent', 'tutor', 'admin'].map((r) => <button key={r} className={`btn sm ${role === r ? '' : 'ghost'}`} onClick={() => setRole(r)}>{r}s</button>)}</div>
      {error && <Alert kind="err">{error}</Alert>}
      {loading && <p className="muted">Loading…</p>}
      {data && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.name} {u.isBlocked && <span className="badge err">Blocked</span>}</td>
                  <td className="mono">{u.phone}</td><td>{u.email}</td><td>{ago(u.createdAt)}</td>
                  <td>{u.role !== 'admin' && <button className={`btn sm ${u.isBlocked ? 'ghost' : 'danger'}`} onClick={() => toggle(u)}>{u.isBlocked ? 'Unblock' : 'Block'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Settings() {
  const { data, error } = useLoad(() => api('/admin/settings'), []);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState({});
  useEffect(() => {
    if (data) {
      const { registrationFee, upiId, upiName, supportPhone, supportEmail } = data.settings;
      setF({ registrationFee, upiId, upiName, supportPhone, supportEmail });
    }
  }, [data]);
  if (error) return <Alert kind="err">{error}</Alert>;
  if (!f) return <p className="muted">Loading…</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setMsg({});
    try {
      await api('/admin/settings', { method: 'PUT', body: f });
      setMsg({ ok: 'Saved. New tutors will see these payment details immediately.' });
    } catch (err) {
      setMsg({ err: err.message });
    }
  };
  return (
    <div className="stack" style={{ gap: 24 }}>
      <form className="panel stack" style={{ maxWidth: 620 }} onSubmit={save}>
        <h3>Registration fee &amp; UPI</h3>
        <div className="form-grid">
          <div className="field"><label htmlFor="sf">Tutor registration fee (₹)</label>
            <input id="sf" type="number" min="0" required value={f.registrationFee} onChange={set('registrationFee')} /></div>
          <div className="field"><label htmlFor="su">Your UPI ID</label>
            <input id="su" required value={f.upiId} onChange={set('upiId')} placeholder="name@okicici" /></div>
          <div className="field"><label htmlFor="sn">Name shown on UPI</label>
            <input id="sn" value={f.upiName} onChange={set('upiName')} /></div>
          <div className="field"><label htmlFor="sp">Support phone</label>
            <input id="sp" value={f.supportPhone} onChange={set('supportPhone')} /></div>
          <div className="field full"><label htmlFor="se">Support email</label>
            <input id="se" type="email" value={f.supportEmail} onChange={set('supportEmail')} /></div>
        </div>
        <p className="small muted">Changing the fee affects new payment submissions only. Payments already submitted keep the amount they were made for.</p>
        <Alert kind="ok">{msg.ok}</Alert>
        <Alert kind="err">{msg.err}</Alert>
        <button className="btn">Save settings</button>
      </form>
      <ChangePassword />
    </div>
  );
}

const TABS = [['overview', 'Overview'], ['payments', 'Payments'], ['tutors', 'Tutors'], ['requirements', 'Requirements'], ['users', 'Users'], ['settings', 'Settings']];

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const go = (t) => setParams({ tab: t });
  return (
    <div className="wrap page-pad stack" style={{ gap: 22 }}>
      <div><p className="eyebrow">Admin panel</p><h1 style={{ fontSize: '1.9rem' }}>TutorSetu admin</h1></div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)}>{l}</button>)}
      </div>
      {tab === 'overview' && <Overview go={go} />}
      {tab === 'payments' && <Payments />}
      {tab === 'tutors' && <Tutors />}
      {tab === 'requirements' && <Requirements />}
      {tab === 'users' && <Users />}
      {tab === 'settings' && <Settings />}
    </div>
  );
}
