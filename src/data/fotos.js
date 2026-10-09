// Fotos del IG de Refridi en la propuesta (permiso de Diego, 2026-10-07). Recortes de insumos/fotos.py, copiados a
// public/img/fotos/<lugar>-<ancho>.{avif,webp,jpg} + <lugar>-niebla.avif (tools/niebla.mjs); se pintan con ui/Vidrio.astro (o ui/Picture.astro).
// w/h: el recorte de origen (CLS 0). widths: escalones por debajo del 90 % del recorte + el nativo (fotos.py).
// sizes (opcional): el de la entrada si quien la pinta no pasa otro. Con tope de caja: por encima del tope el navegador no baja más píxeles.
// La de instalación (IG DKFL_vgx2Dp, 640 px, Q18) se descartó: la ficha usa el dibujo del equipo (Equipo.astro).
const foto = (lugar, w, h, widths, alt, sizes) => ({ base: `img/fotos/${lugar}`, w, h, widths, alt, ...(sizes && { sizes }) });

export const fotos = {
  // [cliente · IG DYQZ9Y3u2-B] · POR CONFIRMAR Q21: sale un técnico (de perfil, con casco y tapabocas)
  // POR CONFIRMAR Q4 (se ve Carrier/R-410A, sugiere climatización)
  // sizes = ancho real de .hero__fig: <960 px, el contenedor (92vw) hasta 36rem; desde 960, 4/5 del alto libre (80vh − 163px) sin pasar
  // de la columna (41vw) ni de la caja máxima (576 px)
  hero: foto('hero', 1215, 1519, [480, 800, 1215], 'Técnico de Refridi lavando el serpentín de un condensador en una azotea',
    '(min-width: 960px) min(calc(80vh - 163px), 41vw, 576px), min(92vw, 576px)'),
  // [cliente · IG CU7v2SUAElR]
  mantenimiento: foto('mantenimiento', 819, 1024, [480, 819], 'Compresor con sondas de presión y temperatura y una pinza amperimétrica durante un diagnóstico'),
  // [cliente · IG DalcKh8KM2k] · el recorte deja fuera la cara del técnico
  restauracion: foto('restauracion', 850, 1062, [480, 850], 'Soldadura con soplete de una unión de cobre en un equipo de refrigeración'),
  // [cliente · IG DZ43wAWOvVA]
  repuestos: foto('repuestos', 720, 900, [480, 720], 'Motor ventilador Kielmann KM42-515 de 1/4 HP recién desempacado'),
  // [cliente · IG DXE-G0FjnyB] · POR CONFIRMAR Q21: instructores y participantes reconocibles
  academia: foto('academia', 1202, 901, [480, 800, 1202], 'Clase de la Academia ARIR con instructores frente a los participantes'),
  // [cliente · IG CYb6yk2rnoK] · POR CONFIRMAR Q21: técnicos, casi todos de espaldas. Franja superior de la pizarra en 2:1 (sin mobiliario: corte en y 490; 960 px, algo menos nítida que el recorte de 1120 que dejaba ver escritorio y banqueta)
  criterio: foto('criterio', 960, 480, [480, 800, 960], 'Técnicos de Refridi resolviendo una tabla de presión y temperatura en la pizarra'),
};

// Foto de la ficha de servicio (/servicios/[slug]/, mantenimiento y restauración): ancho de .ficha__fig desde 1024 px, 4/5 del alto libre
// (80vh − 202px) sin pasar de la columna (36vw) ni de la caja máxima (487 px). Por debajo no se pinta: <Vidrio … desde={1024}>.
export const sizesFicha = '(min-width: 1024px) min(calc(80vh - 202px), 36vw, 487px), 100vw';
