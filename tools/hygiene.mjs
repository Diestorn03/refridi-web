#!/usr/bin/env node
// Gate de higiene (PREPARACION §8): que no se cuelen datos ni textos de otros clientes del estudio, ni CTAs ni firmas vetadas (CONCEPTO §8:
// "Cotizar por WhatsApp", "visita técnica", "Pedir diagnóstico", "Agendar…", expo.out, SplitText, DrawSVG, backdrop-filter).
// Revisa src/, public/, .github/ y package.json (texto; los binarios se saltan), comentarios incluidos: ni para decir "sin X" se nombra X.
// Sale con 1 si hay alguna coincidencia.
// Uso: node tools/hygiene.mjs
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BAD = /visual ?dental|vd[:-]|ssds|renew|expertsddt|polanco|15106760418|dimensionar|Cotizar por WhatsApp|visita técnica|pedir diagnóstico|\bagend|expo\.out|splittext|drawsvg|backdrop-filter/gi;
const BINARY = new Set(['.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.mp4', '.webm', '.pdf']);

const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((n) => walk(join(p, n))) : [p]);
const files = ['src', 'public', '.github', 'package.json'].map((p) => join(ROOT, p)).filter(existsSync).flatMap(walk).filter((f) => !BINARY.has(extname(f).toLowerCase()));

let hits = 0;
for (const f of files) {
  readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(BAD)) {
      hits++;
      console.log(`${relative(ROOT, f).replaceAll('\\', '/')}:${i + 1}: "${m[0]}" → ${line.trim().slice(0, 140)}`);
    }
  });
}
console.log(hits ? `\nHigiene: ${hits} coincidencia(s) en ${files.length} archivos.` : `Higiene: 0 coincidencias en ${files.length} archivos.`);
process.exit(hits ? 1 : 0);
