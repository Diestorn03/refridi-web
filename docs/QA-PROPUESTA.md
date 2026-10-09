# QA de la propuesta (v2 «Descenso», 2026-10-09; v1, 2026-10-07)

Medido sobre `dist` (`PUBLIC_DEMO=1 npm run build` + `npx astro preview`), nunca en dev. Chrome headless por CDP, caché desactivada.
Primero la corrección final de v2 (lo último), luego su integración; después las fotos, la corrección final de v1 (dos revisiones aplicadas) y, al final, lo que dejó su integración.

## v2 «Descenso»: corrección final (2026-10-09, tarde)

Dos revisiones: dinamismo (medido contra SS, RW, VD y DDT) y técnica. Todo medido sobre `dist` (`PUBLIC_DEMO=1 npm run build` +
`npx astro preview --port 4392`), Chrome headless por CDP (SwiftShader, sin GPU), el mismo portátil compartido.

### Aplicado

| Hallazgo | Qué se hizo |
|---|---|
| BLOCK dinamismo (medición) | Repetida con el mismo método (`recorrido.mjs` + `hojas.py`, rueda real cada 0,4 viewport a 1440×900). Ver la tabla de abajo: los 3 objetivos se cumplen |
| BLOCK Despiece corto de amplitud | `Equipo.astro` encuadre `despiece` = `[800, 800, 100, 190, .76]`. Desplazamientos (unidades de la caja): tapa (60, −205) con −4°, ventiladores (−140, −205) y (−135, −265), serpentín (190, 95), tubería (215, 150), losa (0, 140): los de la revisión, ajustados para que en `contain 50 %` ninguna pieza pise a otra ni salga del marco (comprobado en captura a 1440×900, 1366×640, 390×844 y 360×640). `--a` 0/5/10/15/20/25; salida en 0-22 %, deriva de un 10 % más hasta el 78 % (sin parada muerta), vuelta en 78-100 %. La figura entra con `translate 0 10vh` + `scale .92` en `entry 30 → 100 %`. Las tuberías llegan a `V-700` (su extremo no asoma al bajar) |
| (añadido) Despiece empañado | La figura sube empañada (`.despiece__vaho`, el velo del Vidrio: verbo DESEMPAÑAR), se despeja al fijarse (`contain 0 → 14 %`) y se vuelve a empañar al soltarse (`contain 86 → 100 %`, hasta .7). Keyframes por rango (`entry 0%`, `contain 14%`…), una capa de opacity |
| BLOCK Pull-down pálido | Área a .5/.8, filo de 4 px, aro de 28 px con halo de 8 px (clip-margin 24 px), frases apagadas a .15 que suben 1,25 rem al encenderse, capa `.pull__plot::after` (escarcha de consigna, opacity 0 → 1). Además, contra la zona muerta: trazo y cursor de `entry 70 %` a `contain 60 %` (empieza a caer mientras sube), el registro entra desde 10vh/.92 y las frases desde 6vh; frases en `contain 21k → 10 + 21k %` (sincronizadas con el cursor), consigna en 60-75 %, quietud de 75 a 100 % |
| CONCERN titulares | `contrae.js`: scaleX 1.22, .85 s, stagger .12, puerta 3000 px/s |
| CONCERN último tercio | Academia ±9vh/∓5vh con tope `min(…, --section-y × .9)` (§5.6.1 a cualquier ancho y alto). Repuestos: keyframes `bandeja` (6 rem, .88) en las tarjetas. Contacto: campo `scale .94 .92` (ver descartes) |
| CONCERN ritmo de color | Despiece en banda `data-theme="dark"`, equipo en blanco y cian (sin naranja); el header cambia a oscuro encima (gate de tema en verde). **POR APROBAR por Diego** (MARCA §2 decía «dark = solo el pie»; anotado allí y en `tokens.css`). Revertir = quitar el atributo |
| NIT hero en t0 | Subtítulo, CTA y placa: `hero-asentar` .7 s brand a .15/.25/.35 s (misma puerta que el deshielo; la placa lo lleva segundo en su lista, tras la salida en planos). Deshielo de .9 a 1,3 s. El H1 no se anima |
| BLOCK figura diminuta en horizontal | El tope por alto de ventana de `.despiece__fig` solo vale dentro de la puerta. Fuera: `min(100%, 40rem)` / `44rem`. 844×390 y 740×360: 640 px, rótulos legibles |
| CONCERN rótulos solapados ≤375 | Rótulos DENTRO del div de su pieza (`Equipo` prop `rotulos`): viajan con ella y solo animan opacity (salen 4 animaciones de translate). Anclas en unidades del dibujo, distintas armado / separado. Solapes medidos por rectángulos: 0 a 320, 360, 375 (estático) y 360, 390, 1366, 1440 (en `contain 50 %`) |
| CONCERN bucles con la página quieta | `engine.js` (P4, P6): Lenis entra en el ticker de GSAP con la rueda o `scrollToTarget` y sale tras 2 cuadros sin deslizamiento suave; ScrollTrigger se registra solo al primer uso (fallback sin `view()` o un módulo que lo lea; el api lo da con un getter). `contrae.js` dispara con IntersectionObserver. **Página quieta: 0 rAF/s y 0,1 ms/s de hilo principal** (antes 65-117 ms/s) |
| CONCERN p95 | Medido (abajo), con A/B por pieza del Despiece |
| NIT frases a .28 (AA) | Las apagadas quedan a .15 (lo pidió la revisión de dinamismo): estado de paso como un reveal a medias; AA se mide encendidas. Anotado en MOVIMIENTO-V2 §5.3 |
| NIT mobiliario en la pizarra | Recorte `(230, 10, 1190, 490)` = 960×480: corta sobre la banqueta con la bolsa y el escritorio, y deja al técnico sentado fuera del zoom del vidrio. `fotos.py` regenerado, copiados `criterio-{480,800,960}`, fuera `criterio-1120`, niebla regenerada (0,51 KB), `fotos.js` al día. Algo menos nítida que el de 1120 |
| NIT citas repetidas | Antetítulo del Despiece: «Diagnósticos precisos» `[cliente · IG DYDlNeHjlEV]`; «No ponemos parches» queda solo en el Pull-down |
| NIT README / deploy.yml | «≤80 KB gz (AJ3)» |

