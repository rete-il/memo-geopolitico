export const CANDIDATE_FORMAT_VERSION = 2;
export const SUPPORTED_CANDIDATE_FORMAT_VERSIONS = new Set([1, 2]);
const MAX_CANDIDATE_INPUT_CHARS = 5_000_000;

const PROCESS_TYPES = new Set([
  'evento_puntual',
  'tendencia_recurrente',
  'tendencia_estructural',
  'macroproceso_emergente',
  'macroproceso_en_maduracion',
  'macroproceso_estructural',
]);

const SCORE_FIELDS = [
  'impacto',
  'probabilidad',
  'alcance',
  'persistencia',
  'propagacion',
  'subcobertura',
  'incertidumbre',
  'urgencia',
  'cobertura_observada',
];

const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

export const candidateSlug = (value) => normalizeText(value)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'item';

function categoryId(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function text(value, max = 30000) {
  return String(value ?? '').trim().slice(0, max);
}

function first(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function stringArray(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => {
      if (item && typeof item === 'object') return text(first(item.nombre, item.titulo, item.valor, item.id), 500);
      return text(item, 500);
    }).filter(Boolean))];
  }
  if (typeof value === 'string') {
    return [...new Set(value.split(/\r?\n|,\s*/).map((item) => text(item, 500)).filter(Boolean))];
  }
  return [];
}

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function optionalNumber(value, min, max) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

function uniqueId(base, reserved) {
  const root = candidateSlug(base);
  let result = root;
  let suffix = 2;
  while (reserved.has(result)) result = `${root}-${suffix++}`;
  reserved.add(result);
  return result;
}

function validDate(value) {
  const date = text(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

function directUrl(value) {
  const raw = text(value, 3000);
  if (!raw) return '';
  const markdown = raw.match(/^\[[\s\S]*\]\((https?:\/\/[\s\S]+)\)$/i);
  return markdown ? markdown[1].trim() : raw;
}

function canonicalUrl(value) {
  const raw = directUrl(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString();
  } catch {
    return '';
  }
}

function domainOf(value) {
  const canonical = canonicalUrl(value);
  if (!canonical) return '';
  return new URL(canonical).hostname.replace(/^www\./, '');
}

function tokenSimilarity(left, right) {
  const stop = new Set(['a', 'al', 'ante', 'como', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'un', 'una', 'y']);
  const tokens = (value) => new Set(normalizeText(value).split(/[^a-z0-9]+/).filter((item) => item.length > 2 && !stop.has(item)));
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / (a.size + b.size - intersection);
}

function unwrapJsonText(raw) {
  let value = String(raw ?? '').trim();
  if (value.length > MAX_CANDIDATE_INPUT_CHARS) {
    throw new Error(`La respuesta supera el máximo admitido de ${MAX_CANDIDATE_INPUT_CHARS.toLocaleString('es-AR')} caracteres.`);
  }
  const fenced = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) value = fenced[1].trim();
  return value;
}

export function parseCandidateText(raw) {
  const input = unwrapJsonText(raw);
  if (!input) throw new Error('Pegá una respuesta JSON o cargá un archivo .json.');
  let payload;
  try {
    payload = JSON.parse(input);
  } catch (error) {
    throw new Error(`El JSON no se puede leer: ${error.message}`);
  }
  if (!Array.isArray(payload) && payload?.formato && payload.formato !== 'observatorio-candidatos') {
    throw new Error(`Formato no compatible: ${payload.formato}.`);
  }
  if (!Array.isArray(payload) && payload?.schema_version && !SUPPORTED_CANDIDATE_FORMAT_VERSIONS.has(Number(payload.schema_version))) {
    throw new Error(`Versión de candidatos no compatible: ${payload.schema_version}.`);
  }
  const candidates = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.candidatos)
      ? payload.candidatos
      : Array.isArray(payload?.macroeventos)
        ? payload.macroeventos
        : payload?.titulo
          ? [payload]
          : null;
  if (!candidates) throw new Error('El JSON debe contener una lista “candidatos” o “macroeventos”.');
  if (!candidates.length) throw new Error('La respuesta no contiene candidatos.');
  return {
    metadata: Array.isArray(payload) ? {} : {
      formato: text(payload.formato, 100),
      schema_version: Number(payload.schema_version || 0) || null,
      generado_el: validDate(payload.generado_el),
      consulta: text(payload.consulta, 1000),
    },
    candidates,
  };
}

function taxonomyIndexes(taxonomy) {
  const byId = new Map();
  const byName = new Map();
  for (const category of taxonomy?.categorias || []) {
    for (const topic of category.temas || []) {
      const enriched = { ...topic, categoria_nombre: category.nombre };
      byId.set(Number(topic.id), enriched);
      const names = [topic.nombre, topic.slug].map(normalizeText).filter(Boolean);
      for (const name of names) {
        const list = byName.get(name) || [];
        list.push(enriched);
        byName.set(name, list);
      }
    }
  }
  return { byId, byName };
}

