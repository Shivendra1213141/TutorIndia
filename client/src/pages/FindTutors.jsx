import { useSearchParams, Link } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { LEVELS, BOARDS, SUBJECTS } from '../lib/constants.js';
import { useLoad, TutorCard } from '../components/ui.jsx';
import { Seo } from '../lib/ssr.jsx';
import { LEVEL_LABEL } from '../lib/constants.js';

const keyFor = (f) => '/tutors' + qs({ ...f, limit: 12 });
export const ssr = ({ search }) => [keyFor(Object.fromEntries(new URLSearchParams(search)))];

export default function FindTutors() {
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(params);
  const page = Number(f.page || 1);
  const key = keyFor(f);
  const { data, error, loading } = useLoad(() => api(key), [key], key);
  const what = [f.subject, f.level && LEVEL_LABEL[f.level], f.board].filter(Boolean).join(' ');
  const where = f.q ? ` in ${f.q}` : '';

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    next.delete('page');
    setParams(next);
  };

  return (
    <>
      <Seo
        title={`${what ? what + ' ' : ''}Home Tutors${where} – Verified, Free Demo`}
        description={`Browse Aadhaar-verified ${what ? what + ' ' : ''}home tutors${where}. Compare experience, fees and parent reviews, then book a free demo class.`}
        path="/tutors"
      />
      <section className="page-hero">
        <div className="wrap">
          <h1>{what ? `${what} home tutors${where}` : `Find a home tutor${where}`}</h1>
          <p>Every tutor listed here has paid the registration fee and had their Aadhaar checked by our team.</p>
        </div>
      </section>
      <div className="wrap page-pad with-side">
        <aside className="side panel" aria-label="Filters">
          <div className="field"><label htmlFor="fq">City, area or pin code</label>
            <input id="fq" defaultValue={f.q || ''} placeholder="Lucknow, 226024…"
              onKeyDown={(e) => e.key === 'Enter' && set('q', e.currentTarget.value.trim())}
              onBlur={(e) => e.target.value.trim() !== (f.q || '') && set('q', e.target.value.trim())} />
          </div>
          <div className="field"><label htmlFor="fl">Class</label>
            <select id="fl" value={f.level || ''} onChange={(e) => set('level', e.target.value)}>
              <option value="">Any class</option>
              {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.id === 'comp' ? 'JEE / NEET' : l.label}</option>)}
            </select></div>
          <div className="field"><label htmlFor="fb">Board</label>
            <select id="fb" value={f.board || ''} onChange={(e) => set('board', e.target.value)}>
              <option value="">Any board</option>{BOARDS.map((b) => <option key={b}>{b}</option>)}
            </select></div>
          <div className="field"><label htmlFor="fs">Subject</label>
            <select id="fs" value={f.subject || ''} onChange={(e) => set('subject', e.target.value)}>
              <option value="">Any subject</option>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select></div>
          <div className="field"><label htmlFor="fm">Mode</label>
            <select id="fm" value={f.mode || ''} onChange={(e) => set('mode', e.target.value)}>
              <option value="">Any</option><option value="home">Home tuition</option><option value="online">Online</option>
            </select></div>
          <div className="field"><label htmlFor="fo">Sort by</label>
            <select id="fo" value={f.sort || 'rating'} onChange={(e) => set('sort', e.target.value)}>
              <option value="rating">Highest rated</option><option value="experience">Most experienced</option><option value="fee">Lowest fee</option>
            </select></div>
          {params.toString() && <button className="linkbtn" onClick={() => setParams({})}>Clear all filters</button>}
        </aside>

        <div className="stack">
          <p className="muted" aria-live="polite">
            {loading ? 'Searching…' : data ? `${data.total} tutor${data.total === 1 ? '' : 's'} found` : ''}
          </p>
          <div className="grid3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {error && <div className="empty">{error}</div>}
            {data?.items.length === 0 && (
              <div className="empty">
                No tutors match these filters yet. Try a nearby area, or{' '}
                <Link to="/post-requirement">post your requirement</Link> and tutors will apply to you.
              </div>
            )}
            {data?.items.map((t) => <TutorCard key={t.id} t={t} />)}
          </div>
          {data?.pages > 1 && (
            <div className="pager">
              <button className="btn ghost sm" disabled={page <= 1} onClick={() => set('page', page - 1)}>Previous</button>
              <span className="mono">{page} / {data.pages}</span>
              <button className="btn ghost sm" disabled={page >= data.pages} onClick={() => { const n = new URLSearchParams(params); n.set('page', page + 1); setParams(n); }}>Next</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