### Descartado

- **Vaho del CTA al 30 %:** en «feed» ya está al 6 % porque al 18 % el `--muted` y el `--stroke` caen a 3,4:1 sobre el azul rey; al 30 % en «acero» caerían a ~4,2:1. AA manda.
- **Campo del CTA a .90 de ancho:** destapa el borde del contenedor por debajo de ~1300 px (§5.7.1). Se queda en .94 de ancho y gana .92 de alto (recoge ≤4 % arriba, menos que `--section-y`).
- **Borrar `cava.js`:** la decisión es de Diego y sin git el archivo se perdería. Su cabecera anota que leer `ScrollTrigger` vuelve a registrar el plugin (y su bucle).
- **Quitar el giro de las aspas del Despiece:** lo pide AJ1. A/B: −2 ms de p95 en la escena, −0,2 ms en el home (dentro del ruido).

### Dinamismo (mismo método que la revisión: rueda real, 1 paso = 0,4 viewport, % del viewport que cambia además del scroll)

| | Refridi antes | **Refridi ahora** | SS | RW | VD | DDT | Objetivo |
|---|--:|--:|--:|--:|--:|--:|---|
| Movimiento medio | 10,5 | **14,3** | 16,4 | 16,0 | 7,9 | 17,1 | ≥13: ok |
| Mediana | 6,0 | **7,5** | 6,3 | 7,6 | 4,0 | 7,7 | — |
| Pasos > 15 % | 17 % | **28 %** | 29 % | 38 % | 24 % | 37 % | ≥25 %: ok |
| Escenas entre los 6 picos | 1 (Cortina) | **2: Cortina (82,9 · 52,5) y Despiece (48,2 · 44,1 · 31,7 · 31,5)** | | | | | ≥2: ok |

