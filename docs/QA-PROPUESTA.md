# QA de la propuesta (corrección final, 2026-10-07)

Medido sobre `dist` (`PUBLIC_DEMO=1 npm run build` + `npx astro preview`), nunca en dev. Chrome headless por CDP, caché desactivada.
Primero la corrección final (dos revisiones aplicadas); al final, lo que dejó la integración.

## Gates

| Gate | Integración | Corrección final |
|---|---|---|
| `PUBLIC_DEMO=1 npm run build` | exit 0, 5 páginas | exit 0, 5 páginas, 0 warnings |
| `npm test` | 6/6 | 6/6 (el test de textos ahora también veta "Pedir diagnóstico", "Agend…", "coordinar/solicitar visita") |
| `npm run check` · contraste | 34/34 AA | 34/34 AA (feed y acero) |
| `npm run check` · JS por página (gz, ≤75 KB) | `/` 61,2 · fichas y 404 57,3 | `/` 61,2 · fichas y 404 57,2 |
| `npm run check` · higiene | 0 en 34 archivos | 0 en 34 archivos, con la regex ampliada (CTAs vetados + expo.out, SplitText, DrawSVG, backdrop-filter; comentarios incluidos) |
| Build GitHub Pages (`SITE_URL`, `PAGES_BASE=/refridi-web`, demo) | base en todo; canonical y sitemap absolutos | base en todo (0 rutas sin base); **sin canonical, og:url ni sitemap** (staging noindex); robots `Disallow: /` |
| Build producción (`PUBLIC_DEMO=off`) | — | canonical absoluto, sitemap, sin noindex, sin selector de paleta; JS 60,7 / 56,7 KB |

## Sondas CDP

Home y las 3 fichas a 1440×900, 1366×640 y 390×844, más 1440×900 y 390×844 con `prefers-reduced-motion` (20 combinaciones); barrido rápido a 320, 768, 960, 1024, 1280, 1920 y 2560.

| Medida | Antes | Después |
|---|---|---|
| Consola (errores, warnings, excepciones, HTTP ≥400) | 0 | 0 en las 20 combinaciones y en el barrido |
| CLS (carga + scroll completo) | 0 | 0 en las 20 |
| `scrollHeight` DCL / load / load+2 s / tras scroll | idéntico | idéntico en las 20 |
| Alto del home (1440 / 390; reduced) | 8653 / 9858; 7389 / 8923 | 8208 / 9762; 7129 / 8938 (cabeceras a dos columnas, pista de la cava más corta) |
| `#sectores` (1440 / 390) · pista | 2341 / 2009 · 1800 / 1266 | 2161 / 1925 · 1620 / 1182 (`--alto` 180svh / 140svh mientras no haya Q19) |
| Cortina al inicio del recorrido (`contain 0%`) | interior en opacity 0: ~1,3 pantallas de PVC y azul vacíos | interior al 0,35 detrás de las tiras; 1 a mitad y al final; cada tira en su transformada final; riel recto y continuo |
| Reduced / calm | cortina `display:none`, estática | igual; riel `none` |
| Desborde horizontal | 0 (320–2560) | 0 (320–2560, home y fichas) |
| Animaciones corriendo con la página quieta 2 s | 0 | 0 |
| `data-reveal` / `data-stagger` dentro del primer viewport | `#alcance` a medio fundido en fichas (1440×900 y 390×844) | 0 en todas las páginas y tamaños |
| Selector de paleta | z-index 140 sobre el header al hacer scroll; tapaba la lista de `#alcance` a 1440×900; tema navy | z-index 99 (bajo el header); píldora desde 960 px y franja tras el pie por debajo; **0 solapes** de 960 a 2560 (texto, gráficos, enlaces); tema claro con borde; "Azul rey / Grafito" |
| CTA de la ficha dentro del primer viewport | 1366×640: 549–596 px (solo instalación medida) | 1366×640: 527–596 · 1280×800: 626–659 · 1024×768: 606–652 · 1440×900: 714–790 (las 3 fichas) |
| Ficha ≥960 px | `#alcance` asomaba en el primer viewport | la ficha ocupa el primer viewport (`#alcance` empieza en el pliegue) |
| WhatsApp del header <900 px | botón con texto de ~130 px junto al CTA del hero | icono 44×44 (nombre en sr-only): un solo botón con texto en el primer viewport |
| Teclado (45 Tab, home y ficha, 1440 y 390) | anillo visible, ninguno fuera | igual (el skip link es fijo y va sobre el header) |
| Hash mal formado (`/#%`) | `URIError` sin capturar, `boot()` cortado | 0 errores, motor arrancado |

