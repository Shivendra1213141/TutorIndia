import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { inr, ago, LEVEL_LABEL } from '../lib/constants.js';
import { useLoad, Alert, StatusBadge, Avatar, modeLabel } from '../components/ui.jsx';
import TutorProfileFields, { toPayload, checkProfile } from '../components/TutorProfileFields.jsx';
import { ChangePassword } from './ParentDashboard.jsx';

function CopyText({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* clipboard blocked; text is selectable */
    }
  };
  return <button type="button" className="btn ghost sm" onClick={copy}>{done ? 'Copied' : 'Copy'}</button>;
}

function AadhaarStep({ profile, reload }) {
  const [last4, setLast4] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);
  const s = profile.aadhaarStatus;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({});
    const fd = new FormData();
    fd.append('last4', last4);
    fd.append('aadhaar', file);
    try {
      await api('/tutors/me/aadhaar', { method: 'POST', form: fd });
      await reload();
    } catch (err) {
      setMsg({ err: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`check ${s === 'verified' ? 'done' : s === 'pending' ? 'pending' : ''}`}>
      <span className="dot">{s === 'verified' ? '✓' : '2'}</span>
      <div className="stack" style={{ gap: 10 }}>
        <div className="row between"><h3>Aadhaar verification</h3><StatusBadge s={s} /></div>
        {s === 'verified' && <p className="muted">Verified. Your profile shows the "Aadhaar verified" badge.</p>}
        {s === 'pending' && <p className="muted">Uploaded (ending {profile.aadhaarLast4}). Our team will check it shortly.</p>}
        {s === 'rejected' && <Alert kind="err">Not accepted: {profile.aadhaarNote || 'please upload a clearer image.'} Upload again below.</Alert>}
        {(s === 'not_submitted' || s === 'rejected') && (
          <form className="stack" onSubmit={submit}>
            <p className="muted small">Upload a clear photo or PDF of the front of your Aadhaar card. Only admins can see it. We store only the last 4 digits of the number.</p>
            <div className="form-grid">
              <div className="field"><label htmlFor="a4">Last 4 digits of Aadhaar</label>
                <input id="a4" required inputMode="numeric" pattern="\d{4}" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value)} /></div>
              <div className="field"><label htmlFor="af">Aadhaar card (JPG, PNG or PDF, max 5 MB)</label>
                <input id="af" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0])} /></div>
            </div>
            <Alert kind="err">{msg.err}</Alert>
            <button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Upload Aadhaar'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function PaymentStep({ profile, payments, fee, reload }) {
  const [f, setF] = useState({ upiRef: '', payerUpi: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);
  const pending = payments.find((p) => p.status === 'pending');
  const lastRejected = !pending && payments.find((p) => p.status === 'rejected');
  const upiLink = `upi://pay?pa=${encodeURIComponent(fee.upiId)}&pn=${encodeURIComponent(fee.upiName || 'TutorSetu')}&am=${fee.amount}&cu=INR&tn=${encodeURIComponent('TutorSetu tutor registration')}`;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({});
    const fd = new FormData();
    fd.append('upiRef', f.upiRef.trim());
    fd.append('payerUpi', f.payerUpi.trim());
    fd.append('screenshot', file);
    try {
      await api('/payments', { method: 'POST', form: fd });
      await reload();
    } catch (err) {
      setMsg({ err: err.message });
    } finally {
      setBusy(false);
    }
  };

  const state = profile.feePaid ? 'done' : pending ? 'pending' : '';
  return (
    <div className={`check ${state}`}>
      <span className="dot">{profile.feePaid ? '✓' : '3'}</span>
      <div className="stack" style={{ gap: 12 }}>
        <div className="row between"><h3>Registration fee</h3>{profile.feePaid ? <StatusBadge s="approved" /> : pending ? <StatusBadge s="pending" /> : <span className="badge warn">{inr(fee.amount)} due</span>}</div>
        {profile.feePaid && <p className="muted">Payment approved. Thank you.</p>}
        {pending && <p className="muted">We received your payment proof (UTR <span className="mono">{pending.upiRef}</span>, {ago(pending.createdAt)}). We'll approve it after matching it with our UPI account.</p>}
        {!profile.feePaid && !pending && (
          <>
            {lastRejected && <Alert kind="err">Your last payment proof was not accepted: {lastRejected.note}. Please submit again.</Alert>}
            <div className="paybox">
              <div className="qr"><QRCodeSVG value={upiLink} size={148} /></div>
              <div className="stack" style={{ gap: 6, minWidth: 0 }}>
                <span className="eyebrow">Pay exactly</span>
                <b style={{ fontFamily: 'var(--f-display)', fontSize: '2rem' }}>{inr(fee.amount)}</b>
                <span className="eyebrow">To UPI ID</span>
                <div className="row"><span className="upi-id">{fee.upiId}</span><CopyText text={fee.upiId} /></div>
                {fee.upiName && <span className="small muted">Name: {fee.upiName}</span>}
                <a className="btn sm" href={upiLink} style={{ alignSelf: 'flex-start' }}>Open UPI app</a>
                <span className="small muted">Scan the QR with GPay, PhonePe, Paytm or BHIM. On a phone, tap "Open UPI app".</span>
              </div>
            </div>
            <form className="stack" onSubmit={submit}>
              <p className="small muted">After paying, upload the screenshot and enter the UTR / UPI transaction ID shown in your app.</p>
              <div className="form-grid">
                <div className="field"><label htmlFor="utr">UTR / transaction ID</label>
                  <input id="utr" required pattern="[A-Za-z0-9]{8,30}" title="8–30 letters or digits" value={f.upiRef} onChange={(e) => setF({ ...f, upiRef: e.target.value })} placeholder="e.g. 427812345678" /></div>
                <div className="field"><label htmlFor="pupi">Your UPI ID (optional)</label>
                  <input id="pupi" value={f.payerUpi} onChange={(e) => setF({ ...f, payerUpi: e.target.value })} placeholder="name@okaxis" /></div>
                <div className="field full"><label htmlFor="shot">Payment screenshot (JPG, PNG or PDF, max 5 MB)</label>
                  <input id="shot" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0])} /></div>
              </div>
              <Alert kind="err">{msg.err}</Alert>
              <button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Submit payment proof'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Overview({ data, reload }) {
  const { profile, payments, fee } = data;
  return (
    <div className="stack">
      {profile.status === 'active' && <Alert kind="ok">Your profile is live. Parents can find you and you can <Link to="/tuitions">apply to tuitions</Link>. <Link to={`/tutors/${profile.id}`}>View your public profile</Link>.</Alert>}
      {profile.status === 'suspended' && <Alert kind="err">Your profile has been suspended. Contact support for help.</Alert>}
      {profile.status !== 'active' && profile.status !== 'suspended' && (
        <Alert kind="warn">Complete both steps below. Your profile goes live once our team approves your Aadhaar and payment.</Alert>
      )}
      <div className="check done"><span className="dot">✓</span><div className="row between"><h3>Teaching profile</h3><StatusBadge s="completed" /></div></div>
      <AadhaarStep profile={profile} reload={reload} />
      <PaymentStep profile={profile} payments={payments} fee={fee} reload={reload} />
    </div>
  );
}

