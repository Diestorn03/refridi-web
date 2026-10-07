// waText de la página actual (MAPA §2b) para el WhatsApp de servicios de la cabecera y el pie: el de la página de servicio, el de la 404 o el del home.
import { serviceBySlug, home, waText } from '../../data/site.js';

export function waPagina(pathname) {
  const slug = pathname.match(/\/servicios\/([^/]+)\/?$/)?.[1];
  return (slug && serviceBySlug(slug)?.waText) || (/\/404(\.html)?\/?$/.test(pathname) ? waText.notFound : home.waText);
}
