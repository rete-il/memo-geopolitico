import XLSX from 'xlsx';
import { slugify } from './public-export.mjs';

const KEYS = [
  'id',
  'nombre',
  'url',
  'sede',
  'region',
  'idioma',
  'familia',
  'funcion',
  'propiedad',
  'control',
  'orientacion',
  'perspectiva',
  'fiabilidad',
  'independencia',
  'transparencia',
  'rigor',
  'correcciones',
  'separacion',
  'puntuacion',
  'confianza',
  'uso',
  'corroboracion',
  'corroborar_con',
  'estado',
  'observaciones',
  'referencia',
  'fecha_revision',
  'media_id',
];

const NUMERIC_KEYS = new Set([
  'fiabilidad',
  'independencia',
  'transparencia',
  'rigor',
  'correcciones',
  'separacion',
  'puntuacion',
]);

function excelDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return [
        String(parsed.y).padStart(4, '0'),
        String(parsed.m).padStart(2, '0'),
        String(parsed.d).padStart(2, '0'),
      ].join('-');
    }
  }
  return String(value || '').slice(0, 10);
}

export function buildMediaDataset(workbookPath, options = {}) {
  const sheetName = options.sheetName || 'Matriz profesional';
  const workbook = XLSX.readFile(workbookPath, {
    cellDates: true,
    raw: true,
  });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`No existe la hoja “${sheetName}”.`);

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
  });
  const headerRow = rows[3] || [];
  const usedIds = new Set();
  const records = [];

  for (const row of rows.slice(4)) {
    if (!String(row[1] || '').trim()) continue;
    const record = {};
    for (let index = 0; index < KEYS.length; index += 1) {
      const key = KEYS[index];
      const value = row[index] ?? '';
      record[key] = NUMERIC_KEYS.has(key)
        ? Number(value || 0)
        : key === 'fecha_revision'
          ? excelDate(value)
          : String(value).trim();
    }

    const baseId = slugify(record.media_id || record.nombre);
    let mediaId = baseId;
    let suffix = 2;
    while (usedIds.has(mediaId)) mediaId = `${baseId}-${suffix++}`;
    usedIds.add(mediaId);
    record.media_id = mediaId;
    record.id = Number(record.id || records.length + 1);
    records.push(record);
  }

  const dates = records.map((item) => item.fecha_revision).filter(Boolean).sort();
  return {
    schema_version: 2,
    metadata: {
      titulo: 'Directorio profesional de medios geopolíticos',
      archivo_fuente: workbookPath.split(/[\\/]/).pop(),
      hoja_fuente: sheetName,
      total_medios: records.length,
      ultima_revision: dates.at(-1) || '',
      descripcion:
        'Matriz de fuentes clasificada por región, función epistemológica, perspectiva geopolítica y criterios de calidad.',
    },
    columns: KEYS.map((key, index) => ({
      key,
      label: String(headerRow[index] || (key === 'media_id' ? 'Media ID estable' : key)),
    })),
    records,
  };
}

export function validateMediaDataset(data) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  for (const [index, item] of (data.records || []).entries()) {
    const label = item.nombre || `Registro ${index + 1}`;
    if (!item.media_id) errors.push(`${label}: falta media_id.`);
    if (ids.has(item.media_id)) errors.push(`${label}: media_id duplicado.`);
    ids.add(item.media_id);
    if (!item.nombre) errors.push(`Registro ${index + 1}: falta nombre.`);
    if (!item.url) warnings.push(`${label}: falta URL.`);
    if (item.puntuacion < 0 || item.puntuacion > 5) {
      errors.push(`${label}: puntuación fuera de rango.`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