function Applications() {
  const { data, error, loading } = useLoad(() => api('/applications/mine'), []);
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <Alert kind="err">{error}</Alert>;
  if (!data.items.length) return <div className="empty">You haven't applied to any tuitions yet. <Link to="/tuitions">Browse tuition jobs</Link>.</div>;
  return (
    <div className="list">
      {data.items.map((a) => (
        <div className="list-item" key={a.id}>
          <div className="stack" style={{ gap: 4 }}>
            <h4>{a.requirement.studentClass} · {a.requirement.subjects.join(', ')} · {a.requirement.board}</h4>
            <p className="sub">{[a.requirement.area, a.requirement.city].filter(Boolean).join(', ')} · {modeLabel(a.requirement.mode)} · applied {ago(a.at)}</p>
            {a.parent ? (
              <Alert kind="ok">Shortlisted. Call {a.parent.name}: <b className="mono">{a.parent.phone}</b></Alert>
            ) : a.status === 'applied' ? <p className="small muted">The parent's number appears here if they shortlist you.</p> : null}
            {a.requirement.status === 'closed' && <p className="small muted">The parent has closed this requirement.</p>}
          </div>
          <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
            <div className="fee">{inr(a.requirement.budget)}<small>per month</small></div>
            <StatusBadge s={a.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Demos() {
  const { data, error, loading, reload } = useLoad(() => api('/demos/mine'), []);
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
  if (!data.items.length) return <div className="empty">No demo requests yet. Parents can book a demo from your public profile.</div>;
  return (
    <div className="stack">
      <Alert kind="err">{err}</Alert>
      <div className="list">
        {data.items.map((d) => (
          <div className="list-item" key={d.id}>
            <div className="stack" style={{ gap: 4 }}>
              <h4>{d.parent?.name} · {d.studentClass} {d.subject}</h4>
              <p className="sub">Phone: <b className="mono">{d.parent?.phone}</b>{d.preferredTime ? ` · prefers ${d.preferredTime}` : ''} · {ago(d.at)}</p>
              {d.message && <p className="small">"{d.message}"</p>}
            </div>
            <div className="stack" style={{ gap: 8, alignItems: 'flex-end' }}>
              <StatusBadge s={d.status} />
              {d.status === 'requested' && (
                <div className="row"><button className="btn sm ok" onClick={() => act(d.id, 'accepted')}>Accept</button><button className="btn sm danger" onClick={() => act(d.id, 'declined')}>Decline</button></div>
              )}
              {d.status === 'accepted' && <button className="btn sm ghost" onClick={() => act(d.id, 'completed')}>Mark demo done</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProfile({ profile, reload }) {
  const [p, setP] = useState({ ...profile, servicePincodes: (profile.servicePincodes || []).join(', ') });
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const problem = checkProfile(p);
    if (problem) return setMsg({ err: problem });
    setBusy(true);
    setMsg({});
    try {
      const { gender, qualification, experienceYears, about, subjects, levels, boards, city, area, pincode, servicePincodes, mode, feeMin } = p;
      await api('/tutors/me/profile', { method: 'PUT', body: toPayload({ gender, qualification, experienceYears, about, subjects, levels, boards, city, area, pincode, servicePincodes, mode, feeMin }) });
      setMsg({ ok: 'Profile saved.' });
      reload();
    } catch (err) {
      setMsg({ err: err.message });
    } finally {
      setBusy(false);
    }
  };
  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await api('/tutors/me/photo', { method: 'POST', form: fd });
      setMsg({ ok: 'Photo updated.' });
      reload();
    } catch (err) {
      setMsg({ err: err.message });
    }
  };

  return (
    <form className="panel stack" onSubmit={save}>
      <div className="row" style={{ gap: 16 }}>
        <Avatar name={profile.name} photo={profile.photo} size="lg" />
        <div className="field"><label htmlFor="ph">Profile photo (JPG or PNG)</label>
          <input id="ph" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} /></div>
      </div>
      <TutorProfileFields p={p} setP={setP} />
      <Alert kind="ok">{msg.ok}</Alert>
      <Alert kind="err">{msg.err}</Alert>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
}

const TABS = [['overview', 'Overview'], ['applications', 'My applications'], ['demos', 'Demo requests'], ['profile', 'Edit profile'], ['account', 'Account']];

export default function TutorDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const { data, error, loading, reload } = useLoad(() => api('/tutors/me/profile'), []);

  return (
    <div className="wrap page-pad stack" style={{ gap: 22 }}>
      <div className="row between">
        <div><p className="eyebrow">Tutor dashboard</p><h1 style={{ fontSize: '1.9rem' }}>Namaste, {user.name.split(' ')[0]}</h1></div>
        {data && <StatusBadge s={data.profile.status} />}
      </div>
      {params.get('welcome') && <Alert kind="ok">Profile created. Two steps left: upload your Aadhaar and pay the registration fee.</Alert>}
      <div className="tabs" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}>{l}</button>
        ))}
      </div>
      {loading && !data && <p className="muted">Loading…</p>}
      {error && <Alert kind="err">{error}</Alert>}
      {data && tab === 'overview' && <Overview data={data} reload={reload} />}
      {data && tab === 'applications' && <Applications />}
      {data && tab === 'demos' && <Demos />}
      {data && tab === 'profile' && <EditProfile profile={data.profile} reload={reload} />}
      {tab === 'account' && <ChangePassword />}
      {data && tab === 'overview' && data.profile.levels && (
        <p className="small muted">Teaching {data.profile.subjects.join(', ')} · {data.profile.levels.map((l) => LEVEL_LABEL[l]).join(', ')} · {data.profile.city}</p>
      )}
    </div>
  );
}
