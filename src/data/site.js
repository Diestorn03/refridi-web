// Única fuente de verdad de lo que el sitio dice de Refridi, C.A. (docs/MAPA.md, docs/INSUMOS.md). Solo lectura para las secciones.
// Etiquetas: [cliente · fuente] = dato suyo · [redactado] = nuestro, sin aprobar · POR CONFIRMAR Qn = docs/PREGUNTAS-REFRIDI.md.
// Sin imports de Astro/Vite: se prueba con `node --test` (tests/site.test.mjs). Los enlaces internos van como rutas; los componentes
// los pasan por url() de src/lib/url.js (el único que lee BASE_URL).

/* ---------- staging ---------- */
// PUBLIC_DEMO=1 o true → staging: noindex, marca "Vista previa" y selector de paleta. '', 0, off o false → producción.
export const normalizeDemo = (flag) => !!flag && !/^(0|off|false)$/i.test(String(flag).trim());
export const demo = normalizeDemo(import.meta.env?.PUBLIC_DEMO ?? globalThis.process?.env?.PUBLIC_DEMO);

/* ---------- marca ---------- */
export const brand = {
  name: 'Refridi',                 // nombre de sitio provisional junto al isotipo (Q7.6: ¿"Refridi, C.A." o "Refridi"?)
  alternateName: 'REFRIDI C.A.',   // [cliente · nombre de la cuenta de IG]
  tagline: 'Refrigeración industrial y comercial',
  // [redactado desde la bio de IG] · también es la meta description del home (MAPA §2a)
  description: 'Instalación, mantenimiento y reparación de refrigeración industrial y comercial en Maracay: cavas cuarto, carga térmica y repuestos, a nivel nacional.',
};

export const legal = {
  company: 'Refridi, C.A.', // POR CONFIRMAR Q9
  rif: null,                // POR CONFIRMAR Q9: sin RIF no se pinta (pie, /privacidad/, legalName/taxID del JSON-LD)
};

/* ---------- WhatsApp y teléfonos por línea (POR CONFIRMAR Q3) ---------- */
// El 0414 590 6559 de algunos posts no se muestra (MAPA §2b).
export const lines = {
  servicios: { label: 'Servicios', number: '584241338650', display: '0424 133 8650', tel: 'tel:+584241338650', ld: '+58-424-133-8650' }, // [cliente · LT + GBP]
  repuestos: { label: 'Repuestos', number: '584228368270', display: '0422 836 8270', tel: 'tel:+584228368270', ld: '+58-422-836-8270' }, // [cliente · GBP, IG DYaleOhjqsC]
  academia: { label: 'Academia ARIR', number: '584122344365', display: '0412 234 4365', tel: 'tel:+584122344365', ld: '+58-412-234-4365' }, // [cliente · IG DXp3QJuFMih] · Q6
};
export const whatsapp = Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, v.number]));