function catalogIndexes(catalog) {
  const byId = new Map();
  const byName = new Map();
  const byDomain = new Map();
  for (const record of catalog?.records || []) {
    byId.set(record.media_id, record);
    const name = normalizeText(record.nombre);
    if (name) {
      const list = byName.get(name) || [];
      list.push(record);
      byName.set(name, list);
    }
    const domain = domainOf(record.url);
    if (domain) {
      const list = byDomain.get(domain) || [];
      list.push(record);
      byDomain.set(domain, list);
    }
  }
  return { byId, byName, byDomain };
}

function matchCatalogSource(source, indexes) {
  const explicit = text(source.media_id, 200);
  if (explicit && indexes.byId.has(explicit)) return indexes.byId.get(explicit);
  const nameMatches = indexes.byName.get(normalizeText(first(source.medio, source.fuente, source.institucion))) || [];
  if (nameMatches.length === 1) return nameMatches[0];
  const domainMatches = indexes.byDomain.get(domainOf(source.url)) || [];
  return domainMatches.length === 1 ? domainMatches[0] : null;
}

function normalizeSource(source, eventId, sourceIndex, context, warnings, errors) {
  const originalId = candidateSlug(first(source.id, `fuente-${sourceIndex + 1}`));
  const id = uniqueId(first(source.id, `src-${eventId}-${String(sourceIndex + 1).padStart(3, '0')}`), context.reservedSourceIds);
  const rawUrl = directUrl(first(source.url, source.enlace));
  const canonical = canonicalUrl(rawUrl);
  if (rawUrl && !canonical) errors.push(`Fuente ${sourceIndex + 1}: URL inválida.`);
  if (canonical && new URL(canonical).protocol !== 'https:') errors.push(`Fuente ${sourceIndex + 1}: la URL debe usar HTTPS.`);
  if (!rawUrl) warnings.push(`Fuente ${sourceIndex + 1}: no tiene URL.`);
  const matched = matchCatalogSource({ ...source, url: rawUrl }, context.catalogIndexes);
  const medium = text(first(source.medio, source.fuente, source.institucion, matched?.nombre), 300);
  if (!medium) errors.push(`Fuente ${sourceIndex + 1}: falta el nombre del medio o institución.`);
  const title = text(first(source.titulo, source.titulo_publicacion), 1000);
  if (!title) warnings.push(`Fuente ${sourceIndex + 1}: falta el título de la publicación.`);
  return {
    originalId,
    value: {
      id,
      media_id: matched?.media_id || '',
      medio_catalogado: Boolean(matched),
      medio: medium,
      titulo: title,
      fecha: validDate(first(source.fecha, source.fecha_publicacion)),
      idioma: text(source.idioma, 100),
      tipo: text(first(source.tipo, source.tipo_publicacion), 200),
      url: rawUrl,
      estado_verificacion: 'pendiente',
      observaciones: text(source.observaciones),
      revisada_el: '',
    },
  };
}

function normalizeSignal(signal, eventId, signalIndex, sourceMap, context, warnings) {
  const requestedSources = stringArray(first(signal.fuente_ids, signal.fuentes));
  const mappedSources = requestedSources.map((id) => sourceMap.get(candidateSlug(id))).filter(Boolean);
  if (requestedSources.length > mappedSources.length) {
    warnings.push(`Señal ${signalIndex + 1}: algunas referencias a fuentes no coinciden con las fuentes del candidato.`);
  }
  return {
    id: uniqueId(first(signal.id, `sig-${eventId}-${String(signalIndex + 1).padStart(3, '0')}`), context.reservedSignalIds),
    fecha: validDate(signal.fecha),
    titulo: text(signal.titulo, 500),
    tipo: text(signal.tipo, 200),
    descripcion: text(signal.descripcion),
    estado_revision: 'pendiente',
    origen: 'ia',
    fuente_ids: [...new Set(mappedSources)],
    intensidad: optionalNumber(signal.intensidad, 1, 5),
    localizaciones: Array.isArray(signal.localizaciones)
      ? signal.localizaciones.map((location) => {
        if (typeof location === 'string') {
          return {
            etiqueta: text(location, 300),
            pais: '',
            latitud: null,
            longitud: null,
          };
        }
        return {
          etiqueta: text(location?.etiqueta, 300),
          pais: text(location?.pais, 200),
          latitud: optionalNumber(location?.latitud, -90, 90),
          longitud: optionalNumber(location?.longitud, -180, 180),
        };
      }).filter((location) => location.etiqueta || location.pais || location.latitud !== null || location.longitud !== null)
      : [],
  };
}

function resolveTopics(raw, taxonomy, warnings) {
  const resolved = new Set();
  const unknown = [];
  for (const rawId of Array.isArray(raw.tema_ids) ? raw.tema_ids : []) {
    const id = Number(rawId);
    if (Number.isInteger(id) && taxonomy.byId.has(id)) resolved.add(id);
    else unknown.push(String(rawId));
  }
  for (const name of stringArray(first(raw.temas_internos, raw.temas))) {
    const matches = taxonomy.byName.get(normalizeText(name)) || [];
    if (matches.length === 1) resolved.add(Number(matches[0].id));
    else unknown.push(name);
  }
  if (unknown.length) warnings.push(`Temas internos sin coincidencia exacta: ${unknown.join(' · ')}.`);
  return { ids: [...resolved].sort((a, b) => a - b), unknown };
}

