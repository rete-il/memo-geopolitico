const siteName = 'Memo Geopolítico';

/** @type {[RegExp, string][]} */
const detailRoles = [
  [/^\/publicaciones\/[^/]+\/$/, 'Análisis'],
  [/^\/observatorio\/estado\/[^/]+\/$/, 'Estado del Observatorio'],
  [/^\/observatorio\/(?!rectores\/|dashboard\/|senales\/)[^/]+\/$/, 'Expediente'],
  [/^\/opinion\/[^/]+\/$/, 'Opinión'],
  [/^\/actores\/[^/]+\/$/, 'Actor'],
  [/^\/regiones\/[^/]+\/$/, 'Geografía'],
  [/^\/espacios-geopoliticos\/[^/]+\/$/, 'Espacio geopolítico'],
  [/^\/temas\/[^/]+\/$/, 'Tema'],
  [/^\/etiquetas\/[^/]+\/$/, 'Etiqueta'],
  [/^\/metodologia\/relevancia-atencion-mediatica\/[^/]+\/$/, 'Metodología del expediente'],
];

// Search results and browser tabs identify the type of page. Editorial H1s are
// supplied separately by each template and are never changed by this function.
export function pageMetaTitle(title, pathname) {
  const role = detailRoles.find(([pattern]) => pattern.test(pathname))?.[1];
  if (title === siteName && !role) return title;
  return `${title}${role ? ` | ${role}` : ''} · ${siteName}`;
}

// One canonical catalog destination per geographic item. The old region URL
// remains an alias only for geopolitical spaces, so existing links still work.
/**
 * @template {{ id: string, slug: string }} T
 * @param {Partial<Record<string, T[]>>} catalogs
 */
export function geographicCatalogEntries(catalogs) {
  const entries = ['regiones', 'subregiones', 'paises_territorios', 'espacios_geopoliticos']
    .flatMap(key => (catalogs[key] || []).map(item => {
      const space = key === 'espacios_geopoliticos';
      return {
        item,
        path: `/${space ? 'espacios-geopoliticos' : 'regiones'}/${item.slug}/`,
        aliases: space ? [`/regiones/${item.slug}/`] : [],
      };
    }));
  const paths = new Set();
  for (const entry of entries) {
    for (const pathname of [entry.path, ...entry.aliases]) {
      if (paths.has(pathname)) throw new Error(`Ruta geográfica ambigua: ${pathname}`);
      paths.add(pathname);
    }
  }
  return entries;
}
