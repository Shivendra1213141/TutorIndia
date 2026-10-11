import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PencilLine, Sigma, FlaskConical, BookOpen, Languages, Globe2, Atom, TestTubes, Leaf, IndianRupee, LineChart, Monitor, Phone, Mail, MapPin, ShieldCheck, BadgeCheck, Star, MessageCircle, ChevronDown, Search, Home, Users, Clock, Wallet, GraduationCap, CheckCircle2, ArrowRight, Circle, HandCoins, UserCheck, CalendarCheck } from 'lucide-react';

const ICONS = { PencilLine, Sigma, FlaskConical, BookOpen, Languages, Globe2, Atom, TestTubes, Leaf, IndianRupee, LineChart, Monitor, Phone, Mail, MapPin, ShieldCheck, BadgeCheck, Star, MessageCircle, ChevronDown, Search, Home, Users, Clock, Wallet, GraduationCap, CheckCircle2, ArrowRight, Circle, HandCoins, UserCheck, CalendarCheck };
import { LEVEL_LABEL, MODE_LABEL, inr, initials } from '../lib/constants.js';
import { fileUrl } from '../lib/api.js';
import { usePrefetched } from '../lib/ssr.jsx';
import { IMAGES, imageLocal, imageRemote, subjectSlug } from '../lib/site.js';

/**
 * Runs an async loader and exposes {data, error, loading, reload}.
 * `key` (the API path) lets the page start from data the server already fetched.
 */
