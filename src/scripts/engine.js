/*
  Motor de movimiento: GSAP 3.15 (ScrollTrigger + CustomEase 'brand') + Lenis. Multipágina sin router (las transiciones entre páginas son
  View Transitions nativas: src/styles/transitions.css + el script inline del head de Base.astro). Congelado: solo la fundación lo edita.
  Adaptado del engine más maduro de los repos anteriores (CONCEPTO §7): sin los plugins de texto por líneas ni de trazo, sin data-split /
  data-lit / data-count / data-draw / data-parallax (firmas gastadas, CONCEPTO §8), sin loader, con la curva única 'brand'.

  ── Atributos declarativos ───────────────────────────────────────────────────────────────────────────────────────────────
    [data-reveal]  y  [data-stagger] (sus hijos directos)   asentar: opacity 0→1 y y 48 px→0, una vez (MOVIMIENTO-V2 §4.2).
        ="profundo" (en [data-reveal] o [data-stagger]): y 64 px + scale .94 · [data-stagger="lado"]: x 40 px (desde la derecha).
        Los hace el CSS con animation-timeline: view() (base.css). Este motor SOLO actúa de fallback cuando
        !CSS.supports('animation-timeline: view()') (Firefox, Safari <26): --d-2, curva brand, will-change transitorio y
        puerta de velocidad (|velocidad| > 2000 px/s al entrar → gsap.set al estado final: un scroll rápido nunca espera a una animación).
        [data-start="top 85%"] cambia el punto de entrada del fallback. Nunca en el primer viewport (regla 13).
    Pre-hide: base.css, solo bajo html.js y sin view(); failsafe a los 4 s si el motor no arranca (si arranca después, deja todo visible).

  ── Secciones con lógica propia: se registran desde el <script> del componente ──────────────────────────────────────────
    import { onPage } from '../../scripts/engine.js';
    onPage(({ gsap, ScrollTrigger, env, lenis, emit, scrollToTarget, onRefresh }) => {
      const root = document.querySelector('#sectores'); if (!root) return;   // salir siempre si la raíz no está en la página
      ...tweens / ScrollTriggers (viven en el gsap.context del motor)...
    });
    La función corre una vez, en DOMContentLoaded, tras registrarse todos los módulos. Un módulo que se registre después corre al instante.
    Plugins de sección (ScrambleText…) se registran en el módulo que los usa (registerPlugin es idempotente), nunca aquí.
    Ninguna sección llama a ScrollTrigger.refresh(): pasa por la puerta del motor (una llamada suelta también acaba en ella).

  ── Puertas ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
    env.reduced = (prefers-reduced-motion: reduce) O html.calm (interruptor "Reducir movimiento" del pie; localStorage 'rf-calm')
    env.desktop = (min-width:768px) and (pointer:fine) and !reduced. Lenis solo aquí.
    env.coarse  = (pointer:coarse)      env.lite = html.is-lite (≤4 núcleos y ≤4 GB, o Save-Data)
    calm e is-lite los decide el script inline del head ANTES del primer pintado (regla 1); el motor lee las clases, así CSS y JS dicen lo mismo.
    Cambios de modo: cruzar 768 px / tipo de puntero, reduced del sistema o 'rf:calm' → guarda la posición (id de sección + fracción),
    recarga y la restaura. Cada módulo programa UN solo modo al iniciar.

  ── Política de scroll ──────────────────────────────────────────────────────────────────────────────────────────────────
    P1  nada animado cambia el layout tras la carga.
    P2  una sola puerta de refresh (requestRefresh): los auto-refresh de ScrollTrigger están apagados. Refresca al arrancar y después solo si
        cambió el alto de alguna sección (fuentes, load, resize), agrupado y nunca con la página en movimiento (espera 160 ms quieta).
    P3  solo transform / opacity.
    P4  Lenis + ScrollTrigger como en la doc oficial, con tope MAX_DT al paso de tiempo que recibe lenis.raf (un cuadro atascado no se paga
        como un salto). Lenis va en el ticker de GSAP SOLO mientras desliza: entra con la rueda o con scrollToTarget y sale tras 2 cuadros
        sin deslizamiento suave; el ticker de GSAP se duerme solo (autoSleep). Página quieta = sin bucle de rAF (PREPARACION §3.10).
    P6  ScrollTrigger se registra al PRIMER USO (useST): el fallback de reveals sin view(), o un módulo que lea `ScrollTrigger` en onPage
        (el api lo da con un getter). Al registrarse arranca su propio bucle de rAF permanente, y con view() nada lo necesita (contrae.js
        dispara por IntersectionObserver).
    P5  saltos largos (anclas a más de 4 viewports): corte a 2 viewports del destino y luego deslizamiento. Si se aterriza en zona nunca
        pintada, espera 250 ms quieto antes de deslizar. Rueda / toque / tecla cancelan la espera. reduced: va directo.
    No hay pins: history.scrollRestoration queda en 'auto'.

  ── Exporta ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
    onPage(fn) · env · scrollToTarget(el|selector|y, {offset, immediate}) · setCalm(on) (html.calm + localStorage + 'rf:calm' → recarga)
    · emit(name, detail) · onRefresh(fn) · getLenis()
  Los enlaces internos de la misma página (<a href="#id">) pasan por scrollToTarget con el desfase del header.
  Eventos (en document, burbujean a window): 'rf:ready' (motor arrancado) · 'rf:calm' {on}.
*/
import { gsap } from './ease.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// P6: registro perezoso. autoRefreshEvents 'none': la puerta de abajo decide cuándo (y si) refrescar.
let stOn = false;
const useST = () => {
  if (!stOn) { stOn = true; gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'none' }); }
  return ScrollTrigger;
};