El Pull-down pasa de 3,9-10 % a 4,6-9,8 % por paso y gana el tramo de entrada (antes 0,5 %): su cambio es claro sobre claro y la métrica
apenas lo ve, aunque en las capturas ya es una masa azul. Datos: `.shots/comparacion/resumen.json` (antes: `resumen-v2a.json`,
`refridi-v2a/`, `hoja-refridi-v2a.png`), hoja nueva `.shots/comparacion/hoja-refridi.png`.

### Gates

| Gate | Resultado |
|---|---|
| `PUBLIC_DEMO=1 npm run build` | exit 0, 5 páginas, 0 warnings |
| `npm test` | 6/6 |
| Contraste | 34/34 AA |
| JS por página (gz, ≤80) | `/` 65,3 · fichas 61,2 · 404 57,4 |
| Higiene | 0 en 40 archivos |
| `tools/qa/v2.mjs gates` | **118 de 119 en verde** (`.shots/v2/gates.log`, `gates.json`): consola 0, CLS 0 y `scrollHeight` DCL/load/+2 s/tras recorrer idéntico en las 16 combinaciones; reveals y tema del header en las 16; desborde 0 de 320 a 2560 en las 4 páginas; reduced, calm y 1366×560 estáticos; sin JS visible; VT home→ficha (1440 y 390) sin transformadas |
| Página quieta 2 s | 0 animaciones por tiempo y **0 rAF/s** en las 7 medidas; 0,1 ms/s de hilo principal en desktop y fichas, 3,3 y 10,6 ms/s a 390 y 360 (sin bucle) |
| Separación entre escenas fijadas | 1440×900: 1,37 · 1,03 · 1366×640: 1,86 · 1,42 · 390×844: 1,99 · 0,92 · 360×640: 2,61 · 0,96 viewports |
| Lite 1440 · todo visible | **NO por muestreo:** el 4.º sector de la cava (escalón `i = 3` del «profundo», rango hasta `cover 52 %`) a opacity 0,98 en una parada del barrido (el umbral es ≥ 0,98). Está terminando su reveal, no oculto. Pasaba antes porque la banda oscura movió las paradas. Lite 390, reduced y calm: todo visible |
| **p95 ≤ 12 ms (CPU ×4)** | **home 1366×640: 19,0 ms NO · home 360×640: 13,2 ms NO · ficha de instalación: 9,3 / 9,1 ms ok** |

### p95 (CPU ×4, mediana de 3 pasadas; `.shots/v2/p95.log`, `p95-todo.json`)

El portátil iba más cargado que en la integración: **el suelo (todas las animaciones CSS apagadas) da ahora 11,2 ms de p95 a 1366×640,
frente a 7,3** en la integración. El sobrecoste de las animaciones es parecido: +7,2 ms (18,4 − 11,2) frente a +8,1 (15,4 − 7,3).

| Escena | 1366×640 p95 | 360×640 p95 |
|---|--:|--:|
| Todo el home | 19,0 | 13,2 |
| Azotea | 14,3 | 11,4 |
| Servicios (cabecera) | 22,1 | 11,5 |
| Despiece | 26,1 | 17,2 |
| Tres vidrios | 19,5 | 13,4 |
| Pull-down | 15,7 | 11,6 |
| Pizarra | 16,4 | 11,3 |
| Cortina | 19,8 | 14,3 |
| Anaquel | 16,8 | 14,0 |
| Aula | 18,0 | 12,3 |
| Consigna | 19,2 | 13,1 |
| Pie | 10,1 | 8,9 |
| Ficha de instalación | 9,3 | 9,1 |

