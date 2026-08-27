import assert from 'node:assert/strict';
import test from 'node:test';
import {
  editorialVocabularyRecord,
  normalizeEditorialVocabularies,
} from '../public/editorial-vocabularies.js';

test('unifica idiomas y caracterizaciones históricas sin duplicar valores', () => {
  const events = [{
    fuentes: [
      { idioma: 'Inglés', tipo: 'Noticia de agencia' },
      { idioma: 'en', tipo: 'noticia_de_agencia' },
    ],
    senales: [{ tipo: 'Acuerdo defensa' }],
    advertencias: [
      { tipo: 'insuficiencia-evidencia' },
      { tipo: 'insuficiencia_evidencia' },
    ],
  }];
  const result = normalizeEditorialVocabularies({}, events);

  assert.equal(result.idiomas.filter((item) => item.id === 'en').length, 1);
  assert.equal(result.tipos_fuente.filter((item) => item.id === 'noticia_de_agencia').length, 1);
  assert.equal(result.tipos_advertencia.filter((item) => item.id === 'insuficiencia_evidencia').length, 1);
});

test('conserva ID, descripción, alias, estado y sugerencias administradas', () => {
  const result = normalizeEditorialVocabularies({
    tipos_advertencia: [{
      id: 'inferencia_analitica',
      nombre: 'Inferencia analítica',
      descripcion: 'Distingue una evaluación del dato comprobado.',
      aliases: ['inferencia-analitica'],
      estado: 'archivada',
      tratamiento_sugerido: 'observacion_posterior',
      prioridad_sugerida: 'baja',
    }],
  }, []);
  const item = editorialVocabularyRecord(result, 'tipos_advertencia', 'inferencia-analitica');

  assert.equal(item.id, 'inferencia_analitica');
  assert.equal(item.estado, 'archivada');
  assert.deepEqual(item.aliases, ['inferencia_analitica']);
  assert.equal(item.tratamiento_sugerido, 'observacion_posterior');
  assert.equal(item.prioridad_sugerida, 'baja');
});
