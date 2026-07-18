#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const toolsDir = path.dirname(filename);
const repoRoot = path.resolve(toolsDir, '..', '..');
const casesDir = path.join(repoRoot, 'src', 'data', 'observatorio');

const CATEGORIES = new Set([
  'seguridad_conflicto',
  'infraestructura_estrategica',
  'comercio_energia_recursos',
]);
const PUBLICATION_STATES = new Set([
  'borrador',
  'publicado',
  'destacado',
  'archivado',
]);
const DATA_STATES = new Set(['incompleto', 'completo']);
const CLASSIFICATIONS = new Set([
  'subcubierto',
  'cobertura_proporcional',
  'sobrecubierto',
]);
const FULL_BLOCKS = [
  'periodo_cobertura',
  'dimensiones_relevancia',
  'indices',
  'atencion_mediatica',
  'metricas_especificas',
];
const DIMENSIONS = [
  'criticidad_estrategica',
  'alcance_geografico',
  'poblacion_activos_afectados',
  'persistencia_temporal',
  'propagacion_regional',
  'dificultad_reversion',
  'capacidad_actores',
];
const WEIGHTS = {
  criticidad_estrategica: 20,
  alcance_geografico: 15,
  poblacion_activos_afectados: 15,
  persistencia_temporal: 15,
  propagacion_regional: 15,
  dificultad_reversion: 10,
  capacidad_actores: 10,
};

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function expectedClassification(gap) {
  if (gap <= -20) return 'subcubierto';
  if (gap >= 20) return 'sobrecubierto';
  return 'cobertura_proporcional';
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function validateCase(data, fileName, ids) {
  const errors = [];
  const warnings = [];
  const prefix = data?.id || fileName;

  if (!isObject(data)) return { errors: [`${fileName}: el contenido debe ser un objeto.`], warnings };

  if (data.schema_version !== 1)
    errors.push(`${prefix}: schema_version debe ser 1.`);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id || ''))
    errors.push(`${prefix}: ID inválido.`);

  if (data.id && `${data.id}.json` !== fileName)
    errors.push(`${prefix}: el nombre del archivo debe ser ${data.id}.json.`);

  if (ids.has(data.id)) errors.push(`${prefix}: ID duplicado.`);
  ids.add(data.id);

  if (!String(data.titulo || '').trim()) errors.push(`${prefix}: falta titulo.`);
  if (!CATEGORIES.has(data.categoria))
    errors.push(`${prefix}: categoria desconocida (${data.categoria}).`);
  if (!String(data.region || '').trim()) errors.push(`${prefix}: falta region.`);
  if (!PUBLICATION_STATES.has(data.estado_publicacion))
    errors.push(`${prefix}: estado_publicacion inválido.`);
  if (!DATA_STATES.has(data.estado_datos))
    errors.push(`${prefix}: estado_datos inválido.`);
  if (String(data.resumen || '').trim().length < 40)
    errors.push(`${prefix}: resumen demasiado breve.`);
  if (!validDate(data.corte_editorial))
    errors.push(`${prefix}: corte_editorial debe ser una fecha válida YYYY-MM-DD.`);
  if (data.fecha_inicio !== null && data.fecha_inicio !== undefined && !validDate(data.fecha_inicio))
    errors.push(`${prefix}: fecha_inicio debe ser null o una fecha válida.`);
  if (String(data.insight || '').trim().length < 30)
    errors.push(`${prefix}: insight demasiado breve.`);
  if (!Array.isArray(data.fuentes)) errors.push(`${prefix}: fuentes debe ser una lista.`);
  if (!Array.isArray(data.historial)) errors.push(`${prefix}: historial debe ser una lista.`);

  const publicable = ['publicado', 'destacado', 'archivado'].includes(
    data.estado_publicacion,
  );

  if (publicable && data.estado_datos !== 'completo')
    errors.push(`${prefix}: un caso ${data.estado_publicacion} debe tener estado_datos completo.`);

  if (data.estado_publicacion === 'destacado' &&
      (!Number.isInteger(data.orden_portada) || data.orden_portada < 0))
    errors.push(`${prefix}: un caso destacado necesita orden_portada entero no negativo.`);

  if (!publicable && data.estado_datos === 'incompleto') {
    const missing = FULL_BLOCKS.filter((field) => data[field] === undefined);
    if (missing.length)
      warnings.push(`${prefix}: borrador incompleto; faltan ${missing.join(', ')}.`);
  }

  if (data.estado_datos === 'completo' || publicable) {
    for (const field of FULL_BLOCKS)
      if (data[field] === undefined) errors.push(`${prefix}: falta ${field}.`);

    if (!Array.isArray(data.fuentes) || data.fuentes.length === 0)
      errors.push(`${prefix}: un caso completo necesita al menos una fuente.`);
    if (!Array.isArray(data.historial) || data.historial.length === 0)
      errors.push(`${prefix}: un caso completo necesita al menos un corte histórico.`);

    const dimensions = data.dimensiones_relevancia;
    if (isObject(dimensions)) {
      for (const key of DIMENSIONS) {
        const value = dimensions[key];
        if (!Number.isInteger(value) || value < 0 || value > 5)
          errors.push(`${prefix}: ${key} debe ser un entero entre 0 y 5.`);
      }
    }

    if (isObject(dimensions) && isObject(data.indices)) {
      const calculatedRelevance = round(
        DIMENSIONS.reduce(
          (total, key) => total + (Number(dimensions[key]) / 5) * WEIGHTS[key],
          0,
        ),
      );
      if (Math.abs(Number(data.indices.relevancia) - calculatedRelevance) > 0.51)
        errors.push(
          `${prefix}: relevancia ${data.indices.relevancia} no coincide con el cálculo ${calculatedRelevance}.`,
        );

      const gap = round(Number(data.indices.atencion) - Number(data.indices.relevancia));
      if (Math.abs(Number(data.indices.brecha) - gap) > 0.01)
        errors.push(`${prefix}: brecha debe ser atención − relevancia (${gap}).`);

      const classification = expectedClassification(gap);
      if (!CLASSIFICATIONS.has(data.indices.clasificacion))
        errors.push(`${prefix}: clasificación desconocida.`);
      else if (data.indices.clasificacion !== classification)
        errors.push(`${prefix}: clasificación debería ser ${classification}.`);
    }

    const attention = data.atencion_mediatica;
    if (isObject(attention) && isObject(data.indices)) {
      const fields = [
        'participacion_pct',
        'amplitud_pct',
        'prominencia_pct',
        'persistencia_pct',
      ];
      for (const key of fields) {
        const value = Number(attention[key]);
        if (!Number.isFinite(value) || value < 0 || value > 100)
          errors.push(`${prefix}: ${key} debe estar entre 0 y 100.`);
      }
      const calculatedAttention = round(
        Number(attention.participacion_pct) * 0.5 +
        Number(attention.amplitud_pct) * 0.25 +
        Number(attention.prominencia_pct) * 0.15 +
        Number(attention.persistencia_pct) * 0.1,
      );
      if (Math.abs(Number(data.indices.atencion) - calculatedAttention) > 0.51)
        errors.push(
          `${prefix}: atención ${data.indices.atencion} no coincide con el cálculo ${calculatedAttention}.`,
        );
    }
  }

  if (isObject(data.migracion)) {
    if (data.migracion.origen !== 'src/data/monitores.json')
      errors.push(`${prefix}: origen de migración desconocido.`);
    if (!isObject(data.migracion.datos_legacy))
      errors.push(`${prefix}: faltan datos_legacy de migración.`);
  }

  return { errors, warnings };
}

if (!fs.existsSync(casesDir)) {
  console.error(`ERROR: no existe ${path.relative(repoRoot, casesDir)}.`);
  process.exit(1);
}

const files = fs
  .readdirSync(casesDir)
  .filter((name) => name.endsWith('.json'))
  .sort();

if (!files.length) {
  console.error('ERROR: no hay casos JSON en src/data/observatorio.');
  process.exit(1);
}

const ids = new Set();
const errors = [];
const warnings = [];

for (const file of files) {
  const fullPath = path.join(casesDir, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${file}: JSON inválido (${error.message}).`);
    continue;
  }
  const result = validateCase(data, file, ids);
  errors.push(...result.errors);
  warnings.push(...result.warnings);
}

console.log(`Observatorio: ${files.length} caso(s) revisado(s).`);

if (warnings.length) {
  console.log('\nADVERTENCIAS');
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error('\nERRORES');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('\nVALIDACIÓN CORRECTA: no se encontraron errores.');
