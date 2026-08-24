export const INTERNAL_SCHEMA_VERSION = 3;

export const WARNING_STATES = Object.freeze([
  'pendiente',
  'resuelta',
  'descartada',
]);

export const WARNING_TREATMENTS = Object.freeze([
  'bloqueante',
  'relevante',
  'observacion_posterior',
  'irrelevante',
]);

export const WARNING_PRIORITIES = Object.freeze([
  'alta',
  'media',
  'baja',
]);

export const WARNING_EXCEPTION_SCOPES = Object.freeze([
  'omitir_afirmacion',
  'reducir_alcance',
  'expresar_limitacion',
  'publicar_solo_proceso',
]);

export const WARNING_RESOLUTION_TYPES = Object.freeze([
  'evidencia',
  'decision_editorial',
]);

const ID_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const clean = (value) => String(value ?? '').trim();
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function issue(list, code, path, message) {
  list.push({ code, path, message });
}

function validTimestamp(value) {
  return typeof value === 'string'
    && value.trim() === value
    && value.length > 0
    && !Number.isNaN(Date.parse(value));
}

function validateId(value, { issues, code, path, label }) {
  if (!clean(value)) {
    issue(issues, `${code}.required`, path, `Falta ${label}.`);
    return;
  }
  if (typeof value !== 'string' || value !== clean(value) || !ID_PATTERN.test(value)) {
    issue(issues, `${code}.format`, path, `${label} debe usar minúsculas, números, guiones o guiones bajos.`);
  }
}

function validateEnum(value, allowed, { issues, code, path, label }) {
  if (!allowed.includes(value)) {
    issue(issues, code, path, `${label} inválido (${clean(value) || 'vacío'}).`);
  }
}

function validateTimestamp(value, { issues, code, path, label, nullable = false }) {
  if (nullable && (value === null || value === undefined)) return;
  if (!validTimestamp(value)) issue(issues, code, path, `${label} debe ser una fecha y hora ISO válida.`);
}

function validateStringList(value, { issues, code, path, label }) {
  if (!Array.isArray(value)) {
    issue(issues, `${code}.type`, path, `${label} debe ser una lista.`);
    return [];
  }
  const seen = new Set();
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== 'string' || !clean(entry) || entry !== clean(entry)) {
      issue(issues, `${code}.item`, `${path}[${index}]`, `${label} contiene un identificador vacío o inválido.`);
      continue;
    }
    if (seen.has(entry)) issue(issues, `${code}.duplicate`, `${path}[${index}]`, `${label} contiene el identificador duplicado ${entry}.`);
    seen.add(entry);
  }
  return value.filter((entry) => typeof entry === 'string' && clean(entry));
}

function sameStringSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  return [...left].sort().every((entry, index) => entry === [...right].sort()[index]);
}

function activeExceptionsFor(warning, exceptions, sessionId) {
  const id = clean(warning?.advertencia_id);
  const session = clean(sessionId);
  if (!id || !session) return [];
  return (Array.isArray(exceptions) ? exceptions : []).filter((entry) => (
    clean(entry?.advertencia_id) === id
    && clean(entry?.session_id) === session
    && WARNING_EXCEPTION_SCOPES.includes(entry?.alcance)
  ));
}

export function derivePromptInclusion(warning, { exceptions = [], sessionId = '' } = {}) {
  if (warning?.estado !== 'pendiente') return false;
  if (warning?.tratamiento === 'relevante') return true;
  if (warning?.tratamiento !== 'bloqueante') return false;
  const active = activeExceptionsFor(warning, exceptions, sessionId);
  return !active.some((entry) => entry.alcance === 'publicar_solo_proceso');
}

export function hasUnresolvedBlockingWarning(event, { sessionId = '' } = {}) {
  const exceptions = Array.isArray(event?.excepciones_advertencias)
    ? event.excepciones_advertencias
    : [];
  return (Array.isArray(event?.advertencias) ? event.advertencias : []).some((warning) => {
    if (warning?.estado !== 'pendiente' || warning?.tratamiento !== 'bloqueante') return false;
    return activeExceptionsFor(warning, exceptions, sessionId).length === 0;
  });
}

