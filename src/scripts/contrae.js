/*
  Contracción térmica (MOVIMIENTO-V2 §7): el titular llega ancho y tenue y se cierra a su ancho de cava, línea a línea. Solo scaleX + opacity
  (compositor), sin máscara, sin recorrido vertical, sin blur y sin ejes de fuente animados (regla 11). Una vez por titular, por tiempo
  (--ease-brand vía 'brand'), disparado al cruzar el 92 % del viewport. Fuera del engine: solo este módulo carga el plugin de líneas.
    <h2 data-contrae>…</h2>              origen a la izquierda
    <h2 data-contrae="centro">…</h2>     origen al centro (titulares centrados)
  Uso: en el <script> del componente,  import '../../scripts/contrae.js';  (Astro lo deduplica). Nunca en el H1 ni en un rótulo viajero.
  · reduced / calm: no hace nada (el titular queda como está). lite: solo opacity. Sin JS: titular normal.
  · Un titular que ya está a la vista al arrancar (recarga a mitad de página, o asoma en el primer viewport) no se toca: nunca parpadea.
  · Disparo por IntersectionObserver, sin ScrollTrigger: así, con view(), el motor no registra ScrollTrigger y no queda su bucle de rAF
    con la página quieta (PREPARACION §3.10). El margen superior enorme del observador cuenta como cruzado lo que ya quedó por encima: un
    salto por ancla que se pasa el titular entero también lo dispara (y va al estado final). No hay borde que "toque" y mantenga trabajo
    vivo (§3.5): el observador deja de mirar cada titular en cuanto lo dispara.
  · Puerta de velocidad: |v| > 3000 px/s al entrar → estado final sin animar (v = Δ scrollY / Δt entre eventos de scroll; Lenis y el
    scroll nativo los emiten cada cuadro). 3000 y no los 2000 del engine: los golpes de rueda de Lenis de 4+ muescas pasaban de 2000 y el
    titular llegaba ya cerrado (revisión final de v2).
  · Ritmo: como mucho un titular contrayéndose a la vez; el siguiente espera a que termine el anterior.
  · Al terminar se revierte el partido: el titular vuelve a su marcado original (balance intacto, sin observadores vivos).
  · El ensanche temporal (≤22 %) lo recorta el overflow-x: clip de main: nunca hay scroll horizontal. El alto no cambia (líneas sin máscara).
*/
import { SplitText } from 'gsap/SplitText';
import { onPage } from './engine.js';

const FAST = 3000; // px/s
let free = 0;      // performance.now() en que termina la última contracción programada
let lastY = 0, lastT = 0, v = 0;
addEventListener('scroll', () => {
  const t = performance.now();
  if (t > lastT) v = (Math.abs(scrollY - lastY) * 1000) / (t - lastT);
  lastY = scrollY; lastT = t;
}, { passive: true });
const speed = () => (performance.now() - lastT > 100 ? 0 : v);

onPage(({ gsap, env }) => {
  const els = gsap.utils.toArray('[data-contrae]');
  if (env.reduced || !els.length) return;
  gsap.registerPlugin(SplitText);
  const from = env.lite ? { opacity: 0 } : { opacity: 0, scaleX: 1.22 };
  const fire = new Map();
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    fire.get(e.target)?.(e.boundingClientRect.bottom < 0);
  }), { rootMargin: '100000px 0px -8% 0px' });

  const init = (el) => {
    if (el.getBoundingClientRect().top < innerHeight) return; // ya a la vista al arrancar: no se oculta nunca lo que el lector ve
    let tween, playing = false;
    const split = SplitText.create(el, {
      type: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit(self) {
        gsap.set(self.lines, { transformOrigin: el.dataset.contrae === 'centro' ? '50% 50%' : '0% 50%' });
        tween = gsap.from(self.lines, { ...from, duration: 0.85, ease: 'brand', stagger: 0.12, paused: !playing, onComplete: () => split.revert() });
        return tween; // autoSplit lo revierte y le pasa el progreso si vuelve a partir (cambio de ancho a mitad)
      },
    });
    fire.set(el, (pasado) => {
      if (pasado || speed() > FAST) return void tween.progress(1);
      const now = performance.now(), wait = Math.max(0, free - now);
      free = now + wait + tween.duration() * 1000;
      gsap.delayedCall(wait / 1000, () => { playing = true; tween.play(); });
    });
    io.observe(el);
  };
  // las líneas se miden con la fuente final
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(() => els.forEach(init));
});
