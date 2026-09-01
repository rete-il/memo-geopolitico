import {
  normalizeCharacterization,
  normalizeLanguageCode,
} from '../../centro-local/modules/observatorio/public/controlled-values.js';

const THEME_DEFINITIONS = [
  ['seguridad-conflicto', 'Seguridad y conflicto'],
  ['diplomacia-gobernanza', 'Diplomacia y gobernanza'],
  ['geoeconomia-comercio-sanciones', 'Geoeconomía, comercio y sanciones'],
  ['infraestructura-conectividad', 'Infraestructura y conectividad'],
  ['energia-recursos-estrategicos', 'Energía y recursos estratégicos'],
  ['tecnologia-poder-digital', 'Tecnología y poder digital'],
  ['clima-ambiente-seguridad-humana', 'Clima, ambiente y seguridad humana'],
  ['sociedad-demografia-migraciones', 'Sociedad, demografía y migraciones'],
];

const SUBTHEME_DEFINITIONS = [
  ['corredores-estrategicos', 'Corredores estratégicos'],
  ['minerales-criticos', 'Minerales críticos'],
  ['cadenas-suministro', 'Cadenas de suministro'],
  ['infraestructura-critica-resiliencia', 'Infraestructura crítica y resiliencia'],
  ['movilidad-militar-infraestructura-doble-uso', 'Movilidad militar e infraestructura de doble uso'],
  ['cables-submarinos', 'Cables submarinos'],
  ['puertos-estrategicos', 'Puertos estratégicos'],
  ['rutas-maritimas-estrechos', 'Rutas marítimas y estrechos'],
];

const CATEGORY_THEME = {
  seguridad_conflicto: 'seguridad-conflicto',
  infraestructura_conectividad: 'infraestructura-conectividad',
  infraestructura_energia: 'infraestructura-conectividad',
  minerales_recursos_estrategicos: 'energia-recursos-estrategicos',
  comercio_finanzas_sanciones: 'geoeconomia-comercio-sanciones',
  tecnologia_soberania_digital: 'tecnologia-poder-digital',
  clima_agua_seguridad_alimentaria: 'clima-ambiente-seguridad-humana',
  potencias_bloques: 'diplomacia-gobernanza',
};