const root = document.documentElement;
const mqWide = window.matchMedia('(min-width: 768px) and (pointer: fine)');
const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqCoarse = window.matchMedia('(pointer: coarse)');
const hasView = !!window.CSS?.supports?.('animation-timeline: view()');

export const env = {
  get reduced() { return mqReduced.matches || root.classList.contains('calm'); },
  get desktop() { return mqWide.matches && !this.reduced; },
  get coarse() { return mqCoarse.matches; },
  get lite() { return root.classList.contains('is-lite'); },
};

let lenis = null;
let ctx = null;
let booted = false;
const registry = [];

export const getLenis = () => lenis;
export const onRefresh = (fn) => useST().addEventListener('refresh', fn);
export const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
export function setCalm(on) {
  saveScroll(); // antes de que la clase cambie el layout (la cava pasa a estática): la recarga devuelve al lector a su sitio
  root.classList.toggle('calm', on);
  try { on ? localStorage.setItem('rf-calm', '1') : localStorage.removeItem('rf-calm'); } catch (e) { /* storage bloqueado */ }
  emit('rf:calm', { on });
}

/* ---------------- Saltos largos (P5) ---------------- */
const LONG_JUMP = 4, LEAD = 2, SETTLE = 250; // viewports, viewports, ms
const SLICE = 400, seen = new Set();          // franjas de px que ya estuvieron en pantalla
const markSeen = () => { for (let k = Math.floor(window.scrollY / SLICE), e = Math.floor((window.scrollY + innerHeight) / SLICE); k <= e; k++) seen.add(k); };
const isSeen = (a, b) => { for (let k = Math.floor(Math.max(0, a) / SLICE), e = Math.floor(b / SLICE); k <= e; k++) if (!seen.has(k)) return false; return true; };
addEventListener('scroll', markSeen, { passive: true });
let glide = 0;
['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, () => clearTimeout(glide), { passive: true }));
function skipMiddle(to) {
  const vh = innerHeight, d = to - window.scrollY;
  if (Math.abs(d) <= LONG_JUMP * vh) return 0;
  const y = Math.max(0, to - Math.sign(d) * LEAD * vh);
  const warm = isSeen(Math.min(y, to), Math.max(y, to) + vh);
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo({ top: y, behavior: 'instant' });
  return warm ? 0 : SETTLE;
}
export function scrollToTarget(target, opts = {}) {
  const isY = typeof target === 'number';
  const el = isY ? null : typeof target === 'string' ? document.querySelector(target) : target;
  if (!el && !isY) return;
  // aterrizaje por defecto = scroll-padding-top del html + scroll-margin-top del destino, como un salto #hash nativo (Lenis ya resta ambos)
  const gap = (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + (el ? parseFloat(getComputedStyle(el).scrollMarginTop) || 0 : 0);
  const offset = opts.offset ?? (lenis ? 0 : -gap);
  const immediate = opts.immediate || env.reduced;
  const y = isY ? target : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? -gap);
  const go = () => {
    if (lenis) { wake(); return lenis.scrollTo(isY ? target : el, { offset: isY ? 0 : offset, immediate }); }
    window.scrollTo({ top: Math.max(0, y), behavior: immediate ? 'auto' : 'smooth' });
  };
  clearTimeout(glide);
  const wait = immediate ? 0 : skipMiddle(y);
  if (wait) glide = setTimeout(go, wait); else return go();
}

const fontsReady = () => Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]);
const api = () => ({ gsap, get ScrollTrigger() { return useST(); }, env, lenis, emit, scrollToTarget, onRefresh });

