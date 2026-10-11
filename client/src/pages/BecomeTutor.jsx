import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Alert } from '../components/ui.jsx';
import TutorProfileFields, { EMPTY_PROFILE, toPayload, checkProfile } from '../components/TutorProfileFields.jsx';
import { AccountFields } from './Auth.jsx';
import { Seo } from '../lib/ssr.jsx';
import { useSettings } from '../components/Layout.jsx';

export default function BecomeTutor() {
  const { user, signIn } = useAuth();
  const nav = useNavigate();
  const settings = useSettings();
  const fee = { data: settings };
  const [step, setStep] = useState(1);
  const [acct, setAcct] = useState({ name: '', phone: '', email: '', password: '' });
  const [p, setP] = useState(EMPTY_PROFILE);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const setA = (k) => (e) => setAcct({ ...acct, [k]: e.target.value });
  const amount = fee.data ? `₹${fee.data.registrationFee}` : 'a small';

  const next = (e) => {
    e.preventDefault();
    setErr('');
    setStep(2);
    window.scrollTo(0, 0);
  };
  const submit = async (e) => {
    e.preventDefault();
    const problem = checkProfile(p);
    if (problem) return setErr(problem);
    setBusy(true);
    setErr('');
    try {
      const d = await api('/auth/register-tutor', { method: 'POST', body: { ...acct, ...toPayload(p) } });
      signIn(d);
      nav('/dashboard/tutor?welcome=1', { replace: true });
    } catch (e2) {
      setErr(e2.message);
      if (/email|phone|password|name/i.test(e2.message)) setStep(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Become a Home Tutor – Get Home Tuition Jobs Near You" description={`Register as a home tutor, upload your Aadhaar and pay a one-time ₹${settings?.registrationFee ?? 300} fee. Get tuition requests from parents near you. No commission on your fees.`} />
      <section className="page-hero"><div className="wrap">
        <p className="eyebrow">For tutors</p>
        <h1>Get home tuitions near you</h1>
        <p>Create your profile, upload your Aadhaar and pay a one-time {amount} registration fee by UPI. Once approved, apply to any tuition. We take no commission on your fees.</p>
      </div></section>

      <div className="wrap page-pad split">
        <div className="stack">
          {user ? (
            <div className="panel stack">
              <p>You're logged in as <b>{user.name}</b> ({user.role}).</p>
              {user.role === 'tutor' ? <Link className="btn" to="/dashboard/tutor">Go to your tutor dashboard</Link> : <p className="muted">To register as a tutor, log out and create a tutor account with a different email.</p>}
            </div>
          ) : step === 1 ? (
            <form className="panel stack" onSubmit={next}>
              <p className="eyebrow">Step 1 of 2 · Account</p>
              <div className="form-grid"><AccountFields f={acct} set={setA} /></div>
              <Alert kind="err">{err}</Alert>
              <button className="btn block">Continue</button>
              <p className="small muted">Already registered? <Link to="/login">Log in</Link></p>
            </form>
          ) : (
            <form className="panel stack" onSubmit={submit}>
              <div className="row between"><p className="eyebrow">Step 2 of 2 · Teaching profile</p><button type="button" className="linkbtn" onClick={() => setStep(1)}>Back</button></div>
              <TutorProfileFields p={p} setP={setP} />
              <Alert kind="err">{err}</Alert>
              <button className="btn block" disabled={busy}>{busy ? 'Creating profile…' : 'Create profile'}</button>
              <p className="small muted">Next you'll upload your Aadhaar and pay the registration fee from your dashboard.</p>
            </form>
          )}
        </div>
        <div className="stack">
          <p className="eyebrow">How it works</p>
          <ol className="steps">
            <li><div><h3>Create your profile</h3><p>Subjects, classes, boards, and the pin codes you can travel to.</p></div></li>
            <li><div><h3>Upload your Aadhaar</h3><p>A photo or PDF of your Aadhaar card. Only our admin team sees it, and we store just the last 4 digits of the number.</p></div></li>
            <li><div><h3>Pay {amount} by UPI</h3><p>Pay to our UPI ID from any app (GPay, PhonePe, Paytm), then upload the screenshot and transaction ID.</p></div></li>
            <li><div><h3>Get approved and apply</h3><p>We check your payment and Aadhaar, usually within 24 hours. Then your profile goes live and you can apply to tuitions.</p></div></li>
          </ol>
          <Alert kind="info">The registration fee is one-time. Parents pay you directly for classes, and TutorSetu takes no cut.</Alert>
        </div>
      </div>
    </>
  );
}
