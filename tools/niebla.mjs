#!/usr/bin/env node
// Niebla del Vidrio (MOVIMIENTO-V2 §4.3): por cada foto de src/data/fotos.js, la misma foto a 96 px de ancho, desenfocada y lavada hacia
// el blanco (vaho), en AVIF q45 → public/img/fotos/<lugar>-niebla.avif. El navegador la amplía: un vidrio empañado sin `filter` en vivo.
// Sale con 1 si alguna pasa de 2 KB. Uso: node tools/niebla.mjs   (después de python insumos/fotos.py y de copiar los recortes)
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fotos } from '../src/data/fotos.js';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const MAX = 2048;
const LAVADO = [0.78, 52]; // salida = 0.78 · entrada + 52: baja el contraste hacia el blanco. Mando de calibración: [1, 0] = solo desenfoque

let bad = 0;
for (const [lugar, f] of Object.entries(fotos)) {
  const src = `${PUB}${f.base}-${f.widths.at(-1)}.jpg`;
  const out = `${PUB}${f.base}-niebla.avif`;
  await sharp(src).resize(96).blur(1.5).linear(...LAVADO).avif({ quality: 45 }).toFile(out);
  const kb = statSync(out).size;
  if (kb > MAX) bad++;
  console.log(`${lugar.padEnd(14)} ${(kb / 1024).toFixed(2)} KB${kb > MAX ? '  > 2 KB' : ''}`);
}
process.exit(bad ? 1 : 0);
