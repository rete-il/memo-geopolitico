import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadPublicExpedientStates } from './lib/public-expedients.mjs';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const projectRoot = path.resolve(root, '..', '..', '..');
const publicDir = path.join(root, 'public');
const dataPath = path.join(root, 'data', 'macroeventos.json');
const taxonomyPath = path.join(root, 'data', 'taxonomia-temas.json');
const catalogPath = path.join(root, 'data', 'catalogo-medios.json');
const searchConfigPath = path.join(root, 'data', 'configuracion-busqueda.json');
const configPath = path.join(root, 'data', 'config.json');
const backupsDir = path.join(root, 'backups');
const config = readJson(configPath);
const APP_VERSION = '0.6.3';

const HOST = process.env.OBSERVATORIO_HOST || config.host || '127.0.0.1';
const PORT = Number(process.env.OBSERVATORIO_PORT || config.puerto || 4323);
const MAX_BODY = 12 * 1024 * 1024;
const MAX_BACKUPS = Number(config.max_backups || 30);

fs.mkdirSync(backupsDir, { recursive: true });

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJsonAtomic(file, value) {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function slug(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function text(value, max = 30000) {
  return String(value ?? '').trim().slice(0, max);
}

function stringArray(value, max = 1000) {
  return Array.isArray(value)
    ? value.map((item) => text(item, 500)).filter(Boolean).slice(0, max)
    : [];
}

function integer(value, fallback = 1, min = 1, max = 5) {
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

function catalogIndex(catalog) {
  return new Map((catalog?.records || []).map((item) => [item.media_id, item]));
}

function catalogNameIndex(catalog) {
  return new Map((catalog?.records || []).map((item) => [slug(item.nombre), item]));
}

function normalizeLocation(location = {}) {
  return {
    etiqueta: text(location.etiqueta, 300),
    pais: text(location.pais, 200),
    latitud: optionalNumber(location.latitud, -90, 90),
    longitud: optionalNumber(location.longitud, -180, 180),
  };
}

function normalizeSignal(signal = {}, eventId = 'evento', index = 0) {
  return {
    id: slug(signal.id || `sig-${eventId}-${String(index + 1).padStart(3, '0')}`),
    fecha: text(signal.fecha, 20),
    titulo: text(signal.titulo, 500),
    tipo: text(signal.tipo, 200),
    descripcion: text(signal.descripcion),
    estado_revision: text(signal.estado_revision === 'confirmada' ? 'verificada' : (signal.estado_revision || 'pendiente'), 40),
    origen: text(signal.origen || 'ia', 40),
    fuente_ids: stringArray(signal.fuente_ids, 500).map(slug),
    intensidad: optionalNumber(signal.intensidad, 1, 5),
    localizaciones: Array.isArray(signal.localizaciones)
      ? signal.localizaciones.map(normalizeLocation).filter((item) => item.etiqueta || item.pais || item.latitud !== null || item.longitud !== null)
      : [],
  };
}

function normalizeSource(source = {}, eventId = 'evento', index = 0, catalog = {}) {
  const byMediaId = catalogIndex(catalog);
  const byName = catalogNameIndex(catalog);
  const matchedByName = byName.get(slug(source.medio));
  const mediaId = text(source.media_id || matchedByName?.media_id, 200);
  const cataloged = Boolean(source.medio_catalogado && byMediaId.has(mediaId)) || Boolean(matchedByName);
  const verifiedState = source.estado_verificacion || (source.verificada ? 'verificada' : 'pendiente');
  const catalogItem = byMediaId.get(mediaId) || matchedByName;
  return {
    id: slug(source.id || `src-${eventId}-${String(index + 1).padStart(3, '0')}`),
    media_id: cataloged ? catalogItem.media_id : '',
    medio_catalogado: cataloged,
    medio: text(source.medio || catalogItem?.nombre, 300),
    titulo: text(source.titulo, 1000),
    fecha: text(source.fecha, 20),
    idioma: text(source.idioma, 100),
    tipo: text(source.tipo, 200),
    url: text(source.url, 3000),
    estado_verificacion: text(verifiedState || 'pendiente', 40),
    observaciones: text(source.observaciones),
    revisada_el: text(source.revisada_el, 20),
  };
}

function normalizeUpdateRecord(record = {}) {
  return {
    lote_id: slug(record.lote_id || `lote-${new Date().toISOString().slice(0, 10)}`),
    actualizado_el: text(record.actualizado_el || new Date().toISOString().slice(0, 10), 20),
    origen: text(record.origen || 'chatgpt', 100),
    candidato_id: slug(record.candidato_id || 'candidato'),
    candidato_titulo: text(record.candidato_titulo, 1000),
    tipo_evolucion: text(record.tipo_evolucion || 'continuidad', 100),
    justificacion: text(record.justificacion),
    fuente_ids_agregadas: stringArray(record.fuente_ids_agregadas, 500).map(slug),
    senal_ids_agregadas: stringArray(record.senal_ids_agregadas, 500).map(slug),
    campos_modificados: stringArray(record.campos_modificados, 100),
  };
}

function normalizeEvaluationHistory(record = {}) {
  const evaluation = record.evaluacion || {};
  return {
    fecha: text(record.fecha || new Date().toISOString().slice(0, 10), 20),
    lote_id: slug(record.lote_id || `lote-${new Date().toISOString().slice(0, 10)}`),
    evaluacion: {
      impacto: integer(evaluation.impacto, 1),
      probabilidad: integer(evaluation.probabilidad, 1),
      alcance: integer(evaluation.alcance, 1),
      persistencia: integer(evaluation.persistencia, 1),
      propagacion: integer(evaluation.propagacion, 1),
      subcobertura: integer(evaluation.subcobertura, 1),
      incertidumbre: integer(evaluation.incertidumbre, 1),
      urgencia: integer(evaluation.urgencia, 1),
      cobertura_observada: integer(evaluation.cobertura_observada, 1),
      confianza: text(evaluation.confianza || 'media', 40),
    },
  };
}

function normalizeEvent(event = {}, index = 0, catalog = {}) {
  const id = slug(event.id || event.titulo || `macroevento-${index + 1}`);
  const evaluation = event.evaluacion || {};
  const sources = Array.isArray(event.fuentes)
    ? event.fuentes.map((source, sourceIndex) => normalizeSource(source, id, sourceIndex, catalog))
    : [];
  const sourceIds = new Set(sources.map((source) => source.id));
  const signals = Array.isArray(event.senales)
    ? event.senales.map((signal, signalIndex) => normalizeSignal(signal, id, signalIndex))
    : [];
  for (const signal of signals) {
    signal.fuente_ids = signal.fuente_ids.filter((sourceId) => sourceIds.has(sourceId));
  }
  return {
    id,
    titulo: text(event.titulo, 1000),
    tipo_proceso: text(event.tipo_proceso || 'macroproceso_estructural', 100),
    estado_editorial: text(event.estado_editorial || 'borrador', 40),
    estado_verificacion: text(event.estado_verificacion || 'pendiente', 40),
    fecha_corte: text(event.fecha_corte, 20),
    regiones: stringArray(event.regiones),
    categoria: text(event.categoria, 200),
    tema_ids: Array.isArray(event.tema_ids)
      ? [...new Set(event.tema_ids.map(Number).filter(Number.isInteger))]
      : [],
    clasificacion_tematica: {
      origen: text(event.clasificacion_tematica?.origen || 'ia', 40),
      estado_revision: text(event.clasificacion_tematica?.estado_revision || 'pendiente', 40),
      taxonomy_version: Number(event.clasificacion_tematica?.taxonomy_version || 1),
      revisada_el: text(event.clasificacion_tematica?.revisada_el, 20) || null,
    },
    descripcion: text(event.descripcion),
    senales: signals,
    actores: stringArray(event.actores),
    intereses: stringArray(event.intereses),
    horizonte: {
      min_anios: Number(event.horizonte?.min_anios || 3),
      max_anios: Number(event.horizonte?.max_anios || 10),
    },
    escenarios: {
      base: text(event.escenarios?.base),
      adverso: text(event.escenarios?.adverso),
      transformador: text(event.escenarios?.transformador),
    },
    indicadores: stringArray(event.indicadores),
    evaluacion: {
      impacto: integer(evaluation.impacto, 1),
      probabilidad: integer(evaluation.probabilidad, 1),
      alcance: integer(evaluation.alcance, 1),
      persistencia: integer(evaluation.persistencia, 1),
      propagacion: integer(evaluation.propagacion, 1),
      subcobertura: integer(evaluation.subcobertura, 1),
      incertidumbre: integer(evaluation.incertidumbre, 1),
      urgencia: integer(evaluation.urgencia, 1),
      cobertura_observada: integer(evaluation.cobertura_observada, 1),
      confianza: text(evaluation.confianza || 'media', 40),
    },
    palabras_clave: stringArray(event.palabras_clave),
    fuentes: sources,
    actualizaciones: Array.isArray(event.actualizaciones)
      ? event.actualizaciones.map(normalizeUpdateRecord)
      : [],
    historial_evaluacion: Array.isArray(event.historial_evaluacion)
      ? event.historial_evaluacion.map(normalizeEvaluationHistory)
      : [],
    ...(event.importacion && typeof event.importacion === 'object' ? {
      importacion: {
        origen: text(event.importacion.origen || 'chatgpt', 100),
        formato_version: Number(event.importacion.formato_version || 1),
        lote_id: slug(event.importacion.lote_id || `lote-${new Date().toISOString().slice(0, 10)}`),
        importado_el: text(event.importacion.importado_el || new Date().toISOString().slice(0, 10), 20),
      },
    } : {}),
  };
}

function normalizeExpedient(item = {}, index = 0) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: slug(item.id || `exp-${today}-${String(index + 1).padStart(3, '0')}`),
    estado: text(item.estado || 'borrador', 60),
    tipo_documento: text(item.tipo_documento || 'foco', 40),
    titulo_trabajo: text(item.titulo_trabajo, 1000),
    pregunta_editorial: text(item.pregunta_editorial),
    tesis_central: text(item.tesis_central),
    macroevento_ids: stringArray(item.macroevento_ids).map(slug),
    signal_ids: stringArray(item.signal_ids).map(slug),
    source_ids: stringArray(item.source_ids).map(slug),
    geografias_publicas: stringArray(item.geografias_publicas).map(slug),
    temas_publicos: stringArray(item.temas_publicos).map(slug),
    procesos_publicos: stringArray(item.procesos_publicos).map(slug),
    incertidumbres: stringArray(item.incertidumbres),
    documentos_relacionados: stringArray(item.documentos_relacionados),
    extension_objetivo: Number(item.extension_objetivo || 1800),
    creado: text(item.creado || today, 20),
    actualizado: text(item.actualizado || today, 20),
  };
}

function normalizeData(payload = {}, catalog = readJson(catalogPath)) {
  const events = Array.isArray(payload.macroeventos) ? payload.macroeventos : [];
  const expedients = Array.isArray(payload.expedientes_editoriales) ? payload.expedientes_editoriales : [];
  return {
    schema_version: 2,
    titulo: text(payload.titulo || 'Observatorio de macroeventos geopolíticos', 500),
    actualizado: text(payload.actualizado || new Date().toISOString().slice(0, 10), 20),
    notas: text(payload.notas),
    macroeventos: events.map((event, index) => normalizeEvent(event, index, catalog)),
    expedientes_editoriales: expedients.map(normalizeExpedient),
  };
}

function normalizeCatalog(payload = {}) {
  const used = new Set();
  const records = Array.isArray(payload.records) ? payload.records : [];
  const normalized = records.map((record, index) => {
    let mediaId = slug(record.media_id || record.nombre || `medio-${index + 1}`);
    let candidate = mediaId;
    let suffix = 2;
    while (used.has(candidate)) candidate = `${mediaId}-${suffix++}`;
    mediaId = candidate;
    used.add(mediaId);
    return {
      ...record,
      id: Number(record.id || index + 1),
      media_id: mediaId,
      nombre: text(record.nombre, 500),
      url: text(record.url, 3000),
      sede: text(record.sede),
      region: text(record.region, 500),
      idioma: text(record.idioma, 300),
      familia: text(record.familia, 500),
      funcion: text(record.funcion, 1000),
      propiedad: text(record.propiedad),
      control: text(record.control, 500),
      orientacion: text(record.orientacion, 500),
      perspectiva: text(record.perspectiva, 1000),
      fiabilidad: Number(record.fiabilidad || 0),
      independencia: Number(record.independencia || 0),
      transparencia: Number(record.transparencia || 0),
      rigor: Number(record.rigor || 0),
      correcciones: Number(record.correcciones || 0),
      separacion: Number(record.separacion || 0),
      puntuacion: Number(record.puntuacion || 0),
      confianza: text(record.confianza, 100),
      uso: text(record.uso),
      corroboracion: text(record.corroboracion, 500),
      corroborar_con: text(record.corroborar_con),
      estado: text(record.estado, 200),
      observaciones: text(record.observaciones),
      referencia: text(record.referencia, 3000),
      fecha_revision: text(record.fecha_revision, 20),
    };
  });
  return {
    schema_version: 1,
    metadata: {
      ...(payload.metadata || {}),
      total_medios: normalized.length,
      importado: new Date().toISOString().slice(0, 10),
    },
    columns: Array.isArray(payload.columns) ? payload.columns : [],
    records: normalized,
  };
}

function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const assistedStates = new Set(['verificado', 'propuesto', 'sin_determinar']);
  if (!Array.isArray(catalog.records)) errors.push('El catálogo no contiene records.');
  for (const [index, item] of (catalog.records || []).entries()) {
    const label = item.nombre || `Registro ${index + 1}`;
    if (!item.media_id) errors.push(`${label}: falta media_id.`);
    if (ids.has(item.media_id)) errors.push(`${label}: media_id duplicado (${item.media_id}).`);
    ids.add(item.media_id);
    if (!item.nombre) errors.push(`Registro ${index + 1}: falta nombre.`);
    if (!item.url) warnings.push(`${label}: falta URL institucional.`);
    if (item.revision_asistida) {
      if (item.revision_asistida.estado !== 'confirmada_por_usuario') warnings.push(`${label}: el alta asistida no registra confirmación humana.`);
      for (const [field, state] of Object.entries(item.revision_asistida.estados || {})) {
        if (!assistedStates.has(state)) errors.push(`${label}: condición inválida en ${field} (${state}).`);
        if (state === 'sin_determinar' && item[field]) warnings.push(`${label}: ${field} tiene valor aunque está marcado sin determinar.`);
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

function validateData(data, catalog = readJson(catalogPath), taxonomy = readJson(taxonomyPath)) {
  const errors = [];
  const warnings = [];
  const eventIds = new Set();
  const allSignalIds = new Set();
  const allSourceIds = new Set();
  const allowedEditorial = new Set(['borrador', 'revision', 'validado', 'archivado']);
  const allowedVerification = new Set(['pendiente', 'parcial', 'verificado']);
  const allowedSourceVerification = new Set(['pendiente', 'revisada', 'verificada', 'descartada']);
  const allowedSignalReview = new Set(['pendiente', 'revisada', 'verificada', 'descartada']);
  const allowedOrigin = new Set(['ia', 'humano', 'fuente', 'mixto']);
  const allowedThemeReview = new Set(['pendiente', 'revisada']);
  const topicIds = new Set((taxonomy.categorias || []).flatMap((category) => (category.temas || []).map((topic) => Number(topic.id))));
  const allowedExpedientStatus = new Set(['borrador', 'fuentes_pendientes', 'listo_para_prompt', 'prompt_exportado', 'borrador_recibido', 'revision_editorial', 'aprobado', 'publicado', 'archivado']);
  const allowedDocTypes = new Set(['movimiento', 'foco', 'dossier']);
  const mediaIds = new Set((catalog.records || []).map((item) => item.media_id));
  const eventMap = new Map();

  if (data.schema_version !== 2) errors.push('El esquema debe ser v2.');
  if (!Array.isArray(data.macroeventos)) errors.push('macroeventos debe ser una lista.');
  if (!Array.isArray(data.expedientes_editoriales)) errors.push('expedientes_editoriales debe ser una lista.');

  for (const [eventIndex, event] of (data.macroeventos || []).entries()) {
    const label = event.titulo || event.id || `Macroevento ${eventIndex + 1}`;
    if (!event.id) errors.push(`${label}: falta ID.`);
    if (eventIds.has(event.id)) errors.push(`${label}: ID duplicado (${event.id}).`);
    eventIds.add(event.id);
    eventMap.set(event.id, event);
    if (!event.titulo) errors.push(`${label}: falta título.`);
    if (!event.descripcion) errors.push(`${label}: falta descripción.`);
    if (!event.categoria) errors.push(`${label}: falta categoría.`);
    if (!event.regiones?.length) errors.push(`${label}: falta al menos una región.`);
    if (!allowedEditorial.has(event.estado_editorial)) errors.push(`${label}: estado editorial inválido.`);
    if (!allowedVerification.has(event.estado_verificacion)) errors.push(`${label}: estado de verificación inválido.`);
    if (!allowedOrigin.has(event.clasificacion_tematica?.origen)) errors.push(`${label}: origen de clasificación temática inválido.`);
    if (!allowedThemeReview.has(event.clasificacion_tematica?.estado_revision)) errors.push(`${label}: estado de revisión temática inválido.`);
    for (const topicId of event.tema_ids || []) if (!topicIds.has(Number(topicId))) errors.push(`${label}: tema interno inexistente (${topicId}).`);
    const minYears = Number(event.horizonte?.min_anios);
    const maxYears = Number(event.horizonte?.max_anios);
    if (!Number.isFinite(minYears) || !Number.isFinite(maxYears) || minYears > maxYears) errors.push(`${label}: horizonte inválido.`);
    if (minYears < Number(config.horizonte_minimo_anios || 3) || maxYears > Number(config.horizonte_maximo_anios || 10)) warnings.push(`${label}: horizonte fuera del rango editorial recomendado.`);

    const sourceIdsInEvent = new Set();
    for (const source of event.fuentes || []) {
      const sourceLabel = `${label} / ${source.titulo || source.id || 'fuente'}`;
      if (!source.id) errors.push(`${sourceLabel}: falta ID.`);
      if (allSourceIds.has(source.id)) errors.push(`${sourceLabel}: ID global duplicado (${source.id}).`);
      allSourceIds.add(source.id);
      sourceIdsInEvent.add(source.id);
      if (!allowedSourceVerification.has(source.estado_verificacion)) errors.push(`${sourceLabel}: estado de verificación inválido.`);
      if (source.url) {
        try {
          const url = new URL(source.url);
          if (url.protocol !== 'https:') errors.push(`${sourceLabel}: la URL debe usar HTTPS.`);
        } catch {
          errors.push(`${sourceLabel}: URL inválida.`);
        }
      }
      if (source.medio_catalogado && !mediaIds.has(source.media_id)) errors.push(`${sourceLabel}: media_id inexistente en el catálogo.`);
      if (!source.medio_catalogado && !source.medio) errors.push(`${sourceLabel}: falta el nombre del medio no catalogado.`);
    }

    for (const signal of event.senales || []) {
      const signalLabel = `${label} / ${signal.titulo || signal.id || 'señal'}`;
      if (!signal.id) errors.push(`${signalLabel}: falta ID.`);
      if (allSignalIds.has(signal.id)) errors.push(`${signalLabel}: ID global duplicado (${signal.id}).`);
      allSignalIds.add(signal.id);
      if (!signal.titulo) errors.push(`${signalLabel}: falta título.`);
      if (!allowedSignalReview.has(signal.estado_revision)) errors.push(`${signalLabel}: estado de revisión inválido.`);
      if (!allowedOrigin.has(signal.origen)) errors.push(`${signalLabel}: origen inválido.`);
      if (signal.intensidad !== null && (signal.intensidad < 1 || signal.intensidad > 5)) errors.push(`${signalLabel}: intensidad fuera de rango.`);
      for (const sourceId of signal.fuente_ids || []) if (!sourceIdsInEvent.has(sourceId)) errors.push(`${signalLabel}: referencia una fuente inexistente (${sourceId}).`);
      for (const location of signal.localizaciones || []) {
        if (location.latitud !== null && (location.latitud < -90 || location.latitud > 90)) errors.push(`${signalLabel}: latitud inválida.`);
        if (location.longitud !== null && (location.longitud < -180 || location.longitud > 180)) errors.push(`${signalLabel}: longitud inválida.`);
      }
    }

    if (!event.fuentes?.length) warnings.push(`${label}: no tiene fuentes.`);
    if (!event.senales?.length) warnings.push(`${label}: no tiene señales.`);
    if (!event.indicadores?.length) warnings.push(`${label}: no tiene indicadores.`);
    if (event.estado_editorial === 'validado') {
      const verified = (event.fuentes || []).filter((source) => source.estado_verificacion === 'verificada').length;
      if (verified < Number(config.requiere_fuentes_para_validar || 2)) errors.push(`${label}: un evento validado requiere al menos ${config.requiere_fuentes_para_validar || 2} fuentes verificadas.`);
    }
  }

  const expIds = new Set();
  for (const [index, exp] of (data.expedientes_editoriales || []).entries()) {
    const label = exp.titulo_trabajo || exp.id || `Expediente ${index + 1}`;
    if (!exp.id) errors.push(`${label}: falta ID.`);
    if (expIds.has(exp.id)) errors.push(`${label}: ID duplicado (${exp.id}).`);
    expIds.add(exp.id);
    if (!allowedExpedientStatus.has(exp.estado)) errors.push(`${label}: estado de expediente inválido.`);
    if (!allowedDocTypes.has(exp.tipo_documento)) errors.push(`${label}: tipo documental inválido.`);
    for (const eventId of exp.macroevento_ids || []) if (!eventMap.has(eventId)) errors.push(`${label}: macroevento inexistente (${eventId}).`);
    for (const signalId of exp.signal_ids || []) if (!allSignalIds.has(signalId)) errors.push(`${label}: señal inexistente (${signalId}).`);
    for (const sourceId of exp.source_ids || []) if (!allSourceIds.has(sourceId)) errors.push(`${label}: fuente inexistente (${sourceId}).`);
    const selectedSources = [];
    for (const eventId of exp.macroevento_ids || []) {
      const event = eventMap.get(eventId);
      if (!event) continue;
      selectedSources.push(...(event.fuentes || []).filter((source) => exp.source_ids.includes(source.id)));
    }
    const promptReady = exp.titulo_trabajo && exp.pregunta_editorial && exp.tesis_central && exp.macroevento_ids.length && exp.temas_publicos.length && selectedSources.length && selectedSources.every((source) => source.estado_verificacion === 'verificada');
    if (['listo_para_prompt', 'prompt_exportado'].includes(exp.estado) && !promptReady) errors.push(`${label}: no cumple los requisitos para generar un prompt.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function pruneBackups(prefix) {
  const items = fs.readdirSync(backupsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
    .map((name) => ({ name, mtime: fs.statSync(path.join(backupsDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  for (const item of items.slice(MAX_BACKUPS)) fs.unlinkSync(path.join(backupsDir, item.name));
}

function backupFile(file, prefix, reason = 'save') {
  if (!fs.existsSync(file)) return null;
  const name = `${prefix}-${timestamp()}-${reason}.json`;
  fs.copyFileSync(file, path.join(backupsDir, name));
  pruneBackups(prefix);
  return name;
}

function listBackups(prefix = 'macroeventos') {
  return fs.readdirSync(backupsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
    .map((name) => {
      const stat = fs.statSync(path.join(backupsDir, name));
      return { name, size: stat.size, modified: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendFile(res, file) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };
  const ext = path.extname(file).toLowerCase();
  const body = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': types[ext] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=60',
  });
  res.end(body);
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('El cuerpo de la solicitud es demasiado grande.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

function loadNormalizedData() {
  const catalog = normalizeCatalog(readJson(catalogPath));
  return normalizeData(readJson(dataPath), catalog);
}

const checkOnly = process.argv.includes('--check');
if (checkOnly) {
  const catalog = normalizeCatalog(readJson(catalogPath));
  const catalogValidation = validateCatalog(catalog);
  const data = normalizeData(readJson(dataPath), catalog);
  const validation = validateData(data, catalog);
  console.log(JSON.stringify({
    schema_version: data.schema_version,
    macroeventos: data.macroeventos.length,
    expedientes_publicos: data.macroeventos.length,
    encargos_editoriales: data.expedientes_editoriales.length,
    senales: data.macroeventos.reduce((sum, item) => sum + item.senales.length, 0),
    fuentes: data.macroeventos.reduce((sum, item) => sum + item.fuentes.length, 0),
    catalogo_medios: catalog.records.length,
    valid: validation.valid && catalogValidation.valid,
    errors: [...catalogValidation.errors, ...validation.errors],
    warnings: [...catalogValidation.warnings, ...validation.warnings],
  }, null, 2));
  process.exit(validation.valid && catalogValidation.valid ? 0 : 1);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true, version: APP_VERSION });

    if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
      const catalog = normalizeCatalog(readJson(catalogPath));
      const data = normalizeData(readJson(dataPath), catalog);
      return sendJson(res, 200, {
        data,
        taxonomy: readJson(taxonomyPath),
        search_config: readJson(searchConfigPath),
        catalog,
        config,
        validation: validateData(data, catalog),
        catalog_validation: validateCatalog(catalog),
        public_expedients: loadPublicExpedientStates(projectRoot),
        backups: listBackups('macroeventos'),
        catalog_backups: listBackups('catalogo-medios'),
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/validate') {
      const catalog = normalizeCatalog(readJson(catalogPath));
      const data = normalizeData(await readBody(req), catalog);
      return sendJson(res, 200, validateData(data, catalog));
    }

    if (req.method === 'PUT' && url.pathname === '/api/data') {
      const catalog = normalizeCatalog(readJson(catalogPath));
      const data = normalizeData(await readBody(req), catalog);
      const validation = validateData(data, catalog);
      if (!validation.valid) return sendJson(res, 422, validation);
      data.actualizado = new Date().toISOString().slice(0, 10);
      const backup = backupFile(dataPath, 'macroeventos', 'save');
      writeJsonAtomic(dataPath, data);
      return sendJson(res, 200, { data, validation, backup });
    }

    if (req.method === 'GET' && url.pathname === '/api/export') {
      const data = loadNormalizedData();
      const body = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="macroeventos-observatorio.json"',
        'Content-Length': body.length,
      });
      return res.end(body);
    }

    if (req.method === 'GET' && url.pathname === '/api/catalog/export') {
      const catalog = normalizeCatalog(readJson(catalogPath));
      const body = Buffer.from(`${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="catalogo-medios.json"',
        'Content-Length': body.length,
      });
      return res.end(body);
    }

    if (req.method === 'PUT' && url.pathname === '/api/catalog') {
      const incoming = normalizeCatalog(await readBody(req));
      const validation = validateCatalog(incoming);
      if (!validation.valid) return sendJson(res, 422, validation);
      const backup = backupFile(catalogPath, 'catalogo-medios', 'save');
      writeJsonAtomic(catalogPath, incoming);
      const data = normalizeData(readJson(dataPath), incoming);
      const dataValidation = validateData(data, incoming);
      return sendJson(res, 200, { catalog: incoming, validation, data_validation: dataValidation, backup });
    }

    if (req.method === 'GET' && url.pathname === '/api/backups') return sendJson(res, 200, { backups: listBackups('macroeventos'), catalog_backups: listBackups('catalogo-medios') });

    if (req.method === 'POST' && url.pathname === '/api/restore') {
      const { name } = await readBody(req);
      const safeName = path.basename(String(name || ''));
      if (!safeName.startsWith('macroeventos-') || !safeName.endsWith('.json')) return sendJson(res, 400, { error: 'Backup inválido.' });
      const source = path.join(backupsDir, safeName);
      if (!fs.existsSync(source)) return sendJson(res, 404, { error: 'Backup no encontrado.' });
      const catalog = normalizeCatalog(readJson(catalogPath));
      const data = normalizeData(readJson(source), catalog);
      const validation = validateData(data, catalog);
      if (!validation.valid) return sendJson(res, 422, validation);
      const backup = backupFile(dataPath, 'macroeventos', 'before-restore');
      writeJsonAtomic(dataPath, data);
      return sendJson(res, 200, { data, validation, backup });
    }

    if (req.method === 'POST' && url.pathname === '/api/catalog/restore') {
      const { name } = await readBody(req);
      const safeName = path.basename(String(name || ''));
      if (!safeName.startsWith('catalogo-medios-') || !safeName.endsWith('.json')) return sendJson(res, 400, { error: 'Backup de catálogo inválido.' });
      const source = path.join(backupsDir, safeName);
      if (!fs.existsSync(source)) return sendJson(res, 404, { error: 'Backup no encontrado.' });
      const catalog = normalizeCatalog(readJson(source));
      const validation = validateCatalog(catalog);
      if (!validation.valid) return sendJson(res, 422, validation);
      const backup = backupFile(catalogPath, 'catalogo-medios', 'before-restore');
      writeJsonAtomic(catalogPath, catalog);
      return sendJson(res, 200, { catalog, validation, backup });
    }

    const relative = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const file = path.normalize(path.join(publicDir, relative));
    if (!file.startsWith(publicDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('No encontrado');
    }
    return sendFile(res, file);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error.message || 'Error interno.' });
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log(`Observatorio v${APP_VERSION} disponible en ${url}`);
  if (process.argv.includes('--open')) openBrowser(url);
});
