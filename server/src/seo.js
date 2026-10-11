import fs from 'node:fs';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { config } from './config.js';
import { Tutor } from './models/index.js';

/** Secret header so the server's own SSR calls to its API skip the rate limiter. */
export const INTERNAL_TOKEN = crypto.randomBytes(16).toString('hex');

const siteUrlFor = (req) => config.siteUrl || `${req.protocol}://${req.get('host')}`;
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function loadSiteData() {
  try {
    return await import(pathToFileURL(config.siteData).href);
  } catch {
    return { CITIES: [], SUBJECT_PAGES: [] };
  }
}

/** robots.txt and sitemap.xml. Work with or without the SSR build. */
export function seoRoutes(app) {
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /admin',
        'Disallow: /dashboard/',
        'Disallow: /login',
        'Disallow: /register',
        '',
        `Sitemap: ${siteUrlFor(req)}/sitemap.xml`,
        '',
      ].join('\n')
    );
  });

  app.get('/sitemap.xml', async (req, res, next) => {
    try {
      const base = siteUrlFor(req);
      const { CITIES = [], SUBJECT_PAGES = [] } = await loadSiteData();
      const today = new Date().toISOString().slice(0, 10);
      const urls = [
        ['/', '1.0', 'daily'],
        ['/tutors', '0.9', 'daily'],
        ['/home-tuition', '0.9', 'weekly'],
        ['/post-requirement', '0.8', 'monthly'],
        ['/tuitions', '0.7', 'daily'],
        ['/become-a-tutor', '0.7', 'monthly'],
        ['/how-it-works', '0.5', 'monthly'],
        ['/contact', '0.4', 'yearly'],
        ['/terms', '0.2', 'yearly'],
        ...CITIES.map((c) => [`/home-tuition/${c.slug}`, '0.9', 'daily']),
        ...SUBJECT_PAGES.map((s) => [`/tuition/${s.slug}`, '0.8', 'weekly']),
        ...CITIES.flatMap((c) => SUBJECT_PAGES.map((s) => [`/home-tuition/${c.slug}/${s.slug}`, '0.7', 'weekly'])),
      ].map(([p, pr, cf]) => ({ loc: base + p, lastmod: today, pr, cf }));

      const tutors = await Tutor.find({ status: 'active' }).select('_id updatedAt').sort({ updatedAt: -1 }).limit(45000).lean();
      for (const t of tutors)
        urls.push({ loc: `${base}/tutors/${t._id}`, lastmod: new Date(t.updatedAt).toISOString().slice(0, 10), pr: '0.6', cf: 'weekly' });

      res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls.map((u) => `  <url><loc>${xmlEsc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.cf}</changefreq><priority>${u.pr}</priority></url>`).join('\n') +
          `\n</urlset>\n`
      );
    } catch (e) {
      next(e);
    }
  });
}

/**
 * Serves the built React app. With the SSR build present, every page is rendered on the server
 * (full HTML, meta tags, structured data and correct 404 status) so search engines see real content.
 */
export async function frontendRoutes(app) {
  const indexPath = `${config.clientDist}/index.html`;
  if (!fs.existsSync(indexPath)) return false;
  const template = fs.readFileSync(indexPath, 'utf8');
  const verify = config.googleVerification
    ? `<meta name="google-site-verification" content="${config.googleVerification.replace(/"/g, '')}">\n`
    : '';

  app.use('/assets', express.static(`${config.clientDist}/assets`, { maxAge: '1y', immutable: true }));
  app.use(express.static(config.clientDist, { index: false, maxAge: '1d' }));

  let render = null;
  if (fs.existsSync(config.ssrEntry)) {
    ({ render } = await import(pathToFileURL(config.ssrEntry).href));
    console.log('Server-side rendering enabled');
  } else console.log('SSR build not found; serving the client-only app (run `npm run build` in client/).');

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    if (!render) return res.send(template.replace('<!--head-->', verify));
    try {
      const siteUrl = siteUrlFor(req);
      const fetchJson = async (p) => {
        const r = await fetch(`http://127.0.0.1:${config.port}/api${p}`, { headers: { 'x-internal': INTERNAL_TOKEN } });
        return { status: r.status, body: await r.json().catch(() => null) };
      };
      const out = await render(req.originalUrl, { fetchJson, siteUrl });
      const json = JSON.stringify(out.data).replace(/</g, '\\u003c');
      const site = JSON.stringify({ url: siteUrl }).replace(/</g, '\\u003c');
      const html = template
        .replace('<!--head-->', verify + out.head)
        .replace('<!--app-->', out.html)
        .replace('<!--data-->', `<script>window.__DATA__=${json};window.__SITE__=${site};</script>`);
      res.status(out.status).set('Cache-Control', 'public, max-age=0, must-revalidate').send(html);
    } catch (e) {
      console.error('SSR failed, falling back to client render:', e);
      res.send(template.replace('<!--head-->', verify));
    }
  });
  return true;
}
