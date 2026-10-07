#!/usr/bin/env node
// Presupuesto de JS por página (PREPARACION §11: ≤75 KB gzip). Correr DESPUÉS de `npm run build`.
// Por cada HTML de dist/: suma el gzip de cada <script src> y de sus imports estáticos (recursivo, cada archivo una vez; los import()
// dinámicos no cuentan: no bloquean la página), más los <script> en línea. Imprime la tabla y sale con 1 si alguna página se pasa.
// Uso: node tools/check-budget.mjs [dist] [--max=75]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const MAX = +(args.find((a) => a.startsWith('--max='))?.slice(6) ?? 75);
const DIST = resolve(args.find((a) => !a.startsWith('--')) ?? join(fileURLToPath(new URL('../', import.meta.url)), 'dist'));
if (!existsSync(DIST)) { console.error(`No existe ${DIST}: corre antes npm run build.`); process.exit(1); }

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const gz = (buf) => gzipSync(buf, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(1);

// /<base>/_astro/x.js o ./x.js → ruta en dist (el base de GitHub Pages se descarta: todo cuelga de _astro/)
function locate(src, fromFile) {
  if (/^(https?:)?\/\//.test(src)) return null; // externo: no debería haber
  if (src.startsWith('/')) { const i = src.indexOf('/_astro/'); return join(DIST, i >= 0 ? src.slice(i + 1) : src.slice(1)); }
  return resolve(dirname(fromFile), src);
}
function collect(file, seen) {
  if (!file || seen.has(file)) return;
  if (!existsSync(file)) { console.error(`  falta ${relative(DIST, file)}`); process.exitCode = 1; return; }
  seen.add(file);
  const code = readFileSync(file, 'utf8');
  for (const m of code.matchAll(/(?:\bfrom|\bimport)\s*["']([^"']+\.m?js)["']/g)) collect(locate(m[1], file), seen); // estáticos, no import()
}

const rows = [];
for (const html of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const page = '/' + relative(DIST, html).replaceAll('\\', '/').replace(/index\.html$/, '');
  const src = readFileSync(html, 'utf8');
  const files = new Set();
  let inline = 0, raw = 0;
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = m;
    if (/type=["']?application\/(ld\+)?json/i.test(attrs)) continue; // datos, no código
    const s = attrs.match(/\bsrc=["']?([^"'\s>]+)/i);
    if (s) collect(locate(s[1], html), files);
    else if (body.trim()) {
      inline += gz(Buffer.from(body)); raw += Buffer.byteLength(body);
      for (const i of body.matchAll(/(?:\bfrom|\bimport)\s*["']([^"']+\.m?js)["']/g)) collect(locate(i[1], html), files);
    }
  }
  let total = inline;
  for (const f of files) { const b = readFileSync(f); total += gz(b); raw += b.length; }
  rows.push({ page, n: files.size, raw, inline, total });
}
rows.sort((a, b) => a.page.localeCompare(b.page));
console.log(`\n| Página | Archivos JS | Crudo KB | En línea KB gz | Total KB gz | ≤${MAX} |\n|---|--:|--:|--:|--:|---|`);
let fails = 0;
for (const r of rows) {
  const ok = r.total / 1024 <= MAX;
  if (!ok) fails++;
  console.log(`| ${r.page} | ${r.n} | ${kb(r.raw)} | ${kb(r.inline)} | ${kb(r.total)} | ${ok ? 'ok' : 'NO'} |`);
}
if (!rows.length) { console.error('No hay HTML en dist.'); fails++; }
process.exit(fails || process.exitCode ? 1 : 0);
