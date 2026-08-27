import {
  LANGUAGE_OPTIONS,
  normalizeCharacterization,
  normalizeLanguageCode,
} from './controlled-values.js';

export const EDITORIAL_VOCABULARY_DEFINITIONS = Object.freeze({
  tipos_senal: { nombre: 'Tipos de señal', singular: 'tipo de señal' },
  tipos_fuente: { nombre: 'Tipos de fuente', singular: 'tipo de fuente' },
  tipos_advertencia: { nombre: 'Tipos de advertencia', singular: 'tipo de advertencia' },
  idiomas: { nombre: 'Idiomas', singular: 'idioma' },
});

const clean = (value, limit = 2000) => String(value ?? '').trim().slice(0, limit);
const unique = (values) => [...new Set(values.filter(Boolean))];

function labelFromId(value) {
  return clean(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeId(kind, value) {
  return kind === 'idiomas'
    ? normalizeLanguageCode(value)
    : normalizeCharacterization(value);
}

function normalizeAliases(kind, aliases = []) {
  const values = Array.isArray(aliases) ? aliases : String(aliases || '').split(',');
  return unique(values.map((value) => clean(value, 200)).filter(Boolean).map((value) => (
    kind === 'idiomas' ? value.toLowerCase() : normalizeCharacterization(value)
  )));
}

function record(kind, input = {}) {
  const id = normalizeId(kind, input.id || input.nombre);
  if (!id) return null;
  return {
    id,
    nombre: clean(input.nombre, 200) || labelFromId(id),
    descripcion: clean(input.descripcion),
    aliases: normalizeAliases(kind, input.aliases),
    estado: input.estado === 'archivada' ? 'archivada' : 'activa',
    ...(kind === 'tipos_advertencia' ? {
      tratamiento_sugerido: ['bloqueante', 'relevante', 'observacion_posterior', 'irrelevante'].includes(input.tratamiento_sugerido)
        ? input.tratamiento_sugerido
        : 'relevante',
      prioridad_sugerida: ['alta', 'media', 'baja'].includes(input.prioridad_sugerida)
        ? input.prioridad_sugerida
        : 'media',
    } : {}),
  };
}

function usedValues(events, kind) {
  if (kind === 'tipos_senal') {
    return events.flatMap((event) => event.senales || []).map((item) => item.tipo);
  }
  if (kind === 'tipos_fuente') {
    return events.flatMap((event) => event.fuentes || []).map((item) => item.tipo);
  }
  if (kind === 'tipos_advertencia') {
    return events.flatMap((event) => event.advertencias || []).map((item) => item.tipo);
  }
  return events.flatMap((event) => event.fuentes || []).map((item) => item.idioma);
}

function languageDefaults() {
  return LANGUAGE_OPTIONS.map(([id, nombre]) => record('idiomas', { id, nombre }));
}

export function normalizeEditorialVocabularies(payload = {}, events = []) {
  const result = {};
  for (const kind of Object.keys(EDITORIAL_VOCABULARY_DEFINITIONS)) {
    const normalized = new Map();
    if (kind === 'idiomas') {
      for (const item of languageDefaults()) normalized.set(item.id, item);
    }
    for (const value of usedValues(Array.isArray(events) ? events : [], kind)) {
      const item = record(kind, { id: value });
      if (item) normalized.set(item.id, item);
    }
    for (const input of Array.isArray(payload?.[kind]) ? payload[kind] : []) {
      const item = record(kind, input);
      if (!item) continue;
      normalized.set(item.id, { ...(normalized.get(item.id) || {}), ...item });
    }
    result[kind] = [...normalized.values()].sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'));
  }
  return result;
}

export function editorialVocabularyRecord(vocabularies = {}, kind = '', id = '') {
  const normalizedId = normalizeId(kind, id);
  return (vocabularies?.[kind] || []).find((item) => item.id === normalizedId) || null;
}

export function normalizeEditorialVocabularyId(kind, value) {
  return normalizeId(kind, value);
}