function suggestedAction(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_');
  if (['nuevo', 'new'].includes(normalized)) return 'new';
  if (['actualizacion', 'actualización', 'update', 'actualizar'].includes(normalized)) return 'update';
  if (['sin_novedad', 'sin_novedades', 'no_change'].includes(normalized)) return 'no_change';
  if (['relacionado', 'related'].includes(normalized)) return 'related';
  if (['compuesto', 'composite'].includes(normalized)) return 'composite';
  return '';
}

function evolutionType(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_');
  const allowed = new Set([
    'continuidad',
    'avance',
    'aceleracion',
    'bloqueo',
    'retraso',
    'desescalamiento',
    'reversion',
    'cambio_alcance',
    'cambio_actores',
    'contradiccion',
    'sin_novedad',
  ]);
  return allowed.has(normalized) ? normalized : '';
}

function normalizeCandidate(raw, index, context) {
  const errors = [];
  const warnings = [];
  const title = text(first(raw.titulo, raw.nombre, raw.nombre_proceso), 1000);
  const id = candidateSlug(first(raw.id, title, `macroevento-${index + 1}`));
  const regions = stringArray(first(raw.regiones, raw.region));
  const category = categoryId(first(raw.categoria, raw.tema_principal));
  const description = text(first(raw.descripcion, raw.explicacion_estrategica));
  const type = text(first(raw.tipo_proceso, raw.tipo, 'macroproceso_emergente'), 100);
  const topics = resolveTopics(raw, context.taxonomyIndexes, warnings);
  const rawSources = Array.isArray(raw.fuentes) ? raw.fuentes : [];
  const sourceMap = new Map();
  const sources = rawSources.map((source, sourceIndex) => {
    const normalized = normalizeSource(source || {}, id, sourceIndex, context, warnings, errors);
    sourceMap.set(normalized.originalId, normalized.value.id);
    return normalized.value;
  });
  const rawSignals = Array.isArray(raw.senales) ? raw.senales : [];
  const signals = rawSignals.map((signal, signalIndex) => normalizeSignal(signal || {}, id, signalIndex, sourceMap, context, warnings));
  const horizon = raw.horizonte || {};
  const minYears = Number(first(horizon.min_anios, raw.horizonte_min_anios, context.config.horizonte_minimo_anios, 3));
  const maxYears = Number(first(horizon.max_anios, raw.horizonte_max_anios, context.config.horizonte_maximo_anios, 10));
  const scenarios = raw.escenarios || {};
  const evaluation = raw.evaluacion || {};
  const missingScores = SCORE_FIELDS.filter((field) => !Number.isFinite(Number(evaluation[field])));
  if (missingScores.length) warnings.push(`Evaluación incompleta: ${missingScores.join(', ')} quedan provisionalmente en 3/5.`);
  const value = {
    id,
    titulo: title,
    tipo_proceso: PROCESS_TYPES.has(type) ? type : 'macroproceso_emergente',
    estado_editorial: 'borrador',
    estado_verificacion: 'pendiente',
    fecha_corte: validDate(first(raw.fecha_corte, raw.fecha)) || context.importedAt,
    regiones: regions,
    categoria: category,
    tema_ids: topics.ids,
    clasificacion_tematica: {
      origen: 'ia',
      estado_revision: 'pendiente',
      taxonomy_version: Number(context.taxonomy.schema_version || 1),
      revisada_el: null,
    },
    descripcion: description,
    senales: signals,
    actores: stringArray(first(raw.actores, raw.actores_relevantes)),
    intereses: stringArray(first(raw.intereses, raw.intereses_en_juego)),
    horizonte: {
      min_anios: Number.isFinite(minYears) ? minYears : 3,
      max_anios: Number.isFinite(maxYears) ? maxYears : 10,
    },
    escenarios: {
      base: text(first(scenarios.base, raw.escenario_base)),
      adverso: text(first(scenarios.adverso, raw.escenario_adverso)),
      transformador: text(first(scenarios.transformador, raw.escenario_transformador)),
    },
    indicadores: stringArray(first(raw.indicadores, raw.variables_seguimiento)),
    evaluacion: Object.fromEntries([
      ...SCORE_FIELDS.map((field) => [field, numberInRange(evaluation[field], 3, 1, 5)]),
      ['confianza', text(evaluation.confianza || 'media', 40)],
    ]),
    palabras_clave: stringArray(first(raw.palabras_clave, raw.terminos_busqueda)),
    fuentes: sources,
    importacion: {
      origen: 'chatgpt',
      formato_version: CANDIDATE_FORMAT_VERSION,
      lote_id: context.batchId,
      importado_el: context.importedAt,
    },
  };

  if (!title) errors.push('Falta el título.');
  if (!description) errors.push('Falta la descripción estratégica.');
  if (!regions.length) errors.push('Falta al menos una región.');
  if (!category) errors.push('Falta la categoría interna.');
  if (!PROCESS_TYPES.has(type)) warnings.push(`Tipo de proceso “${type}” no reconocido; se usará macroproceso_emergente.`);
  if (!Number.isFinite(minYears) || !Number.isFinite(maxYears) || minYears > maxYears) errors.push('El horizonte temporal es inválido.');
  if (!sources.length) warnings.push('No contiene publicaciones; se importará sin fuentes.');
  if (!signals.length) warnings.push('No contiene señales; se importará sin señales.');
  if (!value.indicadores.length) warnings.push('No contiene indicadores de seguimiento.');

  return {
    index,
    raw,
    value,
    errors,
    warnings,
    duplicates: [],
    matches: [],
    classification: {
      suggested_action: suggestedAction(first(raw.accion_sugerida, raw.tratamiento_sugerido, raw.clasificacion)),
      target_id: candidateSlug(first(raw.macroevento_existente_id, raw.macroevento_id, '')) === 'item'
        ? ''
        : candidateSlug(first(raw.macroevento_existente_id, raw.macroevento_id, '')),
      evolution_type: evolutionType(first(raw.tipo_evolucion, raw.evolucion)),
      justification: text(first(raw.justificacion_tratamiento, raw.justificacion_clasificacion), 2000),
      proposed_changes: raw.cambios_propuestos && typeof raw.cambios_propuestos === 'object'
        ? raw.cambios_propuestos
        : {},
    },
    action: 'review',
    target_id: '',
    update_plan: null,
    blocked: false,
    selected: false,
  };
}