export function useLoad(fn, deps = [], key) {
  const pre = usePrefetched(key);
  const [state, set] = useState(() =>
    pre === undefined
      ? { data: null, error: '', loading: true }
      : pre && pre.__error
        ? { data: null, error: pre.__error, loading: false }
        : { data: pre, error: '', loading: false }
  );
  const skipFirst = useRef(pre !== undefined);
  const run = useCallback(() => {
    set((s) => ({ ...s, loading: true, error: '' }));
    return fn()
      .then((data) => set({ data, error: '', loading: false }))
      .catch((e) => set({ data: null, error: e.message, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    run();
  }, [run]);
  return { ...state, reload: run };
}

export function Icon({ name, size = 20, ...rest }) {
  const C = ICONS[name] || Circle;
  return <C size={size} aria-hidden="true" strokeWidth={1.8} {...rest} />;
}

/**
 * Photo from site.js. Uses /images/<name>.jpg from your own server when present,
 * otherwise the remote Pexels copy, otherwise a soft placeholder.
 */
export function Photo({ name, w = 1200, className = '', eager = false, alt }) {
  const img = IMAGES[name];
  const ref = useRef(null);
  const [stage, setStage] = useState(0); // 0 local, 1 remote, 2 failed
  const src = stage === 0 ? imageLocal(name) : imageRemote(name, w);
  const fail = useCallback(() => setStage((s) => Math.min(s + 1, 2)), []);
  useEffect(() => {
    // the image may have failed before React attached onError (server-rendered HTML)
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) fail();
  }, [fail, stage]);
  if (!img || stage === 2) return <div className={`photo-fallback ${className}`} role="img" aria-label={alt ?? img?.alt ?? ''} />;
  return (
    <img
      ref={ref}
      className={className}
      src={src}
      alt={alt ?? img.alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchpriority={eager ? 'high' : undefined}
      decoding="async"
      width="1200"
      height="800"
      onError={fail}
    />
  );
}

export const Alert = ({ kind = 'info', children }) => (children ? <div className={`alert ${kind}`} role={kind === 'err' ? 'alert' : 'status'}>{children}</div> : null);

export function Stars({ value = 0 }) {
  const n = Math.round(value);
  return <span className="stars" aria-hidden="true">{'★'.repeat(n) + '☆'.repeat(5 - n)}</span>;
}

export function Avatar({ name, photo, size = '' }) {
  return photo ? (
    <img className={`avatar ${size}`} src={fileUrl(photo)} alt={name ? `${name}, home tutor` : ''} loading="lazy" />
  ) : (
    <span className={`avatar ${size}`} aria-hidden="true">{initials(name)}</span>
  );
}

/** Multi-select chips for subjects, boards and class groups. */
export function ChipSelect({ options, value, onChange, labels }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="toggle-chips">
      {options.map((o) => (
        <button type="button" key={o} aria-pressed={value.includes(o)} onClick={() => toggle(o)}>
          {labels ? labels[o] : o}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between">
          <h3>{title}</h3>
          <button className="linkbtn" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TrustBadges({ t }) {
  return (
    <div className="badges">
      {t.aadhaarVerified ? <span className="badge"><Icon name="ShieldCheck" size={13} /> Aadhaar verified</span> : <span className="badge neutral">Aadhaar pending</span>}
      <span className="badge neutral" title="Qualification as written by the tutor; not checked by us">Degree: stated by tutor</span>
    </div>
  );
}

export function TutorCard({ t, cta }) {
  return (
    <article className="tutor">
      <div className="t-top">
        <Avatar name={t.name} photo={t.photo} />
        <div>
          <h3><Link className="plain" to={`/tutors/${t.id}`}>{t.name}</Link></h3>
          <p>{t.qualification} · {t.experienceYears} yrs exp.</p>
        </div>
      </div>
      <div className="rating">
        {t.ratingCount ? (
          <>
            <Stars value={t.ratingAvg} />
            <b className="mono">{t.ratingAvg.toFixed(1)}</b>
            <span className="muted">({t.ratingCount} parent reviews)</span>
          </>
        ) : (
          <span className="muted">New tutor, no reviews yet</span>
        )}
      </div>
      <TrustBadges t={t} />
      <div className="tags">
        {t.subjects.map((s) => {
          const slug = subjectSlug(s);
          return slug ? <Link className="tag" key={s} to={`/tuition/${slug}`}>{s}</Link> : <span className="tag" key={s}>{s}</span>;
        })}
      </div>
      <dl className="meta">
        <div><dt>Boards</dt><dd>{t.boards.join(', ')}</dd></div>
        <div><dt>Classes</dt><dd>{t.levels.map((l) => LEVEL_LABEL[l]).join(', ')}</dd></div>
        <div><dt>Area</dt><dd>{[t.area, t.city].filter(Boolean).join(', ')} <span className="mono">{t.pincode}</span></dd></div>
        <div><dt>Fee / month</dt><dd className="mono">{t.feeMin ? `from ${inr(t.feeMin)}` : 'On request'}</dd></div>
      </dl>
      <div className="actions">
        {cta || (
          <>
            <Link className="btn ghost" to={`/tutors/${t.id}`}>View profile</Link>
            <Link className="btn" to={`/tutors/${t.id}#demo`}>Book free demo</Link>
          </>
        )}
      </div>
    </article>
  );
}

/** Accordion of questions; pair with ldFaq() in <Seo jsonLd>. */
export function Faq({ items }) {
  return (
    <div className="faq">
      {items.map(([q, a], i) => (
        <details key={q} open={i === 0}>
          <summary>{q}<Icon name="ChevronDown" size={18} /></summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {items.map(([name, path], i) => (
        <span key={path}>
          {i < items.length - 1 ? <Link to={path}>{name}</Link> : <span aria-current="page">{name}</span>}
          {i < items.length - 1 && <span aria-hidden="true"> / </span>}
        </span>
      ))}
    </nav>
  );
}

export const modeLabel = (m) => MODE_LABEL[m] || m;

const STATUS = {
  open: ['info', 'Open'], closed: ['neutral', 'Closed'],
  applied: ['info', 'Applied'], shortlisted: ['', 'Shortlisted'], rejected: ['err', 'Not selected'],
  requested: ['warn', 'Awaiting tutor'], accepted: ['', 'Accepted'], declined: ['err', 'Declined'],
  completed: ['', 'Completed'], cancelled: ['neutral', 'Cancelled'],
  pending: ['warn', 'Pending review'], approved: ['', 'Approved'],
  active: ['', 'Live'], under_review: ['warn', 'Under review'], payment_pending: ['warn', 'Payment due'], suspended: ['err', 'Suspended'],
  verified: ['', 'Verified'], not_submitted: ['neutral', 'Not submitted'],
};
export function StatusBadge({ s }) {
  const [k, l] = STATUS[s] || ['neutral', s];
  return <span className={`badge ${k}`}>{l}</span>;
}
