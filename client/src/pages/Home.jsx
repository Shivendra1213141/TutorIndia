import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { LEVELS, BOARDS, SUBJECTS, CITIES as CITY_NAMES } from '../lib/constants.js';
import { BRAND, REGION, CITIES, SUBJECT_PAGES, LEVEL_PAGES, homeFaqs } from '../lib/site.js';
import { Seo, ldFaq, useSiteUrl } from '../lib/ssr.jsx';
import { useLoad, TutorCard, Avatar, Photo, Icon, Faq } from '../components/ui.jsx';
import { useSettings } from '../components/Layout.jsx';

export function SearchBar({ initial = {} }) {
  const nav = useNavigate();
  const [f, setF] = useState({ level: '', board: '', subject: '', q: '', ...initial });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    nav(`/tutors?${p}`);
  };
  return (
    <form className="search" role="search" onSubmit={submit}>
      <div className="field"><label htmlFor="sLevel">Class</label>
        <select id="sLevel" value={f.level} onChange={set('level')}>
          <option value="">Any class</option>
          {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id === 'comp' ? 'JEE / NEET' : l.label}</option>)}
        </select></div>
      <div className="field"><label htmlFor="sBoard">Board</label>
        <select id="sBoard" value={f.board} onChange={set('board')}>
          <option value="">Any board</option>
          {BOARDS.map((b) => <option key={b}>{b}</option>)}
        </select></div>
      <div className="field"><label htmlFor="sSubject">Subject</label>
        <select id="sSubject" value={f.subject} onChange={set('subject')}>
          <option value="">Any subject</option>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select></div>
      <div className="field"><label htmlFor="sQ">City, area or pin code</label>
        <input id="sQ" list="cityList" value={f.q} onChange={set('q')} placeholder="e.g. Lucknow or 208002" />
        <datalist id="cityList">{CITY_NAMES.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
      <button className="btn sun" type="submit"><Icon name="Search" size={18} /> Find tutors</button>
    </form>
  );
}

export const TESTIMONIALS = [
  { who: 'Parent', text: 'Found a verified UP Board Physics tutor for my Class 12 son in Lucknow within 24 hours. Very safe and professional.', name: 'Sunita Mishra', sub: 'Parent · Gomti Nagar, Lucknow' },
  { who: 'Student', text: 'My JEE Mains numerical solving speed doubled after getting a dedicated home tutor through this portal.', name: 'Aditya Yadav', sub: 'JEE dropper · Kanpur' },
  { who: 'Tutor', text: 'As a qualified teacher, I found 3 high-paying home tuitions within 5 km of my location without paying huge upfront brokerage fees.', name: 'Rekha Kushwaha', sub: 'M.Sc. Chemistry · Prayagraj' },
];

export const FEATURES = [
  ['ShieldCheck', 'Aadhaar-verified tutors', 'Every tutor\'s identity is checked by our team before their profile goes live.'],
  ['CalendarCheck', 'Free demo class', 'Meet the tutor and see how they teach before you pay anything.'],
  ['MapPin', 'Tutors near your home', 'Search by locality or pin code and find tutors who can reach you.'],
  ['HandCoins', 'No commission', 'Parents pay the tutor directly. Fees stay fair for both sides.'],
];

export function Testimonials() {
  return (
    <div className="quotes">
      {TESTIMONIALS.map((q) => (
        <blockquote key={q.who}>
          <span className="who">{q.who}</span>
          <p>{q.text}</p>
          <footer><Avatar name={q.name} /><span>{q.name}<small>{q.sub}</small></span></footer>
        </blockquote>
      ))}
    </div>
  );
}

export function CtaBand({ title = 'Book a free demo class with a verified home tutor', text = 'Post your requirement in a minute. Tutors near you apply, and you choose whom to call.' }) {
  return (
    <div className="cta">
      <Photo name="teacher" w={1600} alt="" />
      <div className="inner">
        <div><h2>{title}</h2><p>{text}</p></div>
        <div className="row">
          <Link className="btn sun" to="/post-requirement">Post your requirement</Link>
          <Link className="btn ghost-white" to="/tutors">Browse tutors</Link>
        </div>
      </div>
    </div>
  );
}