const GEOGRAPHY = {
  Global: { type: 'region', id: 'global', nombre: 'Global' },
  África: { type: 'region', id: 'africa', nombre: 'África' },
  Europa: { type: 'region', id: 'europa', nombre: 'Europa' },
  'Oriente Medio': { type: 'region', id: 'oriente-medio', nombre: 'Oriente Medio' },
  'América Latina': { type: 'region', id: 'americas', nombre: 'Américas' },
  'América Central': { type: 'subregion', id: 'america-central', nombre: 'América Central', parent_id: 'americas' },
  Caribe: { type: 'subregion', id: 'caribe', nombre: 'Caribe', parent_id: 'americas' },
  'Asia Central': { type: 'subregion', id: 'asia-central', nombre: 'Asia Central', parent_id: 'asia' },
  'Asia central': { type: 'subregion', id: 'asia-central', nombre: 'Asia Central', parent_id: 'asia' },
  'Asia nororiental': { type: 'subregion', id: 'asia-nororiental', nombre: 'Asia nororiental', parent_id: 'asia' },
  'Sudeste Asiático': { type: 'subregion', id: 'sudeste-asiatico', nombre: 'Sudeste Asiático', parent_id: 'asia' },
  'China occidental': { type: 'subregion', id: 'china-occidental', nombre: 'China occidental', parent_id: 'asia' },
  'África atlántica': { type: 'subregion', id: 'africa-atlantica', nombre: 'África atlántica', parent_id: 'africa' },
  'África austral': { type: 'subregion', id: 'africa-austral', nombre: 'África austral', parent_id: 'africa' },
  'África central': { type: 'subregion', id: 'africa-central', nombre: 'África central', parent_id: 'africa' },
  'África oriental': { type: 'subregion', id: 'africa-oriental', nombre: 'África oriental', parent_id: 'africa' },
  'Cuerno de África': { type: 'subregion', id: 'cuerno-de-africa', nombre: 'Cuerno de África', parent_id: 'africa' },
  'Grandes Lagos': { type: 'subregion', id: 'grandes-lagos-africanos', nombre: 'Grandes Lagos', parent_id: 'africa' },
  Magreb: { type: 'subregion', id: 'magreb', nombre: 'Magreb', parent_id: 'africa' },
  Sahel: { type: 'subregion', id: 'sahel', nombre: 'Sahel', parent_id: 'africa' },
  'Cáucaso Sur': { type: 'subregion', id: 'caucaso-sur', nombre: 'Cáucaso Sur', parent_id: 'asia' },
  'Estados bálticos': { type: 'subregion', id: 'estados-balticos', nombre: 'Estados bálticos', parent_id: 'europa' },
  'Europa central': { type: 'subregion', id: 'europa-central', nombre: 'Europa central', parent_id: 'europa' },
  'Europa oriental': { type: 'subregion', id: 'europa-oriental', nombre: 'Europa oriental', parent_id: 'europa' },
  Azerbaiyán: { type: 'country', id: 'AZE', nombre: 'Azerbaiyán', parent_id: 'asia' },
  Bolivia: { type: 'country', id: 'BOL', nombre: 'Bolivia', parent_id: 'americas' },
  Brasil: { type: 'country', id: 'BRA', nombre: 'Brasil', parent_id: 'americas' },
  Chad: { type: 'country', id: 'TCD', nombre: 'Chad', parent_id: 'africa' },
  Chile: { type: 'country', id: 'CHL', nombre: 'Chile', parent_id: 'americas' },
  China: { type: 'country', id: 'CHN', nombre: 'China', parent_id: 'asia' },
  Egipto: { type: 'country', id: 'EGY', nombre: 'Egipto', parent_id: 'africa' },
  Eritrea: { type: 'country', id: 'ERI', nombre: 'Eritrea', parent_id: 'africa' },
  Etiopía: { type: 'country', id: 'ETH', nombre: 'Etiopía', parent_id: 'africa' },
  India: { type: 'country', id: 'IND', nombre: 'India', parent_id: 'asia' },
  Irak: { type: 'country', id: 'IRQ', nombre: 'Irak', parent_id: 'oriente-medio' },
  Irán: { type: 'country', id: 'IRN', nombre: 'Irán', parent_id: 'oriente-medio' },
  Libia: { type: 'country', id: 'LBY', nombre: 'Libia', parent_id: 'africa' },
  Myanmar: { type: 'country', id: 'MMR', nombre: 'Myanmar', parent_id: 'asia' },
  Paraguay: { type: 'country', id: 'PRY', nombre: 'Paraguay', parent_id: 'americas' },
  Perú: { type: 'country', id: 'PER', nombre: 'Perú', parent_id: 'americas' },
  'República Centroafricana': { type: 'country', id: 'CAF', nombre: 'República Centroafricana', parent_id: 'africa' },
  Rusia: { type: 'country', id: 'RUS', nombre: 'Rusia', parent_id: 'europa' },
  Siria: { type: 'country', id: 'SYR', nombre: 'Siria', parent_id: 'oriente-medio' },
  Sudán: { type: 'country', id: 'SDN', nombre: 'Sudán', parent_id: 'africa' },
  'Sudán del Sur': { type: 'country', id: 'SSD', nombre: 'Sudán del Sur', parent_id: 'africa' },
  Turquía: { type: 'country', id: 'TUR', nombre: 'Turquía', parent_id: 'oriente-medio' },
  Ucrania: { type: 'country', id: 'UKR', nombre: 'Ucrania', parent_id: 'europa' },
  'Bahía de Bengala': { type: 'space', id: 'bahia-de-bengala', nombre: 'Bahía de Bengala', parent_id: 'asia' },
  Caspio: { type: 'space', id: 'mar-caspio', nombre: 'Mar Caspio', parent_id: 'asia' },
  Golfo: { type: 'space', id: 'golfo-persico', nombre: 'Golfo Pérsico', parent_id: 'oriente-medio' },
  Levante: { type: 'space', id: 'levante-mediterraneo', nombre: 'Levante mediterráneo', parent_id: 'oriente-medio' },
  'Mar Báltico': { type: 'space', id: 'mar-baltico', nombre: 'Mar Báltico', parent_id: 'europa' },
  'Mar Negro': { type: 'space', id: 'mar-negro', nombre: 'Mar Negro', parent_id: 'europa' },
  'Mar Rojo': { type: 'space', id: 'mar-rojo', nombre: 'Mar Rojo', parent_id: 'oriente-medio' },
  'Mar de Azov': { type: 'space', id: 'mar-de-azov', nombre: 'Mar de Azov', parent_id: 'europa' },
  'Mar del Norte': { type: 'space', id: 'mar-del-norte', nombre: 'Mar del Norte', parent_id: 'europa' },
  Mediterráneo: { type: 'space', id: 'mediterraneo', nombre: 'Mediterráneo', parent_id: 'europa' },
  'Ártico': { type: 'space', id: 'artico', nombre: 'Ártico', parent_id: 'global' },
};

