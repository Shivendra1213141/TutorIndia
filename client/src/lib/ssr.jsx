import { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BRAND, imageRemote } from './site.js';

/**
 * Server-side rendering support.
 * - DataContext: API responses fetched by the server before rendering, keyed by API path.
 *   The same object is sent to the browser as window.__DATA__ so hydration renders identical HTML.
 * - SeoContext: on the server, <Seo> writes the page's meta tags into it; the server puts them in <head>.
 */
export const DataContext = createContext(null);
export const SeoContext = createContext(null);
export const SiteContext = createContext({ url: '' });

let hydrated = false;
export const markHydrated = () => {
  hydrated = true;
};

/** Returns the server-prefetched response for `key` during SSR and the first client render only. */
export function usePrefetched(key) {
  const data = useContext(DataContext);
  if (!key || !data || hydrated) return undefined;
  return data[key];
}

export const useSiteUrl = () => useContext(SiteContext).url;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Builds the <head> tags for a page. Used by the server (string) and the browser (on navigation). */
export function headTags(seo, siteUrl) {
  const title = seo.title ? `${seo.title} | ${BRAND}` : `${BRAND} · Home Tuition & Verified Home Tutors`;
  const url = siteUrl + (seo.path || '/');
  const image = seo.image || imageRemote('hero', 1200);
  const tags = [
    `<meta name="description" content="${esc(seo.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta name="robots" content="${seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">`,
    `<meta property="og:type" content="${seo.ogType || 'website'}">`,
    `<meta property="og:site_name" content="${esc(BRAND)}">`,
    `<meta property="og:locale" content="en_IN">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(seo.description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
  ];
  if (seo.jsonLd) {
    const graph = Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd];
    const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }
  return { title, tags: tags.map((t) => t.replace(/^<(\w+)/, '<$1 data-seo')) };
}

/**
 * Declares the page's SEO metadata.
 * title: page title without brand · description: ~150 chars · path: canonical path (defaults to current)
 * jsonLd: schema.org object(s) · noindex: hide from search engines
 */
export function Seo(props) {
  const ctx = useContext(SeoContext);
  const siteUrl = useSiteUrl();
  const loc = useLocation();
  const seo = { ...props, path: props.path ?? loc.pathname };
  if (ctx) Object.assign(ctx, seo); // server: collected during render

  const key = JSON.stringify(seo);
  useEffect(() => {
    const { title, tags } = headTags(seo, siteUrl || window.location.origin);
    document.title = title;
    document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
    document.head.insertAdjacentHTML('beforeend', tags.join(''));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/* ---------- schema.org helpers ---------- */
export const ldBreadcrumbs = (siteUrl, items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: siteUrl + path })),
});
export const ldFaq = (faqs) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