A/B del Despiece a 1366×640 (`--css`, misma sesión; base 24,1-24,7 ms): sin vaho 24,3 · sin la entrada de la figura 22,3 · sin el giro
de las aspas 22,5 · sin rótulos 21,6 · con todo el Despiece quieto 17,2. Ninguna pieza pasa de ~2 ms (el ruido es ±2); la traza de
`blink.animations` no da ninguna animación del Despiece fuera del compositor (solo las transiciones de color del header). El sobrecoste es el de
siempre: Commit, UpdateLayoutTree y Layerize de muchas capas ligadas al scroll.

### Capturas

- Recorrido del home cada 0,5 viewport: `.shots/v2/hoja-desktop.png` (30 cuadros a 1440×900) y `.shots/v2/hoja-movil.png` (33 a 390×844);
  cuadros sueltos `d-NN.png` / `m-NN.png`, `secuencia.json`.
- Mitad de cada escena fijada (`contain 50 %`): `.shots/v2/medio-despiece-{d,m}.png`, `medio-pull-{d,m}.png`, `medio-cortina-{d,m}.png`.

### Pendiente

- **p95 del home** por encima de 12 ms en este equipo (con el suelo ya en 11,2). Medir en un PC con GPU y en un Android de gama media antes
  de recortar más; la siguiente palanca es de diseño (menos animaciones ligadas al scroll).
- **Aprobación de Diego:** banda oscura del Despiece y la pizarra a 960 px.
- Sin cambios desde la integración: LCP frente a la v1 (Lighthouse), Firefox/Safari <26, vídeo comparativo con SS, `cava.js`.
- El bucle de rAF con la página quieta de la sección siguiente **quedó resuelto** aquí.

## v2 «Descenso»: integración y QA (2026-10-09)

Medido sobre `dist` (`PUBLIC_DEMO=1 npm run build` + `npx astro preview --port 4360`), nunca en dev. Chrome headless por CDP (SwiftShader, sin
GPU), en un portátil Ryzen 7 7730U compartido con otras cargas: las medidas de tiempo varían ±30 % entre corridas, por eso cada p95 es la
mediana de 3 pasadas. Sondas nuevas: `tools/qa/v2.mjs` (`p95`, `gates`, `secuencia`) y `tools/qa/hoja.py` (hoja de contacto).

### Cambios de la integración

1. **Pedidos de los agentes**
   - `base.css`: `view-timeline-inset: 0` en `[data-salida]` (y en la figura por debajo de 960 px). Sale la regla `#inicio` de `Hero.astro`.
   - `base.css`: fuera `.panel-hielo*` (nadie la usaba ya).
   - `contrae.js`: un titular que ya está a la vista al arrancar no se oculta nunca (antes, entre el 85 % y el 100 % del viewport quedaba
     invisible), y el disparo pasa a `top 92%`. Arregla «Qué incluye» invisible en el primer viewport de restauración a 390×844 (§6 aceptación 2).
   - `Equipo.astro` sin props: la ficha de instalación pinta el equipo armado, sin despiece (comprobado en captura y sin errores).
   - `tools/qa/shoot.mjs`: acepta un `SHOTS_DIR` relativo.
2. **Fluidez** (reglas de MOVIMIENTO-V2 §5.2 y §5.4: si el p95 no cabe, se quita la pieza)
   - **Balanceo de la cortina quitado** (`cava.js` queda sin importar; la escena CSS sigue igual). Medido en la escena: +4,7 ms de media y
     +7 ms de p95 por cuadro (15,1 / 27,8 ms con balanceo frente a 10,4 / 20,9 sin él).
   - **Giro de los ventiladores en la fila de instalación y en su ficha quitado.** En «Tres vidrios» la media bajó de 15,1-18,1 a 11,1-12,8 ms
     (desaparecen 3,2-3,8 ms de Layerize por cuadro). Los del Despiece siguen girando (AJ1): cuestan +0,4 ms de media.
   - Las piezas animadas que eran `<svg>` (capas del Equipo e íconos de Repuestos) van ahora en un `div` o `span`. Chrome no acelera
     `translate`/`rotate` sobre un elemento SVG («SVG target has independent transform property», 9 animaciones en el hilo principal).