export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

const unique = (items) => [...new Set(items.filter(Boolean))];
const rectorIdsFor = (item = {}) => unique([
  ...(item.macroevento_rector_id ? [slugify(item.macroevento_rector_id)] : []),
  ...(Array.isArray(item.macroevento_rector_ids)
    ? item.macroevento_rector_ids.map(slugify)
    : []),
]);

function catalogItem(id, nombre, order = 100, extra = {}) {
  return {
    id,
    nombre,
    slug: /^[A-Z]{3}$/.test(id) ? slugify(nombre) : id,
    estado: 'activo',
    orden: order,
    ...extra,
  };
}

function canonicalCatalog(taxonomy, key, fallbackDefinitions) {
  const explicit = taxonomy?.catalogos?.[key] || taxonomy?.[key];
  const source =
    Array.isArray(explicit) && explicit.length
      ? explicit
      : fallbackDefinitions.map(([id, nombre]) => ({ id, nombre }));

  return source
    .map((entry, index) => {
      const value = Array.isArray(entry)
        ? { id: entry[0], nombre: entry[1] }
        : entry;
      const nombre = String(value?.nombre || '').trim();
      const id = String(value?.id || value?.slug || slugify(nombre)).trim();
      if (!id || !nombre) return null;

      return catalogItem(
        id,
        nombre,
        Number.isFinite(Number(value.orden))
          ? Number(value.orden)
          : (index + 1) * 10,
        {
          ...(value.descripcion
            ? { descripcion: String(value.descripcion).trim() }
            : {}),
          ...(value.parent_id
            ? { parent_id: String(value.parent_id) }
            : {}),
          ...(Array.isArray(value.aliases)
            ? { aliases: unique(value.aliases.map(String)) }
            : {}),
          ...(value.estado === 'inactivo' ? { estado: 'inactivo' } : {}),
          slug: String(value.slug || id),
        },
      );
    })
    .filter(Boolean);
}

function themeFromInternalCategory(category) {
  const name = String(category?.nombre || '').toLowerCase();
  if (/seguridad|conflicto|militar|armamento/.test(name)) return 'seguridad-conflicto';
  if (/infraestructura|conectividad|transporte/.test(name)) return 'infraestructura-conectividad';
  if (/energ|mineral|recurso/.test(name)) return 'energia-recursos-estrategicos';
  if (/tecnolog|digital|ciber/.test(name)) return 'tecnologia-poder-digital';
  if (/comercio|finanza|sanci|geoeconom/.test(name)) return 'geoeconomia-comercio-sanciones';
  if (/gobernanza|poder|potencia|alianza|diploma/.test(name)) return 'diplomacia-gobernanza';
  if (/clima|agua|ambiente|aliment/.test(name)) return 'clima-ambiente-seguridad-humana';
  if (/demograf|migra|sociedad/.test(name)) return 'sociedad-demografia-migraciones';
  return null;
}

function subthemesFromTopics(topics) {
  const text = topics.map((item) => item?.nombre || '').join(' ').toLowerCase();
  const ids = [];
  if (/corredor/.test(text)) ids.push('corredores-estrategicos');
  if (/mineral|cobalto|cobre|litio|níquel|niquel|tierras raras/.test(text)) ids.push('minerales-criticos');
  if (/cadena.*suministro|suministro/.test(text)) ids.push('cadenas-suministro');
  if (/infraestructura crítica|infraestructura critica|resiliencia/.test(text)) ids.push('infraestructura-critica-resiliencia');
  if (/movilidad militar|doble uso/.test(text)) ids.push('movilidad-militar-infraestructura-doble-uso');
  if (/cable.*submarino/.test(text)) ids.push('cables-submarinos');
  if (/puerto/.test(text)) ids.push('puertos-estrategicos');
  if (/estrecho|ruta marítima|ruta maritima|canal/.test(text)) ids.push('rutas-maritimas-estrechos');
  return unique(ids);
}

function normalizeSourceState(value) {
  const state = String(value || '').toLowerCase();
  if (state === 'verificada' || state === 'verificado') return 'verificada';
  if (state === 'revisada' || state === 'revisado') return 'revisada';
  return 'pendiente';
}

