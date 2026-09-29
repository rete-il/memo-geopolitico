/** A pending editorial review is not a negative rating; an evaluated zero is valid. */
export function assessedMediaScore(record) {
  const confidence = String(record.confianza || '').trim().toLocaleLowerCase('es');
  const state = String(record.estado || '').trim().toLocaleLowerCase('es');
  if (confidence === 'por revisar' || state === 'propuesto') return null;
  const score = record.puntuacion;
  return typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 5 ? score : null;
}
