import { Link, useParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { BRAND, REGION, CITIES, SUBJECT_PAGES, cityBySlug, subjectBySlug, cityFaqs } from '../lib/site.js';
import { Seo, ldBreadcrumbs, ldFaq, useSiteUrl } from '../lib/ssr.jsx';
import { useLoad, TutorCard, Photo, Icon, Faq, Breadcrumbs } from '../components/ui.jsx';
import { SearchBar, CtaBand, FEATURES } from './Home.jsx';
import { NotFound } from './Static.jsx';

const tutorsKey = (p) => '/tutors' + qs({ ...p, limit: 9 });
const subjectTitle = (s) => (s.slug === 'all-subjects' ? 'Home Tutor for All Subjects' : `${s.name} Home Tutor`);

function TutorGrid({ k, emptyText }) {
  const { data, loading, error } = useLoad(() => api(k), [k], k);
  return (
    <div className="grid3">
      {loading && <p className="muted">Loading tutors…</p>}
      {error && <div className="empty">{error}</div>}
      {data?.items.length === 0 && (
        <div className="empty">{emptyText} <Link to="/post-requirement">Post your requirement</Link> and tutors near you will apply.</div>
      )}
      {data?.items.map((t) => <TutorCard key={t.id} t={t} />)}
    </div>
  );
}

const service = (siteUrl, name, area, path) => ({
  '@type': 'Service',
  name,
  serviceType: 'Home tuition',
  url: siteUrl + path,
  provider: { '@type': 'EducationalOrganization', name: BRAND, url: `${siteUrl}/` },
  areaServed: area ? { '@type': 'City', name: area } : { '@type': 'State', name: REGION },
  audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
});

/* ---------- /home-tuition ---------- */
export function CitiesIndex() {
  const siteUrl = useSiteUrl();
  return (
    <>
      <Seo
        title={`Home Tuition in ${REGION} – Choose Your City`}
        description={`Find verified home tutors in ${CITIES.map((c) => c.name).join(', ')}. KG to Class 12, UP Board, CBSE, ICSE, JEE and NEET. Free demo class.`}
        jsonLd={[service(siteUrl, `Home tuition in ${REGION}`, null, '/home-tuition'), ldBreadcrumbs(siteUrl, [['Home', '/'], ['Home tuition', '/home-tuition']])]}
      />
      <section className="page-hero">
        <div className="wrap stack" style={{ gap: 10 }}>
          <Breadcrumbs items={[['Home', '/'], ['Home tuition', '/home-tuition']]} />
          <h1>Home tuition in {REGION}</h1>
          <p>Choose your city to see verified home tutors near you, typical fees and the localities our tutors cover.</p>
        </div>
      </section>
      <div className="wrap page-pad stack" style={{ gap: 40 }}>
        <div className="cities">
          {CITIES.map((c) => (
            <Link key={c.slug} className="city" to={`/home-tuition/${c.slug}`}>
              <b>Home tuition in {c.name}</b><span>{c.areas.slice(0, 4).join(', ')}</span>
            </Link>
          ))}
        </div>
        <div className="stack">
          <h2>Popular searches</h2>
          <div className="link-cloud">
            {CITIES.flatMap((c) =>
              ['maths', 'physics', 'english'].map((s) => (
                <Link key={c.slug + s} to={`/home-tuition/${c.slug}/${s}`}>{subjectBySlug(s).name} tutor in {c.name}</Link>
              ))
            )}
          </div>
        </div>
        <CtaBand />
      </div>
    </>
  );
}

/* ---------- /home-tuition/:city ---------- */
export const citySsr = ({ params }) => {
  const c = cityBySlug(params.city);
  return c ? [tutorsKey({ q: c.name })] : { status: 404 };
};

export function CityPage() {
  const { city } = useParams();
  const siteUrl = useSiteUrl();
  const c = cityBySlug(city);
  if (!c) return <NotFound />;
  const path = `/home-tuition/${c.slug}`;
  const faqs = cityFaqs(c);
  const crumbs = [['Home', '/'], ['Home tuition', '/home-tuition'], [c.name, path]];

  return (
    <>
      <Seo
        title={`Home Tuition in ${c.name} – Verified Home Tutors, Class 1–12`}
        description={`Find Aadhaar-verified home tutors in ${c.name} for UP Board, CBSE, ICSE, JEE and NEET. Tutors in ${c.areas.slice(0, 3).join(', ')} and more. Book a free demo class today.`}
        path={path}
        jsonLd={[service(siteUrl, `Home tuition in ${c.name}`, c.name, path), ldBreadcrumbs(siteUrl, crumbs), ldFaq(faqs)]}
      />
      <section className="photo-hero compact">
        <Photo name="hero" eager w={1800} />
        <div className="wrap">
          <Breadcrumbs items={crumbs} />
          <h1>Home tuition in {c.name}</h1>
          <p className="lede">Aadhaar-verified home tutors in {c.name} for KG to Class 12, UP Board, CBSE, ICSE, JEE and NEET. Tutors available in {c.areas.slice(0, 4).join(', ')} and nearby areas.</p>
          <SearchBar initial={{ q: c.name }} />
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head">
            <div><p className="eyebrow">{c.name}</p><h2>Home tutors in {c.name}</h2></div>
            <Link className="btn ghost" to={`/tutors?q=${encodeURIComponent(c.name)}`}>All tutors in {c.name}</Link>
          </div>
          <TutorGrid k={tutorsKey({ q: c.name })} emptyText={`New tutors in ${c.name} are being verified.`} />
        </div>
      </section>

      <section className="block soft">
        <div className="wrap">
          <div className="head"><div><p className="eyebrow">Subjects</p><h2>Find a tutor by subject in {c.name}</h2></div></div>
          <div className="subjects">
            {SUBJECT_PAGES.map((s) => (
              <Link key={s.slug} className="subject" to={`${path}/${s.slug}`}>
                <span className="ico"><Icon name={s.icon} size={24} /></span>
                <div><span className="cls">{s.classes}</span><h3>{s.slug === 'all-subjects' ? 'All-subject' : s.name} tutor in {c.name}</h3></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap split">
          <div className="prose">
            <p className="eyebrow">About</p>
            <h2>Home tuition in {c.name}, made simple</h2>
            <p>Parents in {c.name} use {BRAND} to find private home tutors who teach the exact board and class their child is in. Whether your child studies in a UP Board school or a CBSE or ICSE school, you can search tutors by subject and locality and compare their experience, fees and parent reviews.</p>
            <p>Every tutor listed in {c.name} has had their Aadhaar card checked by our team before their profile went live. You can book a free demo class first and pay the tutor directly only if you are happy.</p>
            <p>Senior students preparing for JEE Main, JEE Advanced or NEET can find subject specialists in Physics, Chemistry, Maths and Biology who teach at home or online.</p>
            <h3>Localities we cover in {c.name}</h3>
            <div className="chips">
              {c.areas.map((a) => <Link key={a} to={`/tutors?q=${encodeURIComponent(a)}`}>{a}</Link>)}
            </div>
          </div>
          <div className="features">
            {FEATURES.map(([icon, title, text]) => (
              <div className="feature" key={title}>
                <span className="ico"><Icon name={icon} size={22} /></span>
                <div><h4>{title}</h4><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block soft">
        <div className="wrap split top">
          <div className="stack" style={{ gap: 12 }}>
            <p className="eyebrow">FAQ</p>
            <h2>Home tuition in {c.name}: common questions</h2>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      <section className="block">
        <div className="wrap stack" style={{ gap: 28 }}>
          <CtaBand title={`Find a home tutor in ${c.name} today`} />
          <div className="stack">
            <h3>Home tuition in other cities</h3>
            <div className="link-cloud">
              {CITIES.filter((x) => x.slug !== c.slug).map((x) => <Link key={x.slug} to={`/home-tuition/${x.slug}`}>Home tuition in {x.name}</Link>)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- /home-tuition/:city/:subject ---------- */
export const citySubjectSsr = ({ params }) => {
  const c = cityBySlug(params.city);
  const s = subjectBySlug(params.subject);
  return c && s ? [tutorsKey({ q: c.name, subject: s.name })] : { status: 404 };
};

export function CitySubjectPage() {
  const { city, subject } = useParams();
  const siteUrl = useSiteUrl();
  const c = cityBySlug(city);
  const s = subjectBySlug(subject);
  if (!c || !s) return <NotFound />;
  const path = `/home-tuition/${c.slug}/${s.slug}`;
  const heading = `${subjectTitle(s)} in ${c.name}`;
  const crumbs = [['Home', '/'], ['Home tuition', '/home-tuition'], [c.name, `/home-tuition/${c.slug}`], [s.name, path]];
  const faqs = [
    [`How do I find a ${s.label.toLowerCase()} in ${c.name}?`, `Browse ${s.name} tutors in ${c.name} on this page or post your requirement with your class, board and locality. Verified tutors who teach ${s.name} near you will apply.`],
    [`Which classes do ${s.name} tutors in ${c.name} teach?`, `${s.name} tutors on ${BRAND} cover ${s.classes}. Each profile lists the boards and classes the tutor teaches.`],
    [`Can I get a free demo class for ${s.name}?`, 'Yes. Every tutor offers a free demo class. You pay the tutor directly only if you continue.'],
  ];

  return (
    <>
      <Seo
        title={`${heading} – ${s.classes}`}
        description={`Find a verified ${s.label.toLowerCase()} in ${c.name} for ${s.classes}. Home tuition in ${c.areas.slice(0, 3).join(', ')} and more. UP Board, CBSE, ICSE. Free demo class.`}
        path={path}
        jsonLd={[service(siteUrl, heading, c.name, path), ldBreadcrumbs(siteUrl, crumbs), ldFaq(faqs)]}
      />
      <section className="photo-hero compact">
        <Photo name={['physics', 'chemistry', 'biology', 'maths'].includes(s.slug) ? 'senior' : 'homework'} eager w={1800} />
        <div className="wrap">
          <Breadcrumbs items={crumbs} />
          <h1>{heading}</h1>
          <p className="lede">{s.blurb} Verified tutors in {c.name} for {s.classes}.</p>
          <SearchBar initial={{ q: c.name, subject: s.name }} />
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><div><p className="eyebrow">{c.name}</p><h2>{s.name} tutors in {c.name}</h2></div></div>
          <TutorGrid k={tutorsKey({ q: c.name, subject: s.name })} emptyText={`We're onboarding more ${s.name} tutors in ${c.name}.`} />
        </div>
      </section>

      <section className="block soft">
        <div className="wrap split top">
          <div className="prose">
            <p className="eyebrow">What your child will learn</p>
            <h2>{s.name} tuition at home in {c.name}</h2>
            <p>{s.blurb}</p>
            <p>Tutors follow your child's school syllabus, whether UP Board, CBSE or ICSE, and give regular tests so you can see progress before exams.</p>
            <ul className="stack" style={{ gap: 6, paddingLeft: 20, margin: 0 }}>
              {s.topics.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      <section className="block">
        <div className="wrap stack" style={{ gap: 28 }}>
          <CtaBand title={`Book a free ${s.name} demo class in ${c.name}`} />
          <div className="split top">
            <div className="stack">
              <h3>Other subjects in {c.name}</h3>
              <div className="link-cloud">
                {SUBJECT_PAGES.filter((x) => x.slug !== s.slug).map((x) => <Link key={x.slug} to={`/home-tuition/${c.slug}/${x.slug}`}>{x.name} tutor in {c.name}</Link>)}
              </div>
            </div>
            <div className="stack">
              <h3>{s.name} tutors in other cities</h3>
              <div className="link-cloud">
                {CITIES.filter((x) => x.slug !== c.slug).map((x) => <Link key={x.slug} to={`/home-tuition/${x.slug}/${s.slug}`}>{s.name} tutor in {x.name}</Link>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- /tuition/:subject ---------- */
export const subjectSsr = ({ params }) => {
  const s = subjectBySlug(params.subject);
  return s ? [tutorsKey({ subject: s.name })] : { status: 404 };
};

export function SubjectPage() {
  const { subject } = useParams();
  const siteUrl = useSiteUrl();
  const s = subjectBySlug(subject);
  if (!s) return <NotFound />;
  const path = `/tuition/${s.slug}`;
  const heading = s.slug === 'all-subjects' ? 'All-Subject Home Tuition' : `${s.name} Home Tuition`;
  const crumbs = [['Home', '/'], ['Subjects', '/tuition/all-subjects'], [s.name, path]];
  const faqs = [
    [`What does ${s.name} home tuition cover?`, `${s.blurb} Topics include ${s.topics.slice(0, 4).join(', ').toLowerCase()} and more.`],
    [`Which classes are covered?`, `${s.classes}, for UP Board, CBSE and ICSE students.`],
    [`How do I book a ${s.name} tutor?`, 'Choose a tutor below and book a free demo class, or post your requirement and let tutors near you apply.'],
  ];

  return (
    <>
      <Seo
        title={`${heading} – Verified Tutors, ${s.classes}`}
        description={`${s.blurb} Find verified ${s.name} home tutors near you in ${REGION}. Free demo class.`}
        path={path}
        jsonLd={[service(siteUrl, heading, null, path), ldBreadcrumbs(siteUrl, crumbs), ldFaq(faqs)]}
      />
      <section className="photo-hero compact">
        <Photo name={['physics', 'chemistry', 'biology', 'maths', 'accountancy', 'economics'].includes(s.slug) ? 'senior' : 'young'} eager w={1800} />
        <div className="wrap">
          <Breadcrumbs items={crumbs} />
          <h1>{heading}</h1>
          <p className="lede">{s.blurb}</p>
          <SearchBar initial={{ subject: s.name }} />
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><div><p className="eyebrow">{s.classes}</p><h2>Top {s.name} tutors</h2></div>
            <Link className="btn ghost" to={`/tutors?subject=${encodeURIComponent(s.name)}`}>All {s.name} tutors</Link></div>
          <TutorGrid k={tutorsKey({ subject: s.name })} emptyText={`We're onboarding more ${s.name} tutors.`} />
        </div>
      </section>

      <section className="block soft">
        <div className="wrap split top">
          <div className="prose">
            <p className="eyebrow">Syllabus</p>
            <h2>What {s.name} tutors cover</h2>
            <ul className="stack" style={{ gap: 6, paddingLeft: 20, margin: 0 }}>{s.topics.map((t) => <li key={t}>{t}</li>)}</ul>
            <h3>{s.name} home tutors by city</h3>
            <div className="link-cloud">
              {CITIES.map((c) => <Link key={c.slug} to={`/home-tuition/${c.slug}/${s.slug}`}>{s.name} tutor in {c.name}</Link>)}
            </div>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      <section className="block">
        <div className="wrap stack" style={{ gap: 28 }}>
          <CtaBand title={`Book a free ${s.name} demo class`} />
          <div className="stack">
            <h3>Other subjects</h3>
            <div className="link-cloud">
              {SUBJECT_PAGES.filter((x) => x.slug !== s.slug).map((x) => <Link key={x.slug} to={`/tuition/${x.slug}`}>{x.name} tuition</Link>)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
