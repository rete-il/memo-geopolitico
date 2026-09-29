import test from 'node:test';
import assert from 'node:assert/strict';
import { latestOpinionReadings } from '../tools/lib/opinion-selection.mjs';
test('la portada prioriza incorporación, excluye borradores y no muta el catálogo', () => {
  const old = {slug:'articulo', estado:'publicado', origen:{fecha:'2026-09-16'}};
  const added = {slug:'entrevista', estado:'publicado', incorporado_el:'2026-09-18', origen:{fecha:'2025-03-24'}};
  const draft = {...added, slug:'borrador', estado:'borrador', incorporado_el:'2026-09-19'};
  const catalog = [old, draft, added];
  assert.deepEqual(latestOpinionReadings(catalog, 1), [added]);
  assert.deepEqual(catalog, [old, draft, added]);
  assert.deepEqual(latestOpinionReadings([]), []);
  assert.deepEqual(latestOpinionReadings(catalog, 0), []);
  assert.deepEqual(latestOpinionReadings([added, {...added, slug:'otra', origen:{fecha:'2026-01-01'}}]).map(x=>x.slug), ['otra','entrevista']);
});
