import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, dashboardPath } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { BRAND, REGION, CITIES, SUBJECT_PAGES } from '../lib/site.js';
import { useLoad, Icon } from './ui.jsx';

export const SETTINGS_KEY = '/payments/settings';
export const useSettings = () => useLoad(() => api(SETTINGS_KEY), [], SETTINGS_KEY).data;

const waNumber = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
};

export default function Layout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const settings = useSettings();

  useEffect(() => {
    setOpen(false);
    if (!loc.hash) window.scrollTo(0, 0);
  }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isApp = /^\/(dashboard|admin)/.test(loc.pathname);

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          {settings?.supportPhone && <a href={`tel:+${waNumber(settings.supportPhone)}`}><Icon name="Phone" size={14} /> {settings.supportPhone}</a>}
          {settings?.supportEmail && <a className="hide-sm" href={`mailto:${settings.supportEmail}`}><Icon name="Mail" size={14} /> {settings.supportEmail}</a>}
          <span className="hide-sm"><Icon name="MapPin" size={14} /> Home tutors across {REGION}</span>
          <span className="right"><Icon name="ShieldCheck" size={14} /> Aadhaar-verified tutors · Free demo class</span>
        </div>
      </div>
      <header className="top">
        <div className={`wrap nav ${open ? 'open' : ''}`}>
          <Link className="logo" to="/" aria-label={`${BRAND} home`}><i>स</i>{BRAND}</Link>
          <button className="menu-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
          <nav className="nav-links" aria-label="Main">
            <NavLink to="/tutors">Find tutors</NavLink>
            <NavLink to="/home-tuition">Home tuition</NavLink>
            <NavLink to="/tuitions">Tuition jobs</NavLink>
            <NavLink to="/become-a-tutor">Become a tutor</NavLink>
            <NavLink to="/how-it-works">How it works</NavLink>
          </nav>
          <div className="nav-cta">
            {user ? (
              <>
                <Link className="btn ghost" to={dashboardPath(user.role)}>{user.role === 'admin' ? 'Admin panel' : 'My dashboard'}</Link>
                <button className="linkbtn" onClick={() => { signOut(); nav('/'); }}>Log out</button>
              </>
            ) : (
              <>
                <Link className="linkbtn" to="/login">Log in</Link>
                <Link className="btn sun" to="/post-requirement">Hire a tutor</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site">
        <div className="wrap foot-grid">
          <div className="stack" style={{ gap: 12 }}>
            <Link className="logo" to="/"><i>स</i>{BRAND}</Link>
            <p>Verified home tutors and private tuition for KG to Class 12, UP Board, CBSE, ICSE, JEE and NEET across {REGION}. Book a free demo class with a tutor near you.</p>
          </div>
          <div>
            <h4>Parents</h4>
            <Link to="/tutors">Find a home tutor</Link>
            <Link to="/post-requirement">Post requirement</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/register">Create account</Link>
          </div>
          <div>
            <h4>Home tuition in</h4>
            {CITIES.slice(0, 6).map((c) => <Link key={c.slug} to={`/home-tuition/${c.slug}`}>{c.name}</Link>)}
            <Link to="/home-tuition">All cities</Link>
          </div>
          <div>
            <h4>Subjects</h4>
            {SUBJECT_PAGES.filter((s) => ['maths', 'science', 'english', 'physics', 'chemistry', 'biology'].includes(s.slug)).map((s) => (
              <Link key={s.slug} to={`/tuition/${s.slug}`}>{s.name} tuition</Link>
            ))}
          </div>
          <div className="contact">
            <h4>Tutors &amp; contact</h4>
            <Link to="/become-a-tutor">Become a tutor</Link>
            <Link to="/tuitions">Tuition jobs</Link>
            {settings?.supportPhone && <span><Icon name="Phone" size={15} /> {settings.supportPhone}</span>}
            {settings?.supportEmail && <span><Icon name="Mail" size={15} /> {settings.supportEmail}</span>}
            <Link to="/contact">Contact us</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="wrap">
            <span>© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
            <span><Link to="/terms">Terms &amp; privacy</Link></span>
          </div>
        </div>
      </footer>

      {!isApp && settings?.supportPhone && (
        <a className="wa-float" href={`https://wa.me/${waNumber(settings.supportPhone)}?text=${encodeURIComponent('Hi, I am looking for a home tutor.')}`} target="_blank" rel="noopener noreferrer">
          <Icon name="MessageCircle" size={20} /><span>Chat on WhatsApp</span>
        </a>
      )}
    </>
  );
}
