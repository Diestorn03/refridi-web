#!/usr/bin/env node
// Fallback métrico para @font-face: lee head/hhea/OS2/cmap/hmtx/fvar de los woff2 del paquete (brotli de node:zlib) y del Arial local,
// y escribe las reglas 'Archivo Fallback' y 'Figtree Fallback' que van en src/styles/base.css (se pegan a mano; no corre en el build).
// Uso: node tools/font-metrics.mjs
// Método (el de Capsize / next/font): size-adjust = ancho medio de la fuente web / ancho medio del fallback sobre una muestra de texto
// en español; ascent/descent/line-gap = métrica de la fuente web / (unitsPerEm × size-adjust), porque size-adjust también escala los overrides.
// ponytail: se mide la instancia por defecto de la fuente variable (sin HVAR); el script imprime su wght/wdth. Archivo condensado (78 %)
// se aproxima como 0,78 × el ancho por defecto contra Arial Narrow (el eje wdth se diseña como % del ancho normal).
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const FS = 'node_modules/@fontsource-variable/';
const WIN = process.env.WINDIR ? process.env.WINDIR.replaceAll('\\', '/') + '/Fonts/' : 'C:/Windows/Fonts/';
const SAMPLE = 'Refrigeración industrial y comercial: garantizamos su cadena de frío a nivel nacional. Instalación, mantenimiento y reparación de cavas cuarto, unidades de compresión y repuestos en Maracay, Aragua.';

const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

/** → { tag: { buf: DataView, transformed } } */
function tables(file) {
  const b = readFileSync(file);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const sig = b.toString('latin1', 0, 4);
  const out = {};
  if (sig === 'wOF2') {
    const n = dv.getUint16(12);
    let p = 48;
    const b128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const c = b[p++]; v = (v << 7) | (c & 0x7f); if (!(c & 0x80)) return v >>> 0; } throw new Error('UIntBase128'); };
    const dir = [];
    for (let i = 0; i < n; i++) {
      const flags = b[p++];
      const tag = (flags & 0x3f) === 63 ? b.toString('latin1', p, (p += 4)) : TAGS[flags & 0x3f];
      const ver = flags >> 6;
      const orig = b128();
      const transformed = tag === 'glyf' || tag === 'loca' ? ver !== 3 : ver !== 0;
      dir.push({ tag, transformed, len: transformed ? b128() : orig });
    }
    const data = brotliDecompressSync(b.subarray(p, p + dv.getUint32(20)));
    let off = 0;
    for (const t of dir) { out[t.tag] = { buf: new DataView(data.buffer, data.byteOffset + off, t.len), transformed: t.transformed }; off += t.len; }
  } else {
    const n = dv.getUint16(4);
    for (let i = 0; i < n; i++) {
      const r = 12 + i * 16;
      out[b.toString('latin1', r, r + 4)] = { buf: new DataView(b.buffer, b.byteOffset + dv.getUint32(r + 8), dv.getUint32(r + 12)), transformed: false };
    }
  }
  if (out.head.buf.getUint32(12) !== 0x5f0f3cf5) throw new Error(`${file}: tabla head ilegible`);
  return out;
}

function cmap(t) {
  const d = t.cmap.buf, map = new Map();
  const n = d.getUint16(2);
  let best = null;
  for (let i = 0; i < n; i++) {
    const pid = d.getUint16(4 + i * 8), eid = d.getUint16(6 + i * 8), off = d.getUint32(8 + i * 8), fmt = d.getUint16(off);
    if (pid === 3 && (eid === 10 || eid === 1) && (fmt === 12 || fmt === 4) && (!best || fmt === 12)) best = { off, fmt };
    if (pid === 0 && (fmt === 12 || fmt === 4) && !best) best = { off, fmt };
  }
  const { off, fmt } = best;
  if (fmt === 12) {
    const groups = d.getUint32(off + 12);
    for (let g = 0; g < groups; g++) {
      const q = off + 16 + g * 12, s = d.getUint32(q), e = d.getUint32(q + 4), gid = d.getUint32(q + 8);
      for (let c = s; c <= e; c++) map.set(c, gid + c - s);
    }
  } else {
    const seg = d.getUint16(off + 6) / 2, ends = off + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ranges = deltas + seg * 2;
    for (let i = 0; i < seg; i++) {
      const e = d.getUint16(ends + i * 2), s = d.getUint16(starts + i * 2), delta = d.getInt16(deltas + i * 2), ro = d.getUint16(ranges + i * 2);
      for (let c = s; c <= e && c !== 0xffff; c++) {
        let gid = ro ? d.getUint16(ranges + i * 2 + ro + (c - s) * 2) : c;
        if (gid) gid = (gid + delta) & 0xffff;
        map.set(c, gid);
      }
    }
  }
  return map;
}