function duplicateLabel(type, event) {
  if (type === 'id') return `ID ya existente: ${event.id}`;
  if (type === 'title') return `Título ya existente: ${event.titulo}`;
  if (type === 'similar') return `Título parecido a “${event.titulo}”`;
  return `Comparte una publicación con “${event.titulo}”`;
}

function sourceIdentity(source) {
  const url = canonicalUrl(source.url);
  if (url) return `url:${url}`;
  const fallback = normalizeText([source.medio, source.titulo, source.fecha].join('|'));
  return fallback ? `meta:${fallback}` : '';
}

function matchingExistingSource(source, event) {
  const identity = sourceIdentity(source);
  if (!identity) return null;
  return (event.fuentes || []).find((item) => sourceIdentity(item) === identity) || null;
}

function matchingExistingSignal(signal, event) {
  const normalizedTitle = normalizeText(signal.titulo);
  return (event.senales || []).find((item) => {
    if (signal.id && item.id === signal.id) return true;
    if (normalizedTitle && normalizeText(item.titulo) === normalizedTitle && (!signal.fecha || !item.fecha || signal.fecha === item.fecha)) return true;
    const similarity = tokenSimilarity(`${signal.titulo} ${signal.descripcion}`, `${item.titulo} ${item.descripcion}`);
    return similarity >= 0.84 && (!signal.fecha || !item.fecha || signal.fecha === item.fecha);
  }) || null;
}

function overlapRatio(left = [], right = []) {
  const a = new Set(left.map((item) => normalizeText(item)).filter(Boolean));
  const b = new Set(right.map((item) => normalizeText(item)).filter(Boolean));
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((item) => b.has(item)).length;
  return shared / Math.min(a.size, b.size);
}

function anchorTokens(value) {
  const ignored = new Set([
    'acceso', 'alternativa', 'columna', 'competencia', 'conversion', 'corredor', 'corredores',
    'desarrollo', 'doble', 'energia', 'estrategica', 'estrategico', 'eje', 'emergente',
    'europea', 'europeo', 'global', 'infraestructura', 'internacional', 'logistica', 'maduracion',
    'maritima', 'maritimo', 'movilidad', 'nuevo', 'nueva', 'parcial', 'presion', 'proyecto',
    'regional', 'ruta', 'rutas', 'sistema', 'supervivencia', 'hacia', 'occidental', 'oriental',
    'norte', 'noreste', 'noroeste', 'sur', 'sudeste', 'suroeste', 'guerra', 'sancion',
    'china', 'chino', 'estados', 'europa', 'india', 'rusia', 'union',
  ]);
  const aliases = new Map([
    ['middle', 'medio'],
    ['transcaspiano', 'caspio'],
    ['transcaspiana', 'caspio'],
    ['articos', 'artico'],
    ['arctica', 'artico'],
  ]);
  return new Set(normalizeText(value).split(/[^a-z0-9]+/).map((token) => {
    let result = aliases.get(token) || token;
    if (result.length > 5 && result.endsWith('es')) result = result.slice(0, -2);
    else if (result.length > 4 && result.endsWith('s')) result = result.slice(0, -1);
    return aliases.get(result) || result;
  }).filter((token) => token.length > 3 && !ignored.has(token)));
}

function anchorOverlap(left, right) {
  const a = anchorTokens(left);
  const b = anchorTokens(right);
  if (!a.size || !b.size) return { score: 0, shared: [] };
  const shared = [...a].filter((token) => b.has(token));
  if (!shared.length) return { score: 0, shared };
  let score = shared.length / Math.min(a.size, b.size);
  if (shared.length === 1 && shared[0].length >= 5) score = Math.max(score, 0.58);
  return { score, shared };
}

