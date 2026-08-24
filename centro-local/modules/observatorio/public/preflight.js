export const TRACE_STEPS = [
  [1, 'Propuesta de macroevento'],
  [2, 'Registro del macroevento'],
  [3, 'Clasificación analítica'],
  [4, 'Señales estructuradas'],
  [5, 'Fuentes y catálogo de medios'],
  [6, 'Diversidad y cobertura'],
  [7, 'Puerta de verificación'],
  [8, 'Candidatura editorial'],
  [9, 'Expediente editorial'],
  [10, 'Prompt controlado'],
  [11, 'Borrador Markdown'],
  [12, 'Revisión editorial y factual'],
  [13, 'Markdown definitivo'],
];

const clean = (value) => String(value ?? '').trim();
const normalize = (value) => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

function unique(values) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function item(code, title, detail = '') {
  return { code, title, detail };
}

function mediaRecord(source, catalogById) {
  if (!source?.medio_catalogado || !source.media_id) return null;
  return catalogById.get(source.media_id) || null;
}

function diversityFor(sources, catalog) {
  const catalogById = new Map((catalog?.records || []).map((record) => [record.media_id, record]));
  const records = sources.map((source) => ({ source, media: mediaRecord(source, catalogById) }));
  const cataloged = records.filter(({ media }) => media);
  const uniqueMedia = unique(records.map(({ source }) => source.media_id || `externa:${normalize(source.medio)}`));
  const catalogedMedia = [...new Map(cataloged.map(({ media }) => [media.media_id, media])).values()];
  return {
    publications: sources.length,
    uniqueMedia: uniqueMedia.length,
    catalogedPublications: cataloged.length,
    catalogedMedia: catalogedMedia.length,
    regions: unique(catalogedMedia.map((media) => media.region)),
    families: unique(catalogedMedia.map((media) => media.familia)),
    perspectives: unique(catalogedMedia.map((media) => media.perspectiva)),
  };
}

function traceStep(number, status, note) {
  const definition = TRACE_STEPS.find(([step]) => step === number);
  return { number, title: definition?.[1] || `Paso ${number}`, status, note };
}

function traceFor({ event, blocks, warnings, metrics, assignments }) {
  const eventBlocks = blocks.filter((entry) => entry.code !== 'data-validation');
  const classificationComplete = Boolean(
    event.regiones?.length
    && event.categoria
    && event.tema_ids?.length
    && event.palabras_clave?.length,
  );
  const evidenceWarningCodes = new Set([
    'pending-sources',
    'pending-signals',
    'insufficient-verified-sources',
    'verified-source-concentration',
    'low-regional-diversity',
    'low-family-diversity',
    'low-perspective-diversity',
    'verification-pending',
  ]);
  const evidenceWarnings = warnings.filter((entry) => evidenceWarningCodes.has(entry.code));

  return [
    traceStep(1, 'done', 'El candidato ya existe como macroevento guardado.'),
    traceStep(2, eventBlocks.length ? 'blocked' : 'done', eventBlocks.length
      ? 'La ficha presenta bloqueos estructurales.'
      : 'ID, título, descripción, región y categoría están disponibles.'),
    traceStep(3, classificationComplete ? 'done' : 'attention', classificationComplete
      ? 'La clasificación permite recuperar el proceso.'
      : 'La clasificación está disponible, pero conserva metadatos opcionales pendientes.'),
    traceStep(4, !metrics.signals ? 'attention' : metrics.pendingSignals ? 'attention' : 'done', !metrics.signals
      ? 'No hay señales registradas.'
      : metrics.pendingSignals
        ? `${metrics.signals - metrics.pendingSignals}/${metrics.signals} señales no están pendientes.`
        : `${metrics.signals} señales disponibles sin pendientes.`),
    traceStep(5, !metrics.sources ? 'attention' : metrics.pendingSources ? 'attention' : 'done', !metrics.sources
      ? 'No hay fuentes registradas.'
      : `${metrics.verifiedSources}/${metrics.sources} fuentes verificadas; ${metrics.pendingSources} pendientes.`),
    traceStep(6, evidenceWarnings.length ? 'attention' : 'done', evidenceWarnings.length
      ? `${evidenceWarnings.length} advertencias de cobertura o suficiencia.`
      : 'La muestra no activa advertencias de cobertura.'),
    traceStep(7, event.estado_verificacion === 'verificado' && !evidenceWarnings.length ? 'done' : 'attention',
      event.estado_verificacion === 'verificado' && !evidenceWarnings.length
        ? 'La ficha registra verificación suficiente.'
        : 'La puerta permanece abierta; se puede continuar con justificación.'),
    traceStep(8, 'current', 'Proceso en evolución y Análisis completo están previstos por defecto.'),
    traceStep(9, assignments.length ? 'attention' : 'pending', assignments.length
      ? `Existe ${assignments.length === 1 ? 'un expediente editorial previo' : `${assignments.length} expedientes editoriales previos`}; todavía no fue incorporado a esta preparación.`
      : 'Se generará en una fase posterior.'),
    traceStep(10, 'pending', 'La generación del prompt corresponde a la Fase 4.'),
    traceStep(11, 'pending', 'Requiere copiar el prompt a ChatGPT y pegar la respuesta.'),
    traceStep(12, 'pending', 'Requiere una respuesta recibida y validada.'),
    traceStep(13, 'pending', 'El paquete para VS Code corresponde a la Fase 6.'),
  ];
}

