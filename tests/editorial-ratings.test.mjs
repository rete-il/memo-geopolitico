import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAssignedRatings, compareProcessRatings, compareProcessRelevance, formatRating, formatRatingGap } from '../tools/lib/editorial-ratings.mjs';
import { groupMatrixProcesses } from '../tools/lib/matrix-groups.mjs';

const event = (id, relevance, attention, state) => ({
  macroevento_id: id, estado_evaluacion: state,
  valoraciones: { relevancia_geopolitica: relevance, atencion_mediatica: attention, brecha: relevance === null || attention === null ? null : relevance - attention },
});

test('la matriz excluye evaluaciones pendientes y mantiene agrupación de cifras asignadas', () => {
  const assigned = event('a', 4, 2);
  const same = event('b', 4, 2);
  const pending = event('pending', null, null, 'no_asignada');
  const inherited = event('inherited', 3, 3, 'no_asignada');
  const invalid = event('invalid', 0, 2);
  assert.equal(hasAssignedRatings(pending), false);
  assert.equal(hasAssignedRatings(inherited), false);
  const groups = groupMatrixProcesses([pending, assigned, same, inherited, invalid]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].processes.map(item => item.macroevento_id), ['a', 'b']);
  assert.equal(groups[0].attention, 2);
});

test('ordenación mantiene evaluación asignada y deja pendientes fuera del ranking numérico', () => {
  const a = event('a', 4, 4);
  const b = event('b', 4, 2);
  const c = event('c', 5, 5);
  const missing = event('missing', null, null, 'no_asignada');
  assert.deepEqual([missing, a, c, b].sort(compareProcessRatings).map(item => item.macroevento_id), ['c', 'b', 'a', 'missing']);
  assert.equal(compareProcessRelevance(a, b), 0);
  assert.equal(compareProcessRatings(missing, event('missing2', null, null, 'no_asignada')), 0);
});

test('ausencia y cero no se imprimen como una puntuación editorial', () => {
  for (const missing of [undefined, null, '', 0, NaN, Infinity]) assert.equal(formatRating(missing), 'Sin asignar');
  assert.equal(formatRating(4.5), '4.5');
  assert.equal(formatRatingGap(null), 'Sin asignar');
  assert.equal(formatRatingGap(0), '0.0');
  assert.equal(formatRatingGap(1.5), '+1.5');
});