function metrics(file) {
  const t = tables(file);
  const head = t.head.buf, hhea = t.hhea.buf, os2 = t['OS/2'].buf, hmtx = t.hmtx;
  const upm = head.getUint16(18), nh = hhea.getUint16(34);
  const adv = (gid) => hmtx.buf.getUint16((hmtx.transformed ? 1 : 0) + Math.min(gid, nh - 1) * (hmtx.transformed ? 2 : 4));
  const cm = cmap(t);
  const chars = [...SAMPLE].map((c) => c.codePointAt(0));
  const avg = chars.reduce((s, c) => s + adv(cm.get(c) ?? 0), 0) / chars.length / upm;
  const useTypo = !!(os2.getUint16(62) & 0x80);
  const m = useTypo
    ? { asc: os2.getInt16(68), desc: -os2.getInt16(70), gap: os2.getInt16(72), src: 'OS/2 typo (USE_TYPO_METRICS)' }
    : { asc: hhea.getInt16(4), desc: -hhea.getInt16(6), gap: hhea.getInt16(8), src: 'hhea' };
  let axes = '';
  if (t.fvar) {
    const f = t.fvar.buf, ao = f.getUint16(4), na = f.getUint16(8), as = f.getUint16(10);
    for (let i = 0; i < na; i++) { const q = ao + i * as; axes += `${String.fromCharCode(f.getUint8(q), f.getUint8(q + 1), f.getUint8(q + 2), f.getUint8(q + 3))}=${f.getInt32(q + 8) / 65536} `; }
  }
  return { upm, avg, ...m, axes: axes.trim() };
}

const pct = (x) => `${(x * 100).toFixed(2)}%`;
function face(family, web, fb, local, { stretch, widthFactor = 1 } = {}) {
  const size = (web.avg * widthFactor) / fb.avg;
  const k = web.upm * size;
  return `@font-face { font-family: '${family}'; src: local('${local}');${stretch ? ` font-stretch: ${stretch};` : ''} font-weight: 100 900; size-adjust: ${pct(size)}; ascent-override: ${pct(web.asc / k)}; descent-override: ${pct(web.desc / k)}; line-gap-override: ${pct(web.gap / k)}; }`;
}

const archivo = metrics(root + FS + 'archivo/files/archivo-latin-wdth-normal.woff2');
const figtree = metrics(root + FS + 'figtree/files/figtree-latin-wght-normal.woff2');
const arial = metrics(WIN + 'arial.ttf');
const arialN = metrics(WIN + 'ARIALN.TTF');
for (const [n, m] of Object.entries({ archivo, figtree, arial, arialN })) console.error(`${n}: upm ${m.upm} · ancho medio ${m.avg.toFixed(4)} em · asc ${m.asc} desc ${m.desc} gap ${m.gap} (${m.src})${m.axes ? ' · por defecto ' + m.axes : ''}`);
console.log(face('Archivo Fallback', archivo, arial, 'Arial', { stretch: '91% 125%' }));
console.log(face('Archivo Fallback', archivo, arialN, 'Arial Narrow', { stretch: '62% 90%', widthFactor: 0.78 }));
console.log(face('Figtree Fallback', figtree, arial, 'Arial'));
