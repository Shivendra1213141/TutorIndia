import { Link } from 'react-router-dom';
import { BRAND } from '../lib/site.js';
import { Seo } from '../lib/ssr.jsx';
import { Photo } from '../components/ui.jsx';
import { useSettings } from '../components/Layout.jsx';
import { Testimonials, CtaBand } from './Home.jsx';

export function HowItWorks() {
  const settings = useSettings();
  const amount = settings ? `₹${settings.registrationFee}` : 'a one-time';
  return (
    <>
      <Seo title="How It Works – Find a Home Tutor or Get Tuition Jobs" description={`How ${BRAND} works for parents and tutors: post a requirement or search, book a free demo, and pay the tutor directly. Tutors pay a one-time registration fee and keep 100% of their fees.`} />
      <section className="page-hero"><div className="wrap"><h1>How {BRAND} works</h1><p>A local marketplace for home tuition. Parents post or search; tutors register and apply.</p></div></section>
      <section className="block">
        <div className="wrap split top">
          <div>
            <p className="eyebrow">Parents &amp; students</p>
            <h2>Free for parents</h2>
            <ol className="steps">
              <li><div><h3>Search or post a requirement</h3><p>Filter by class, board, subject and pin code, or post what you need and let tutors apply.</p></div></li>
              <li><div><h3>Check the profile</h3><p>Every listed tutor has an Aadhaar check by our team. Ratings come only from parents who booked through us.</p></div></li>
              <li><div><h3>Book a free demo</h3><p>The tutor gets your number and calls to fix a time. Pay the tutor directly only if you continue.</p></div></li>
              <li><div><h3>Rate the tutor</h3><p>Your review helps the next parent choose.</p></div></li>
            </ol>
            <Link className="btn sun" style={{ marginTop: 22 }} to="/post-requirement">Post requirement</Link>
          </div>
          <div>
            <p className="eyebrow">Tutors</p>
            <h2>{amount} registration, no commission</h2>
            <ol className="steps">
              <li><div><h3>Create your profile</h3><p>Subjects, classes, boards, fee and the pin codes you cover.</p></div></li>
              <li><div><h3>Upload Aadhaar</h3><p>Seen only by our admin team. We keep just the last 4 digits.</p></div></li>
              <li><div><h3>Pay by UPI and upload the screenshot</h3><p>Use any UPI app. Enter the UTR so we can match it.</p></div></li>
              <li><div><h3>Go live and apply</h3><p>After approval, parents can find you and you can apply to every open tuition.</p></div></li>
            </ol>
            <Link className="btn" style={{ marginTop: 22 }} to="/become-a-tutor">Become a tutor</Link>
          </div>
        </div>
      </section>
      <section className="block soft"><div className="wrap"><Testimonials /></div></section>
      <section className="wrap" style={{ paddingTop: 56 }}><CtaBand /></section>
    </>
  );
}

export function Contact() {
  const data = useSettings();
  return (
    <>
      <Seo title="Contact Us" description={`Contact ${BRAND} for help finding a home tutor, tutor registration or payments.`} />
      <div className="wrap page-pad split">
        <div className="stack">
          <h1>Contact us</h1>
          <p className="muted">Questions about a tutor, a payment or your account? Reach us here.</p>
          <div className="panel stack">
            {data?.supportPhone && <p>Phone / WhatsApp: <b className="mono">{data.supportPhone}</b></p>}
            {data?.supportEmail && <p>Email: <b>{data.supportEmail}</b></p>}
            {data && !data.supportPhone && !data.supportEmail && <p className="muted">Support contact details will be added soon.</p>}
            <p className="small muted">For payment questions, keep your UPI transaction ID (UTR) ready.</p>
          </div>
          <div className="row"><Link className="btn sun" to="/post-requirement">Post a requirement</Link><Link className="btn ghost" to="/become-a-tutor">Become a tutor</Link></div>
        </div>
        <Photo name="online" w={900} className="rounded" />
      </div>
    </>
  );
}

export function Terms() {
  return (
    <div className="wrap page-pad narrow stack">
      <Seo title="Terms & Privacy" description={`Terms of use and privacy policy for ${BRAND}: what we verify, fees and how we handle your data.`} />
      <h1>Terms &amp; privacy</h1>
      <p className="muted">Replace this summary with terms drafted by a lawyer before launch.</p>
      <div className="stack">
        <h3>What we verify</h3>
        <p>We check each tutor's Aadhaar card against their name. Qualifications and experience are shown as stated by the tutor and are not verified by {BRAND}. Parents should check certificates during the demo class.</p>
        <h3>Fees</h3>
        <p>Tutors pay a one-time registration fee to be listed. {BRAND} does not charge parents and takes no commission on tuition fees, which are paid directly to the tutor.</p>
        <h3>Your data</h3>
        <p>Aadhaar images and payment screenshots are visible only to administrators. We store only the last 4 digits of the Aadhaar number. Parents' phone numbers are shared only with tutors they shortlist or book a demo with.</p>
        <h3>Conduct</h3>
        <p>Accounts that misrepresent identity or behave inappropriately will be suspended.</p>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="wrap page-pad narrow stack">
      <Seo title="Page not found" description="This page does not exist." noindex />
      <h1>Page not found</h1>
      <p className="muted">The link may be old or mistyped.</p>
      <div className="row"><Link className="btn" to="/">Go home</Link><Link className="btn ghost" to="/tutors">Find tutors</Link><Link className="btn ghost" to="/home-tuition">Home tuition by city</Link></div>
    </div>
  );
}