export function normalizeWarningContainers(event = {}) {
  return {
    advertencias: own(event, 'advertencias') ? clone(event.advertencias) : [],
    excepciones_advertencias: own(event, 'excepciones_advertencias')
      ? clone(event.excepciones_advertencias)
      : [],
  };
}

function validateResolution(resolution, { warning, sourceIds, issues, path }) {
  if (!isObject(resolution)) {
    issue(issues, 'warning.resolution.type', path, 'resolucion debe ser un objeto.');
    return;
  }
  validateEnum(resolution.tipo, WARNING_RESOLUTION_TYPES, {
    issues,
    code: 'warning.resolution.invalid_type',
    path: `${path}.tipo`,
    label: 'Tipo de resolución',
  });
  if (!clean(resolution.motivo)) issue(issues, 'warning.resolution.missing_reason', `${path}.motivo`, 'La resolución requiere motivo.');
  if (!clean(resolution.decidida_por)) issue(issues, 'warning.resolution.missing_actor', `${path}.decidida_por`, 'La resolución requiere decidida_por.');
  validateTimestamp(resolution.decidida_el, {
    issues,
    code: 'warning.resolution.invalid_timestamp',
    path: `${path}.decidida_el`,
    label: 'decidida_el',
  });
  const resolutionSourceIds = validateStringList(resolution.fuente_ids, {
    issues,
    code: 'warning.resolution.source_ids',
    path: `${path}.fuente_ids`,
    label: 'fuente_ids de la resolución',
  });
  for (const sourceId of resolutionSourceIds) {
    if (!sourceIds.has(sourceId)) issue(issues, 'warning.resolution.unknown_source', `${path}.fuente_ids`, `La resolución referencia una fuente inexistente (${sourceId}).`);
  }
  if (resolution.tipo === 'evidencia' && resolutionSourceIds.length === 0) {
    issue(issues, 'warning.resolution.evidence_without_sources', `${path}.fuente_ids`, 'Una resolución por evidencia requiere al menos una fuente.');
  }
  if (warning.estado === 'descartada' && resolution.tipo === 'evidencia') {
    issue(issues, 'warning.resolution.discarded_with_evidence', `${path}.tipo`, 'Una advertencia descartada debe registrar una decisión editorial, no una resolución por evidencia.');
  }
}

