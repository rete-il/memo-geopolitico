/** Normalize only free text. Catalog IDs and exact-filter values stay unchanged. */
export function normalizeSearchText(value = '') {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The same searchable process fields are used in cards and the dashboard. */
export function processSearchText(process, catalogs) {
  const classification = process.clasificacion;
  const geography = classification.geografia;
  const references = [
    [catalogs.temas, [classification.tema_principal_id, ...classification.tema_secundario_ids]],
    [catalogs.subtemas, classification.subtema_ids],
    [catalogs.etiquetas, classification.etiqueta_ids],
    [catalogs.actores, classification.actor_ids],
    [catalogs.regiones, geography.region_ids],
    [catalogs.subregiones, geography.subregion_ids],
    [catalogs.paises, geography.pais_ids],
    [catalogs.espacios, geography.espacio_ids],
  ];
  return normalizeSearchText([
    process.titulo,
    process.sintesis,
    ...references.flatMap(([catalog, ids]) =>
      ids.filter(Boolean).flatMap((id) => [id, catalog.get(id)?.nombre || '']),
    ),
  ].join(' '));
}
