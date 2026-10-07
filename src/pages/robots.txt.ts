import type { APIRoute } from 'astro';
import { demo } from '../data/site.js';
import { url } from '../lib/url.js';

// Staging (PUBLIC_DEMO=1) queda fuera de los buscadores; producción permite todo y anuncia el sitemap (solo si hay SITE_URL).
export const GET: APIRoute = ({ site }) => {
  const body = demo
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site.origin}${url('sitemap-index.xml')}\n` : ''}`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
