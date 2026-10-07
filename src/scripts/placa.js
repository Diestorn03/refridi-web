// Placa del hero: decode único de las cifras (CONCEPTO §4 "Primer segundo"). Lo importa Hero.astro.
// t0: la placa ya está pintada con su texto final. Tras document.fonts.ready + 1 rAF, ScrambleText decodifica SOLO las cifras
// [data-placa-dig] ("40", "24", "7": la "/" queda fija) en sus cajas fijas (width en ch, tabular-nums, contain: layout paint; texto real en .sr-only).
// 0,7 s, stagger 0,08 en 3 cajas, ease none (0,7 + 2 × 0,08 = 0,86 s ≤ 0,95 s). Una vez por sesión ('rf-placa'). scroll o pointerdown → progress(1).
// OJO: CONCEPTO §4 decodifica solo cifras CONFIRMADAS; "40" (Q10) y "24/7" (Q11) siguen POR CONFIRMAR y la propuesta lo anima para
// enseñarlo. Pendiente de decisión de Diego: si no va, basta con no importar este módulo en Hero.astro (la placa ya está pintada).
// Se omite con reduced/calm (env.reduced), lite y si se llegó por View Transition (html.vt: la transición es la entrada).
import { onPage } from './engine.js';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

onPage(({ gsap, env }) => {
  const digs = [...document.querySelectorAll('#inicio [data-placa-dig]')];
  if (!digs.length || env.reduced || env.lite) return;
  gsap.registerPlugin(ScrambleTextPlugin);

  (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(() => {
    if (document.documentElement.classList.contains('vt')) return;
    try {
      if (sessionStorage.getItem('rf-placa')) return;
      sessionStorage.setItem('rf-placa', '1');
    } catch (e) { /* storage bloqueado: una vez por carga */ }

    const tl = gsap.timeline({ defaults: { duration: 0.7, ease: 'none' } });
    digs.forEach((el, i) => tl.to(el, { scrambleText: { text: el.textContent, chars: '0123456789' } }, i * 0.08));

    const end = () => tl.progress(1);
    const off = () => { removeEventListener('scroll', end); removeEventListener('pointerdown', end); };
    addEventListener('scroll', end, { once: true, passive: true });
    addEventListener('pointerdown', end, { once: true, passive: true });
    tl.eventCallback('onComplete', off);
  }));
});
