# Refridi, C.A. · web (propuesta en staging)

Propuesta de sitio para **Refridi, C.A.**, refrigeración industrial y comercial en Maracay, Aragua. Es una **vista previa**: lleva `noindex` (sin canonical ni sitemap), la marca "Vista previa" y un selector de paleta (Azul rey / Grafito, también con `?palette=feed|acero`). Los textos marcados `[redactado]` y los datos `POR CONFIRMAR` todavía no están aprobados por el cliente.

Astro 7.3.5 (estático) · GSAP 3.15 + Lenis · Archivo + Figtree (self-host) · CSS y JS vanilla.

## Correrlo

```bash
npm install
npm run dev          # http://localhost:4321
PUBLIC_DEMO=1 npm run build && npm run preview
npm test             # node:test (site.js: WhatsApp, demo, servicios)
npm run check        # contraste AA de los tokens + presupuesto de JS (≤75 KB gz, tras el build) + gate de higiene
```

Varios dev servers a la vez: `VITE_CACHE_DIR=.vite-<id> npx astro dev --port <puerto> --ignore-lock` (Astro 7 no deja arrancar un segundo `astro dev` en la misma carpeta sin `--ignore-lock`; `--force` mataría el del otro). Capturas: `node tools/qa/shoot.mjs --port=9431 mobile http://127.0.0.1:4331/ "#sectores"` (la cabecera del script explica el resto).

Deploy: cada push a `main` publica en GitHub Pages (`.github/workflows/deploy.yml`). La variable del repo `PUBLIC_DEMO=off` apaga el modo staging. GitHub Pages ignora `public/_headers`: la propuesta va sin cabeceras de seguridad; el sitio real irá en Cloudflare Pages.

`insumos/` (fotos del IG del cliente, sin permiso: Q8/Q21) está en `.gitignore` y nunca se sube.

## Dónde está cada cosa

- `src/data/site.js`: todo lo que el sitio dice (NAP, WhatsApp por línea, servicios, sectores, repuestos, academia). Cada dato pendiente lleva `POR CONFIRMAR Qn`.
- `src/styles/tokens.css`: paletas, temas (`light` / `brand` / `dark`), tipo, espacio y la curva `brand`.
- `src/scripts/engine.js`: motor de movimiento. `src/styles/transitions.css`: transiciones entre páginas.

## Pendiente del cliente

| Q | Qué falta | Mientras tanto |
|---|---|---|
| Q1 | Dominio `refridi.com.ve` (hoy no carga) | GitHub Pages, sin dominio |
| Q3 | WhatsApp por línea | 0424 servicios · 0422 repuestos · 0412 academia |
| Q4 | Servicios y su orden | Mantenimiento · Instalación · Restauración |
| Q5 | Repuestos: marcas, envíos, a quién venden | Familias con las marcas de su IG, sin precios |
| Q6 | Academia ARIR: ¿parte de Refridi? | Sección corta en el home, sin precios ni fechas |
| Q7 | Logo en vector y wordmark | Isotipo redibujado + "Refridi" en texto (provisional) |
| Q8 | Fotos propias | Gráficos propios en SVG/CSS, sin fotos ni stock |
| Q9 | Razón social y RIF | Sin RIF en el pie |
| Q10 | Año de fundación ("40+ años") | En la placa del hero, marcado POR CONFIRMAR |
| Q11 | Qué cubre el soporte 24/7 | "Atención 24/7" solo en la placa, marcado POR CONFIRMAR (ni en Criterio, ni en Mantenimiento, ni en #contacto) |
| Q12 | Zonas atendidas fuera de Aragua | "A nivel nacional" en la placa, sin mapa |
| Q13 | Permiso para mostrar clientes | Sin logos ni nombres de clientes |
| Q14 | Certificaciones | "Equipo de profesionales", sin "certificados" |
| Q15 | Dirección, horario y correo vigentes | Los de Google, Cylex e IG |
| Q16 | Tú o usted | Usted |
| Q19 | Temperatura de referencia | La sonda de la cava no se muestra |
| Q20 | Citar reseñas de Google | Solo la valoración (4,5 ★, 48 opiniones) con enlace |
| Q22 | Pin de Google Maps | Enlace de búsqueda por dirección |