3. **Ritmo**: entre el Pull-down y la Cortina hay ahora ≥ 0,8 viewport también en móvil. El cierre de `#criterio` mide `80svh` dentro de la
   puerta: la pizarra sube al soltarse la escena y el aire queda antes de la cortina. En desktop no cambia.
4. `docs/CONCEPTO.md` anota los dos recortes.

### Gates (MOVIMIENTO-V2 §11)

| Gate | Resultado |
|---|---|
| `PUBLIC_DEMO=1 npm run build` | exit 0, 5 páginas, 0 warnings |
| `npm test` | 6/6 |
| `npm run check` · contraste | 34/34 AA |
| `npm run check` · JS por página (gz, ≤80) | `/` 65,1 · fichas 61,0 · 404 57,3 |
| `npm run check` · higiene | 0 en 40 archivos |
| Consola (errores, warnings, excepciones, HTTP ≥400) | 0 en home y las 3 fichas a 1440×900, 1366×640, 390×844 y 360×640 (16 combinaciones) |
| CLS (carga + recorrido completo) | 0 en las 16 |
| `scrollHeight` DCL / load / +2 s / tras recorrer | idéntico en las 16 |
| Reveals y titulares completos al cruzar el 55 % del viewport | todos, en las 16 (fuera de las escenas fijadas, que se revisan en las capturas) |
| Tema del header = zona de debajo, en cada parada de 0,5 viewport | coincide en las 16 |
| Desborde horizontal | 0 en 12 anchos de 320 a 2560 (arriba, a mitad y al final), home y 3 fichas |
| Página quieta 2 s | 0 animaciones por tiempo en `document.timeline` (home y fichas) |
| Separación entre escenas fijadas (Despiece→Pull · Pull→Cortina) | 1440×900: 1,37 · 1,03 · 1366×640: 1,86 · 1,42 · 390×844: 1,99 · 0,92 · 360×640: 2,61 · 0,96 viewports (≥0,8 en todos) |
| Reduced y calm (1440 y 390) | 3 pistas en `auto` y sticky `static`, 0 animaciones, todo visible |
| Lite (1440 y 390) | pistas en `auto`, solo `asentar-lite` (opacity), sin vidrio ni deshielo, todo visible |
| Ventana baja (1366×560) | las 3 escenas fijadas, estáticas; el resto del movimiento sigue |
| Sin JS | texto visible (las escenas CSS siguen donde hay `view()`) |
| VT home→ficha con clic real en la fila (1440 y 390 táctil) | llega con `html.vt`, `scrollY` 0, 0 transformadas en `#rotulo` y sus ancestros, consola 0 |
| **p95 del cuadro ≤ 12 ms, CPU ×4** | **home 1366×640 (Lenis, rueda): 15,4 ms, NO · home 360×640 (toque, nativo): 12,7 ms, NO · ficha de instalación: 8,3 / 8,0 ms, ok** |

### p95 por escena (CPU ×4, mediana de 3 pasadas, ms de hilo principal por cuadro)

Cuadro = suma de las tareas de primer nivel del hilo principal entre dos `BeginMainThreadFrame`. Desktop: rueda real de 100 px cada 50 ms
(Lenis). Móvil: arrastres de toque de 420 px a ~1250 px/s (scroll nativo). Antes del p95, una pasada sin límite de CPU carga las imágenes.

