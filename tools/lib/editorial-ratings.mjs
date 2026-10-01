/** Missing editorial ratings are not measurements and never become zero. */
export const isAssignedRating = value => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;

export function hasAssignedRatings(process) {
  return process.estado_evaluacion !== 'no_asignada'
    && isAssignedRating(process.valoraciones?.relevancia_geopolitica)
    && isAssignedRating(process.valoraciones?.atencion_mediatica);
}

export function compareProcessRelevance(left, right) {
  const leftAssigned = hasAssignedRatings(left);
  const rightAssigned = hasAssignedRatings(right);
  if (leftAssigned !== rightAssigned) return leftAssigned ? -1 : 1;
  if (!leftAssigned) return 0;
  return right.valoraciones.relevancia_geopolitica - left.valoraciones.relevancia_geopolitica;
}

export function compareProcessRatings(left, right) {
  const relevanceOrder = compareProcessRelevance(left, right);
  if (relevanceOrder || !hasAssignedRatings(left)) return relevanceOrder;
  return (right.valoraciones.relevancia_geopolitica - right.valoraciones.atencion_mediatica)
      - (left.valoraciones.relevancia_geopolitica - left.valoraciones.atencion_mediatica);
}

export const formatRating = value => isAssignedRating(value) ? value.toFixed(1) : 'Sin asignar';
export const formatRatingGap = value => typeof value === 'number' && Number.isFinite(value)
  ? (value > 0 ? '+' : '') + value.toFixed(1) : 'Sin asignar';
