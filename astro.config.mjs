import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { normalizeDemo } from './src/data/site.js';

// GitHub Pages (propuesta): SITE_URL=https://<owner>.github.io  PAGES_BASE=/<repo>  (los pone .github/workflows/deploy.yml).
// Dominio propio (POR CONFIRMAR Q1): SITE_URL=https://www.refridi.com.ve y sin PAGES_BASE. Sin SITE_URL no hay canonical,
// og:url ni sitemap absolutos: mejor nada que apuntar a un dominio que nadie confirmó.
const site = process.env.SITE_URL || undefined;
const base = process.env.PAGES_BASE || '/';
// staging (PUBLIC_DEMO): noindex y robots Disallow → sin sitemap (ni canonical, Base.astro)
const demo = normalizeDemo(process.env.PUBLIC_DEMO);

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: site && !demo ? [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })] : [],
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // un cacheDir por dev server (VITE_CACHE_DIR=.vite-a1 …) para que varios corran a la vez
  vite: {
    cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
    server: { watch: { ignored: ['**/.shots/**', '**/.vite-*/**'] } }, // perfiles de Chrome de QA y cachés extra inundan el watcher
  },
});
