import { normalizeCharacterization } from './controlled-values.js';

export const DEFAULT_INTERNAL_CATEGORIES = [
  ['africa', 'África'],
  ['clima_agua_seguridad_alimentaria', 'Clima, agua y seguridad alimentaria'],
  ['comercio_finanzas_sanciones', 'Comercio, finanzas y sanciones'],
  ['infraestructura_conectividad', 'Infraestructura y conectividad'],
  ['infraestructura_energia', 'Infraestructura y energía'],
  ['minerales_recursos_estrategicos', 'Minerales y recursos estratégicos'],
  ['potencias_bloques', 'Potencias y bloques'],
  ['seguridad_conflicto', 'Seguridad y conflicto'],
  ['tecnologia_soberania_digital', 'Tecnología y soberanía digital'],
].map(([id, nombre]) => ({ id, nombre, descripcion: '', estado: 'activa' }));

const clean = (value, limit = 1000) => String(value ?? '').trim().slice(0, limit);

export function internalCategoryLabelFromId(value) {
  return clean(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeInternalCategories(records = [], events = []) {
  const normalized = new Map(DEFAULT_INTERNAL_CATEGORIES.map((record) => [record.id, { ...record }]));

  for (const record of Array.isArray(records) ? records : []) {
    const id = normalizeCharacterization(record?.id || record?.nombre);
    if (!id) continue;
    normalized.set(id, {
      id,
      nombre: clean(record?.nombre, 200) || internalCategoryLabelFromId(id),
      descripcion: clean(record?.descripcion, 2000),
      estado: record?.estado === 'archivada' ? 'archivada' : 'activa',
    });
  }

  for (const event of Array.isArray(events) ? events : []) {
    const id = normalizeCharacterization(event?.categoria);
    if (!id || normalized.has(id)) continue;
    normalized.set(id, {
      id,
      nombre: internalCategoryLabelFromId(id),
      descripcion: '',
      estado: 'activa',
    });
  }

  return [...normalized.values()].sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'));
}

export function internalCategoryById(categories = [], id = '') {
  const normalizedId = normalizeCharacterization(id);
  return (categories || []).find((category) => category.id === normalizedId) || null;
}
