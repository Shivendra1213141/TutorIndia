import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { matchRoutes } from 'react-router-dom';
import App, { routes, ALWAYS_PREFETCH } from './App.jsx';
import { DataContext, SeoContext, SiteContext, headTags } from './lib/ssr.jsx';

export { CITIES, SUBJECT_PAGES } from './lib/site.js';

/**
 * Renders a page on the server.
 * fetchJson(path) -> { status, body } calls this site's own API.
 * Returns { html, head, data, status } for the server to put into index.html.
 */
export async function render(url, { fetchJson, siteUrl }) {
  const u = new URL(url, 'http://local');
  const matches = matchRoutes(routes, u.pathname) || [];
  const leaf = matches[matches.length - 1];
  let status = leaf?.route.notFound ? 404 : 200;

  let keys = [...ALWAYS_PREFETCH];
  const plan = leaf?.route.ssr?.({ params: leaf.params, search: u.search }) ?? [];
  if (Array.isArray(plan)) keys.push(...plan);
  else if (plan.status) status = plan.status;

  const data = {};
  await Promise.all(
    [...new Set(keys)].map(async (k) => {
      try {
        const r = await fetchJson(k);
        if (r.status >= 400) {
          data[k] = { __error: r.body?.error || 'Not found.' };
          if (r.status === 404 && leaf?.route.required) status = 404;
        } else data[k] = r.body;
      } catch {
        /* leave it to the browser to fetch */
      }
    })
  );

  const seo = {};
  const html = renderToString(
    <SiteContext.Provider value={{ url: siteUrl }}>
      <DataContext.Provider value={data}>
        <SeoContext.Provider value={seo}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </SeoContext.Provider>
      </DataContext.Provider>
    </SiteContext.Provider>
  );
  const { title, tags } = headTags(seo, siteUrl);
  return { html, head: `<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>\n${tags.join('\n')}`, data, status };
}
