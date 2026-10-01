import { EVALUATION_SCORE_KEYS } from '../../centro-local/modules/observatorio/public/evaluation-state.js';
import { isAssignedRating } from './editorial-ratings.mjs';

const DIMENSIONS = ['impacto', 'probabilidad', 'alcance', 'persistencia'];
const SCORE_KEYS = [...EVALUATION_SCORE_KEYS, 'confianza'];
const string = value => typeof value === 'string' ? value.trim() : '';
const strings = value => Array.isArray(value) ? value.map(string).filter(Boolean) : [];
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

// A justification describes a particular editorial decision. A later change to
// any of its scores or confidence requires a new justification, not silent reuse.
function sameEvaluation(left, right) {
  return left && right && Object.keys(left).length === SCORE_KEYS.length
    && Object.keys(right).length === SCORE_KEYS.length
    && SCORE_KEYS.every(key => Object.hasOwn(left, key) && Object.hasOwn(right, key) && left[key] === right[key])
    && EVALUATION_SCORE_KEYS.every(key => Number.isInteger(left[key]) && isAssignedRating(left[key]))
    && Boolean(string(left.confianza));
}

export function validateEvaluationBasis(basis, process, sources) {
  const errors = [];
  if (!basis) return errors;
  const fail = message => errors.push(`Fundamento de evaluación: ${message}`);
  const allowed = new Set(process.fuente_ids || []);
  const verifiedSource = id => {
    const source = sources.get(id);
    if (!allowed.has(id) || source?.estado_verificacion !== 'verificada') return false;
    try { return ['https:', 'http:'].includes(new URL(source.url).protocol); } catch { return false; }
  };
  if (process.estado_evaluacion !== 'asignada') fail('requiere una evaluación asignada.');
  if (basis.schema_version !== 1 || basis.caracter !== 'editorial_provisional') fail('versión o carácter inválido.');
  const period = basis.atencion?.periodo || {};
  if (!date(basis.fecha) || !date(period.desde) || !date(period.hasta)
      || period.desde > period.hasta || period.hasta > basis.fecha) fail('fecha o periodo inválido.');
  if (!string(basis.alcance) || !string(basis.confianza_justificacion)) fail('faltan alcance o justificación de confianza.');
  const dimensions = basis.relevancia?.dimensiones || [];
  if (dimensions.length !== 4 || new Set(dimensions.map(item => item.clave)).size !== 4
      || dimensions.some(item => !DIMENSIONS.includes(item.clave))) fail('se requieren las cuatro dimensiones de relevancia.');
  for (const item of dimensions) {
    if (!Number.isInteger(item.valor) || !isAssignedRating(item.valor) || !string(item.justificacion)
        || !item.fuente_ids?.length || item.fuente_ids.some(id => !verifiedSource(id))) fail(`dimensión sin respaldo verificado: ${item.clave}.`);
  }
  const mean = Number((dimensions.reduce((total, item) => total + item.valor, 0) / 4).toFixed(1));
  if (mean !== process.valoraciones?.relevancia_geopolitica) fail('las dimensiones no coinciden con la relevancia publicada.');
  if (!string(basis.relevancia?.resumen) || !string(basis.atencion?.resumen) || !string(basis.atencion?.seleccion)
      || !string(basis.brecha)) fail('faltan explicaciones de las valoraciones.');
  if (!basis.atencion?.criterios?.length || basis.atencion.criterios.some(item => !string(item.criterio) || !string(item.observacion))) fail('faltan criterios de cobertura.');
  if (!basis.atencion?.muestra?.length) fail('falta la muestra periodística.');
  const sampleIds = new Set();
  for (const item of basis.atencion?.muestra || []) {
    const source = sources.get(item.fuente_id);
    if (!verifiedSource(item.fuente_id) || !string(item.origen_editorial) || !string(item.funcion) || !string(item.observacion)) fail(`muestra sin respaldo verificado: ${item.fuente_id}.`);
    if (sampleIds.has(item.fuente_id)) fail(`documento duplicado en la muestra: ${item.fuente_id}.`);
    sampleIds.add(item.fuente_id);
    if (!date(source?.fecha) || source.fecha < period.desde || source.fecha > period.hasta) fail(`documento fuera del periodo: ${item.fuente_id}.`);
  }
  if (!basis.limites?.length || !basis.condiciones_revision?.length) fail('faltan límites o condiciones de revisión.');
  return errors;
}

export function projectEvaluationBasis(event, process, sources) {
  const value = event.fundamento_evaluacion;
  if (!value || !sameEvaluation(value.evaluacion_referenciada, event.evaluacion)
      || process.estado_evaluacion !== 'asignada') return null;
  // Public fields are enumerated explicitly. Internal scores, snapshots, notes
  // and arbitrary URL/HTML properties never cross this projection boundary.
  const basis = {
    schema_version: value.schema_version,
    fecha: string(value.fecha),
    caracter: string(value.caracter),
    alcance: string(value.alcance),
    confianza_justificacion: string(value.confianza_justificacion),
    relevancia: {
      resumen: string(value.relevancia?.resumen),
      dimensiones: (Array.isArray(value.relevancia?.dimensiones) ? value.relevancia.dimensiones : []).map(item => ({
        clave: string(item.clave), valor: item.valor,
        justificacion: string(item.justificacion), fuente_ids: [...new Set(strings(item.fuente_ids))],
      })),
    },
    atencion: {
      resumen: string(value.atencion?.resumen),
      periodo: { desde: string(value.atencion?.periodo?.desde), hasta: string(value.atencion?.periodo?.hasta) },
      seleccion: string(value.atencion?.seleccion),
      criterios: (Array.isArray(value.atencion?.criterios) ? value.atencion.criterios : []).map(item => ({ criterio: string(item.criterio), observacion: string(item.observacion) })),
      muestra: (Array.isArray(value.atencion?.muestra) ? value.atencion.muestra : []).map(item => ({
        fuente_id: string(item.fuente_id), origen_editorial: string(item.origen_editorial),
        funcion: string(item.funcion), observacion: string(item.observacion),
      })),
      exclusiones: strings(value.atencion?.exclusiones),
    },
    brecha: string(value.brecha),
    limites: strings(value.limites),
    condiciones_revision: strings(value.condiciones_revision),
  };
  if (basis.relevancia.dimensiones.some(item => item.valor !== event.evaluacion[item.clave])) return null;
  return validateEvaluationBasis(basis, process, sources).length ? null : basis;
}