function eventMatch(candidate, event, explicitTargetId = '') {
  const idExact = candidate.id === event.id;
  const titleExact = normalizeText(candidate.titulo) === normalizeText(event.titulo);
  const titleScore = tokenSimilarity(candidate.titulo, event.titulo);
  const anchors = anchorOverlap(`${candidate.id} ${candidate.titulo}`, `${event.id} ${event.titulo}`);
  const sharedSources = candidate.fuentes.filter((source) => matchingExistingSource(source, event)).length;
  const topicOverlap = overlapRatio(candidate.tema_ids, event.tema_ids);
  const regionOverlap = overlapRatio(candidate.regiones, event.regiones);
  const contextAnchors = anchorOverlap(
    [candidate.id, candidate.titulo, ...(candidate.regiones || []), ...(candidate.actores || []), ...(candidate.palabras_clave || [])].join(' '),
    [event.id, event.titulo, ...(event.regiones || []), ...(event.actores || []), ...(event.palabras_clave || [])].join(' '),
  );
  const contextualTitleAnchors = anchorOverlap(
    [candidate.id, candidate.titulo, ...(candidate.regiones || []), ...(candidate.actores || []), ...(candidate.palabras_clave || [])].join(' '),
    `${event.id} ${event.titulo}`,
  );
  let score = Math.min(0.96,
    Math.max(titleScore * 0.7, anchors.score * 0.72)
    + Math.min(0.24, sharedSources * 0.12)
    + topicOverlap * 0.08
    + regionOverlap * 0.06
    + contextAnchors.score * 0.25
    + contextualTitleAnchors.score * 0.5);
  const reasons = [];
  if (explicitTargetId && explicitTargetId === event.id) {
    score = 1;
    reasons.push('ID existente indicado por la respuesta');
  }
  if (idExact) {
    score = 1;
    reasons.push('mismo ID');
  }
  if (titleExact) {
    score = 1;
    reasons.push('mismo título');
  }
  if (titleScore >= 0.45 && !titleExact) reasons.push(`${Math.round(titleScore * 100)} % de términos comunes en el título`);
  if (anchors.shared.length && !titleExact) reasons.push(`anclas compartidas: ${anchors.shared.join(', ')}`);
  if (contextualTitleAnchors.shared.length && !titleExact) reasons.push(`anclas contextuales: ${contextualTitleAnchors.shared.join(', ')}`);
  if (sharedSources) reasons.push(`${sharedSources} ${sharedSources === 1 ? 'publicación compartida' : 'publicaciones compartidas'}`);
  if (topicOverlap >= 0.5) reasons.push('temas internos coincidentes');
  if (regionOverlap >= 0.5) reasons.push('regiones coincidentes');
  return {
    event,
    score,
    reasons,
    shared_sources: sharedSources,
    contextual_title_shared: contextualTitleAnchors.shared,
  };
}