/** Registra el inicializador de una sección (ver cabecera). */
export function onPage(fn) {
  registry.push(fn);
  if (booted) { runInit(fn); requestRefresh({ force: true }); }
}
function runInit(fn) {
  try { ctx.add(() => { fn(api()); }); } catch (e) { console.error('[engine] falló el init de una sección', e); }
}

/* ---------------- Puerta de refresh (P2) ---------------- */
const refreshNow = ScrollTrigger.refresh.bind(ScrollTrigger);
ScrollTrigger.refresh = () => requestRefresh(); // una llamada suelta de una sección cae en la puerta
ScrollTrigger.refreshNow = refreshNow;          // solo motor y sondas de QA
let lastScrollAt = 0;
addEventListener('scroll', () => { lastScrollAt = performance.now(); }, { passive: true });
const moving = () => !!lenis?.isScrolling || performance.now() - lastScrollAt < 160;
const layoutSig = () => {
  let s = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll('main > section, body > footer')) s += ',' + Math.round(el.getBoundingClientRect().height);
  return s;
};
let lastSig = '', wantForce = false, queued = false, baseW = innerWidth, baseH = innerHeight;
function refreshEngine() { if (stOn) { ScrollTrigger.sort(); refreshNow(); } lastSig = layoutSig(); baseW = innerWidth; baseH = innerHeight; }
function requestRefresh({ force = false } = {}) {
  if (!lastSig && !force) return;
  wantForce ||= force;
  if (queued) return;
  queued = true;
  const run = () => {
    if (moving()) return void setTimeout(run, 120);
    queued = false;
    const f = wantForce; wantForce = false;
    if (f || layoutSig() !== lastSig) refreshEngine();
  };
  requestAnimationFrame(run);
}
function watchLayout() {
  let t, force = false;
  const later = (f) => { force ||= f; clearTimeout(t); t = setTimeout(() => { const ff = force; force = false; requestRefresh({ force: ff }); }, 250); };
  new ResizeObserver(() => later(false)).observe(document.body);
  // un resize de ventana siempre re-mide, salvo el de la barra de URL del móvil
  addEventListener('resize', () => later(!(env.coarse && innerWidth === baseW && Math.abs(innerHeight - baseH) < baseH * 0.25)), { passive: true });
  if (document.readyState === 'complete') later(false); else addEventListener('load', () => later(false), { once: true });
}

/* ---------------- Lenis (solo env.desktop) ---------------- */
const MAX_DT = 34; // ms (2 cuadros a 60 Hz: lo que pase de ahí es un atasco, no una tasa de refresco)
let clock = 0, prev = 0, idle = 0, ticking = false;
// P4: un cuadro de Lenis. Al despertar avanza un cuadro nominal (no 0: el primer cuadro tras la rueda ya se mueve)
function tick(t) {
  const now = t * 1000;
  clock += prev ? Math.min(now - prev, MAX_DT) : 16.7; prev = now;
  lenis.raf(clock);
  idle = lenis.isScrolling === 'smooth' ? 0 : idle + 1;
  if (idle > 2) { gsap.ticker.remove(tick); ticking = false; prev = 0; }
}
function wake() { if (lenis && !ticking) { ticking = true; idle = 0; gsap.ticker.add(tick); } }
function startLenis() {
  if (!env.desktop) return;
  lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
  lenis.on('scroll', () => { if (stOn) ScrollTrigger.update(); });
  gsap.ticker.lagSmoothing(0);
  // captura en window: llega antes que el manejador de Lenis (el tick corre en el cuadro siguiente, ya con isScrolling = 'smooth')
  addEventListener('wheel', wake, { passive: true, capture: true });
}
// #hash → elemento. Un hash mal formado (/#%) haría lanzar a decodeURIComponent: entonces se busca tal cual.
const byHash = (hash) => { let id = hash.slice(1); try { id = decodeURIComponent(id); } catch (e) { /* tal cual */ } return id ? document.getElementById(id) : null; };
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href*="#"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href, location.href);
  if (url.pathname !== location.pathname || !url.hash || a.target === '_blank') return;
  const el = byHash(url.hash);
  if (!el) return;
  e.preventDefault();
  scrollToTarget(el);
  history.replaceState(history.state, '', url.hash);
  // como el salto nativo: el foco (y el siguiente Tab) sigue al destino. Sin esto el skip link dejaba el foco en sí mismo.
  if (!el.matches('a[href], button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
});