### Rótulo viajero con clics reales (1440 y 390 táctil)

| Navegación | Antes | Después |
|---|---|---|
| Fila de `#servicios` → ficha | rótulo | rótulo (1 solo `rotulo`, `html.vt`) |
| Desplegable del header → ficha | rótulo de la fila fuera de pantalla, entraba volando | solo root |
| Pie → ficha | idem | solo root |
| Menú `<dialog>` (móvil) → ficha | idem | solo root |
| `#relacionados` ficha → ficha | rótulo | rótulo |
| Migas ficha → home | solo root | solo root |

## Cambios de la corrección final

**BLOCK**
1. `insumos/` (62 MB de fotos del IG del cliente, con personas, sin permiso Q8/Q21) en `.gitignore`; docstring de `insumos/fotos.py` corregido. Falta comprobar `git status --ignored` antes del primer push (este paso no ejecuta git).

**CONCERN**
2. `Base.astro`: `pageswap` nombra solo el `[data-rotulo]` que está dentro del enlace pulsado (clic en captura) y si va al destino; si no, solo el root.
3. `#alcance` sin `data-reveal` / `data-stagger`; además, la ficha ocupa el primer viewport desde 960 px.
4. "soporte 24/7" fuera de Criterio y de Mantenimiento hasta Q11 (MAPA §3): el 24/7 queda solo en la placa. Se quitan `refTemp`, `certified`, `clients` y `reviews`, que no gobernaban nada.
5. La Cortina: interior visible al 0,35 detrás del PVC desde el inicio (`contain 0%–40%`); riel como fondo del sticky (no rota con las tiras, sin capa nueva); tiras hasta `bottom: 0`.
6. Ficha: si el H1 empieza por el nombre del servicio, el rótulo es su primera línea (texto del H1 intacto); en restauración sigue de antetítulo.
7. Dibujos de las fichas en el mismo marco que el hero (`.panel-hielo` + escarcha, ahora en `base.css` y compartido), caras rellenas por token y trazo de 2 px.
8. Header <900 px: WhatsApp en icono.
9. Selector de paleta: bajo el header, desde 960 px, tema claro, etiquetas "Azul rey / Grafito".
10. Cabeceras de sección con entradilla a dos columnas desde 1024 px (H2 a la izquierda, entradilla a la base, a la derecha). Criterio queda igual.

**NIT**
11. `engine.js`: hash decodificado con try/catch; fuera `initOffscreen` y `is-desktop-fx`; con arranque tardío sin `view()` (>4 s) los reveals quedan visibles sin re-animarse.
12. Código muerto fuera: `.section--tight`, `.hairline`, `.btn--ghost`, `.btn--link`, `.sr-only-focusable`, `--z-menu`, icono `star`, `variant` de Button, `contact.address`, `contact.hoursText`, `waText.servicios`, `waText.contacto`.
13. Duplicaciones: `.rotulo` global en `base.css` (una sola definición de las métricas del viajero); `ext` y "(se abre en una pestaña nueva)" en `src/lib/url.js`; el texto de repuestos de `servicios.js` sale de `spares.families`.
14. Tiras de la cortina, grapas y riel solo con tokens (`color-mix` sobre `--ink`, `--white`, `--cyan`).
15. Sin canonical, og:url ni sitemap en staging.
16. `deploy.yml`: `cancel-in-progress: false`. `_headers`: anota que GitHub Pages va sin cabeceras, los dos scripts en línea a hashear y el endpoint de informes.
17. Rutas personales fuera de `tools/qa/shoot.mjs` y de este documento.
18. Copia y tipo: sin los dos puntos colgando en el antetítulo del hero (siguen en sr-only); "A nivel nacional"; "Lo que decimos y cómo lo cumplimos"; detalle de Compresores ("Consulte marca, modelo y refrigerante"); eyebrow 14–15 px (en la cava, step-1); `.rel__text` a step-0; cita de la Academia a step-2; `frost.svg` sin copos (solo ruido en los bordes, 10 KB → 1 KB) y escarcha de la cava al 0,35.
19. `placa.js`: duración real en el comentario (0,86 s).

