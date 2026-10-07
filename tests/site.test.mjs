// node --test tests/   (sin dependencias: node:test + node:assert)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as site from '../src/data/site.js';

const { wa, whatsapp, waText, normalizeDemo, services, sectors } = site;

test('wa() apunta al número de cada línea', () => {
  assert.equal(wa('servicios'), 'https://wa.me/584241338650');
  assert.match(wa('repuestos', 'x'), /^https:\/\/wa\.me\/584228368270\?text=/);
  assert.match(wa('academia', 'x'), /^https:\/\/wa\.me\/584122344365\?text=/);
  assert.throws(() => wa('ventas', 'x'), /desconocida/);
});

test('wa() codifica el texto (tildes, ñ, signos, espacios, &, #)', () => {
  const t = '¿Tienen disponible válvulas solenoide? Año & #2 ñ';
  const u = new URL(wa('repuestos', t));
  assert.equal(u.searchParams.get('text'), t);
  assert.ok(!/[ ¿ñá&#]/.test(u.search.slice(1).replace(/^text=/, '')), 'el query no lleva caracteres sin codificar');
  assert.equal(wa('servicios', waText.home), `https://wa.me/${whatsapp.servicios}?text=${encodeURIComponent(waText.home)}`);
});

test('demo se normaliza', () => {
  for (const v of ['1', 'true', 'TRUE', 'yes', 1, true]) assert.equal(normalizeDemo(v), true, String(v));
  for (const v of ['', 'off', 'OFF', '0', 'false', ' off ', undefined, null, 0, false]) assert.equal(normalizeDemo(v), false, String(v));
  assert.equal(typeof site.demo, 'boolean');
});

test('cada servicio tiene slug, nombre, waText y CTA', () => {
  assert.deepEqual(services.map((s) => s.slug), ['mantenimiento', 'instalacion', 'restauracion']);
  for (const s of services) {
    assert.match(s.slug, /^[a-z]+(-[a-z]+)*$/, 'slug en minúsculas, sin tildes');
    for (const k of ['name', 'h1', 'title', 'description', 'intro', 'cta', 'waText']) assert.ok(s[k]?.trim(), `${s.slug}.${k}`);
    assert.ok(s.title.length <= 60, `${s.slug}: title ≤60`);
    assert.ok(s.description.length <= 155, `${s.slug}: description ≤155`);
    assert.match(s.waText, /^Hola Refridi, vi en la web /);
    assert.ok(s.trabajos.length >= 3);
    for (const r of s.related.services) assert.ok(site.serviceBySlug(r), `${s.slug}: relacionado ${r}`);
  }
  assert.equal(sectors.length, 4);
});

test('waText de todas las páginas dicen de dónde vienen', () => {
  for (const [k, v] of Object.entries(waText)) {
    const t = typeof v === 'function' ? v('compresores') : v;
    assert.match(t, /web/, k);
  }
});

test('no hay números ni textos de otros clientes', () => {
  const dump = JSON.stringify(site, (k, v) => (typeof v === 'function' ? v.toString() : v));
  // otros proyectos del estudio (gate de higiene, PREPARACION §8)
  assert.doesNotMatch(dump, /visual ?dental|vd[:-]|ssds|renew|expertsddt|polanco|15106760418|dimensionar|Cotizar por WhatsApp|visita técnica/i);
  // CTAs vetados (CONCEPTO §8)
  assert.doesNotMatch(dump, /pedir diagnóstico|\bagend|coordinar visita|solicitar visita/i);
  // clientes de Refridi sin permiso (Q13): ningún nombre del mural
  assert.doesNotMatch(dump, /polar|plumrose|del monte|puig|luxor|catania|euroma|deliplaza/i);
  // solo los números de Refridi: 58 + 0424/0422/0412 de MAPA §2b; nada de prefijos +1
  const nums = dump.match(/\b\d{10,13}\b/g) ?? [];
  for (const n of nums) assert.ok(['584241338650', '584228368270', '584122344365'].includes(n), `número ajeno: ${n}`);
});
