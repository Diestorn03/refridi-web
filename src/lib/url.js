// El único lugar que lee BASE_URL (los componentes nunca lo usan directo).
// '' en un deploy en la raíz (dominio propio), '/<repo>' en GitHub Pages.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const join = (p) => `${base}/${p.replace(/^\//, '')}`;

/** Enlace a una página: url() → '/<base>/', url('#contacto') → '/<base>/#contacto', url('/servicios/mantenimiento/') → '/<base>/servicios/mantenimiento/'. */
export const url = (path = '') => join(path);
/** Archivo de public/: asset('img/frost.svg') o asset('/img/frost.svg') → '/<base>/img/frost.svg'. */
export const asset = (path) => join(path);

/** Enlace que abre otra pestaña: <a href={…} {...ext}>…<span class="sr-only"> {nuevaPestana}</span></a> (un solo texto en todo el sitio). */
export const ext = { target: '_blank', rel: 'noopener noreferrer' };
export const nuevaPestana = '(se abre en una pestaña nueva)';
