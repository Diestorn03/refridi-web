/* SIN IMPORTAR desde la QA de integración v2 (docs/QA-PROPUESTA.md): +4,7 ms de media y +7 ms de p95 por cuadro en la cava con la CPU ×4.
   Para reactivarlo: <script>import '../../scripts/cava.js';</script> en Sectores.astro y `.cava__cortina b { transition: rotate 100ms linear }`
   dentro de su puerta. Ojo: leer ScrollTrigger en onPage hace que el motor lo registre (engine.js P6) y con él vuelve su bucle de rAF
   con la página quieta (revisión final de v2). */
/*
  Balanceo de la cortina de la cava (MOVIMIENTO-V2 §5.4): con un scroll rápido la base de cada tira se va hacia afuera y, al parar, vuelve a
  la vertical sin rebote. Las del centro (k = 0) se mecen más: por ahí pasa el aire. La única pieza de la escena con JS mientras se hace
  scroll, y no por cuadro: un paso cada 100 ms escribe `rotate` en el soporte de cada tira (.cava__cortina i > b) y la transición CSS de
  100 ms lineal (Sectores.astro) interpola en el compositor (PREPARACION §3 regla 3: nunca escribir transformadas en cada cuadro).
  · Física = la curva 'brand' (ζ = 1, ω = 6, CONCEPTO §2) como resorte críticamente amortiguado que persigue amp × velocidad, integrado
    en subpasos de 16 ms. No es gsap.quickTo: un quickTo con 'brand' re-apuntado en cada cuadro vuelve a arrancar la curva en su tramo lento
    y la tira no pasaba de 0,3° en un tirón (medido). El resorte conserva la velocidad al re-apuntar.
  · Coste medido (A/B en la misma página, dist, CPU ×4, 1366×640, Lenis, rueda a ~2500 px/s por toda la pista): +2,4-2,8 ms de hilo
    principal por cuadro de media (recálculo de estilo ≈ +1, Layerize + PrePaint ≈ +0,8). Escribiendo en cada cuadro: +7,9. Lanzando
    animaciones WAAPI del resorte solo al cambiar de nivel de velocidad: lo mismo (+1,8-2,4), con más código. El b no pinta (PVC y grapa
    son sus pseudos) y rotate no se hereda: el recálculo toca 8 estilos. Si el p95 de la escena no cabe, se quita el import en
    Sectores.astro y la escena CSS queda igual.
  · Puerta de velocidad: Δ scrollY / Δt del paso, de 0 a 1 entre 400 y 2500 px/s (un tirón nunca pasa de 6°). Por debajo de 400 px/s
    (leer bajando con la rueda) las tiras no se mueven y no se escribe nada; solo se escribe cuando el ángulo cambia. Fuera de la pista, 0.
  · Solo corre desde que la pista se mueve hasta que las tiras se asientan (|x|, |v| < 0,1: menos de 1 px en la base): con la página
    quieta, nada. 1,2 s después de parar, todas a 0 y sin transiciones en curso.
  · No arranca con reduced / calm, lite, sin view() ni con ventanas de menos de 600 px de alto (la escena es estática y no hay cortina).
    Nada de refresh(). Lo importa Sectores.astro.
*/
import { onPage } from './engine.js';

const W = 6, VMIN = 400, VMAX = 2500, AMP = 6, PASO = 100; // ω de 'brand' (1/s) · px/s sin giro y del giro máximo · grados de la tira central · ms (= la transición CSS)

onPage(({ ScrollTrigger, env }) => {
  const root = document.querySelector('#sectores');
  if (!root || env.reduced || env.lite || !CSS.supports('animation-timeline: view()') || matchMedia('(max-height: 599px)').matches) return;
  // k y el sentido de apertura salen del CSS, heredados del i (juego de 8 o de 6, según el ancho al cargar)
  const tiras = [...root.querySelectorAll('.cava__cortina b')].map((el) => {
    const cs = getComputedStyle(el), k = parseFloat(cs.getPropertyValue('--k')) || 0;
    return { el, amp: Math.sign(parseFloat(cs.getPropertyValue('--rot'))) * AMP * (1 - 0.15 * k), x: 0, v: 0, r: '0.00' };
  });
  let y = 0, prev = 0, timer = 0;
  const paso = () => {
    const now = performance.now(), dt = Math.min(now - prev, 2 * PASO) / 1000;
    prev = now;
    const vel = st.isActive ? Math.min(1, Math.max(0, (Math.abs(scrollY - y) / dt - VMIN) / (VMAX - VMIN))) : 0;
    y = scrollY;
    let quieto = vel === 0;
    const n = Math.max(1, Math.round(dt / 0.016)), h = dt / n;
    for (const t of tiras) {
      for (let i = 0; i < n; i++) { t.v += (W * W * (t.amp * vel - t.x) - 2 * W * t.v) * h; t.x += t.v * h; }
      if (Math.abs(t.x) > 0.1 || Math.abs(t.v) > 0.1) quieto = false;
      else t.x = t.v = 0;
      const r = t.x.toFixed(2);
      if (r !== t.r) t.el.style.rotate = (t.r = r) + 'deg';
    }
    timer = quieto ? 0 : setTimeout(paso, PASO);
  };
  const st = ScrollTrigger.create({
    trigger: root.querySelector('.cava__pista'), start: 'top bottom', end: 'bottom top',
    onToggle: (s) => root.classList.toggle('is-viva', s.isActive),
    onUpdate: () => { if (!timer) { y = scrollY; prev = performance.now(); timer = setTimeout(paso, PASO); } },
  });
});
