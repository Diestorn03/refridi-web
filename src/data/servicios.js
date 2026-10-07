// Datos de las fichas /servicios/<slug>/ (MAPA §3 "Plantilla de servicio"). La base (title, h1, description, intro, trabajos, clave, cta,
// waText, related) vive en site.js; aquí solo lo que la ficha necesita y site.js no trae. [redactado] salvo que diga [cliente].
import { services, serviceBySlug, spares } from './site.js';

// "Motores ventiladores, válvulas solenoide, …, compresores e instrumentos" desde spares.families (una sola lista que mantener)
const familias = new Intl.ListFormat('es', { type: 'conjunction' }).format(spares.families.map((f) => f.name.toLowerCase()));

// Bloque "relacionados": la línea de negocio que aplica a cada servicio (MAPA §3, tabla de slugs).
// La propuesta no tiene /repuestos/ ni /academia/ (Q6): van a su sección del home.
const lines = {
  repuestos: {
    href: '/#repuestos',
    name: 'Repuestos y herramientas',
    text: `${familias[0].toUpperCase()}${familias.slice(1)}, con ${spares.shipping.toLowerCase()}.`, // [cliente · IG DYaleOhjqsC]
  },
  academia: {
    href: '/#academia',
    name: 'Academia ARIR',
    text: 'Perfeccionamiento técnico en carga térmica, válvulas de expansión y presostatos.', // [cliente · IG DXE-G0FjnyB] · Q6
  },
};

const extra = {
  mantenimiento: { alcance: 'Desde la rutina preventiva hasta la reparación de la falla, con el equipo en sitio.' },
  instalacion: { alcance: 'Del cálculo al arranque: el proyecto se dimensiona antes de comprar un solo equipo.' },
  restauracion: { alcance: 'Para equipos con corrosión, desgaste o pintura vencida, antes de que la falla obligue a reemplazarlos.' },
};

export const paginas = services.map((s) => ({
  ...s,
  ...extra[s.slug],
  relatedServices: s.related.services.map(serviceBySlug),
  relatedLine: lines[s.related.line] ?? null,
}));
