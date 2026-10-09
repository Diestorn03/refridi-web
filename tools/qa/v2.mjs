// Sondas de MOVIMIENTO-V2 §11 por CDP, siempre sobre dist/preview (nunca dev). Chrome headless propio; lo cierra y borra su perfil al terminar.
// Uso (Git Bash):  npx astro preview --port 4360 --host 127.0.0.1   y en otra terminal:
//   node tools/qa/v2.mjs p95 [home|ficha|todo]   p95 del cuadro con la CPU ×4: home a 1366×640 (Lenis, rueda) y 360×640 (scroll nativo, toque),
//                                               y la ficha de instalación a 1366×640. Por escena: cuadros, media, p95, máx. y lo que más pesa.
//   node tools/qa/v2.mjs gates                  consola, CLS, scrollHeight (DCL / load / +2 s / tras recorrer), reveals completos, tema del
//                                               header, página quieta 2 s, desborde 320-2560, reduced / calm / lite / sin JS y VT home→ficha.
//   node tools/qa/v2.mjs secuencia              capturas cada 0,5 viewport del home (1440×900 y 390×844) en .shots/v2/ (hoja: tools/qa/hoja.py)
// Opciones: --url=http://127.0.0.1:4360  --port=9460 (CDP)  --vueltas=N (p95: pasadas por perfil; se informa la mediana)
//   p95 A/B: --perfiles=l,s  --css="<regla>" (hoja inyectada al cargar, p. ej. ".uc__helice{animation:none!important}")
//            --bloquear="*Sectores.astro*" (Network.setBlockedURLs, p. ej. para quitar cava.js)  --sin-lenis (rueda nativa en desktop)
// Cuadro = suma de las tareas de primer nivel (RunTask) del hilo principal del renderer entre dos BeginMainThreadFrame (A4, .shots/a4/p8.mjs).
// La escena de cada cuadro sale de un console.timeStamp('y<scrollY>') por rAF, solo mientras se mide (la página quieta no lleva bucle).
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = (k, d) => argv.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=') ?? d;
const [modo = 'gates', cual = 'todo'] = argv.filter((a) => !a.startsWith('--'));
const BASE = opt('url', 'http://127.0.0.1:4360').replace(/\/$/, '');
const PORT = +opt('port', 9460);
const VUELTAS = +opt('vueltas', 3);
const CSS_EXTRA = opt('css', '');
const BLOQUEAR = opt('bloquear', '');
const PERFS = opt('perfiles', 'l,s').split(',');
const SIN_LENIS = argv.includes('--sin-lenis'); // A/B: el motor ve (pointer: fine) en falso y no arranca Lenis (rueda nativa); el CSS no cambia
const SHOTS = fileURLToPath(new URL('../../.shots/', import.meta.url));
const OUT = SHOTS + 'v2/';
const PROFILE = `${SHOTS}profile-${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (n) => Math.round(n * 10) / 10;
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };

/* ---------------- CDP ---------------- */
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' });
const bye = async (code) => { try { chrome.kill(); } catch {} await sleep(800); try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5 }); } catch {} process.exit(code); };
process.on('uncaughtException', (e) => { console.error(e); bye(1); });
process.on('unhandledRejection', (e) => { console.error(e); bye(1); });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { await sleep(250); try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((x) => x.type === 'page')?.webSocketDebuggerUrl; } catch {} }
if (!wsUrl) { console.error('Chrome no arrancó en', PORT); await bye(1); }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r));
let seq = 0; const pending = new Map(); const listeners = new Set(); let errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? { error: m.error }); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXCEPCIÓN ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(m.params.type)) errors.push(m.params.type + ' ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
  if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) errors.push(`log ${m.params.entry.level} ${m.params.entry.text.slice(0, 200)} ${m.params.entry.url || ''}`);
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errors.push(`HTTP ${m.params.response.status} ${m.params.response.url}`);
  listeners.forEach((f) => f(m));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r?.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r?.result?.value; };
const once = (method, ms = 20000) => new Promise((r) => { const f = (m) => { if (m.method === method) { listeners.delete(f); r(true); } }; listeners.add(f); setTimeout(() => { listeners.delete(f); r(false); }, ms); });
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
if (BLOQUEAR) await send('Network.setBlockedURLs', { urls: BLOQUEAR.split(',') });

const PERFILES = { d: [1440, 900, false], l: [1366, 640, false], m: [390, 844, true], s: [360, 640, true] };
const UA_MOVIL = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
// en cada documento: alturas (DCL, load, load + 2 s), CLS acumulado, paleta limpia, calm y lite según el caso (antes del script del head)
const SONDA = (calm, lite) => `try { localStorage.removeItem('rf-palette'); sessionStorage.clear(); ${calm ? "localStorage.setItem('rf-calm','1');" : "localStorage.removeItem('rf-calm');"} } catch (e) {}
  ${lite ? "Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });" : ''}
  ${SIN_LENIS ? "const mm0 = window.matchMedia.bind(window); window.matchMedia = (q) => (q === '(min-width: 768px) and (pointer: fine)' ? Object.assign(mm0('(max-width: 0px)'), {}) : mm0(q));" : ''}
  window.__h = {}; window.__cls = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  document.addEventListener('DOMContentLoaded', () => { __h.dcl = document.documentElement.scrollHeight; });
  addEventListener('load', () => { __h.load = document.documentElement.scrollHeight; setTimeout(() => { __h.load2 = document.documentElement.scrollHeight; }, 2000); });
  ${CSS_EXTRA ? `document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = ${JSON.stringify(CSS_EXTRA)}; document.head.append(st); });` : ''}
  window.__marcas = (on) => { window.__m = on; if (on) requestAnimationFrame(function f() { if (!window.__m) return; console.timeStamp('y' + Math.round(scrollY)); requestAnimationFrame(f); }); };`;
let scriptId = null;
async function open(path, { p = 'd', w, h, reduced = false, calm = false, lite = false, nojs = false, wait = 2600 } = {}) {
  const [W, H, mobile] = PERFILES[p];
  w ??= W; h ??= H;
  if (scriptId) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptId });
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Emulation.setUserAgentOverride', { userAgent: mobile ? UA_MOVIL : '' });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: mobile, configuration: 'mobile' });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await send('Emulation.setScriptExecutionDisabled', { value: nojs });
  scriptId = (await send('Page.addScriptToEvaluateOnNewDocument', { source: SONDA(calm, lite) })).identifier;
  await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
  errors = [];
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: BASE + path });
  await loaded; await sleep(wait);
}
async function trace(fn) {
  const events = []; let done; const fin = new Promise((r) => (done = r));
  const f = (m) => { if (m.method === 'Tracing.dataCollected') events.push(...m.params.value); if (m.method === 'Tracing.tracingComplete') done(); };
  listeners.add(f);
  await send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,toplevel', transferMode: 'ReportEvents' });
  const extra = await fn();
  await send('Tracing.end'); await fin; listeners.delete(f);
  return { events, extra };
}

/* ---------------- escenas ---------------- */
const ESCENAS = {
  home: [['Azotea', '#inicio'], ['Servicios (cabecera)', '#servicios'], ['Despiece', '.despiece__pista'], ['Tres vidrios', '.filas'], ['Criterio (cabecera)', '#criterio'],
    ['Pull-down', '.pull__pista'], ['Pizarra', '.criterio__cierre'], ['Cortina', '.cava__pista'], ['Sectores', '.cava__sectores'], ['Anaquel', '#repuestos'],
    ['Aula', '#academia'], ['Consigna', '#contacto'], ['Pie', 'body > footer']],
  ficha: [['Salida', '#servicio'], ['Alcance', '#alcance'], ['Clave', '#clave'], ['Relacionados', '#relacionados'], ['Consigna', '#contacto'], ['Pie', 'body > footer']],
};
const tops = (lista) => js(`(${JSON.stringify(lista)}).map(([n, s]) => { const el = document.querySelector(s); return el ? [n, Math.round(el.getBoundingClientRect().top + scrollY)] : null; }).filter(Boolean).sort((a, b) => a[1] - b[1])`);
const escenaDe = (ts, y, vh) => { let n = ts[0][0]; for (const [name, top] of ts) if (top <= y + vh / 2) n = name; return n; };

/* ---------------- p95 ---------------- */
async function recorrido(p) {
  const max = await js('document.documentElement.scrollHeight - innerHeight');
  const t0 = Date.now();
  if (PERFILES[p][2]) {
    // táctil: arrastres de toque (scroll nativo en el compositor): 420 px en pasos de 20 px cada 16 ms (≈1250 px/s), y se suelta
    let last = -1;
    while (Date.now() - t0 < 120000) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 540 }] });
      for (let d = 20; d <= 420; d += 20) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: 540 - d }] }); await sleep(16); }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(60);
      const y = await js('scrollY');
      if (y >= max - 2 || y === last) break;
      last = y;
    }
  } else {
    // rueda real (Lenis la recibe): 100 px cada 50 ms ≈ 2000 px/s de entrada
    for (let i = 0; Date.now() - t0 < 90000; i++) {
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 683, y: 320, deltaX: 0, deltaY: 100 });
      await sleep(50);
      if (i % 10 === 9 && (await js('scrollY')) >= max - 2) break;
    }
  }
  await sleep(1200);
  return { ms: Date.now() - t0, y: await js('scrollY'), max };
}
function cuadros(events, ts, vh) {
  const marks = events.filter((e) => e.name === 'TimeStamp' && /^y\d+$/.test(e.args?.data?.message || ''));
  if (!marks.length) throw new Error('sin marcas en la traza');
  const { pid, tid } = marks[0];
  const mine = events.filter((e) => e.pid === pid && e.tid === tid);
  const tasks = mine.filter((e) => e.name === 'RunTask' && e.ph === 'X').map((e) => [e.ts, e.dur / 1000]).sort((a, b) => a[0] - b[0]);
  const begins = mine.filter((e) => e.name === 'BeginMainThreadFrame').map((e) => e.ts).sort((a, b) => a - b).filter((t) => t >= marks[0].ts && t <= marks.at(-1).ts);
  const ys = marks.map((e) => [e.ts, +e.args.data.message.slice(1)]).sort((a, b) => a[0] - b[0]);
  const detail = mine.filter((e) => e.ph === 'X' && e.dur > 0 && e.name !== 'RunTask' && !/^ThreadController|^ThreadPool/.test(e.name));
  const out = [];
  let ti = 0, yi = 0, di = 0;
  for (let i = 0; i < begins.length - 1; i++) {
    const [a, b] = [begins[i], begins[i + 1]];
    while (ti < tasks.length && tasks[ti][0] < a) ti++;
    let ms = 0; for (let j = ti; j < tasks.length && tasks[j][0] < b; j++) ms += tasks[j][1];
    while (yi + 1 < ys.length && ys[yi + 1][0] <= a) yi++;
    const by = {};
    while (di < detail.length && detail[di].ts < a) di++;
    for (let j = di; j < detail.length && detail[j].ts < b; j++) by[detail[j].name] = (by[detail[j].name] || 0) + detail[j].dur / 1000;
    out.push({ ms, escena: escenaDe(ts, ys[yi][1], vh), by });
  }
  return out;
}
function resumen(frames) {
  const rows = {};
  for (const f of frames) (rows[f.escena] ||= []).push(f);
  const fila = (fs, n = 4) => {
    const by = {}; for (const f of fs) for (const [k, v] of Object.entries(f.by)) by[k] = (by[k] || 0) + v;
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${r1(v / fs.length)}`).join(' · ');
    const ms = fs.map((f) => f.ms);
    return { n: fs.length, media: r1(ms.reduce((a, b) => a + b, 0) / ms.length), p95: r1(pct(ms, 0.95)), max: r1(Math.max(...ms)), top };
  };
  return { total: fila(frames, 12), escenas: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, fila(v)])) };
}
async function p95(path, p, escenas) {
  await open(path, { p, wait: 3000 });
  // pasada de calentamiento sin límite de CPU: las imágenes lazy quedan cargadas (la red no es lo que se mide aquí)
  for (let y = 0, max = await js('document.documentElement.scrollHeight'); y < max; y += 600) { await js(`window.scrollTo(0, ${y}); 1`); await sleep(120); }
  await js('window.scrollTo(0, 0); 1'); await sleep(1500);
  const ts = await tops(escenas); const vh = await js('innerHeight');
  const pasadas = [];
  for (let v = 0; v < VUELTAS; v++) {
    await js('window.scrollTo(0, 0); 1'); await sleep(1500);
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const { events, extra } = await trace(async () => { await js('__marcas(true); 1'); await sleep(300); const r = await recorrido(p); await js('__marcas(false); 1'); return r; });
    await send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const res = resumen(cuadros(events, ts, vh));
    console.log(`  pasada ${v + 1}: ${extra.ms} ms hasta y=${extra.y}/${extra.max} · cuadros ${res.total.n} · media ${res.total.media} · p95 ${res.total.p95} ms`);
    pasadas.push(res);
  }
  // mediana por pasada (total y cada escena)
  const med = (k, f) => r1(pct(pasadas.map((x) => (k ? x.escenas[k]?.[f] : x.total[f])).filter((x) => x != null), 0.5));
  const nombres = [...new Set(pasadas.flatMap((x) => Object.keys(x.escenas)))].sort((a, b) => ts.findIndex((t) => t[0] === a) - ts.findIndex((t) => t[0] === b));
  const tabla = [{ escena: 'TODO', n: med(null, 'n'), media: med(null, 'media'), p95: med(null, 'p95'), max: med(null, 'max'), top: pasadas[0].total.top }]
    .concat(nombres.map((k) => ({ escena: k, n: med(k, 'n'), media: med(k, 'media'), p95: med(k, 'p95'), max: med(k, 'max'), top: pasadas.map((x) => x.escenas[k]?.top).find(Boolean) })));
  console.log(`\n| ${path} ${PERFILES[p][0]}×${PERFILES[p][1]} | cuadros | media ms | p95 ms | máx ms | ≤12 | más pesado (ms/cuadro) |\n|---|--:|--:|--:|--:|---|---|`);
  for (const t of tabla) console.log(`| ${t.escena} | ${t.n} | ${t.media} | ${t.p95} | ${t.max} | ${t.p95 <= 12 ? 'ok' : 'NO'} | ${t.top} |`);
  console.log('consola:', errors.length ? errors.join(' | ') : '0');
  return tabla;
}

