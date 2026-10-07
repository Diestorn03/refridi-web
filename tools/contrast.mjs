#!/usr/bin/env node
// Contraste WCAG 2.x (luminancia relativa) de los pares texto/fondo de cada [data-palette] de tokens.css.
// Uso: node tools/contrast.mjs [ruta/tokens.css]   → tabla Markdown; sale con 1 si algún par no llega al mínimo.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(process.argv[2] ?? fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');

// [texto, fondo, mínimo, uso]   4.5 = texto normal · 3 = texto grande (≥24px o ≥18.66px bold) y UI
const PAIRS = [
  ['paper', 'ink', 4.5, 'dark · --fg'],
  ['silver', 'ink', 4.5, 'dark · --muted'],
  ['accent', 'ink', 4.5, 'dark · --stroke (texto, cifras, foco)'],
  ['ink', 'accent', 4.5, 'dark/brand · botón (--btn-fg sobre --btn-bg)'],
  ['red', 'ink', 4.5, 'dark · --danger'],
  ['cyan', 'ink', 3, 'dark · isotipo y barras cian (UI)'],
  ['white', 'field', 4.5, 'brand · --fg y --link'],
  ['silver', 'field', 4.5, 'brand · --muted'],
  ['accent', 'field', 4.5, 'brand · --stroke (texto, cifras, foco)'],
  ['white', 'brand', 4.5, 'light · botón (--btn-fg sobre --btn-bg)'],
  ['ink', 'paper', 4.5, 'light · --fg'],
  ['graphite', 'paper', 4.5, 'light · --muted y bordes de campo'],
  ['graphite', 'white', 4.5, 'light · --muted sobre tarjeta blanca'],
  ['accent-ink', 'paper', 4.5, 'light · --stroke (texto, cifras)'],
  ['accent-ink', 'white', 4.5, 'light · --stroke sobre tarjeta blanca'],
  ['brand', 'paper', 4.5, 'light · enlaces y titulares en azul'],
  ['red-ink', 'paper', 4.5, 'light · --danger'],
];

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = hex.slice(1).match(/../g).map((h) => lin(parseInt(h, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
if (Math.abs(ratio('#000000', '#ffffff') - 21) > 1e-9) throw new Error('fórmula de contraste rota');

let fails = 0;
let palettes = 0;
for (const [, name, body] of css.matchAll(/\[data-palette='([\w-]+)'\]\s*\{([^}]*)\}/g)) {
  palettes++;
  const v = Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2].toLowerCase()]));
  console.log(`\n**${name}**\n\n| Uso | Texto | Fondo | Ratio | Mín. | |\n|---|---|---|--:|--:|---|`);
  for (const [fg, bg, min, use] of PAIRS) {
    if (!v[fg] || !v[bg]) {
      fails++;
      console.log(`| ${use} | --${fg} | --${bg} | falta | ${min} | NO |`);
      continue;
    }
    const r = Math.floor(ratio(v[fg], v[bg]) * 100) / 100; // truncado: WCAG no redondea hacia arriba
    if (r < min) fails++;
    console.log(`| ${use} | \`${fg}\` ${v[fg]} | \`${bg}\` ${v[bg]} | ${r.toFixed(2)} | ${min} | ${r >= min ? 'ok' : 'NO'} |`);
  }
}
if (!palettes) fails++, console.error('No hay bloques [data-palette=…] en el CSS.');
process.exit(fails ? 1 : 0);
