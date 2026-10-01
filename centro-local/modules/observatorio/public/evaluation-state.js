export const EVALUATION_SCORE_KEYS = Object.freeze([
  'impacto', 'probabilidad', 'alcance', 'persistencia', 'propagacion',
  'subcobertura', 'incertidumbre', 'urgencia', 'cobertura_observada',
]);

export function optionalScore(value) {
  if (value === null || value === undefined || !['string', 'number'].includes(typeof value) || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5 ? Math.round(number) : null;
}

export function normalizeEventEvaluation(event = {}) {
  const unassigned = event.estado_evaluacion === 'no_asignada';
  const original = event.evaluacion || {};
  const evaluacion = Object.fromEntries(EVALUATION_SCORE_KEYS.map((key) => [key, unassigned ? null : optionalScore(original[key])]));
  evaluacion.confianza = unassigned ? null : (String(original.confianza ?? '').trim().slice(0, 40) || null);
  return {
    ...(event.estado_evaluacion ? { estado_evaluacion: event.estado_evaluacion } : {}),
    evaluacion,
  };
}

// Empty editor controls are missing judgments, never numerical zeroes.
export function evaluationFromInputs(values = {}) {
  const result = normalizeEventEvaluation({ evaluacion: values });
  const complete = EVALUATION_SCORE_KEYS.every((key) => result.evaluacion[key] !== null);
  return {
    estado_evaluacion: complete ? 'asignada' : EVALUATION_SCORE_KEYS.some((key) => result.evaluacion[key] !== null) ? 'parcial' : 'no_asignada',
    evaluacion: result.evaluacion,
  };
}

export function hasAssignedEvaluation(event = {}) {
  return event.estado_evaluacion !== 'no_asignada'
    && EVALUATION_SCORE_KEYS.every((key) => optionalScore(event.evaluacion?.[key]) !== null);
}

export function relevance(event) {
  return hasAssignedEvaluation(event)
    ? ['impacto', 'persistencia', 'alcance', 'probabilidad'].reduce((product, key) => product * optionalScore(event.evaluacion[key]), 1)
    : null;
}

export function coverageGap(event) {
  const value = relevance(event);
  return value === null ? null : value / optionalScore(event.evaluacion.cobertura_observada);
}

export function undercoverage(event) {
  return hasAssignedEvaluation(event) ? optionalScore(event.evaluacion.subcobertura) : null;
}

export function metricLabel(value, suffix = '') {
  return value === null || value === undefined ? 'Sin evaluación' : `${value}${suffix}`;
}