const FEATURED = '/tutors?limit=6';
export const ssr = () => [FEATURED];

export default function Home() {
  const siteUrl = useSiteUrl();
  const featured = useLoad(() => api(FEATURED), [], FEATURED);
  const settings = useSettings();
  const faqs = homeFaqs(settings?.registrationFee);

  const org = {
    '@type': 'EducationalOrganization',
    '@id': `${siteUrl}/#org`,
    name: BRAND,
    url: `${siteUrl}/`,
    description: `Home tuition marketplace connecting parents with Aadhaar-verified home tutors for KG to Class 12, UP Board, CBSE, ICSE, JEE and NEET in ${REGION}.`,
    areaServed: CITIES.map((c) => ({ '@type': 'City', name: c.name })),
    ...(settings?.supportPhone ? { telephone: settings.supportPhone } : {}),
    ...(settings?.supportEmail ? { email: settings.supportEmail } : {}),
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: BRAND,
    publisher: { '@id': `${siteUrl}/#org` },
    potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/tutors?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };

  return (
    <>
      <Seo
        title={`Home Tuition & Home Tutors Near You – KG to 12, JEE, NEET`}
        description={`Find Aadhaar-verified home tutors for UP Board, CBSE, ICSE, JEE and NEET in ${CITIES.slice(0, 4).map((c) => c.name).join(', ')} and across ${REGION}. Free demo class. Post your tuition requirement free.`}
        path="/"
        jsonLd={[org, website, ldFaq(faqs)]}
      />

      <section className="photo-hero">
        <Photo name="hero" eager w={1800} />
        <div className="wrap">
          <p className="hi">सही ट्यूटर, आपके मोहल्ले में</p>
          <h1>Home tuition with <em>verified home tutors</em> near you</h1>
          <p className="lede">Find a private home tutor for KG to Class 12, UP Board, CBSE, ICSE, JEE and NEET. Every tutor's Aadhaar is checked, and the first demo class is free.</p>
          <div className="hero-points">
            <span><Icon name="ShieldCheck" size={18} /> Aadhaar verified</span>
            <span><Icon name="CalendarCheck" size={18} /> Free demo class</span>
            <span><Icon name="HandCoins" size={18} /> No commission</span>
          </div>
          <SearchBar />
          <div className="chips" aria-label="Boards covered"><span>UP Board</span><span>CBSE</span><span>ICSE</span><span>JEE Main / Adv.</span><span>NEET-UG</span></div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="center-head">
            <p className="eyebrow">Subjects</p>
            <h2>Home tuition for every subject</h2>
            <p>Private tutors for school subjects and competitive exams, from early reading to JEE Physics.</p>
          </div>
          <div className="subjects">
            {SUBJECT_PAGES.slice(0, 9).map((s) => (
              <Link key={s.slug} className="subject" to={`/tuition/${s.slug}`}>
                <span className="ico"><Icon name={s.icon} size={26} /></span>
                <div>
                  <span className="cls">{s.classes}</span>
                  <h3>{s.name} {s.slug === 'all-subjects' ? 'tuition' : 'home tutor'}</h3>
                  <p>{s.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 36 }}>
            <Link className="btn sun" to="/post-requirement">Book your free demo class</Link>
          </div>
        </div>
      </section>

      <section className="block soft">
        <div className="wrap">
          <div className="head">
            <div><p className="eyebrow">By class</p><h2>Tutors for every stage of school</h2></div>
            <p>Each stage needs a different kind of teacher. Pick one to see tutors who specialise in it.</p>
          </div>
          <div className="levels">
            {LEVEL_PAGES.map((l) => (
              <Link key={l.id} className="level" to={`/tutors?level=${l.id}`}>
                <Photo name={l.image} w={700} />
                <div className="body">
                  <span className="cls">{l.label}</span>
                  <h3>{l.title}</h3>
                  <ul>{l.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap split">
          <div className="collage">
            <Photo name="homework" w={900} />
            <Photo name="classroom" w={700} />
            <Photo name="senior" w={700} />
          </div>
          <div className="stack" style={{ gap: 18 }}>
            <p className="eyebrow">Why parents choose {BRAND}</p>
            <h2>Better marks start with the right tutor at home</h2>
            <p className="muted">One-to-one home tuition gives your child full attention, a teacher who follows their school syllabus, and time to clear every doubt. We help you find that tutor quickly and safely.</p>
            <div className="features">
              {FEATURES.map(([icon, title, text]) => (
                <div className="feature" key={title}>
                  <span className="ico"><Icon name={icon} size={22} /></span>
                  <div><h4>{title}</h4><p>{text}</p></div>
                </div>
              ))}
            </div>
            <div className="row"><Link className="btn" to="/tutors">Find a tutor near you</Link></div>
          </div>
        </div>
      </section>

      <section className="block soft">
        <div className="wrap">
          <div className="head">
            <div><p className="eyebrow">Top rated</p><h2>Home tutors parents trust</h2></div>
            <Link className="btn ghost" to="/tutors">See all tutors</Link>
          </div>
          <div className="grid3">
            {featured.loading && <p className="muted">Loading tutors…</p>}
            {featured.error && <div className="empty">{featured.error}</div>}
            {featured.data?.items.length === 0 && (
              <div className="empty">Tutors will appear here once their profiles are approved. <Link to="/become-a-tutor">Register as a tutor</Link>.</div>
            )}
            {featured.data?.items.map((t) => <TutorCard key={t.id} t={t} />)}
          </div>
        </div>
      </section>

      <section className="block band">
        <div className="wrap split top">
          <div>
            <p className="eyebrow">For parents &amp; students</p>
            <h2>Tell us what you need. Matched tutors apply.</h2>
            <ol className="steps">
              <li><div><h3>Post your requirement</h3><p>Class, board, subjects, locality and monthly budget.</p></div></li>
              <li><div><h3>Review tutors who apply</h3><p>See their profile and rating, then shortlist the ones you like.</p></div></li>
              <li><div><h3>Take a free demo class</h3><p>Pay the tutor directly only once you're happy.</p></div></li>
            </ol>
            <Link className="btn sun" style={{ marginTop: 24 }} to="/post-requirement">Post your requirement</Link>
          </div>
          <div>
            <p className="eyebrow">For tutors</p>
            <h2>Find home tuitions near you. No commission.</h2>
            <ol className="steps">
              <li><div><h3>Create your profile</h3><p>Subjects, classes, boards and the pin codes you can travel to.</p></div></li>
              <li><div><h3>Upload Aadhaar &amp; pay ₹{settings?.registrationFee ?? 300} once</h3><p>Pay by UPI and upload the screenshot. We approve your profile.</p></div></li>
              <li><div><h3>Apply to tuitions</h3><p>Browse open requirements and apply. Keep 100% of what parents pay you.</p></div></li>
            </ol>
            <Link className="btn ghost-white" style={{ marginTop: 24 }} to="/become-a-tutor">Become a tutor</Link>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head">
            <div><p className="eyebrow">Cities</p><h2>Home tuition in your city</h2></div>
            <Link className="btn ghost" to="/home-tuition">All cities</Link>
          </div>
          <div className="cities">
            {CITIES.map((c) => (
              <Link key={c.slug} className="city" to={`/home-tuition/${c.slug}`}>
                <b>{c.name}</b><span>Home tutors in {c.areas.slice(0, 2).join(', ')}…</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block soft">
        <div className="wrap">
          <div className="center-head"><p className="eyebrow">Reviews</p><h2>What parents, students and tutors say</h2></div>
          <Testimonials />
        </div>
      </section>

      <section className="block">
        <div className="wrap split top">
          <div className="stack" style={{ gap: 14 }}>
            <p className="eyebrow">FAQ</p>
            <h2>Questions about home tuition</h2>
            <p className="muted">Can't find your answer? Post your requirement and we'll help you find the right tutor.</p>
            <Photo name="online" w={900} className="rounded" />
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      <section className="wrap" style={{ paddingTop: 8 }}>
        <CtaBand />
      </section>
    </>
  );
}
