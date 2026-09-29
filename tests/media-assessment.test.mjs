import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessedMediaScore } from '../tools/lib/media-assessment.mjs';
const records = JSON.parse(fs.readFileSync(new URL('../src/data/public/medios.json', import.meta.url), 'utf8')).records;

test('todo el catálogo respeta la revisión pendiente sin cambiar los datos canónicos', () => {
  for (const record of records) {
    if (record.confianza === 'Por revisar' || record.estado === 'propuesto' || record.puntuacion === null) {
      assert.equal(assessedMediaScore(record), null, record.media_id);
    } else {
      assert.equal(assessedMediaScore(record), record.puntuacion, record.media_id);
    }
  }
  const carnegie = records.find(item => item.media_id === 'carnegie-endowment');
  assert.equal(assessedMediaScore(carnegie), null);
  assert.equal(carnegie.puntuacion, 0);
  assert.equal(assessedMediaScore(records.find(item => item.media_id === 'periodismo-puro')), null);
});

test('una evaluación auténtica de cero sigue siendo cero; una pendiente no es una nota', () => {
  const evaluated = { estado: 'Activo', confianza: 'Baja', puntuacion: 0 };
  assert.equal(assessedMediaScore(evaluated), 0);
  assert.equal(assessedMediaScore({ ...evaluated, confianza: ' Por revisar ' }), null);
  assert.equal(assessedMediaScore({ ...evaluated, estado: 'Propuesto', puntuacion: 4 }), null);
  for (const puntuacion of [null, undefined, NaN, Infinity, -1, 6, '0']) {
    assert.equal(assessedMediaScore({ ...evaluated, puntuacion }), null);
  }
});