export function validateEventWarnings(event, { path = 'macroevento' } = {}) {
  const issues = [];
  const sourceIds = new Set((Array.isArray(event?.fuentes) ? event.fuentes : []).map((entry) => clean(entry?.id)).filter(Boolean));
  const signalIds = new Set((Array.isArray(event?.senales) ? event.senales : []).map((entry) => clean(entry?.id)).filter(Boolean));
  const warnings = event?.advertencias;
  const exceptions = event?.excepciones_advertencias;

  if (!Array.isArray(warnings)) issue(issues, 'event.warnings.type', `${path}.advertencias`, 'advertencias debe ser una lista.');
  if (!Array.isArray(exceptions)) issue(issues, 'event.exceptions.type', `${path}.excepciones_advertencias`, 'excepciones_advertencias debe ser una lista.');

  const warningIds = new Set();
  for (const [index, warning] of (Array.isArray(warnings) ? warnings : []).entries()) {
    const warningPath = `${path}.advertencias[${index}]`;
    if (!isObject(warning)) {
      issue(issues, 'warning.type', warningPath, 'La advertencia debe ser un objeto.');
      continue;
    }
    validateId(warning.advertencia_id, {
      issues,
      code: 'warning.id',
      path: `${warningPath}.advertencia_id`,
      label: 'advertencia_id',
    });
    if (warningIds.has(warning.advertencia_id)) issue(issues, 'warning.duplicate_id', `${warningPath}.advertencia_id`, `advertencia_id duplicado (${warning.advertencia_id}).`);
    if (clean(warning.advertencia_id)) warningIds.add(warning.advertencia_id);
    if (!clean(warning.descripcion)) issue(issues, 'warning.missing_description', `${warningPath}.descripcion`, 'La advertencia requiere descripción.');
    validateId(warning.tipo, {
      issues,
      code: 'warning.kind',
      path: `${warningPath}.tipo`,
      label: 'tipo',
    });
    validateEnum(warning.estado, WARNING_STATES, {
      issues,
      code: 'warning.invalid_state',
      path: `${warningPath}.estado`,
      label: 'Estado',
    });
    validateEnum(warning.tratamiento, WARNING_TREATMENTS, {
      issues,
      code: 'warning.invalid_treatment',
      path: `${warningPath}.tratamiento`,
      label: 'Tratamiento',
    });
    validateEnum(warning.prioridad, WARNING_PRIORITIES, {
      issues,
      code: 'warning.invalid_priority',
      path: `${warningPath}.prioridad`,
      label: 'Prioridad',
    });

    const linkedSignals = validateStringList(warning.signal_ids, {
      issues,
      code: 'warning.signal_ids',
      path: `${warningPath}.signal_ids`,
      label: 'signal_ids',
    });
    const linkedSources = validateStringList(warning.fuente_ids, {
      issues,
      code: 'warning.source_ids',
      path: `${warningPath}.fuente_ids`,
      label: 'fuente_ids',
    });
    const resolvedSources = validateStringList(warning.resuelta_con_fuente_ids, {
      issues,
      code: 'warning.resolved_source_ids',
      path: `${warningPath}.resuelta_con_fuente_ids`,
      label: 'resuelta_con_fuente_ids',
    });
    for (const signalId of linkedSignals) {
      if (!signalIds.has(signalId)) issue(issues, 'warning.unknown_signal', `${warningPath}.signal_ids`, `La advertencia referencia una señal inexistente (${signalId}).`);
    }
    for (const sourceId of [...linkedSources, ...resolvedSources]) {
      if (!sourceIds.has(sourceId)) issue(issues, 'warning.unknown_source', `${warningPath}.fuente_ids`, `La advertencia referencia una fuente inexistente (${sourceId}).`);
    }

    validateTimestamp(warning.creada_el, {
      issues,
      code: 'warning.invalid_created_at',
      path: `${warningPath}.creada_el`,
      label: 'creada_el',
    });
    validateTimestamp(warning.actualizada_el, {
      issues,
      code: 'warning.invalid_updated_at',
      path: `${warningPath}.actualizada_el`,
      label: 'actualizada_el',
    });
    if (validTimestamp(warning.creada_el) && validTimestamp(warning.actualizada_el)
      && Date.parse(warning.actualizada_el) < Date.parse(warning.creada_el)) {
      issue(issues, 'warning.updated_before_created', `${warningPath}.actualizada_el`, 'actualizada_el no puede ser anterior a creada_el.');
    }
    if (own(warning, 'notas_editoriales') && warning.notas_editoriales !== null && typeof warning.notas_editoriales !== 'string') {
      issue(issues, 'warning.invalid_notes', `${warningPath}.notas_editoriales`, 'notas_editoriales debe ser texto o null.');
    }
    if (own(warning, 'historial')) {
      if (!Array.isArray(warning.historial)) {
        issue(issues, 'warning.history.type', `${warningPath}.historial`, 'historial debe ser una lista.');
      } else {
        const historyIds = new Set();
        let previousTimestamp = 0;
        let latestHistoryTimestamp = 0;
        for (const [historyIndex, entry] of warning.historial.entries()) {
          const historyPath = `${warningPath}.historial[${historyIndex}]`;
          if (!isObject(entry)) {
            issue(issues, 'warning.history.item_type', historyPath, 'Cada entrada del historial debe ser un objeto.');
            continue;
          }
          validateId(entry.cambio_id, {
            issues,
            code: 'warning.history.id',
            path: `${historyPath}.cambio_id`,
            label: 'cambio_id',
          });
          if (historyIds.has(entry.cambio_id)) issue(issues, 'warning.history.duplicate_id', `${historyPath}.cambio_id`, `cambio_id duplicado (${entry.cambio_id}).`);
          if (clean(entry.cambio_id)) historyIds.add(entry.cambio_id);
          validateId(entry.accion, {
            issues,
            code: 'warning.history.action',
            path: `${historyPath}.accion`,
            label: 'accion del historial',
          });
          if (!clean(entry.detalle)) issue(issues, 'warning.history.missing_detail', `${historyPath}.detalle`, 'La entrada del historial requiere detalle.');
          if (!clean(entry.realizada_por)) issue(issues, 'warning.history.missing_actor', `${historyPath}.realizada_por`, 'La entrada del historial requiere realizada_por.');
          validateTimestamp(entry.realizada_el, {
            issues,
            code: 'warning.history.invalid_timestamp',
            path: `${historyPath}.realizada_el`,
            label: 'realizada_el',
          });
          if (validTimestamp(entry.realizada_el)) {
            const timestamp = Date.parse(entry.realizada_el);
            if (timestamp < previousTimestamp) issue(issues, 'warning.history.out_of_order', `${historyPath}.realizada_el`, 'El historial debe conservar orden cronológico ascendente.');
            if (validTimestamp(warning.creada_el) && timestamp < Date.parse(warning.creada_el)) issue(issues, 'warning.history.before_created', `${historyPath}.realizada_el`, 'Una decisión no puede ser anterior a la creación de la advertencia.');
            previousTimestamp = timestamp;
            latestHistoryTimestamp = Math.max(latestHistoryTimestamp, timestamp);
          }
        }
        if (latestHistoryTimestamp && validTimestamp(warning.actualizada_el)
          && latestHistoryTimestamp > Date.parse(warning.actualizada_el)) {
          issue(issues, 'warning.history.after_updated', `${warningPath}.actualizada_el`, 'actualizada_el no puede ser anterior a la última decisión del historial.');
        }
      }
    }

    if (own(warning, 'incluir_en_prompt')) {
      const derived = derivePromptInclusion(warning);
      if (typeof warning.incluir_en_prompt !== 'boolean' || warning.incluir_en_prompt !== derived) {
        issue(issues, 'warning.invalid_prompt_flag', `${warningPath}.incluir_en_prompt`, `incluir_en_prompt es derivado y debe ser ${derived}.`);
      }
    }

    if (warning.estado === 'resuelta') {
      validateTimestamp(warning.resuelta_el, {
        issues,
        code: 'warning.invalid_resolved_at',
        path: `${warningPath}.resuelta_el`,
        label: 'resuelta_el',
      });
      if (!isObject(warning.resolucion)) {
        issue(issues, 'warning.missing_resolution', `${warningPath}.resolucion`, 'Una advertencia resuelta requiere un objeto resolucion.');
      }
    } else if (warning.resuelta_el !== null && warning.resuelta_el !== undefined) {
      issue(issues, 'warning.unexpected_resolved_at', `${warningPath}.resuelta_el`, 'Solo una advertencia resuelta puede tener resuelta_el.');
    }
    if (warning.estado === 'pendiente' && warning.resolucion !== null && warning.resolucion !== undefined) {
      issue(issues, 'warning.pending_with_resolution', `${warningPath}.resolucion`, 'Una advertencia pendiente no puede tener resolucion.');
    }
    if (warning.resolucion !== null && warning.resolucion !== undefined) {
      validateResolution(warning.resolucion, {
        warning,
        sourceIds,
        issues,
        path: `${warningPath}.resolucion`,
      });
      if (warning.estado === 'resuelta' && validTimestamp(warning.resuelta_el)
        && validTimestamp(warning.resolucion?.decidida_el)
        && Date.parse(warning.resuelta_el) !== Date.parse(warning.resolucion.decidida_el)) {
        issue(issues, 'warning.resolution.timestamp_mismatch', `${warningPath}.resolucion.decidida_el`, 'resuelta_el debe coincidir con resolucion.decidida_el.');
      }
      if (warning.estado === 'resuelta'
        && !sameStringSet(resolvedSources, warning.resolucion?.fuente_ids)) {
        issue(issues, 'warning.resolution.source_mismatch', `${warningPath}.resuelta_con_fuente_ids`, 'resuelta_con_fuente_ids debe coincidir con resolucion.fuente_ids.');
      }
    }
  }

  const exceptionIds = new Set();
  for (const [index, exception] of (Array.isArray(exceptions) ? exceptions : []).entries()) {
    const exceptionPath = `${path}.excepciones_advertencias[${index}]`;
    if (!isObject(exception)) {
      issue(issues, 'exception.type', exceptionPath, 'La excepción debe ser un objeto.');
      continue;
    }
    validateId(exception.excepcion_id, {
      issues,
      code: 'exception.id',
      path: `${exceptionPath}.excepcion_id`,
      label: 'excepcion_id',
    });
    if (exceptionIds.has(exception.excepcion_id)) issue(issues, 'exception.duplicate_id', `${exceptionPath}.excepcion_id`, `excepcion_id duplicado (${exception.excepcion_id}).`);
    if (clean(exception.excepcion_id)) exceptionIds.add(exception.excepcion_id);
    if (!clean(exception.advertencia_id) || !warningIds.has(exception.advertencia_id)) {
      issue(issues, 'exception.unknown_warning', `${exceptionPath}.advertencia_id`, `La excepción referencia una advertencia inexistente (${clean(exception.advertencia_id) || 'vacía'}).`);
    }
    if (!clean(exception.session_id)) issue(issues, 'exception.missing_session', `${exceptionPath}.session_id`, 'La excepción requiere session_id.');
    validateEnum(exception.alcance, WARNING_EXCEPTION_SCOPES, {
      issues,
      code: 'exception.invalid_scope',
      path: `${exceptionPath}.alcance`,
      label: 'Alcance de excepción',
    });
    if (!clean(exception.motivo)) issue(issues, 'exception.missing_reason', `${exceptionPath}.motivo`, 'La excepción requiere motivo.');
    if (!clean(exception.decidida_por)) issue(issues, 'exception.missing_actor', `${exceptionPath}.decidida_por`, 'La excepción requiere decidida_por.');
    validateTimestamp(exception.decidida_el, {
      issues,
      code: 'exception.invalid_timestamp',
      path: `${exceptionPath}.decidida_el`,
      label: 'decidida_el',
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    errors: issues.map((entry) => `${entry.path}: ${entry.message}`),
  };
}

export function validateWarningsData(data, { allowSchema2 = false } = {}) {
  const issues = [];
  const allowedSchemas = allowSchema2 ? [2, INTERNAL_SCHEMA_VERSION] : [INTERNAL_SCHEMA_VERSION];
  if (!isObject(data)) issue(issues, 'data.type', 'data', 'Los datos internos deben ser un objeto.');
  if (!allowedSchemas.includes(data?.schema_version)) {
    issue(issues, 'data.schema', 'schema_version', `El esquema interno debe ser v${INTERNAL_SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(data?.macroeventos)) {
    issue(issues, 'data.events.type', 'macroeventos', 'macroeventos debe ser una lista.');
  }
  for (const [index, event] of (Array.isArray(data?.macroeventos) ? data.macroeventos : []).entries()) {
    if (!isObject(event)) {
      issue(issues, 'event.type', `macroeventos[${index}]`, 'El macroevento debe ser un objeto.');
      continue;
    }
    const eventValidation = validateEventWarnings(event, {
      path: `macroeventos[${index}]${clean(event.id) ? `(${event.id})` : ''}`,
    });
    issues.push(...eventValidation.issues);
  }
  return {
    valid: issues.length === 0,
    issues,
    errors: issues.map((entry) => `${entry.path}: ${entry.message}`),
  };
}

export function migrateWarningsSchemaV3(data) {
  if (!isObject(data)) throw new TypeError('Los datos internos deben ser un objeto JSON.');
  if (![2, INTERNAL_SCHEMA_VERSION].includes(data.schema_version)) {
    throw new Error(`No se puede migrar schema_version ${data.schema_version ?? 'ausente'}; solo se admiten v2 y v${INTERNAL_SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(data.macroeventos)) throw new TypeError('macroeventos debe ser una lista antes de migrar.');

  let changed = data.schema_version !== INTERNAL_SCHEMA_VERSION;
  const migrated = clone(data);
  migrated.schema_version = INTERNAL_SCHEMA_VERSION;
  migrated.macroeventos = migrated.macroeventos.map((event, index) => {
    if (!isObject(event)) throw new TypeError(`macroeventos[${index}] debe ser un objeto antes de migrar.`);
    const next = { ...event };
    if (!own(next, 'advertencias')) {
      next.advertencias = [];
      changed = true;
    }
    if (!own(next, 'excepciones_advertencias')) {
      next.excepciones_advertencias = [];
      changed = true;
    }
    return next;
  });

  return { changed, data: migrated };
}