| Escena | 1366×640 media | 1366×640 p95 | 360×640 media | 360×640 p95 |
|---|--:|--:|--:|--:|
| **Todo el home** | 8,1 | **15,4** | 6,4 | **12,7** |
| Azotea (hero) | 5,9 | 11,8 | 4,9 | 9,5 |
| Servicios (cabecera) | 8,2 | 11,5 | 5,8 | 10,2 |
| Despiece | 10,1 | 17,5 | 6,6 | 13,9 |
| Tres vidrios | 8,3 | 12,5 | 6,8 | 12,4 |
| Criterio (cabecera) | 6,9 | 9,2 | 5,3 | 8,5 |
| Pull-down | 7,8 | 13,1 | 6,2 | 10,1 |
| Pizarra | 9,6 | 13,3 | 6,3 | 9,5 |
| Cortina | 11,6 | 19,7 | 7,1 | 14,5 |
| Sectores | 9,2 | 13,5 | 5,8 | 9,0 |
| Anaquel | 9,1 | 15,0 | 7,2 | 14,5 |
| Aula | 9,1 | 14,3 | 7,3 | 12,2 |
| Consigna | 9,8 | 16,6 | 7,0 | 14,0 |
| Pie | 4,1 | 7,8 | 4,3 | 8,6 |
| Ficha de instalación (todo) | 2,9 | 8,3 | 4,0 | 8,0 |

Referencias, medidas igual:
- **Suelo** (el mismo build con todas las animaciones CSS apagadas: Lenis, GSAP y ScrollTrigger solos): 1366×640, media 4,7 y p95 7,3 ms.
- **Antes de los recortes:** 1366×640, p95 de 19,4 a 30,4 ms en 5 corridas.
- **Sin Lenis** (rueda nativa a 1366×640): media 5,9 y p95 14,9 ms. Lenis sube la media pero no es lo que fija el p95.
- `animation-fill-mode: backwards` en todo: sin mejora.
- **Lectura:** lo que sobra se reparte entre todas las escenas, sin una pieza que destaque. Son ~1-2 ms por cuadro de Commit y UpdateLayoutTree
  de las ~130 animaciones ligadas al scroll (cada una con su timeline). Las únicas piezas con coste propio claro ya se quitaron.

### Página quieta: el bucle del motor

0 animaciones por tiempo, pero el hilo principal no descansa. Hay dos `requestAnimationFrame` permanentes, que ya estaban en v1:
- el ticker de GSAP, que mueve Lenis (solo en desktop);
- el bucle propio de ScrollTrigger, que lo mantiene vivo contra un fallo de Chrome con los eventos de scroll.

Medido con traza, sin límite de CPU, la página quieta gasta 65-117 ms/s de hilo principal en v2, según la corrida (~100 rAF/s; ~200 en
desktop). En una corrida comparada: 107 ms/s en v2, 89 sin las animaciones CSS y 70 en la v1 publicada. No es un gate de §11, pero choca con la regla «sin bucles con la página quieta». La propuesta, no aplicada, toca el contrato del
motor: `contrae.js` con IntersectionObserver en vez de ScrollTrigger, ScrollTrigger cargado solo en el fallback sin `view()` y el ticker de
Lenis dormido mientras no hay scroll.

### Capturas

`.shots/v2/`: recorrido del home cada 0,5 viewport, `d-NN.png` a 1440×900 y `m-NN.png` a 390×844. Hojas de contacto: `hoja-desktop.png` y
`hoja-movil.png`, con número, `scrollY` y escena bajo cada cuadro. Datos: `secuencia.json`, `p95-todo.json`, `gates.json` y las salidas `p95.log` y `gates.log` (119 comprobaciones en verde).

### Pendiente

- **p95 del home por encima de 12 ms en este entorno** (15,4 en desktop y 12,7 en móvil). Hay que medirlo en el hardware objetivo: un
  Android de gama media y un PC con GPU. Si allí tampoco cabe, la siguiente palanca medida es el giro del Despiece (+0,4 ms de media), y
  después hay que bajar el número de animaciones ligadas al scroll, lo que ya es una decisión de diseño.