/* ---------------- gates ---------------- */
// lo que debe acabar visible: reveals, hijos de stagger, titulares que se contraen, antetítulos. Fuera lo que vive dentro de una pista
// fijada: ahí la opacidad la manda la escena (p. ej. el interior de la cava al 35 % con la cortina cerrada), y se revisa en las capturas
const VISIBLES = `[...document.querySelectorAll('main [data-reveal], main [data-stagger] > *, [data-contrae], main .eyebrow')].filter((el) => !el.closest('.despiece__pista, .pull__pista, .cava__pista'))`;
async function barrido(step = 0.5, settle = 900) {
  // baja de 0,5 en 0,5 viewport; en cada parada, todo lo que tenga la parte de arriba entre el 8 % y el 55 % del viewport debe estar a opacity ≥ .98
  // (lo que ya cruzó su rango) y el tema del header debe ser el de la zona que tiene debajo
  const malos = new Set(), temas = new Set();
  const vh = await js('innerHeight'), max = await js('document.documentElement.scrollHeight - innerHeight');
  for (let y = 0; ; y = Math.min(max, y + Math.round(vh * step))) {
    await js(`window.scrollTo(0, ${y}); 1`); await sleep(settle);
    const r = await js(`(() => {
      const op = (el) => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
      const bad = ${VISIBLES}.filter((el) => { const b = el.getBoundingClientRect(); return b.height > 0 && b.top > innerHeight * 0.08 && b.top < innerHeight * 0.55 && op(el) < 0.98; })
        .map((el) => (el.id ? '#' + el.id : el.className ? el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] : el.tagName.toLowerCase()) + ' ' + op(el).toFixed(2));
      const hdr = document.querySelector('[data-cabecera]');
      let tema = null;
      if (hdr && !hdr.classList.contains('is-hidden')) { const zs = [...document.querySelectorAll('main [data-theme], body > footer[data-theme]')].filter((z) => { const b = z.getBoundingClientRect(); return b.top <= hdr.offsetHeight / 2 && b.bottom > hdr.offsetHeight / 2; }); const z = zs.pop(); if (z && z.dataset.theme !== hdr.dataset.theme) tema = 'y' + Math.round(scrollY) + ' header ' + hdr.dataset.theme + ' ≠ ' + z.dataset.theme; }
      return { bad, tema };
    })()`);
    r.bad.forEach((b) => malos.add(b)); if (r.tema) temas.add(r.tema);
    if (y >= max) break;
  }
  await sleep(800);
  const fin = await js(`[...document.querySelectorAll('body > footer [data-stagger] > *, body > footer [data-reveal]')].filter((el) => +getComputedStyle(el).opacity < 0.98).length`);
  return { malos: [...malos], temas: [...temas], pieIncompleto: fin };
}
const QUIETA = `document.getAnimations().filter((a) => a.playState === 'running' && a.timeline === document.timeline).map((a) => (a.animationName || a.constructor.name) + '@' + (a.effect?.target?.className || '')).slice(0, 6)`;
async function quieta() {
  // 2 s sin tocar nada: animaciones por tiempo corriendo y coste del hilo principal (rAF por segundo, ms de tareas por segundo)
  await sleep(1500);
  const { events } = await trace(() => sleep(2000));
  const main = events.filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain').map((e) => [e.pid, e.tid]);
  const runs = (pid, tid) => events.filter((e) => e.pid === pid && e.tid === tid && e.name === 'RunTask' && e.ph === 'X');
  const [pid, tid] = main.sort((a, b) => runs(...b).length - runs(...a).length)[0] || [];
  const raf = events.filter((e) => e.pid === pid && e.name === 'FireAnimationFrame').length;
  const busy = runs(pid, tid).reduce((s, e) => s + e.dur / 1000, 0);
  return { anim: await js(QUIETA), rafPorS: r1(raf / 2), msPorS: r1(busy / 2) };
}
async function gates() {
  const res = {}; const fallos = [];
  const anota = (k, ok, v) => { res[k] = v; if (!ok) fallos.push(k); console.log(`${ok ? 'ok ' : 'NO '} ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`); };
  const paginas = ['/', '/servicios/mantenimiento/', '/servicios/instalacion/', '/servicios/restauracion/'];
  for (const path of paginas) for (const p of ['d', 'l', 'm', 's']) {
    await open(path, { p, wait: 2800 });
    const h0 = await js('window.__h');
    const b = await barrido();
    const h1 = await js('document.documentElement.scrollHeight');
    const q = path === '/' || p === 'd' ? await quieta() : null;
    const cls = await js('window.__cls');
    const k = `${path} ${PERFILES[p][0]}×${PERFILES[p][1]}`;
    anota(`${k} · consola`, !errors.length, errors.length ? errors.join(' | ') : '0');
    anota(`${k} · CLS`, cls < 0.001, r1(cls * 1000) / 1000);
    anota(`${k} · scrollHeight DCL/load/+2s/tras`, h0.dcl === h0.load && h0.load === h0.load2 && h0.load2 === h1, `${h0.dcl}/${h0.load}/${h0.load2}/${h1}`);
    anota(`${k} · reveals completos`, !b.malos.length && !b.pieIncompleto, b.malos.length || b.pieIncompleto ? `${b.malos.join(', ')} · pie ${b.pieIncompleto}` : 'todos');
    anota(`${k} · tema del header`, !b.temas.length, b.temas.length ? b.temas.join(' | ') : 'coincide en cada parada');
    if (q) anota(`${k} · página quieta 2 s`, !q.anim.length, `${q.anim.length} animaciones por tiempo; ${q.rafPorS} rAF/s; ${q.msPorS} ms/s de hilo principal`);
    if (path === '/') {
      // ritmo: entre dos escenas fijadas, ≥ 0,8 viewport de recorrido libre (final de una pista → principio de la siguiente)
      const sep = await js(`(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const a = r('.despiece__pista'), b = r('.pull__pista'), c = r('.cava__pista');
        return [(b.top - a.bottom) / innerHeight, (c.top - b.bottom) / innerHeight].map((x) => Math.round(x * 100) / 100); })()`);
      anota(`${k} · separación Despiece→Pull · Pull→Cortina (viewports)`, sep.every((x) => x >= 0.8), sep.join(' · '));
    }
  }
  // desborde horizontal, arriba y abajo
  for (const path of paginas) {
    const malos = [];
    for (const w of [320, 360, 390, 768, 900, 960, 1024, 1280, 1366, 1440, 1920, 2560]) {
      await open(path, { p: w < 768 ? 'm' : 'd', w, h: w < 768 ? 800 : 900, wait: 1200 });
      for (const y of [0, 0.5, 1]) { await js(`window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ${y}); 1`); await sleep(350); const sw = await js('document.documentElement.scrollWidth - document.documentElement.clientWidth'); if (sw > 0) malos.push(`${w}@${y}:+${sw}`); }
    }
    anota(`${path} · desborde 320-2560`, !malos.length, malos.length ? malos.join(' ') : '0 en 12 anchos');
  }
  // modos estáticos: pistas en auto, sin sticky, sin animación ligada al scroll (lite: solo reveals de opacidad), todo visible
  const PISTAS = `[['despiece', '.despiece__pista', '.despiece__sticky'], ['pull', '.pull__pista', '.pull__sticky'], ['cava', '.cava__pista', '.cava__sticky']].map(([n, a, b]) => { const p = document.querySelector(a), s = document.querySelector(b); return n + ':' + (p.offsetHeight === s.offsetHeight ? 'auto' : p.offsetHeight + '≠' + s.offsetHeight) + '/' + getComputedStyle(s).position; }).join(' ')`;
  const ANIMS = `(() => { const a = document.getAnimations(); return { n: a.length, names: [...new Set(a.map((x) => x.animationName || 'js'))] }; })()`;
  for (const [tag, o] of [['reduced', { reduced: true }], ['calm', { calm: true }], ['lite', { lite: true }], ['1366×560 (ventana baja)', { h: 560 }]]) for (const p of ['d', 'm']) {
    await open('/', { p, ...o, ...(o.h ? { p: 'l', w: 1366 } : {}), wait: 2600 });
    const k = `estático ${tag} ${o.h ? '' : PERFILES[p][0]}`;
    const pistas = await js(PISTAS), anims = await js(ANIMS), html = await js('document.documentElement.className');
    const b = await barrido(0.75, 500);
    // lite: solo los reveals de opacidad · ventana baja: solo se exige que las escenas fijadas sean estáticas · reduced y calm: nada
    const okAnims = tag === 'lite' ? anims.names.every((n) => n === 'asentar-lite') : o.h ? true : anims.n === 0;
    anota(`${k} · pistas`, !/≠|sticky/.test(pistas), pistas);
    anota(`${k} · animaciones`, okAnims, `${anims.n} [${anims.names.join(',')}] · html.${html.trim().replace(/\s+/g, '.')}`);
    anota(`${k} · todo visible`, !b.malos.length && !b.pieIncompleto, b.malos.length ? b.malos.join(', ') : 'sí');
    if (o.h) break;
  }
  // sin JS: el texto visible (lo que es CSS sigue con view(): se comprueba en su sitio)
  await open('/', { p: 'd', nojs: true, wait: 1500 });
  const nj = await barrido(0.75, 400);
  anota('sin JS · texto visible', !nj.malos.length, nj.malos.length ? nj.malos.join(', ') : 'sí');
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  // VT home → ficha con clic real en la fila de instalación: llega con html.vt, el rótulo y sus ancestros sin transformada en scrollY 0
  for (const p of ['d', 'm']) {
    await open('/', { p, wait: 2500 });
    const c = await js(`(() => { const a = document.querySelector('.fila__link[href*="instalacion"]'); a.scrollIntoView({ block: 'center' }); return 1; })()`);
    await sleep(1200);
    const pt = await js(`(() => { const r = document.querySelector('.fila__link[href*="instalacion"] [data-rotulo]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    const nav = once('Page.loadEventFired');
    if (PERFILES[p][2]) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt[0], y: pt[1] }] }); await sleep(60); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt[0], y: pt[1] }); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt[0], y: pt[1], button: 'left', clickCount: 1 }); await sleep(60); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt[0], y: pt[1], button: 'left', clickCount: 1 }); }
    await nav; await sleep(1500);
    const vt = await js(`(() => { const out = []; for (let e = document.getElementById('rotulo'); e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.transform !== 'none' || !['none', '0px'].includes(cs.translate) || cs.scale !== 'none' || cs.rotate !== 'none') out.push(e.tagName + '.' + e.className + ' ' + cs.transform + '/' + cs.translate + '/' + cs.scale); } return { url: location.pathname, vt: document.documentElement.classList.contains('vt'), y: scrollY, trans: out }; })()`);
    anota(`VT home→ficha ${PERFILES[p][0]}`, vt.url === '/servicios/instalacion/' && vt.vt && vt.y === 0 && !vt.trans.length && !errors.length, `${vt.url} vt=${vt.vt} y=${vt.y} transformadas: ${vt.trans.join(' | ') || '0'} consola: ${errors.length}`);
  }
  console.log(`\n${fallos.length ? 'FALLAN ' + fallos.length + ':\n  ' + fallos.join('\n  ') : 'Todos los gates en verde.'}`);
  return { res, fallos };
}

/* ---------------- secuencia ---------------- */
async function secuencia() {
  mkdirSync(OUT, { recursive: true });
  const meta = [];
  for (const p of ['d', 'm']) {
    await open('/', { p, wait: 3000 });
    const ts = await tops(ESCENAS.home);
    const vh = await js('innerHeight'), max = await js('document.documentElement.scrollHeight - innerHeight');
    let i = 0;
    for (let y = 0; ; y = Math.min(max, y + Math.round(vh / 2))) {
      await js(`window.scrollTo(0, ${y}); 1`); await sleep(y ? 1100 : 400);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const f = `${p}-${String(i).padStart(2, '0')}.png`;
      writeFileSync(OUT + f, Buffer.from(r.data, 'base64'));
      meta.push({ perfil: p, f, y, escena: escenaDe(ts, y, vh) });
      i++;
      if (y >= max) break;
    }
    console.log(`${p}: ${i} capturas, alto ${max + vh}`);
  }
  writeFileSync(OUT + 'secuencia.json', JSON.stringify(meta, null, 1));
  console.log('consola:', errors.length ? errors.join(' | ') : '0');
}

let code = 0;
try {
  if (modo === 'p95') {
    const todo = {};
    if (cual !== 'ficha') for (const p of PERFS) todo['home_' + p] = await p95('/', p, ESCENAS.home);
    if (cual !== 'home') for (const p of PERFS) todo['ficha_' + p] = await p95('/servicios/instalacion/', p, ESCENAS.ficha);
    mkdirSync(OUT, { recursive: true }); writeFileSync(OUT + `p95-${cual}.json`, JSON.stringify(todo, null, 1));
  } else if (modo === 'gates') {
    const g = await gates(); mkdirSync(OUT, { recursive: true }); writeFileSync(OUT + 'gates.json', JSON.stringify(g, null, 1));
  } else if (modo === 'secuencia') await secuencia();
  else { console.error('modo desconocido:', modo); code = 1; }
} catch (e) { console.error(e); code = 1; } finally { ws.close(); await bye(code); }