export function runPreflight({
  eventId,
  data,
  catalog = {},
  config = {},
  validation = {},
  publicExpedients = {},
} = {}) {
  const blocks = [];
  const warnings = [];
  const information = [];
  const passed = [];
  const id = clean(eventId);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    blocks.push(item('invalid-data', 'Datos canónicos ilegibles', 'La respuesta del Observatorio no contiene un objeto JSON válido.'));
  }
  if (data?.schema_version !== 3) {
    blocks.push(item('invalid-schema', 'Esquema de datos incompatible', `Se esperaba el esquema interno schema_version 3 y se recibió ${data?.schema_version ?? 'ninguno'}.`));
  } else {
    passed.push('Esquema interno v3 reconocido.');
  }
  if (!Array.isArray(data?.macroeventos)) {
    blocks.push(item('invalid-event-list', 'Lista de macroeventos inválida', 'macroeventos debe ser una lista.'));
  }
  if (!id) blocks.push(item('missing-event-id', 'Falta macroevento_id', 'Abrí la preparación desde una ficha guardada.'));

  const matches = Array.isArray(data?.macroeventos)
    ? data.macroeventos.filter((event) => event?.id === id)
    : [];
  if (id && matches.length === 0) {
    blocks.push(item('missing-event', 'Macroevento no encontrado', `No existe un registro guardado con el ID “${id}”.`));
  }
  if (id && matches.length > 1) {
    blocks.push(item('duplicate-event', 'macroevento_id duplicado', `El ID “${id}” aparece ${matches.length} veces.`));
  }

  const event = matches[0] || null;
  if (!event) {
    return {
      status: 'blocked',
      event: null,
      blocks,
      warnings,
      information,
      passed,
      metrics: null,
      trace: TRACE_STEPS.map(([number, title]) => ({ number, title, status: 'blocked', note: 'No puede evaluarse sin un macroevento único.' })),
    };
  }

  const requiredFields = [
    ['titulo', 'título'],
    ['descripcion', 'descripción'],
    ['categoria', 'categoría'],
  ];
  for (const [field, label] of requiredFields) {
    if (!clean(event[field])) blocks.push(item(`missing-${field}`, `Falta ${label}`, `Completá ${label} en la ficha del macroevento.`));
  }
  if (!Array.isArray(event.regiones) || !event.regiones.length) {
    blocks.push(item('missing-regions', 'Falta región', 'La ficha requiere al menos una región.'));
  }

  const allEvents = data.macroeventos || [];
  const allSignals = allEvents.flatMap((entry) => entry.senales || []);
  const allSources = allEvents.flatMap((entry) => entry.fuentes || []);
  const duplicateSignalIds = unique((event.senales || [])
    .map((signal) => signal.id)
    .filter((signalId) => signalId && allSignals.filter((signal) => signal.id === signalId).length > 1));
  const duplicateSourceIds = unique((event.fuentes || [])
    .map((source) => source.id)
    .filter((sourceId) => sourceId && allSources.filter((source) => source.id === sourceId).length > 1));
  if (duplicateSignalIds.length) {
    blocks.push(item('duplicate-signals', 'IDs de señales duplicados', duplicateSignalIds.join(', ')));
  }
  if (duplicateSourceIds.length) {
    blocks.push(item('duplicate-sources', 'IDs de fuentes duplicados', duplicateSourceIds.join(', ')));
  }

  const globalValidationErrors = Array.isArray(validation?.errors) ? validation.errors : [];
  if (validation?.valid === false && globalValidationErrors.length) {
    blocks.push(item('data-validation', 'La base completa presenta errores estructurales', globalValidationErrors.slice(0, 3).join(' · ')));
  } else {
    passed.push('La validación estructural del Observatorio no informa errores.');
  }

  const sources = Array.isArray(event.fuentes) ? event.fuentes : [];
  const signals = Array.isArray(event.senales) ? event.senales : [];
  const sourceIds = new Set(sources.map((source) => source.id).filter(Boolean));
  const verifiedSources = sources.filter((source) => source.estado_verificacion === 'verificada');
  const pendingSources = sources.filter((source) => ['pendiente', 'revisada'].includes(source.estado_verificacion));
  const pendingSignals = signals.filter((signal) => signal.estado_revision === 'pendiente');
  const orphanSignals = signals.filter((signal) => !(signal.fuente_ids || []).length
    || (signal.fuente_ids || []).some((sourceId) => !sourceIds.has(sourceId)));
  const uncatalogedSources = sources.filter((source) => !source.medio_catalogado);
  const diversity = diversityFor(sources, catalog);
  const verifiedMedia = unique(verifiedSources.map((source) => source.media_id || normalize(source.medio)));
  const requiredVerified = Number(config.requiere_fuentes_para_validar || 2);
  const assignments = (data.expedientes_editoriales || [])
    .filter((assignment) => assignment.macroevento_ids?.includes(id));

  const metrics = {
    signals: signals.length,
    pendingSignals: pendingSignals.length,
    sources: sources.length,
    verifiedSources: verifiedSources.length,
    pendingSources: pendingSources.length,
    uncatalogedSources: uncatalogedSources.length,
    uniqueMedia: diversity.uniqueMedia,
    catalogedMedia: diversity.catalogedMedia,
    regions: diversity.regions.length,
    families: diversity.families.length,
    perspectives: diversity.perspectives.length,
    priorAssignments: assignments.length,
  };

  if (pendingSources.length) warnings.push(item(
    'pending-sources',
    `${pendingSources.length} ${pendingSources.length === 1 ? 'fuente pendiente' : 'fuentes pendientes'}`,
    'Podés continuar, pero las afirmaciones que dependan de ellas deben quedar fuera o identificarse como no verificadas.',
  ));
  if (pendingSignals.length) warnings.push(item(
    'pending-signals',
    `${pendingSignals.length} ${pendingSignals.length === 1 ? 'señal pendiente' : 'señales pendientes'}`,
    'Las señales pendientes no deben presentarse como hechos confirmados.',
  ));
  if (verifiedSources.length < requiredVerified) warnings.push(item(
    'insufficient-verified-sources',
    'Evidencia verificada insuficiente',
    `Hay ${verifiedSources.length} fuentes verificadas; la configuración recomienda al menos ${requiredVerified}.`,
  ));
  if (verifiedSources.length >= 2 && verifiedMedia.length < 2) warnings.push(item(
    'verified-source-concentration',
    'Fuentes verificadas concentradas',
    'La evidencia verificada depende de un solo medio o institución.',
  ));
  if (sources.length >= 3 && diversity.regions.length <= 1) warnings.push(item(
    'low-regional-diversity',
    'Poca diversidad regional',
    'Las fuentes catalogadas representan una sola región mediática o ninguna.',
  ));
  if (sources.length >= 3 && diversity.families.length <= 1) warnings.push(item(
    'low-family-diversity',
    'Poca diversidad de familias de fuentes',
    'La muestra catalogada depende de un solo tipo de fuente o no permite medirlo.',
  ));
  if (sources.length >= 3 && diversity.perspectives.length <= 1) warnings.push(item(
    'low-perspective-diversity',
    'Poca diversidad de perspectivas',
    'La muestra catalogada presenta una sola perspectiva geopolítica o ninguna.',
  ));
  if (orphanSignals.length) warnings.push(item(
    'signals-without-sources',
    'Señales sin evidencia vinculada',
    `${orphanSignals.length} ${orphanSignals.length === 1 ? 'señal no tiene' : 'señales no tienen'} una vinculación completa con fuentes del macroevento.`,
  ));
  if (event.estado_verificacion !== 'verificado') warnings.push(item(
    'verification-pending',
    'Puerta de verificación abierta',
    `El estado actual de la ficha es “${clean(event.estado_verificacion) || 'pendiente'}”.`,
  ));
  if (Number(event.evaluacion?.incertidumbre || 0) >= 4) warnings.push(item(
    'high-uncertainty',
    'Incertidumbre alta',
    `La evaluación registra incertidumbre ${event.evaluacion.incertidumbre}/5.`,
  ));

  const optionalMissing = [];
  if (!event.tema_ids?.length) optionalMissing.push('temas internos');
  if (!event.palabras_clave?.length) optionalMissing.push('palabras clave');
  if (!event.indicadores?.length) optionalMissing.push('indicadores');
  if (optionalMissing.length) warnings.push(item(
    'optional-metadata',
    'Metadatos opcionales incompletos',
    optionalMissing.join(', '),
  ));

  const priorPublication = publicExpedients?.by_event?.[id];
  if (priorPublication) information.push(item(
    'prior-publication',
    'Existe una publicación vinculada',
    `Estado: ${clean(priorPublication.estado) || 'sin determinar'}${priorPublication.actualizado_el ? ` · Actualizada: ${priorPublication.actualizado_el}` : ''}.`,
  ));
  if (assignments.length) information.push(item(
    'prior-assignments',
    assignments.length === 1 ? 'Existe un expediente editorial previo' : `Existen ${assignments.length} expedientes editoriales previos`,
    'Podrá reutilizarse o adaptarse en una fase posterior; no se considera aprobado automáticamente.',
  ));
  if (uncatalogedSources.length) information.push(item(
    'uncataloged-sources',
    `${uncatalogedSources.length} ${uncatalogedSources.length === 1 ? 'fuente no catalogada' : 'fuentes no catalogadas'}`,
    unique(uncatalogedSources.map((source) => source.medio || source.titulo)).join(' · '),
  ));

  if (sources.length) passed.push(`${sources.length} fuentes están vinculadas al macroevento.`);
  if (signals.length && !orphanSignals.length) passed.push('Todas las señales tienen fuentes válidas vinculadas.');
  if (verifiedSources.length >= requiredVerified) passed.push(`Se supera el mínimo de ${requiredVerified} fuentes verificadas configurado.`);
  passed.push('La ruta canónica fue leída sin escribir archivos.');

  const trace = traceFor({ event, blocks, warnings, metrics, assignments });
  return {
    status: blocks.length ? 'blocked' : warnings.length ? 'warnings' : 'ready',
    event,
    blocks,
    warnings,
    information,
    passed,
    metrics,
    trace,
  };
}