/* ---------------- Reveals: fallback sin view() ---------------- */
// Capa propia solo mientras corre la entrada (no queda una capa fija por elemento revelado).
const layer = (els, on) => { for (const el of els) el.style.willChange = on ? 'transform, opacity' : ''; };
const D2 = 0.5;      // = --d-2
const FAST = 2000;   // px/s: por encima, al estado final sin animar
const FROM = { asentar: { y: 48 }, profundo: { y: 64, scale: 0.94 }, lado: { x: 40 } }; // = keyframes de base.css (3rem / 4rem / 2.5rem)
function settle(els, trigger, start, stagger, variant) {
  const from = env.lite ? {} : FROM[variant] || FROM.asentar;
  ScrollTrigger.create({
    trigger, start, once: true,
    onEnter: (self) => {
      // opacity nunca se limpia: el pre-hide de base.css volvería a ocultar el elemento
      if (Math.abs(self.getVelocity()) > FAST) { gsap.set(els, { opacity: 1, clearProps: 'transform' }); return; }
      gsap.fromTo(els, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, scale: 1, duration: D2, ease: 'brand', stagger, clearProps: 'transform',
        onStart: () => layer(els, true), onComplete: () => layer(els, false) });
    },
  });
}
function initReveals() {
  if (hasView || env.reduced) return; // con view() reveala el CSS; reduced/calm: base.css ya los deja visibles
  useST();
  // arranque tardío (red lenta): el failsafe de base.css (4 s) ya los mostró; con fx-booted volverían a opacity 0 y se animarían otra vez
  if (performance.now() > 4000) return void gsap.set('[data-reveal], [data-stagger] > *', { opacity: 1 });
  gsap.utils.toArray('[data-reveal]').forEach((el) => settle([el], el, el.dataset.start || 'top 88%', 0, el.dataset.reveal));
  gsap.utils.toArray('[data-stagger]').forEach((g) => { const kids = [...g.children]; if (kids.length) settle(kids, g, g.dataset.start || 'top 85%', 0.08, g.dataset.stagger); });
}

/* ---------------- Restauración del scroll tras la recarga por cambio de modo / #hash ---------------- */
const KEY = 'rf-restore';
function saveScroll() {
  try {
    const secs = [...document.querySelectorAll('main > section[id]')];
    const cur = secs.filter((s) => s.getBoundingClientRect().top <= 1).pop();
    if (cur) sessionStorage.setItem(KEY, JSON.stringify({ id: cur.id, f: -cur.getBoundingClientRect().top / cur.offsetHeight }));
  } catch (e) { /* storage bloqueado: la página recarga arriba */ }
}
function restore() {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch (e) { /* nada */ }
  const sec = saved && document.getElementById(saved.id);
  const hashEl = byHash(location.hash);
  let place = sec ? () => {
    const y = sec.getBoundingClientRect().top + window.scrollY + saved.f * sec.offsetHeight;
    window.scrollTo(0, y); lenis?.scrollTo(y, { immediate: true, force: true });
  } : hashEl ? () => scrollToTarget(hashEl, { immediate: true }) : null;
  if (!place) return;
  place();
  // imágenes y el cambio de fuente mueven lo de abajo: re-apunta en cada cambio de alto hasta que el lector toque la página (máx. 4 s)
  const ro = new ResizeObserver(() => place?.());
  ro.observe(document.body);
  const stop = () => { place = null; ro.disconnect(); };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, stop, { once: true, passive: true }));
  setTimeout(stop, 4000);
}

/* ---------------- Arranque ---------------- */
function boot() {
  if (booted) return;
  booted = true;
  startLenis();
  ctx = gsap.context(() => {});
  registry.forEach(runInit);
  ctx.add(initReveals);
  fontsReady().then(() => requestRefresh()); // no-op salvo que las fuentes hayan movido una sección
  root.classList.add('fx-booted');
  refreshEngine();
  restore();
  markSeen();
  requestAnimationFrame(() => { watchLayout(); emit('rf:ready'); });
}

// Los módulos de sección son diferidos: ya se registraron en DOMContentLoaded.
if (document.readyState === 'complete') boot(); else document.addEventListener('DOMContentLoaded', boot, { once: true });

// Cambios de modo (breakpoint / puntero / reduced del sistema / interruptor del pie): recarga y devuelve al lector a su sitio.
let rt;
const reflow = (save = true) => { clearTimeout(rt); rt = setTimeout(() => { if (save) saveScroll(); location.reload(); }, 200); };
mqWide.addEventListener('change', () => reflow());
mqReduced.addEventListener('change', () => reflow());
window.addEventListener('rf:calm', () => reflow(false)); // setCalm() ya guardó la posición