function sourceProjection(source) {
  return {
    fuente_id: slugify(source.id),
    media_id: source.media_id ? slugify(source.media_id) : null,
    medio: String(source.medio || ''),
    titulo: String(source.titulo || ''),
    fecha: String(source.fecha || ''),
    idioma: normalizeLanguageCode(source.idioma),
    tipo: normalizeCharacterization(source.tipo),
    url: String(source.url || ''),
    estado_verificacion: normalizeSourceState(source.estado_verificacion),
  };
}

function publicTypedRelation(relation = {}) {
  return {
    relacion_id: slugify(relation.id),
    origen_id: slugify(relation.origen_id),
    destino_id: slugify(relation.destino_id),
    tipo: String(relation.tipo || ''),
    mecanismo: String(relation.mecanismo || ''),
    evidencia_senal_ids: unique((relation.evidencia_senal_ids || []).map(slugify)),
    direccion: String(relation.direccion || 'origen_destino'),
    reciprocidad: Boolean(relation.reciprocidad),
  };
}

function geographyProjection(labels) {
  const regionIds = [];
  const subregionIds = [];
  const countryIds = [];
  const spaceIds = [];
  const catalogEntries = {
    regiones: new Map(),
    subregiones: new Map(),
    paises_territorios: new Map(),
    espacios_geopoliticos: new Map(),
  };

  for (const label of labels || []) {
    const entry = GEOGRAPHY[label] || {
      type: 'space',
      id: slugify(label),
      nombre: label,
      parent_id: 'global',
    };
    const extra = entry.parent_id ? { parent_id: entry.parent_id } : {};
    if (entry.type === 'region') {
      regionIds.push(entry.id);
      catalogEntries.regiones.set(entry.id, catalogItem(entry.id, entry.nombre, 100, extra));
    }
    if (entry.type === 'subregion') {
      subregionIds.push(entry.id);
      regionIds.push(entry.parent_id);
      catalogEntries.subregiones.set(entry.id, catalogItem(entry.id, entry.nombre, 100, extra));
    }
    if (entry.type === 'country') {
      countryIds.push(entry.id);
      regionIds.push(entry.parent_id);
      catalogEntries.paises_territorios.set(entry.id, catalogItem(entry.id, entry.nombre, 100, extra));
    }
    if (entry.type === 'space') {
      spaceIds.push(entry.id);
      regionIds.push(entry.parent_id);
      catalogEntries.espacios_geopoliticos.set(entry.id, catalogItem(entry.id, entry.nombre, 100, extra));
    }
  }

  const regionNames = {
    global: 'Global',
    africa: 'África',
    americas: 'Américas',
    asia: 'Asia',
    europa: 'Europa',
    'oriente-medio': 'Oriente Medio',
  };
  for (const id of unique(regionIds)) {
    catalogEntries.regiones.set(id, catalogItem(id, regionNames[id] || id, 100));
  }

  const geographicCount = unique([...subregionIds, ...countryIds, ...spaceIds]).length;
  const scope = countryIds.length === 1 && geographicCount === 1
    ? 'nacional'
    : countryIds.length > 1 || subregionIds.length > 1 || spaceIds.length > 1
      ? 'transfronterizo'
      : regionIds.includes('global')
        ? 'global'
        : 'regional';

  return {
    classification: {
      alcance: scope,
      region_ids: unique(regionIds),
      subregion_ids: unique(subregionIds),
      pais_ids: unique(countryIds),
      espacio_ids: unique(spaceIds),
    },
    catalogEntries,
  };
}