function arrayUnion(current = [], proposed = []) {
  const seen = new Set(current.map((item) => normalizeText(item)));
  return [...current, ...proposed.filter((item) => {
    const key = normalizeText(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  })];
}

function numberUnion(current = [], proposed = []) {
  return [...new Set([...current, ...proposed].map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

function meaningfullyDifferent(current, proposed, threshold = 0.7) {
  if (!text(proposed)) return false;
  if (!text(current)) return true;
  return tokenSimilarity(current, proposed) < threshold;
}

function buildFieldChanges(candidate, target) {
  const changes = [];
  const add = (key, label, mode, current, proposed) => {
    changes.push({ key, label, mode, current, proposed, selected: false });
  };
  if (candidate.fecha_corte && candidate.fecha_corte > String(target.fecha_corte || '')) {
    add('fecha_corte', 'Fecha de corte', 'replace', target.fecha_corte, candidate.fecha_corte);
  }
  if (candidate.tipo_proceso && candidate.tipo_proceso !== target.tipo_proceso) {
    add('tipo_proceso', 'Tipo de proceso', 'replace', target.tipo_proceso, candidate.tipo_proceso);
  }
  if (candidate.categoria && candidate.categoria !== target.categoria) {
    add('categoria', 'Categoría', 'replace', target.categoria, candidate.categoria);
  }
  if (meaningfullyDifferent(target.descripcion, candidate.descripcion, 0.64)) {
    add('descripcion', 'Descripción estructural', 'replace', target.descripcion, candidate.descripcion);
  }
  const arrayFields = [
    ['regiones', 'Regiones'],
    ['actores', 'Actores'],
    ['intereses', 'Intereses'],
    ['indicadores', 'Indicadores'],
    ['palabras_clave', 'Palabras clave'],
  ];
  for (const [key, label] of arrayFields) {
    const proposed = arrayUnion(target[key] || [], candidate[key] || []);
    if (proposed.length > (target[key] || []).length) add(key, label, 'union', target[key] || [], proposed);
  }
  const proposedTopics = numberUnion(target.tema_ids || [], candidate.tema_ids || []);
  if (proposedTopics.length > (target.tema_ids || []).length) {
    add('tema_ids', 'Temas internos', 'union_numbers', target.tema_ids || [], proposedTopics);
  }
  if (JSON.stringify(candidate.horizonte) !== JSON.stringify(target.horizonte)) {
    add('horizonte', 'Horizonte temporal', 'replace', target.horizonte, candidate.horizonte);
  }
  for (const [key, label] of [['base', 'Escenario base'], ['adverso', 'Escenario adverso'], ['transformador', 'Escenario transformador']]) {
    if (meaningfullyDifferent(target.escenarios?.[key], candidate.escenarios?.[key], 0.68)) {
      add(`escenarios.${key}`, label, 'replace', target.escenarios?.[key] || '', candidate.escenarios?.[key] || '');
    }
  }
  if (JSON.stringify(candidate.evaluacion) !== JSON.stringify(target.evaluacion)) {
    add('evaluacion', 'Evaluación editorial', 'replace_evaluation', target.evaluacion, candidate.evaluacion);
  }
  return changes;
}

function buildUpdatePlan(candidate, target) {
  const sourceMap = new Map();
  const newSources = [];
  for (const source of candidate.fuentes || []) {
    const existing = matchingExistingSource(source, target);
    if (existing) sourceMap.set(source.id, existing.id);
    else {
      sourceMap.set(source.id, source.id);
      newSources.push({ value: source, selected: true });
    }
  }
  const newSignals = [];
  for (const signal of candidate.senales || []) {
    if (matchingExistingSignal(signal, target)) continue;
    const value = {
      ...signal,
      fuente_ids: [...new Set((signal.fuente_ids || []).map((id) => sourceMap.get(id)).filter(Boolean))],
    };
    newSignals.push({ value, selected: true });
  }
  return {
    target_id: target.id,
    new_sources: newSources,
    new_signals: newSignals,
    field_changes: buildFieldChanges(candidate, target),
  };
}

function assessCandidate(report, existingEvents, seen) {
  const normalizedTitle = normalizeText(report.value.titulo);
  const batchIdMatch = seen.ids.get(report.value.id);
  if (batchIdMatch !== undefined) report.errors.push(`ID repetido dentro del lote (candidato ${batchIdMatch + 1}).`);
  const batchTitleMatch = seen.titles.get(normalizedTitle);
  if (batchTitleMatch !== undefined) report.errors.push(`Título repetido dentro del lote (candidato ${batchTitleMatch + 1}).`);
  seen.ids.set(report.value.id, report.index);
  if (normalizedTitle) seen.titles.set(normalizedTitle, report.index);

  const explicitTarget = report.classification.target_id;
  if (explicitTarget && !existingEvents.some((event) => event.id === explicitTarget)) {
    report.warnings.push(`El ID existente sugerido “${explicitTarget}” no está en el Observatorio.`);
  }
  report.matches = existingEvents
    .map((event) => eventMatch(report.value, event, explicitTarget))
    .filter((match) => match.score >= 0.3)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const top = report.matches[0];
  const second = report.matches[1];
  const ambiguous = Boolean(top && second && top.score < 0.9 && top.score - second.score < 0.05);
  const exact = Boolean(top && top.score === 1);
  const confident = Boolean(top && (
    top.score >= 0.5
    || (!second && top.score >= 0.36 && top.contextual_title_shared?.length)
    || (report.classification.suggested_action === 'update' && top.score >= 0.42)
  ));
  const target = !ambiguous && (exact || confident) ? top.event : null;

  if (top) {
    report.duplicates.push({
      type: exact ? 'exact_match' : 'possible_match',
      blocking: false,
      detail: `${exact ? 'Coincide' : 'Posible coincidencia'} con “${top.event.titulo}” (${Math.round(top.score * 100)} %): ${top.reasons.join(', ') || 'similitud contextual'}.`,
    });
  }

  const titleLooksComposite = ((report.value.titulo.match(/\//g) || []).length >= 2 && /\sy\s/i.test(report.value.titulo));
  if (report.classification.suggested_action === 'composite' || titleLooksComposite) {
    report.action = 'composite';
    report.errors.push('El candidato está marcado como compuesto y debe separarse antes de importarlo.');
  } else if (target) {
    report.target_id = target.id;
    report.update_plan = buildUpdatePlan(report.value, target);
    const evidenceCount = report.update_plan.new_sources.length + report.update_plan.new_signals.length;
    if (!evidenceCount) {
      report.action = 'no_change';
      report.errors.push('Coincide con un macroevento existente y no aporta señales ni publicaciones nuevas.');
    } else if (report.classification.suggested_action === 'related' && !exact) {
      report.action = 'review';
      report.warnings.push('La respuesta lo considera relacionado; elegí si debe actualizar el expediente sugerido o crear un proceso autónomo.');
    } else {
      report.action = 'update';
      if (report.classification.suggested_action === 'no_change') {
        report.warnings.push('La respuesta indicó “sin novedad”, pero el control local detectó evidencia nueva; revisá la actualización.');
      }
    }
  } else if (top) {
    report.action = 'review';
    report.target_id = top.event.id;
    report.update_plan = buildUpdatePlan(report.value, top.event);
    report.warnings.push(ambiguous
      ? 'Hay más de una coincidencia posible; elegí el expediente correcto.'
      : 'La coincidencia no es concluyente; elegí entre crear o actualizar.');
  } else if (report.classification.suggested_action === 'update') {
    report.action = 'review';
    report.warnings.push('La respuesta propone una actualización, pero no se pudo resolver el macroevento de destino.');
  } else {
    report.action = 'new';
  }

  report.blocked = report.errors.length > 0 || ['composite', 'no_change'].includes(report.action);
  report.selected = false;
}

export function prepareCandidateBatch(parsed, options = {}) {
  const existingEvents = Array.isArray(options.existingEvents) ? options.existingEvents : [];
  const taxonomy = options.taxonomy || { categorias: [] };
  const catalog = options.catalog || { records: [] };
  const config = options.config || {};
  const importedAt = validDate(options.importedAt) || new Date().toISOString().slice(0, 10);
  const batchId = candidateSlug(first(options.batchId, parsed.metadata?.consulta, `lote-${importedAt}`));
  const reservedSourceIds = new Set(existingEvents.flatMap((event) => (event.fuentes || []).map((source) => source.id)));
  const reservedSignalIds = new Set(existingEvents.flatMap((event) => (event.senales || []).map((signal) => signal.id)));
  const context = {
    taxonomy,
    catalog,
    config,
    importedAt,
    batchId,
    taxonomyIndexes: taxonomyIndexes(taxonomy),
    catalogIndexes: catalogIndexes(catalog),
    reservedSourceIds,
    reservedSignalIds,
  };
  const reports = parsed.candidates.map((candidate, index) => normalizeCandidate(candidate || {}, index, context));
  const seen = { ids: new Map(), titles: new Map() };
  for (const report of reports) assessCandidate(report, existingEvents, seen);
  return {
    metadata: { ...parsed.metadata, batch_id: batchId, imported_at: importedAt },
    candidates: reports,
    summary: {
      total: reports.length,
      ready: reports.filter((item) => item.action === 'new' && !item.blocked).length,
      new: reports.filter((item) => item.action === 'new' && !item.blocked).length,
      updates: reports.filter((item) => item.action === 'update' && !item.blocked).length,
      review: reports.filter((item) => item.action === 'review' && !item.blocked).length,
      no_change: reports.filter((item) => item.action === 'no_change').length,
      composite: reports.filter((item) => item.action === 'composite').length,
      blocked: reports.filter((item) => item.blocked).length,
    },
  };
}

function assignPath(target, key, value) {
  if (!key.includes('.')) {
    target[key] = value;
    return;
  }
  const [parent, child] = key.split('.');
  target[parent] = { ...(target[parent] || {}), [child]: value };
}

export function configureCandidateAction(report, action, target = null) {
  if (!report || report.blocked) return report;
  if (action === 'new') {
    report.action = 'new';
    report.target_id = '';
    report.update_plan = null;
  } else if (action === 'update' && target) {
    report.action = 'update';
    report.target_id = target.id;
    report.update_plan = buildUpdatePlan(report.value, target);
  } else {
    report.action = 'review';
  }
  report.selected = false;
  return report;
}

export function applyCandidateDecisions(data, reports, {
  batchId = `lote-${new Date().toISOString().slice(0, 10)}`,
  importedAt = new Date().toISOString().slice(0, 10),
} = {}) {
  const next = JSON.parse(JSON.stringify(data));
  const applied = { new: 0, updates: 0, sources: 0, signals: 0, field_changes: 0 };
  for (const report of reports.filter((item) => item.selected && !item.blocked)) {
    if (report.action === 'new') {
      next.macroeventos.push(JSON.parse(JSON.stringify(report.value)));
      applied.new += 1;
      continue;
    }
    if (report.action !== 'update' || !report.target_id || !report.update_plan) continue;
    const target = next.macroeventos.find((event) => event.id === report.target_id);
    if (!target) throw new Error(`No se encontró el macroevento de destino ${report.target_id}.`);
    const selectedSources = report.update_plan.new_sources.filter((item) => item.selected).map((item) => JSON.parse(JSON.stringify(item.value)));
    const allowedSourceIds = new Set([...(target.fuentes || []).map((source) => source.id), ...selectedSources.map((source) => source.id)]);
    const selectedSignals = report.update_plan.new_signals.filter((item) => item.selected).map((item) => ({
      ...JSON.parse(JSON.stringify(item.value)),
      fuente_ids: (item.value.fuente_ids || []).filter((id) => allowedSourceIds.has(id)),
    }));
    target.fuentes = [...(target.fuentes || []), ...selectedSources];
    target.senales = [...(target.senales || []), ...selectedSignals];
    const appliedChanges = [];
    for (const change of report.update_plan.field_changes.filter((item) => item.selected)) {
      if (change.mode === 'replace_evaluation') {
        target.historial_evaluacion = [...(target.historial_evaluacion || []), {
          fecha: importedAt,
          lote_id: batchId,
          evaluacion: JSON.parse(JSON.stringify(target.evaluacion)),
        }];
      }
      assignPath(target, change.key, JSON.parse(JSON.stringify(change.proposed)));
      appliedChanges.push(change.key);
    }
    target.actualizaciones = [...(target.actualizaciones || []), {
      lote_id: batchId,
      actualizado_el: importedAt,
      origen: 'chatgpt',
      candidato_id: report.value.id,
      candidato_titulo: report.value.titulo,
      tipo_evolucion: report.classification.evolution_type || 'continuidad',
      justificacion: report.classification.justification,
      fuente_ids_agregadas: selectedSources.map((source) => source.id),
      senal_ids_agregadas: selectedSignals.map((signal) => signal.id),
      campos_modificados: appliedChanges,
    }];
    applied.updates += 1;
    applied.sources += selectedSources.length;
    applied.signals += selectedSignals.length;
    applied.field_changes += appliedChanges.length;
  }
  return { data: next, applied };
}

export function candidateExample() {
  return {
    formato: 'observatorio-candidatos',
    schema_version: CANDIDATE_FORMAT_VERSION,
    generado_el: 'AAAA-MM-DD',
    consulta: 'Descripción breve de la búsqueda realizada',
    candidatos: [{
      id: 'identificador-estable-del-proceso',
      titulo: 'Título descriptivo del macroevento',
      accion_sugerida: 'nuevo',
      macroevento_existente_id: '',
      tipo_evolucion: '',
      justificacion_tratamiento: 'Por qué es nuevo, actualización, sin novedad, relacionado o compuesto.',
      cambios_propuestos: {},
      tipo_proceso: 'macroproceso_emergente',
      fecha_corte: 'AAAA-MM-DD',
      regiones: ['Región principal'],
      categoria: 'categoria_interna',
      tema_ids: [],
      temas_internos: ['Nombre exacto del tema si se conoce'],
      descripcion: 'Explicación estratégica del proceso y de su relevancia a mediano o largo plazo.',
      actores: ['Actor relevante'],
      intereses: ['Interés en juego'],
      horizonte: { min_anios: 3, max_anios: 10 },
      escenarios: {
        base: 'Escenario base.',
        adverso: 'Escenario adverso.',
        transformador: 'Escenario transformador.',
      },
      indicadores: ['Variable observable de seguimiento'],
      palabras_clave: ['término de búsqueda'],
      evaluacion: {
        impacto: 3,
        probabilidad: 3,
        alcance: 3,
        persistencia: 3,
        propagacion: 3,
        subcobertura: 3,
        incertidumbre: 3,
        urgencia: 3,
        cobertura_observada: 3,
        confianza: 'media',
      },
      fuentes: [{
        id: 'fuente-1',
        medio: 'Medio o institución',
        titulo: 'Título de la publicación',
        fecha: 'AAAA-MM-DD',
        idioma: 'es',
        tipo: 'análisis',
        url: 'https://ejemplo.org/publicacion',
      }],
      senales: [{
        id: 'senal-1',
        fecha: 'AAAA-MM-DD',
        titulo: 'Señal observable',
        tipo: 'tipo_de_senal',
        descripcion: 'Qué ocurrió y por qué importa.',
        fuente_ids: ['fuente-1'],
        intensidad: null,
        localizaciones: [],
      }],
    }],
  };
}

export function candidateFormatInstructions() {
  return `INSTRUCCIONES DE SALIDA PARA IMPORTAR EN EL OBSERVATORIO

Devolvé únicamente JSON válido, sin Markdown, introducción ni comentarios.
Usá exactamente un objeto con:
- "formato": "observatorio-candidatos"
- "schema_version": ${CANDIDATE_FORMAT_VERSION}
- "generado_el": fecha AAAA-MM-DD
- "consulta": síntesis breve de la búsqueda
- "candidatos": lista de macroeventos

Condiciones editoriales:
1. Cada candidato debe ser un proceso geopolítico de mediano o largo plazo, no una noticia aislada.
2. No declares ningún dato como verificado. El Observatorio importará todo como borrador y pendiente.
3. Usá URLs HTTPS completas y publicaciones identificables.
4. Vinculá las señales con las fuentes mediante los IDs locales incluidos en el mismo candidato.
5. Las evaluaciones 1–5 son propuestas analíticas, no mediciones científicas.
6. Si no conocés un dato, usá una lista vacía, una cadena vacía o null; no lo inventes.
7. En "temas_internos", usá nombres exactos de la taxonomía solo cuando estén disponibles.
8. Compara cada candidato con el índice de macroeventos existentes incluido en el prompt.
9. Usa "accion_sugerida": "nuevo", "actualizacion", "sin_novedad", "relacionado" o "compuesto".
10. Si es una actualización, incluye el "macroevento_existente_id" exacto y conserva las nuevas señales y fuentes.
11. Usa "tipo_evolucion": "continuidad", "avance", "aceleracion", "bloqueo", "reversion", "cambio_alcance", "cambio_actores", "contradiccion" o "sin_novedad".
12. En "cambios_propuestos", incluye únicamente cambios materiales de los campos principales; no propongas simples reformulaciones.

ESTRUCTURA DE REFERENCIA
${JSON.stringify(candidateExample(), null, 2)}`;
}
