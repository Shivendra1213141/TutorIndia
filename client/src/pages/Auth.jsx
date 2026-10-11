import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth, dashboardPath } from '../lib/auth.jsx';
import { Alert } from '../components/ui.jsx';
import { Seo } from '../lib/ssr.jsx';

/** Only allow redirects within this site. */
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);

export function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const d = await api('/auth/login', { method: 'POST', body: f });
      signIn(d);
      nav(safeNext(params.get('next')) || dashboardPath(d.user.role), { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap page-pad narrow" style={{ maxWidth: 440 }}>
      <Seo title="Log in" description="Log in to your parent, tutor or admin account." noindex />
      <form className="panel stack" onSubmit={submit}>
        <h1 style={{ fontSize: '1.8rem' }}>Log in</h1>
        <p className="muted">For parents, tutors and admins.</p>
        <div className="field"><label htmlFor="le">Email</label>
          <input id="le" type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="field"><label htmlFor="lp">Password</label>
          <input id="lp" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <Alert kind="err">{err}</Alert>
        <button className="btn block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="small muted">
          New here? <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`}>Create a parent account</Link> or{' '}
          <Link to="/become-a-tutor">register as a tutor</Link>.
        </p>
      </form>
    </div>
  );
}

export function AccountFields({ f, set }) {
  return (
    <>
      <div className="field"><label htmlFor="aName">Your name</label>
        <input id="aName" required autoComplete="name" value={f.name} onChange={set('name')} /></div>
      <div className="field"><label htmlFor="aPhone">Mobile number</label>
        <input id="aPhone" required inputMode="numeric" pattern="[6-9][0-9]{9}" title="10-digit Indian mobile number" autoComplete="tel-national" value={f.phone} onChange={set('phone')} placeholder="10 digits" /></div>
      <div className="field"><label htmlFor="aEmail">Email</label>
        <input id="aEmail" required type="email" autoComplete="email" value={f.email} onChange={set('email')} /></div>
      <div className="field"><label htmlFor="aPass">Password</label>
        <input id="aPass" required type="password" minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} placeholder="At least 8 characters" /></div>
    </>
  );
}

export function Register() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const d = await api('/auth/register', { method: 'POST', body: f });
      signIn(d);
      nav(safeNext(params.get('next')) || '/dashboard/parent', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap page-pad narrow" style={{ maxWidth: 560 }}>
      <Seo title="Create a parent account" description="Create a free parent account to post tuition requirements and book free demo classes." noindex />
      <form className="panel stack" onSubmit={submit}>
        <h1 style={{ fontSize: '1.8rem' }}>Create a parent account</h1>
        <p className="muted">Free. Post requirements, book demo classes and review tutors.</p>
        <div className="form-grid"><AccountFields f={f} set={set} /></div>
        <Alert kind="err">{err}</Alert>
        <button className="btn block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="small muted">Already have an account? <Link to="/login">Log in</Link>. Are you a tutor? <Link to="/become-a-tutor">Register here</Link>.</p>
      </form>
    </div>
  );
}