- El bucle de rAF del motor con la página quieta (arriba).
- LCP frente a la v1 publicada (§5.1, aceptación 1): sin medir, hace falta Lighthouse.
- Fallback de Firefox y Safari <26 (reveals por el engine): sin probar.
- Vídeo comparativo de los recorridos completos (MOVIMIENTO-V2 §11): no se hizo.
- Pizarra algo blanda en desktop: el recorte de 1120 px se pinta hasta 1414 px con el zoom del vidrio. Un recorte más ancho del original
  (1440×1080) mete el corcho, la vitrina y el escritorio.
- `cava.js` (balanceo): se queda en `src/scripts/` sin importar, con la nota de cómo reactivarlo. Decide Diego.

---

## Fotos (2026-10-07)

Diego autorizó usar las fotos del IG del cliente en la propuesta. Recortes de `insumos/fotos.py` copiados a `public/img/fotos/` (51 archivos,
3,3 MB; los de instalación no, ver abajo), datos en `src/data/fotos.js`, `<picture>` AVIF/WebP/JPG en `src/components/ui/Picture.astro`.

| Lugar | Foto | Carga | Personas |
|---|---|---|---|
| Hero `#inicio` | `hero` 4:5, en el panel con escarcha (0,6 sobre foto) y la placa en su esquina | eager + `fetchpriority="high"` (LCP) | POR CONFIRMAR Q21 |
| `#criterio` | `criterio` 4:3, junto al titular (≥900 px) o entre titular y frases | lazy + async | POR CONFIRMAR Q21 |
| `#repuestos` | `repuestos` en la tarjeta destacada (Motores ventiladores): 1.ª columna y 3 filas (≥900), foto al lado del texto en móvil; `alt=""` (el enlace se nombra por su texto) | lazy + async | — |
| `#academia` | `academia` 4:3, bajo el titular (dos columnas que no comparten filas) | lazy + async | POR CONFIRMAR Q21 |
| `/servicios/mantenimiento/` · `/restauracion/` | `mantenimiento` · `restauracion` 4:5 en el panel (solo ≥1024, como antes) | lazy + async (bajo 1024 no se descarga) | — |
| `/servicios/instalacion/` | sin foto: el dibujo del equipo del hero, ahora `src/components/ui/Equipo.astro` | — | — |
| `#sectores` y sectores | sin foto (CONCEPTO §5) | — | — |

Toda imagen lleva `width`/`height` y `aspect-ratio` fijo; `sizes` = ancho real de su caja (comprobado con `currentSrc`: hero 800w a 1440×900,
480w a 1366×640 y a 390×844 DPR 1).

### Antes / después

Peso: home, caché desactivada, tras scroll completo; antes y después servidos igual (estático con gzip).
LCP: `PerformanceObserver('largest-contentful-paint')` antes de tocar el scroll, 3 corridas (mediana). Slow 4G = 150 ms RTT, 1,6 Mbps, CPU ×4.

| Medida | Antes | Después |
|---|---|---|
| Peso home móvil 390×844 DPR 1 | 195,8 KB (imágenes 0,8) | **256,8 KB** (imágenes 62,5: hero 22,6 · criterio 18,4 · repuestos 12,0 · academia 8,8) |
| Peso home móvil 390×844 DPR 3 | 195,8 KB | **424,6 KB** (imágenes 230,4: hero-1200 100,2 · criterio-1200 89,8 · academia-1200 27,6) |
| Peso home 1440×900 · 1366×640 | 197,6 · 196,0 KB | 324,4 · 291,3 KB |
| Presupuesto (≤900 KB home móvil) | ok | ok |
| LCP laptop 1366×640, sin límite | 492 ms (440/616/492), H1 `.hero__lema` | **368 ms** (368/332/468), `hero-480.avif` |
| LCP laptop 1366×640, Slow 4G | 1552 ms (1632/1548/1552), H1 | **1720 ms** (1652/1720/1860), `hero-480.avif` (objetivo ≤1800: ok en la mediana) |
| LCP móvil Slow 4G, DPR 1 | 1708/1992 ms, `frost.svg` | 1676/1716 ms, `hero-480.avif` |
| LCP móvil Slow 4G, DPR 3 | 1880/2228 ms, `frost.svg` | **2424/2816 ms**, `hero-1200.avif` (por encima de 1800) |
| JS por página (gz) | `/` 61,2 · resto 57,2 | igual |

