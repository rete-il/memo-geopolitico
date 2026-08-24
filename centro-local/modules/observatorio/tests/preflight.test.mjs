import assert from 'node:assert/strict';
import test from 'node:test';
import { runPreflight, TRACE_STEPS } from '../public/preflight.js';

function fixture(overrides = {}) {
  const event = {
    id: 'corredor-lobito-minerales',
    titulo: 'Corredor de Lobito',
    descripcion: 'Proceso geopolítico estructural.',
    categoria: 'minerales_recursos_estrategicos',
    regiones: ['África austral'],
    tema_ids: [22],
    palabras_clave: ['Lobito Corridor'],
    indicadores: ['Cierre financiero'],
    estado_verificacion: 'pendiente',
    evaluacion: { incertidumbre: 3 },
    senales: [
      { id: 'sig-1', estado_revision: 'revisada', fuente_ids: ['src-1'] },
      { id: 'sig-2', estado_revision: 'pendiente', fuente_ids: ['src-2'] },
    ],
    fuentes: [
      { id: 'src-1', media_id: 'reuters', medio_catalogado: true, medio: 'Reuters', estado_verificacion: 'verificada' },
      { id: 'src-2', media_id: '', medio_catalogado: false, medio: 'AFC', estado_verificacion: 'pendiente' },
    ],
    advertencias: [],
    excepciones_advertencias: [],
    ...overrides,
  };
  return {
    eventId: event.id,
    data: {
      schema_version: 3,
      macroeventos: [event],
      expedientes_editoriales: [{ id: 'exp-1', macroevento_ids: [event.id] }],
    },
    catalog: {
      records: [{ media_id: 'reuters', region: 'Global', familia: 'Agencia de noticias', perspectiva: 'Global' }],
    },
    config: { requiere_fuentes_para_validar: 2 },
    validation: { valid: true, errors: [], warnings: [] },
    publicExpedients: {
      by_event: { [event.id]: { estado: 'publicado', actualizado_el: '2026-07-23' } },
    },
  };
}

test('clasifica el caso Lobito como preparación con advertencias, no como bloqueo', () => {
  const result = runPreflight(fixture());
  assert.equal(result.status, 'warnings');
  assert.equal(result.blocks.length, 0);
  assert.ok(result.warnings.some((entry) => entry.code === 'pending-sources'));
  assert.ok(result.warnings.some((entry) => entry.code === 'pending-signals'));
  assert.ok(result.information.some((entry) => entry.code === 'prior-publication'));
  assert.ok(result.information.some((entry) => entry.code === 'uncataloged-sources'));
  assert.equal(result.trace.length, 13);
  assert.equal(result.trace[6].status, 'attention');
  assert.equal(result.trace[7].status, 'current');
});

test('bloquea un macroevento_id ausente o duplicado', () => {
  const missing = fixture();
  missing.eventId = 'inexistente';
  const missingResult = runPreflight(missing);
  assert.equal(missingResult.status, 'blocked');
  assert.ok(missingResult.blocks.some((entry) => entry.code === 'missing-event'));

  const duplicated = fixture();
  duplicated.data.macroeventos.push({ ...duplicated.data.macroeventos[0] });
  const duplicateResult = runPreflight(duplicated);
  assert.equal(duplicateResult.status, 'blocked');
  assert.ok(duplicateResult.blocks.some((entry) => entry.code === 'duplicate-event'));
});

test('queda listo cuando la estructura y la evidencia no activan excepciones', () => {
  const input = fixture({
    estado_verificacion: 'verificado',
    senales: [
      { id: 'sig-1', estado_revision: 'verificada', fuente_ids: ['src-1'] },
      { id: 'sig-2', estado_revision: 'verificada', fuente_ids: ['src-2'] },
      { id: 'sig-3', estado_revision: 'verificada', fuente_ids: ['src-3'] },
    ],
    fuentes: [
      { id: 'src-1', media_id: 'reuters', medio_catalogado: true, medio: 'Reuters', estado_verificacion: 'verificada' },
      { id: 'src-2', media_id: 'afp', medio_catalogado: true, medio: 'AFP', estado_verificacion: 'verificada' },
      { id: 'src-3', media_id: 'afc', medio_catalogado: true, medio: 'AFC', estado_verificacion: 'verificada' },
    ],
  });
  input.catalog.records = [
    { media_id: 'reuters', region: 'Global', familia: 'Agencia de noticias', perspectiva: 'Occidental' },
    { media_id: 'afp', region: 'Europa', familia: 'Agencia de noticias', perspectiva: 'Europea' },
    { media_id: 'afc', region: 'África', familia: 'Fuente institucional primaria', perspectiva: 'Africana' },
  ];
  const result = runPreflight(input);
  assert.equal(result.status, 'ready');
  assert.equal(result.blocks.length, 0);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.metrics.verifiedSources, 3);
});

test('mantiene exactamente los trece pasos editoriales', () => {
  assert.equal(TRACE_STEPS.length, 13);
  assert.deepEqual(TRACE_STEPS.map(([number]) => number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
});
