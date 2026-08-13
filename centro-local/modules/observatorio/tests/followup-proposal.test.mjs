import assert from 'node:assert/strict';
import test from 'node:test';

import { diffFollowupProcesses, generateFollowupProposal } from '../lib/followup-proposal.mjs';

function eventFixture() {
  return {
    id: 'corredor-lobito-minerales',
    titulo: 'Corredor de Lobito',
    descripcion: 'Seguimiento estructurado del corredor.',
    indicadores: ['Financiación', 'Capacidad ferroviaria'],
    escenarios: { base: 'Avance gradual', adverso: 'Demoras', transformador: 'Procesamiento local' },
    evaluacion: { impacto: 5, probabilidad: 4, alcance: 4, persistencia: 5, cobertura_observada: 2, incertidumbre: 3, confianza: 'alta' },
    senales: [
      { id: 'sig-verificada', estado_revision: 'revisada', fuente_ids: ['src-verificada'] },
      { id: 'sig-pendiente', estado_revision: 'pendiente', fuente_ids: ['src-pendiente'] },
    ],
    fuentes: [
      { id: 'src-verificada', estado_verificacion: 'verificada' },
      { id: 'src-pendiente', estado_verificacion: 'pendiente' },
    ],
  };
}

function exporter(data) {
  const event = data.macroeventos[0];
  return {
    procesos: [{
      schema_version: 2,
      macroevento_id: event.id,
      titulo: event.titulo,
      sintesis: event.descripcion,
      que_esta_ocurriendo: event.descripcion,
      publicacion: { estado: 'borrador', publicado_el: null, actualizado_el: '2026-08-06' },
      progreso_publico: { etapa: 'borrador', proximo_paso: 'Revisar', hitos_completados: [] },
      clasificacion: { tema_principal_id: 'energia-recursos-estrategicos' },
      por_que_importa: '',
      claves_estructurales: [],
      valoraciones: { relevancia_geopolitica: 4.5, atencion_mediatica: 2, brecha: 2.5, confianza: 'alta', incertidumbre: 3 },
      senales: [{ senal_id: 'sig-verificada', fuente_ids: ['src-verificada'], estado_verificacion: 'verificada' }],
      cronologia: [],
      fuente_ids: ['src-verificada'],
      recurso_visual_ids: [],
      macroevento_relacionado_ids: [],
      indicadores_seguimiento: event.indicadores,
      escenarios: event.escenarios,
    }],
    fuentes: [{ fuente_id: 'src-verificada', estado_verificacion: 'verificada' }],
  };
}

test('genera una propuesta de actualización sin alterar la identidad ni los estados públicos independientes', async () => {
  const event = eventFixture();
  const data = { schema_version: 2, actualizado: '2026-08-06', macroeventos: [event] };
  const original = structuredClone(data);
  const current = {
    macroevento_id: event.id,
    titulo: event.titulo,
    sintesis: 'Síntesis pública anterior.',
    que_esta_ocurriendo: 'Síntesis pública anterior.',
    publicacion: { estado: 'publicado', publicado_el: '2026-07-26', actualizado_el: '2026-07-26' },
    progreso_publico: { etapa: 'publicado', proximo_paso: 'Mantener seguimiento', hitos_completados: ['Publicado'] },
    clasificacion: { tema_principal_id: 'energia-recursos-estrategicos' },
    por_que_importa: 'Contexto editorial ya publicado.',
    claves_estructurales: ['Infraestructura', 'Minerales'],
    valoraciones: { relevancia_geopolitica: 4.5, atencion_mediatica: 2, brecha: 2.5, confianza: 'alta', incertidumbre: 3 },
    senales: [],
    cronologia: [{ fecha: '2026-07-01', titulo: 'Hito' }],
    fuente_ids: [],
    recurso_visual_ids: ['mapa-lobito'],
    macroevento_relacionado_ids: [],
    indicadores_seguimiento: event.indicadores,
    escenarios: event.escenarios,
  };

  const result = await generateFollowupProposal({
    data,
    taxonomy: {},
    eventId: event.id,
    buildPublicPackage: exporter,
    generatedAt: '2026-08-06',
    publicExpedients: { process_by_event: { [event.id]: current } },
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.operation, 'actualizar');
  assert.equal(result.macroevento_id, event.id);
  assert.equal(result.proposed_process.macroevento_id, event.id);
  assert.equal(result.proposed_process.publicacion.estado, 'publicado');
  assert.equal(result.proposed_process.por_que_importa, current.por_que_importa);
  assert.deepEqual(result.proposed_process.cronologia, current.cronologia);
  assert.deepEqual(result.proposed_process.recurso_visual_ids, current.recurso_visual_ids);
  assert.ok(result.diff.some((change) => change.field === 'senales'));
  assert.ok(result.diff.some((change) => change.field === 'fuente_ids'));
  assert.equal(result.metrics.signals_verified, 1);
  assert.equal(result.metrics.signals_exportable, 1);
  assert.equal(result.metrics.sources_verified, 1);
  assert.equal(result.metrics.sources_exportable, 1);
  assert.equal(result.metrics.pending_sources_excluded, 1);
  assert.equal(result.metrics.signals_without_verified_source_excluded, 1);
  assert.deepEqual(data, original, 'La generación no debe mutar los datos canónicos en memoria.');
});

test('propone crear un proceso nuevo y conserva el mismo macroevento_id', async () => {
  const event = eventFixture();
  const result = await generateFollowupProposal({
    data: { schema_version: 2, macroeventos: [event] },
    taxonomy: {},
    eventId: event.id,
    buildPublicPackage: exporter,
    publicExpedients: { process_by_event: {} },
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.operation, 'crear');
  assert.equal(result.identity_preserved, true);
  assert.equal(result.safety.files_created, 0);
  assert.equal(result.safety.files_modified, 0);
  assert.equal(result.safety.markdown_created, false);
});

test('bloquea IDs ausentes o duplicados', async () => {
  const event = eventFixture();
  const missing = await generateFollowupProposal({
    data: { schema_version: 2, macroeventos: [event] },
    eventId: 'inexistente',
    buildPublicPackage: exporter,
  });
  assert.equal(missing.status, 'blocked');
  assert.equal(missing.blocks[0].code, 'missing-event');

  const duplicate = await generateFollowupProposal({
    data: { schema_version: 2, macroeventos: [event, structuredClone(event)] },
    eventId: event.id,
    buildPublicPackage: exporter,
  });
  assert.equal(duplicate.status, 'blocked');
  assert.equal(duplicate.blocks[0].code, 'duplicate-event');
});

test('resume diferencias de señales por identidad estable', () => {
  const changes = diffFollowupProcesses(
    { senales: [{ senal_id: 'sig-1', titulo: 'Anterior' }], fuente_ids: ['src-1'] },
    { senales: [{ senal_id: 'sig-1', titulo: 'Nueva' }, { senal_id: 'sig-2' }], fuente_ids: ['src-1', 'src-2'] },
  );
  const signals = changes.find((change) => change.field === 'senales');
  const sources = changes.find((change) => change.field === 'fuente_ids');
  assert.deepEqual(signals.summary.added, ['sig-2']);
  assert.deepEqual(signals.summary.modified, ['sig-1']);
  assert.deepEqual(sources.summary.added, ['src-2']);
});
