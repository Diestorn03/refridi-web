/*
  Comportamiento del chrome: cabecera (tema del bloque de debajo, se oculta al bajar, desplegable de servicios, menú <dialog>) y pie
  (interruptor "Reducir movimiento"). Header y Footer importan este módulo: una sola instancia; cada bloque sale si su marcado no está.
  Sin trabajo por cuadro: el tema va por IntersectionObserver y el scroll por un rAF que solo lee scrollY. El giro del isotipo del pie es CSS.
*/
import { onPage, getLenis, setCalm } from './engine.js';

const root = document.documentElement;
const raf = (fn) => { let id = 0; return () => { if (!id) id = requestAnimationFrame(() => { id = 0; fn(); }); }; };
const later = (fn, ms = 150) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

/* Tema del [data-theme] más profundo que cruza una banda de 2 px a `y()` px del borde superior: el último en orden de documento entre los
   que la tocan (los anidados van después que su padre). Si en un cuadro no toca ninguno (un hueco entre secciones), conserva el anterior:
   esa es la histéresis; nunca parpadea a un tema por defecto. La banda se rehace al cambiar el tamaño. */
function followTheme(y, apply) {
  const zones = [...document.querySelectorAll('main [data-theme], body > footer[data-theme]')];
  if (!zones.length) return;
  const hit = new Set();
  let io;
  const build = () => {
    io?.disconnect();
    hit.clear();
    const top = Math.max(0, Math.round(y()));
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? hit.add(e.target) : hit.delete(e.target)));
      const cur = zones.filter((z) => hit.has(z)).pop();
      if (cur) apply(cur.dataset.theme);
    }, { rootMargin: `${-top}px 0px ${-(innerHeight - top - 2)}px 0px` });
    zones.forEach((z) => io.observe(z));
  };
  build();
  addEventListener('resize', later(build));
}

/* ---------- Cabecera ---------- */
onPage(() => {
  const hdr = document.querySelector('[data-cabecera]');
  if (!hdr) return;
  const menu = hdr.querySelector('dialog');
  const burger = hdr.querySelector('[data-menu-open]');
  const srv = hdr.querySelector('[data-srv]');

  followTheme(() => hdr.offsetHeight / 2, (t) => { hdr.dataset.theme = t; });

  // Se oculta tras 80 px seguidos hacia abajo y vuelve tras 40 px hacia arriba (`run` se reinicia al cambiar de sentido: el rebote del
  // trackpad o la cola de Lenis no la hacen parpadear). No se oculta antes del primer gesto del lector (una posición restaurada o un #hash
  // nunca arrancan sin cabecera) ni durante los 3 s que siguen a un clic en el menú (el deslizamiento hacia la sección no cuenta).
  let lastY = scrollY, run = 0, armed = false, pinned = false, unpin;
  const onScroll = raf(() => {
    const y = scrollY, d = y - lastY;
    lastY = y;
    if (y < 120) { run = 0; hdr.classList.remove('is-hidden'); return; }
    run = d * run < 0 ? d : run + d;
    if (run < -40) hdr.classList.remove('is-hidden');
    else if (run > 80 && armed && !pinned && !menu?.open) {
      hdr.classList.add('is-hidden');
      if (srv) srv.open = false;
    }
  });
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, () => { armed = true; }, { once: true, passive: true }));
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, () => { pinned = false; }, { passive: true }));
  hdr.addEventListener('click', (e) => {
    if (!e.target.closest('a[href*="#"]')) return;
    pinned = true;
    clearTimeout(unpin);
    unpin = setTimeout(() => { pinned = false; }, 3000);
  });
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Desplegable de servicios (<details>): se cierra al elegir, al hacer clic fuera y con Esc (devuelve el foco al resumen).
  if (srv) {
    document.addEventListener('click', (e) => { if (srv.open && !srv.contains(e.target)) srv.open = false; });
    srv.addEventListener('click', (e) => { if (e.target.closest('a[href]')) srv.open = false; });
    srv.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !srv.open) return;
      srv.open = false;
      srv.querySelector('summary').focus();
    });
  }

  if (!menu || !burger) return;
  // Menú móvil: showModal() vuelve inerte el resto y Esc lo cierra (evento 'cancel' → 'close'). La entrada y la salida (fundido y 1rem)
  // son CSS (@starting-style + transition-behavior: allow-discrete). `done` corre de forma síncrona al pulsar un enlace: el manejador de
  // anclas del motor viene justo después y necesita el scroll desbloqueado.
  const done = () => {
    root.classList.remove('menu-open');
    getLenis()?.start();
    burger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    if (menu.open) return;
    menu.showModal();
    root.classList.add('menu-open');
    getLenis()?.stop();
    burger.setAttribute('aria-expanded', 'true');
  };
  const close = () => { if (menu.open) { done(); menu.close(); } };
  burger.addEventListener('click', open);
  menu.addEventListener('close', done);
  menu.addEventListener('click', (e) => { if (e.target.closest('[data-menu-close], a[href]')) close(); });
  matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches) close(); });
});

/* ---------- Pie: interruptor "Reducir movimiento" ---------- */
onPage(({ env }) => {
  const sw = document.querySelector('[data-calm]');
  if (!sw) return;
  sw.setAttribute('aria-pressed', String(env.reduced));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { // ya lo pide el sistema: no hay nada que alternar
    sw.disabled = true;
    return;
  }
  // setCalm pone html.calm, guarda 'rf-calm' y emite 'rf:calm'; el motor recarga en el modo nuevo y devuelve al lector a su sitio
  sw.addEventListener('click', () => {
    const next = sw.getAttribute('aria-pressed') !== 'true';
    sw.setAttribute('aria-pressed', String(next));
    setCalm(next);
  });
});