## Sin aplicar o pendientes

- **Decode de la placa** sobre "40" y "24/7" sin confirmar (CONCEPTO §4 dice que solo se decodifican cifras confirmadas): se mantiene para enseñarlo en la demo y queda anotado en `placa.js`. Decide Diego; quitarlo es no importar `placa.js` en `Hero.astro`.
- `git status --ignored` antes del primer push: no se ejecutó (sin git en este paso; todavía no hay `.git`).
- JSON-LD con URL de github.io en staging: se deja (la revisión lo marcó sin daño; solo pidió canonical y sitemap).
- Fallback sin `view()` (Firefox, Safari <26), incluido el arranque tardío, y la VT en Safari real: sin probar (Chromium tiene `view()`).
- 320×640: el CTA de restauración queda bajo el pliegue (675 px), por el H1 largo de MAPA.
- Con la caché caliente en la misma pestaña, Chrome avisa "preloaded but not used" de las 2 fuentes: es un artefacto de la sonda (misma URL en el preload y en `@font-face`; 0 avisos con la caché desactivada).
- ms por cuadro (CPU ×4) y memoria de capas en un Android real: sin medir.
- Un ancla directa a `/#sectores` aterriza con la cortina cerrada (ahora con el H2 visible detrás).
- `/privacidad/` no existe. CSP en Report-Only sin hashes (para el lanzamiento en Cloudflare).
- Textos `[redactado]` y datos POR CONFIRMAR (Q7, Q10, Q11, Q12, Q13, Q19…) a aprobar por el cliente.

## Capturas

`.shots/fin/` (prefijo `9466-`; `d` 1440×900, `l` 1366×640, `m` 390×844, `R` reduced):

- Home: `9466-{d,m}-home-{00-top,servicios,criterio,repuestos,academia,contacto}.png`, `9466-l-home-{00-top,servicios}.png`, `9466-m-home-body-fin.png` (pie + franja de paleta)
- La Cortina: `9466-d-home-sectores-f1de5..f5de5.png` (f2 = a mitad, abierta), `9466-m-home-sectores-f1de5..f5de5.png`, `9466-l-home-sectores-f1de3..f3de3.png`
- Fichas: `9466-d-servicios-{instalacion,mantenimiento,restauracion}-{00-top,alcance,relacionados}.png`, `9466-l-servicios-restauracion-00-top.png`, `9466-m-servicios-instalacion-{00-top,alcance,relacionados}.png`
- Reduced: `9466-dR-home-{00-top,sectores,sectores-fin}.png`, `9466-mR-home-{00-top,sectores}.png`
- Grafito: `9466-d-home-paletteacero-{00-top,sectores-f1de3..f3de3}.png`, `9466-d-servicios-instalacion-paletteacero-00-top.png`

Las de la integración siguen en `.shots/int/` (prefijo `9450-`) para comparar.

---

## Integración (antes de esta corrección)

1. View Transitions abortaban ("opt-in disabled"): el `@view-transition` pasó a un `<style>` en línea en el head de `Base.astro`.
2. Clic perdido por el "Asiento" (`scale(.97)`): capa transparente del enlace mientras se presiona.
3. Rótulo deformado en la transición: `max-width: 8.5em` + `text-wrap: balance` y `object-fit: none` en las capturas de la VT.
4. Skip link: `engine.js` enfoca el destino de toda ancla interna.
5. La nota "(activado en su sistema)" del pie la decide el CSS (el pie crecía 36 px tras la carga).
6. Selector de paleta no fijo; placa 24/7 con la "/" fija; README con `--ignore-lock`.