### Gates

`PUBLIC_DEMO=1 npm run build` exit 0, 5 páginas, 0 warnings · `npm test` 6/6 · `npm run check`: 34/34 AA, JS igual, higiene 0 en 37 archivos.
En preview, home y las 3 fichas a 1440×900, 1366×640 y 390×844 (12 combinaciones): consola 0, CLS 0 (carga + scroll), `scrollHeight`
DCL / load / load+2 s / tras scroll idéntico; desborde 0 de 320 a 2560 (11 anchos, 4 páginas). Con Slow 4G el CLS es 0,0011-0,0012 antes y
después (header, selector de paleta y placa al llegar las fuentes; no las fotos). Rótulo viajero home→ficha: `html.vt`, sin errores.

Corregido durante la QA:
1. `picture { display: contents }` convertía cada `<source>` en un hijo más del flex (con su `gap`): la foto de repuestos bajaba 48 px.
   `source { display: none }` en `base.css`.
2. Alto que cambiaba tras la carga: con `aspect-ratio: auto` el navegador pasa a la proporción del archivo (480×360 frente a 1202×901), y en
   la tarjeta de repuestos el ancho intrínseco que da `sizes` ganaba a la base del flex (+5,4 px). `Picture.astro` fija `aspect-ratio`
   y la foto del flex lleva `min-width: 0`. Después: 0 cambios de alto a 390, 1024, 1366 y 1440.
3. La escarcha a 0,9 sobre la foto parecía ruido: 0,6 en `.panel-hielo--foto`.

### Pendiente

- **LCP móvil DPR 3 en Slow 4G (2,4-2,8 s):** el hero pide `hero-1200.avif` (100 KB) porque `sizes` es correcto (358 px × 3). Opciones: en
  <600 px ofrecer hasta 800w con un `<source media>` (−45 KB, 2,2× de densidad) o recomprimir el 1200. Decide Diego. Antes ya pasaba de 1800
  (1,9-2,2 s, con el `frost.svg` como LCP).
- Fichas: la foto es lazy aunque esté en el primer viewport desde 1024 px (regla "el resto lazy"; además bajo 1024 está oculta y así no se
  descarga). Sin límite, el LCP de escritorio es la foto a 144-172 ms; a 1366×640 el LCP es la escarcha (misma área que la foto).
- POR CONFIRMAR Q21 (personas) en el hero, Criterio y Academia; JSON-LD sigue sin `image` hasta Q21.
- Los recortes de instalación (`DKFL_vgx2Dp`, 640 px, Q18) no se copiaron a `public/`: no se usan.
- `git status --ignored`: `insumos/` sale ignorado; `public/img/fotos/` y los 3 archivos nuevos de `src/` están sin commitear.

Capturas en `.shots/fotos/` (prefijo `9473-`; `d` 1440×900, `l` 1366×640, `m` 390×844, `R` reduced):
`9473-{d,l,m}-home-{00-top,criterio,repuestos,repuestos-fin,academia}.png`,
`9473-{d,l,m}-servicios-{instalacion,mantenimiento,restauracion}-00-top.png`, `9473-d-home-paletteacero-{00-top,criterio}.png`,
`9473-mR-home-{00-top,repuestos}.png`. Mediciones en `.shots/fotos/*.json`.

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