/** wa('servicios', 'Hola…') → https://wa.me/584241338650?text=Hola%E2%80%A6  (sin texto, sin ?text). Línea desconocida = error de build. */
export function wa(line, text) {
  const n = whatsapp[line];
  if (!n) throw new Error(`wa(): línea de WhatsApp desconocida "${line}"`);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// waText por página: dice de dónde viene el chat, para que el cliente los cuente sin cookies (MAPA §2b, [redactado])
export const waText = {
  home: 'Hola Refridi, vi en la web su servicio de refrigeración industrial y quiero solicitar una inspección.',
  repuestos: 'Hola Refridi, vi en la web la sección de repuestos. Busco: ',
  repuestosFamilia: (familia) => `Hola Refridi, vi en la web los repuestos. ¿Tienen disponible ${familia}?`,
  academia: 'Hola, vi en la web de Refridi los cursos de la Academia ARIR. Quiero información de la próxima fecha.',
  notFound: 'Hola Refridi, llegué a una página de su web que no existe. Busco: ',
};

/* ---------- contacto (NAP) · POR CONFIRMAR Q15 ---------- */
export const contact = {
  phone: lines.servicios,
  email: 'refridionline@gmail.com',             // [cliente · INSUMOS, fuente por registrar] · Q15
  emailHref: 'mailto:refridionline@gmail.com',
  street: 'Av. Sucre, Nro. 107 Sur',            // [cliente · Cylex + GBP]
  streetNote: 'a 30 m de la Av. Los Cedros',
  city: 'Maracay',
  region: 'Aragua',
  postalCode: '2103',
  country: 'VE',
  // Q22: sin pin confirmado, búsqueda por dirección (sin embed)
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Refridi, C.A. Av. Sucre, Maracay 2103, Aragua')}`,
  // [cliente · GBP + IG destacado Horario]
  hours: [
    { label: 'Lunes a viernes', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:30', text: '8:00 a 17:30' },
    { label: 'Sábados', days: ['Saturday'], opens: '09:00', closes: '14:00', text: '9:00 a 14:00' },
  ],
  walkIn: false, // Q15: ¿reciben público / se retiran repuestos en la dirección? false = sin mostrador
  // [cliente · GBP, corte oct. 2026] · una línea en #contacto mientras no exista #clientes (Q13/Q20)
  rating: {
    text: '4,5 ★ · 48 opiniones en Google (oct. 2026)',
    url: `https://www.google.com/search?q=${encodeURIComponent('Refridi, C.A. Maracay')}`,
  },
};

/* ---------- redes [cliente · LT, bio de IG] ---------- */
export const social = {
  instagram: 'https://www.instagram.com/refridioficial_/',
  instagramHandle: '@refridioficial_',
  tiktok: 'https://www.tiktok.com/@refridi',
  facebook: 'https://www.facebook.com/refridi',
  arir: 'https://www.instagram.com/arir_ve/',
  arirHandle: '@arir_ve',
};

/* ---------- afirmaciones de la placa del hero (solo la placa: la propuesta las muestra ahí y en ningún otro sitio) ---------- */
// null = no se pinta ese dato. Fuera de la placa, sin Q11 no hay "24/7" (Criterio, Mantenimiento y #contacto: MAPA §3).
export const claims = {
  coverage: { text: 'A nivel nacional' },        // [cliente · bio de IG "a Nivel Nacional"] · POR CONFIRMAR Q12 (sin mapa ni lista de estados)
  years: { num: '40+', text: 'Años' },           // [cliente · bio de IG] · POR CONFIRMAR Q10 (sin año ni foundingDate)
  support24: { pre: 'Atención', num: '24/7' },   // [cliente · IG DWO2-bmDn4f] · POR CONFIRMAR Q11
};
// Sin interruptor porque nada los pinta todavía: sonda de #sectores (Q19), "certificados" (Q14), logos/nombres de clientes (Q13) y
// citas de reseñas (Q20). Cuando llegue la respuesta se añaden el dato y el componente que lo muestra.

/* ---------- navegación ---------- */
// La propuesta es el home + las 3 páginas de servicio: el menú apunta a las secciones del home. Cuando existan /servicios/,
// /repuestos/ y /contacto/ (MAPA §2), cambian las rutas, no los nombres.
export const nav = [
  { path: '/#servicios', label: 'Servicios' },
  { path: '/#repuestos', label: 'Repuestos' },
  { path: '/#academia', label: 'Academia' },
  { path: '/#contacto', label: 'Contacto' },
];

/* ---------- páginas ---------- */
export const home = {
  title: 'Refrigeración industrial y comercial en Maracay · Refridi',
  description: brand.description,
  h1: 'Refrigeración industrial y comercial: garantizamos su cadena de frío a nivel nacional', // [redactado sobre la bio de IG; usted por Q16]
  subtitle: 'Instalación | Mantenimiento | Reparación',                                          // [cliente · bio de IG]
  cta: 'Solicitar una inspección',                                                               // [redactado sobre IG DZs-MXMFkYT]
  waText: waText.home,
  closing: 'Trabaje con los que saben.',                                                         // [redactado sobre IG DY205E2FuaN; usted por Q16]
};

// Orden: Q4. `name` es el rótulo viajero (Archivo de ancho normal, sin código ni mayúsculas). trabajos: [cliente · INSUMOS §Qué hacen].
export const services = [
  {
    slug: 'mantenimiento',
    name: 'Mantenimiento y reparación',
    title: 'Mantenimiento y reparación de refrigeración · Refridi',
    h1: 'Mantenimiento y reparación de refrigeración industrial',
    description: 'Mantenimiento preventivo, predictivo y correctivo de refrigeración industrial en Maracay. Diagnósticos precisos y tableros eléctricos.',
    intro: 'Mantenimiento preventivo, predictivo y correctivo para cavas, cámaras y unidades de compresión. Primero el diagnóstico, después la reparación: no ponemos parches.', // [redactado; "no ponemos parches" · IG DYDlNeHjlEV]
    trabajos: [
      'Mantenimiento preventivo, predictivo y correctivo',
      'Reparación de equipos de refrigeración',
      'Diagnóstico con instrumentación', // POR CONFIRMAR Q4 (inferido de los repuestos que venden)
      'Tableros eléctricos de refrigeración',
      // 'Soporte 24/7' entra con Q11 (MAPA §3, tabla de servicios)
    ],
    clave: { text: 'La continuidad de su producción empieza en el tablero.', quote: false }, // [redactado sobre IG DXNQ1NwFrhv; usted por Q16]
    cta: 'Reportar una falla',
    waText: 'Hola Refridi, vi en la web el servicio de mantenimiento y reparación. Quiero reportar una falla en un equipo de refrigeración.',
    related: { services: ['instalacion', 'restauracion'], line: 'repuestos' },
  },
  {
    slug: 'instalacion',
    name: 'Proyectos e instalación',
    title: 'Proyectos e instalación de cavas cuarto · Refridi',
    h1: 'Proyectos e instalación de cavas cuarto y refrigeración industrial',
    description: 'Proyectos de refrigeración desde cero: cálculo de carga térmica, cavas cuarto, unidades de compresión y control térmico para evitar mermas.',
    intro: 'Proyectos de refrigeración desde cero y optimización de lo que ya tiene. Cada proyecto empieza por el cálculo de carga térmica.', // [redactado]
    trabajos: [
      'Cálculo de carga térmica y balance térmico',
      'Proyectos desde cero y optimización de lo existente',
      'Cavas cuarto y unidades comerciales',
      'Unidades de compresión de alta eficiencia',
      'Automatización y control térmico para evitar mermas',
    ],
    clave: { text: 'Todo gran proyecto comienza con un número clave: la Carga Térmica', quote: true, source: 'IG DWO2-bmDn4f' }, // [cliente] literal
    cta: 'Pedir cotización del proyecto',
    waText: 'Hola Refridi, vi en la web el servicio de proyectos e instalación. Quiero cotizar una cava cuarto o un proyecto de refrigeración.',
    related: { services: ['mantenimiento', 'restauracion'], line: 'academia' },
  },
  {
    slug: 'restauracion',
    name: 'Restauración y protección',
    title: 'Tratamiento fenólico y restauración de equipos · Refridi',
    h1: 'Tratamiento fenólico anticorrosivo y restauración de equipos de refrigeración',
    description: 'Tratamiento fenólico anticorrosivo para serpentines en zonas costeras o húmedas, restauración integral de equipos y pintura de tuberías y aislamiento.',
    intro: 'Devolvemos a servicio equipos castigados por la corrosión y protegemos los que trabajan en zonas costeras o húmedas.', // [redactado]
    trabajos: [
      'Restauración integral de equipos',
      'Tratamiento fenólico anticorrosivo para serpentines',
      'Pintura y protección de tuberías y aislamiento',
    ],
    // [redactado sobre IG DbHL0NFFiKL y Db34Hmllo7K]
    clave: { text: 'En zonas costeras o húmedas, la corrosión empieza por el serpentín. El recubrimiento fenólico lo protege; el blanco o el aluminio en tuberías y aislamiento funcionan como escudo térmico.', quote: false },
    cta: 'Solicitar evaluación',
    waText: 'Hola Refridi, vi en la web el tratamiento fenólico y la restauración de equipos. Quiero una evaluación.',
    related: { services: ['mantenimiento', 'instalacion'], line: null },
  },
];
export const serviceBySlug = (slug) => services.find((s) => s.slug === slug);

// [cliente · IG destacado Servicios] · líneas [redactado] · sin clientes hasta Q13
export const sectors = [
  { id: 'carnicos', name: 'Cárnicos y embutidos', line: 'Salas de proceso y cavas de conservación donde la temperatura no puede variar entre turnos.' },
  { id: 'frigorificos', name: 'Centros frigoríficos', line: 'Cámaras de congelación y conservación que trabajan día y noche.' },
  { id: 'lacteos', name: 'Lácteos y bebidas', line: 'Frío constante desde la línea de producción hasta el despacho.' },
  { id: 'retail', name: 'Supermercados y retail', line: 'Cavas, vitrinas y unidades comerciales abiertas al público todo el día.' },
];

// Repuestos [cliente · IG DZ43wAWOvVA, DYaleOhjqsC, DWCmPz3jtpN, DZn5gEwOoaB, IG destacado Repuestos] · marcas y modelos POR CONFIRMAR Q5 · sin precios
export const spares = {
  shipping: 'Envíos a Nivel Nacional', // [cliente · IG DYaleOhjqsC]
  cta: 'Consultar disponibilidad',
  families: [
    { id: 'motores', name: 'Motores ventiladores', detail: 'Kielmann KM42-515 de 1/4 HP · RGC de 1/4 a 1 HP', ask: 'motores ventiladores' },
    { id: 'valvulas', name: 'Válvulas solenoide', detail: 'DEGAR Parts', ask: 'válvulas solenoide' },
    { id: 'filtros', name: 'Filtros deshidratadores', detail: 'RGC', ask: 'filtros deshidratadores' },
    { id: 'compresores', name: 'Compresores', detail: 'Consulte marca, modelo y refrigerante', ask: 'compresores' }, // [redactado] Q5
    { id: 'instrumentos', name: 'Instrumentos', detail: 'Medidor de aislamiento UNI-T · manómetro digital Elitech MS-4000s', ask: 'instrumentos de medición' },
  ],
};

// Academia ARIR [cliente · bio de IG] · POR CONFIRMAR Q6 (sin precios, fechas ni instructores)
export const academy = {
  name: 'Academia ARIR',
  programs: [
    'Refrigeración Básica, Módulo 1',                                  // [cliente · IG DdUkv8dFu1P]
    'Buenas Prácticas en Refrigeración, con FONDOIN',                  // [cliente · IG DXp3QJuFMih]
    'Perfeccionamiento técnico: válvulas de expansión, presostatos y carga térmica', // [cliente · IG DXE-G0FjnyB]
  ],
  attendance: 'Más de 40 profesionales de toda Venezuela', // [cliente · IG DV9w2lTDlk4] asistieron a una capacitación con FONDOIN
  cta: 'Pedir la próxima fecha',
  waText: waText.academia,
};