function averageScale(evaluation) {
  const values = ['impacto', 'probabilidad', 'alcance', 'persistencia']
    .map((key) => Number(evaluation?.[key]))
    .filter(Number.isFinite);
  if (!values.length) return 1;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function publicationState(event) {
  const explicit = event.publicacion?.estado;
  if (['borrador', 'en_revision', 'listo', 'publicado'].includes(explicit)) return explicit;
  if (event.estado_editorial === 'publicado') return 'publicado';
  if (event.estado_editorial === 'revision') return 'en_revision';
  if (event.estado_editorial === 'validado') return 'listo';
  return 'borrador';
}

function trackingState(event) {
  if (['en_seguimiento', 'pausado', 'archivado'].includes(event.estado_seguimiento)) {
    return event.estado_seguimiento;
  }
  return event.estado_editorial === 'archivado' ? 'archivado' : 'en_seguimiento';
}

function nextEditorialStep(state) {
  const steps = {
    borrador: 'Completar la documentación y verificar las señales pendientes.',
    en_revision: 'Revisar coherencia, fuentes y valoraciones antes de autorizar la publicación.',
    listo: 'Realizar el control final y decidir la fecha de publicación.',
    publicado: 'Mantener el seguimiento e incorporar nuevas señales verificadas.',
  };
  return steps[state] || steps.borrador;
}

export function buildPublicPackage(data, taxonomy = {}, options = {}) {
  const includeUnpublished = Boolean(
    options.includeUnpublished ?? options.includeDrafts,
  );
  const includeInternal = Boolean(
    options.includeInternal ?? options.includeDrafts,
  );
  const allTopics = new Map(
    (taxonomy.categorias || []).flatMap((category) =>
      (category.temas || []).map((topic) => [
        Number(topic.id),
        { ...topic, categoria: category },
      ]),
    ),
  );
  const canonicalThemes = canonicalCatalog(
    taxonomy,
    'temas',
    THEME_DEFINITIONS,
  );
  const canonicalSubthemes = canonicalCatalog(
    taxonomy,
    'subtemas',
    SUBTHEME_DEFINITIONS,
  );

  const processes = [];
  const globalSources = new Map();
  const actors = new Map();
  const geographyCatalog = {
    regiones: new Map(),
    subregiones: new Map(),
    paises_territorios: new Map(),
    espacios_geopoliticos: new Map(),
  };
  const usedThemes = new Set();
  const usedSubthemes = new Set();

  for (const event of data.macroeventos || []) {
    const state = publicationState(event);
    if (!includeUnpublished && state !== 'publicado') continue;

    const eventTopics = (event.tema_ids || []).map((id) => allTopics.get(Number(id))).filter(Boolean);
    const mappedTopicThemes = unique(
      eventTopics.map((item) => themeFromInternalCategory(item.categoria)),
    );
    const ownClassification = event.clasificacion;
    const hasOwnPrimary =
      ownClassification &&
      Object.prototype.hasOwnProperty.call(
        ownClassification,
        'tema_principal_id',
      );
    const primaryTheme = hasOwnPrimary
      ? String(ownClassification.tema_principal_id || '') || null
      : CATEGORY_THEME[event.categoria] || mappedTopicThemes[0] || null;
    const secondaryThemes = unique(
      ownClassification &&
        Object.prototype.hasOwnProperty.call(
          ownClassification,
          'tema_secundario_ids',
        )
        ? Array.isArray(ownClassification.tema_secundario_ids)
          ? ownClassification.tema_secundario_ids.map(String)
          : []
        : mappedTopicThemes,
    ).filter((id) => id !== primaryTheme);
    if (primaryTheme) usedThemes.add(primaryTheme);
    secondaryThemes.forEach((id) => usedThemes.add(id));

    const subthemes = unique(
      ownClassification &&
        Object.prototype.hasOwnProperty.call(
          ownClassification,
          'subtema_ids',
        )
        ? Array.isArray(ownClassification.subtema_ids)
          ? ownClassification.subtema_ids.map(String)
          : []
        : subthemesFromTopics(eventTopics),
    );
    subthemes.forEach((id) => usedSubthemes.add(id));

    const geography = geographyProjection(event.regiones || []);
    for (const [key, map] of Object.entries(geography.catalogEntries)) {
      for (const [id, item] of map) geographyCatalog[key].set(id, item);
    }

    const actorIds = unique((event.actores || []).map(slugify));
    for (const actor of event.actores || []) {
      const id = slugify(actor);
      actors.set(id, catalogItem(id, actor, 100));
    }

    const sourceList = (event.fuentes || []).map(sourceProjection);
    const allowedSources = includeInternal
      ? sourceList
      : sourceList.filter((source) => source.estado_verificacion === 'verificada');
    const allowedSourceIds = new Set(allowedSources.map((source) => source.fuente_id));
    allowedSources.forEach((source) => globalSources.set(source.fuente_id, source));

    let signalsOmitted = 0;
    const signals = [];
    for (const signal of event.senales || []) {
      const sourceIds = unique(
        (signal.fuente_ids || []).map(slugify).filter((id) => allowedSourceIds.has(id)),
      );
      if (!sourceIds.length) {
        signalsOmitted += 1;
        continue;
      }
      const allVerified = sourceIds.every(
        (id) => globalSources.get(id)?.estado_verificacion === 'verificada',
      );
      signals.push({
        senal_id: slugify(signal.id),
        propietario_macroevento_id: slugify(signal.propietario_macroevento_id || event.id),
        fecha: String(signal.fecha || ''),
        titulo: String(signal.titulo || ''),
        resumen: String(signal.descripcion || ''),
        fuente_ids: sourceIds,
        estado_verificacion: allVerified
          ? 'verificada'
          : normalizeSourceState(signal.estado_revision),
      });
    }

    const relevance = averageScale(event.evaluacion);
    const attention = Number(event.evaluacion?.cobertura_observada || 1);
    const sourceIds = allowedSources.map((source) => source.fuente_id);
    const completedMilestones = [
      'Expediente abierto y clasificado',
      ...(sourceIds.length ? ['Fuentes verificadas incorporadas'] : []),
      ...(signals.length ? ['Señales verificadas incorporadas'] : []),
      ...(state === 'en_revision' || state === 'listo' || state === 'publicado'
        ? ['Revisión editorial iniciada']
        : []),
      ...(state === 'listo' || state === 'publicado'
        ? ['Control editorial completado']
        : []),
      ...(state === 'publicado' ? ['Publicación autorizada'] : []),
    ];

    processes.push({
      schema_version: 2,
      macroevento_id: slugify(event.id),
      slug: slugify(event.slug || event.id),
      titulo: String(event.titulo || ''),
      sintesis: String(event.descripcion || ''),
      estado_seguimiento: trackingState(event),
      publicacion: {
        estado: state,
        publicado_el: event.publicacion?.publicado_el || null,
        actualizado_el: String(
          event.publicacion?.actualizado_el || event.fecha_corte || data.actualizado || '',
        ),
      },
      progreso_publico: {
        etapa: state,
        proximo_paso: nextEditorialStep(state),
        hitos_completados: completedMilestones,
      },
      clasificacion: {
        tema_principal_id: primaryTheme,
        tema_secundario_ids: secondaryThemes,
        subtema_ids: subthemes,
        geografia: geography.classification,
        actor_ids: actorIds,
        etiqueta_ids: [],
      },
      que_esta_ocurriendo: String(event.descripcion || ''),
      por_que_importa: String(event.por_que_importa || ''),
      es_macroevento_rector: Boolean(event.es_macroevento_rector),
      macroevento_rector_id: rectorIdsFor(event)[0] || null,
      macroevento_rector_ids: rectorIdsFor(event),
      claves_estructurales: Array.isArray(event.claves_estructurales)
        ? event.claves_estructurales.map(String)
        : [],
      valoraciones: {
        relevancia_geopolitica: relevance,
        atencion_mediatica: attention,
        brecha: Number((relevance - attention).toFixed(1)),
        confianza: String(event.evaluacion?.confianza || 'media'),
        incertidumbre: Number(event.evaluacion?.incertidumbre || 1),
      },
      senales: signals.sort((a, b) => b.fecha.localeCompare(a.fecha)),
      cronologia: [],
      fuente_ids: sourceIds,
      recurso_visual_ids: [],
      macroevento_relacionado_ids: Array.isArray(event.macroevento_relacionado_ids)
        ? unique(event.macroevento_relacionado_ids.map(slugify))
        : [],
      relaciones_tipadas: (data.relaciones_macroeventos || [])
        .filter((relation) => relation.origen_id === event.id || relation.destino_id === event.id)
        .map(publicTypedRelation),
      referencias_senal: (event.referencias_senal || []).map((reference) => ({
        senal_id: slugify(reference.senal_id),
        tipo_uso: String(reference.tipo_uso || ''),
        efecto_segundo_orden: String(reference.efecto_segundo_orden || ''),
      })),
      indicadores_seguimiento: Array.isArray(event.indicadores)
        ? event.indicadores.map(String)
        : [],
      escenarios: {
        base: String(event.escenarios?.base || ''),
        adverso: String(event.escenarios?.adverso || ''),
        transformador: String(event.escenarios?.transformador || ''),
      },
      ...(includeInternal
        ? {
            metricas_editoriales: {
              senales_omitidas_sin_fuente: signalsOmitted,
              fuentes_pendientes: sourceList.filter(
                (source) => source.estado_verificacion !== 'verificada',
              ).length,
            },
          }
        : {}),
    });
  }

  const themeCatalog = canonicalThemes;
  const subthemeCatalog = canonicalSubthemes;

  return {
    formato: 'memo-geopolitico-publico',
    schema_version: 2,
    generado_el: String(options.generatedAt || new Date().toISOString().slice(0, 10)),
    procesos: processes.sort((a, b) =>
      b.publicacion.actualizado_el.localeCompare(a.publicacion.actualizado_el),
    ),
    fuentes: [...globalSources.values()].sort((a, b) =>
      a.fuente_id.localeCompare(b.fuente_id),
    ),
    recursos_visuales: [],
    catalogos: {
      temas: themeCatalog,
      subtemas: subthemeCatalog,
      regiones: [...geographyCatalog.regiones.values()],
      subregiones: [...geographyCatalog.subregiones.values()],
      paises_territorios: [...geographyCatalog.paises_territorios.values()],
      espacios_geopoliticos: [...geographyCatalog.espacios_geopoliticos.values()],
      actores: [...actors.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      etiquetas: [],
      autores: [catalogItem('rete', 'Rete', 10)],
    },
  };
}

export function validatePublicPackage(data, options = {}) {
  const errors = [];
  const warnings = [];
  if (data?.formato !== 'memo-geopolitico-publico') errors.push('Formato público inválido.');
  if (data?.schema_version !== 2) errors.push('El esquema público debe ser v2.');

  const processIds = new Set();
  const signalOwners = new Map();
  const sourceIds = new Set((data?.fuentes || []).map((item) => item.fuente_id));
  const themeIds = new Set((data?.catalogos?.temas || []).map((item) => item.id));
  const subthemeIds = new Set((data?.catalogos?.subtemas || []).map((item) => item.id));
  const actorIds = new Set((data?.catalogos?.actores || []).map((item) => item.id));

  const normalizeCatalogValue = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  for (const [key, items] of Object.entries(data?.catalogos || {})) {
    const ids = new Set();
    const slugs = new Set();
    const names = new Set();
    for (const item of items || []) {
      const normalizedName = normalizeCatalogValue(item.nombre);
      if (!item.id || !item.nombre || !item.slug) {
        errors.push(`Catálogo ${key}: entrada incompleta.`);
        continue;
      }
      if (ids.has(item.id)) {
        errors.push(`Catálogo ${key}: ID duplicado (${item.id}).`);
      }
      if (slugs.has(item.slug)) {
        errors.push(`Catálogo ${key}: slug duplicado (${item.slug}).`);
      }
      if (names.has(normalizedName)) {
        errors.push(
          `Catálogo ${key}: nombre duplicado o variante accidental (${item.nombre}).`,
        );
      }
      ids.add(item.id);
      slugs.add(item.slug);
      names.add(normalizedName);
    }
  }

  for (const process of data?.procesos || []) {
    const label = process.titulo || process.macroevento_id;
    if (!process.macroevento_id) errors.push(`${label}: falta macroevento_id.`);
    if (processIds.has(process.macroevento_id)) errors.push(`${label}: ID duplicado.`);
    processIds.add(process.macroevento_id);
    if (!process.titulo || !process.sintesis) errors.push(`${label}: faltan título o síntesis.`);
    if (!process.clasificacion.tema_principal_id) {
      errors.push(`${label}: falta tema principal.`);
    } else if (!themeIds.has(process.clasificacion.tema_principal_id)) {
      errors.push(`${label}: tema principal inexistente.`);
    }
    if (
      process.clasificacion.tema_secundario_ids.includes(
        process.clasificacion.tema_principal_id,
      )
    ) {
      errors.push(`${label}: el tema principal está repetido como secundario.`);
    }
    if (
      new Set(process.clasificacion.tema_secundario_ids).size !==
      process.clasificacion.tema_secundario_ids.length
    ) {
      errors.push(`${label}: hay temas secundarios duplicados.`);
    }
    if (
      new Set(process.clasificacion.subtema_ids).size !==
      process.clasificacion.subtema_ids.length
    ) {
      errors.push(`${label}: hay subtemas duplicados.`);
    }
    for (const id of process.clasificacion.tema_secundario_ids) {
      if (!themeIds.has(id)) errors.push(`${label}: tema secundario inexistente (${id}).`);
    }
    for (const id of process.clasificacion.subtema_ids) {
      if (!subthemeIds.has(id)) errors.push(`${label}: subtema inexistente (${id}).`);
    }
    for (const id of process.clasificacion.actor_ids) {
      if (!actorIds.has(id)) errors.push(`${label}: actor inexistente (${id}).`);
    }
    const topicCount = unique([
      process.clasificacion.tema_principal_id,
      ...process.clasificacion.tema_secundario_ids,
      ...process.clasificacion.subtema_ids,
    ]).length;
    if (topicCount > 3) {
      warnings.push(
        `${label}: ${topicCount} clasificaciones temáticas; revisar legibilidad editorial.`,
      );
    }
    for (const id of process.fuente_ids) {
      if (!sourceIds.has(id)) errors.push(`${label}: fuente inexistente (${id}).`);
    }
    for (const signal of process.senales) {
      if (!signal.fuente_ids.length) errors.push(`${label} / ${signal.titulo}: señal sin fuente.`);
      for (const id of signal.fuente_ids) {
        if (!sourceIds.has(id)) errors.push(`${label} / ${signal.titulo}: fuente inexistente (${id}).`);
      }
      if (signal.propietario_macroevento_id && signal.propietario_macroevento_id !== process.macroevento_id) errors.push(`${label} / ${signal.titulo}: propietario canónico incoherente.`);
      if (signalOwners.has(signal.senal_id)) errors.push(`${label} / ${signal.titulo}: ID de señal duplicado globalmente.`);
      signalOwners.set(signal.senal_id, process.macroevento_id);
    }
    if (process.publicacion.estado === 'publicado') {
      if (!process.por_que_importa) errors.push(`${label}: un proceso publicado requiere “por qué importa”.`);
      if (!process.senales.length) errors.push(`${label}: un proceso publicado requiere señales.`);
      if (!process.fuente_ids.length) errors.push(`${label}: un proceso publicado requiere fuentes.`);
    } else if (!options.allowDrafts && !options.allowDevelopment) {
      errors.push(`${label}: el paquete público contiene un proceso no publicado.`);
    }
  }

  const processById = new Map((data?.procesos || []).map((process) => [process.macroevento_id, process]));
  for (const process of data?.procesos || []) {
    const label = process.titulo || process.macroevento_id;
    const rectorIds = rectorIdsFor(process);
    if (process.es_macroevento_rector && rectorIds.length) errors.push(`${label}: un macroevento rector no puede depender de otro rector.`);
    for (const rectorId of rectorIds) {
      if (rectorId === process.macroevento_id) errors.push(`${label}: no puede ser su propio macroevento rector.`);
      if (!processById.has(rectorId)) errors.push(`${label}: macroevento rector inexistente (${rectorId}).`);
      if (processById.has(rectorId) && !processById.get(rectorId).es_macroevento_rector) {
        errors.push(`${label}: el macroevento de destino no está marcado como rector (${rectorId}).`);
      }
    }
    const relatedIds = process.macroevento_relacionado_ids || [];
    if (new Set(relatedIds).size !== relatedIds.length) errors.push(`${label}: hay macroeventos relacionados duplicados.`);
    for (const relatedId of relatedIds) {
      if (relatedId === process.macroevento_id) errors.push(`${label}: no puede relacionarse consigo mismo.`);
      else if (!processById.has(relatedId)) errors.push(`${label}: macroevento relacionado inexistente (${relatedId}).`);
    }
    const relationIds = new Set();
    for (const relation of process.relaciones_tipadas || []) {
      if (!relation.relacion_id || relationIds.has(relation.relacion_id)) errors.push(`${label}: relación tipada ausente o duplicada.`);
      relationIds.add(relation.relacion_id);
      if (!processById.has(relation.origen_id) || !processById.has(relation.destino_id)) errors.push(`${label}: relación tipada con extremo inexistente.`);
      if (![relation.origen_id, relation.destino_id].includes(process.macroevento_id)) errors.push(`${label}: relación tipada ajena al proceso.`);
      if (!['subordinada', 'relacionada', 'amplificadora', 'contenedora', 'contextual', 'coincidente'].includes(relation.tipo)) errors.push(`${label}: tipo de relación inválido (${relation.tipo}).`);
      if (!relation.mecanismo) errors.push(`${label}: relación tipada sin mecanismo.`);
      for (const signalId of relation.evidencia_senal_ids || []) if (!signalOwners.has(signalId)) errors.push(`${label}: relación con evidencia inexistente (${signalId}).`);
    }
    for (const reference of process.referencias_senal || []) {
      if (!signalOwners.has(reference.senal_id)) errors.push(`${label}: referencia transversal inexistente (${reference.senal_id}).`);
      if (signalOwners.get(reference.senal_id) === process.macroevento_id) errors.push(`${label}: referencia transversal apunta a una señal propia (${reference.senal_id}).`);
      if (!reference.efecto_segundo_orden) errors.push(`${label}: referencia transversal sin efecto de segundo orden.`);
    }
  }

  for (const source of data?.fuentes || []) {
    if (!source.fuente_id || !source.titulo || !source.url) {
      errors.push(`Fuente incompleta: ${source.fuente_id || '(sin ID)'}.`);
    }
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:') warnings.push(`${source.fuente_id}: URL no HTTPS.`);
    } catch {
      errors.push(`${source.fuente_id}: URL inválida.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
