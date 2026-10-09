// Capturas por CDP: Chrome headless → navega → va a cada objetivo → PNG + errores de consola / HTTP ≥400.
// Uso (Git Bash; las rutas con espacio van entre comillas):
//   node tools/qa/shoot.mjs --port=943N <perfil> [url] [objetivos...] [--reduced] [--calm] [--wait=2500] [--w=… --h=…]
//   perfil:  desktop 1440×900 · laptop 1366×640 · mobile 390×844 (táctil, UA móvil)
//   url:     por defecto http://127.0.0.1:4331/  (?palette=acero funciona)
//   --reduced emula prefers-reduced-motion: reduce · --calm deja puesto el interruptor del pie (localStorage rf-calm).
//            Cada navegación borra rf-palette: la paleta solo la fija ?palette= (el perfil de Chrome se reutiliza entre corridas).
//   --port   puerto CDP de ESTE Chrome (uno por agente: 9431-9434); el perfil temporal va a .shots/profile-<port>
// Objetivos:
//   "#id"        el borde superior del elemento arriba del viewport
//   "#id!"       el borde inferior del elemento abajo del viewport
//   "#id@5"      escena con scroll (p. ej. la cava sticky): 5 cuadros repartidos por todo su recorrido
//   "js:<expr>"  evalúa una expresión en la página (p. ej. un clic) y espera 1,2 s
// Salida: .shots/ en la raíz del repo (SHOTS_DIR la cambia) como <port>-<d|l|m>[R][C]-<página>-<nombre>.png;
// al final imprime los errores de consola, excepciones y respuestas HTTP ≥400. Cierra su Chrome al terminar.
// Ejemplo: node tools/qa/shoot.mjs --port=9431 mobile http://127.0.0.1:4331/ "#servicios" "#sectores@4" --reduced
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const OUT = (process.env.SHOTS_DIR ? resolve(process.env.SHOTS_DIR) : fileURLToPath(new URL('../../.shots/', import.meta.url))).replaceAll('\\', '/').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const flag = (k, d) => { const a = argv.find((x) => x === `--${k}` || x.startsWith(`--${k}=`)); return a ? (a.includes('=') ? a.split('=').slice(1).join('=') : true) : d; };
const PROFILES = { desktop: [1440, 900, false], laptop: [1366, 640, false], mobile: [390, 844, true] };
const PORT = +flag('port', 9431);
const pos = argv.filter((a) => !a.startsWith('--'));
const [mode = 'desktop', ...targets] = pos;
if (!PROFILES[mode]) { console.error(`perfil desconocido "${mode}" (desktop | laptop | mobile)`); process.exit(1); }
const url = /^(https?|file):/.test(targets[0] || '') ? targets.shift() : 'http://127.0.0.1:4331/';
const u = new URL(url);
// nombre corto (MAX_PATH de Windows): los 2 últimos tramos de la ruta + el query
const slug = ((u.pathname.replace(/^\/+|\/+$/g, '').split('/').slice(-2).join('-').replace(/[^a-z0-9]+/gi, '-') || 'home') + (u.search ? '-' + u.search.replace(/[^a-z0-9]+/gi, '') : '')).slice(0, 60);
const tag = `${PORT}-${mode[0]}${flag('reduced') ? 'R' : ''}${flag('calm') ? 'C' : ''}-${slug}`;
const [W, H, mobile] = [+flag('w', PROFILES[mode][0]), +flag('h', PROFILES[mode][1]), PROFILES[mode][2]];
const WAIT = +flag('wait', 2500);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const chrome = spawn(CHROME, ['--headless=new', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${PORT}`, `--window-size=${W},${H}`, `--user-data-dir=${OUT}profile-${PORT}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bye = (code) => { try { chrome.kill(); } catch {} process.exit(code); };
process.on('uncaughtException', (e) => { console.error(e); bye(1); });
process.on('unhandledRejection', (e) => { console.error(e); bye(1); });
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { await sleep(250); try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); wsUrl = t.find((x) => x.type === 'page')?.webSocketDebuggerUrl; } catch {} }
if (!wsUrl) { console.error('Chrome no arrancó en el puerto', PORT); bye(1); }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') errors.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 400));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) errors.push(m.params.type.toUpperCase() + ' ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400));
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errors.push(`HTTP ${m.params.response.status} ${m.params.response.url}`);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); const f = `${OUT}${tag}-${name}.png`; writeFileSync(f, Buffer.from(r.data, 'base64')); console.log('guardada', f); };

await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
if (mobile) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36' });
  await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
}
if (flag('reduced')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
// perfil reutilizado entre corridas: cada navegación arranca sin paleta guardada (solo ?palette= manda) y con calm según --calm
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.removeItem('rf-palette'); ${flag('calm') ? "localStorage.setItem('rf-calm', '1');" : "localStorage.removeItem('rf-calm');"} } catch (e) {}` });
await send('Page.navigate', { url });
await sleep(WAIT);
await shot('00-top');
for (const t of targets) {
  if (t.startsWith('js:')) { console.log('js ->', JSON.stringify(await evalJs(t.slice(3)))?.slice(0, 4000)); await sleep(1200); continue; }
  const frames = t.includes('@') ? +t.split('@')[1] : 0;
  const end = t.endsWith('!');
  const sel = t.replace(/[!@].*$/, '');
  const name = sel.replace(/[^a-z0-9]/gi, '');
  if (frames) {
    const range = await evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { start: r.top + scrollY, end: r.top + scrollY + el.offsetHeight - innerHeight }; })()`);
    if (!range) { console.log('no existe', sel); continue; }
    for (let i = 0; i < frames; i++) {
      const y = Math.round(range.start + ((range.end - range.start) * i) / Math.max(1, frames - 1));
      await evalJs(`window.scrollTo(0, ${y}); 'ok'`);
      await sleep(1400);
      await shot(`${name}-f${i + 1}de${frames}`);
    }
    continue;
  }
  const ok = await evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.scrollIntoView({ block: '${end ? 'end' : 'start'}' }); return true; })()`);
  if (!ok) { console.log('no existe', sel); continue; }
  await sleep(2200);
  await shot(name + (end ? '-fin' : ''));
}
console.log('errores:', errors.length ? '\n  ' + errors.join('\n  ') : 'ninguno');
ws.close();
bye(0);
