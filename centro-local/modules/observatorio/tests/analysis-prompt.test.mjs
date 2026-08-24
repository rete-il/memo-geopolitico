import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ANALYSIS_PROMPT_TEMPLATE_ID,
  ANALYSIS_PROMPT_TEMPLATE_VERSION,
  buildAnalysisPrompt,
  createAnalysisPromptSession,
  loadAnalysisPromptSession,
  sessionFileFor,
} from '../lib/analysis-prompt.mjs';

function fixture() {
  const event = {
    id: 'corredor-lobito-minerales',
    titulo: 'Corredor de Lobito',
    descripcion: 'Proceso estructural sobre logística y minerales críticos.',
    regiones: ['África austral'],
    actores: ['Angola', 'RDC', 'Zambia'],
    intereses: ['Cobre', 'Cobalto'],
    indicadores: ['Financiación ferroviaria'],
    escenarios: { base: 'Avance gradual', adverso: 'Demoras', transformador: 'Procesamiento local' },
    fuentes: [
      {
        id: 'src-verificada', media_id: 'reuters', medio_catalogado: true, medio: 'Reuters',
        titulo: 'Financing advances', fecha: '2026-07-01', idioma: 'en', tipo: 'noticia',
        url: 'https://example.com/verified', estado_verificacion: 'verificada', observaciones: 'Confirma financiación parcial.',
      },
      {
        id: 'src-pendiente', medio: 'AFC', titulo: 'Institutional release',
        url: 'https://example.com/pending', estado_verificacion: 'pendiente',
      },
    ],
    senales: [
      { id: 'sig-verificada', fecha: '2026-07-01', titulo: 'Financiación parcial', descripcion: 'Avance verificable.', estado_revision: 'revisada', fuente_ids: ['src-verificada'] },
      { id: 'sig-pendiente', fecha: '2026-07-02', titulo: 'Expansión futura', descripcion: 'Todavía pendiente.', estado_revision: 'pendiente', fuente_ids: ['src-pendiente'] },
    ],
  };
  const data = {
    schema_version: 2,
    macroeventos: [event],
    expedientes_editoriales: [{
      id: 'exp-lobito',
      macroevento_ids: [event.id],
      titulo_trabajo: 'Lobito y la competencia por minerales críticos',
      pregunta_editorial: '¿Qué convierte a Lobito en una pieza geopolítica?',
      tesis_central: 'El corredor combina infraestructura, financiación y competencia estratégica.',
      extension_objetivo: 1800,
      incertidumbres: ['La financiación no cubre todos los componentes.'],
      actualizado: '2026-08-06',
    }],
  };
  const catalog = {
    records: [{ media_id: 'reuters', familia: 'Agencia', region: 'Global', perspectiva: 'Global', confianza: 'Alta', corroboracion: 'Baja' }],
  };
  const followupProposal = {
    status: 'ready',
    macroevento_id: event.id,
    proposed_process: {
      macroevento_id: event.id,
      clasificacion: {
        tema_principal_id: 'energia-recursos-estrategicos',
        tema_secundario_ids: ['infraestructura-conectividad'],
        subtema_ids: ['corredores-estrategicos'],
        geografia: { alcance: 'transfronterizo', region_ids: ['africa'], subregion_ids: ['africa-austral'], pais_ids: [], espacio_ids: [] },
        actor_ids: ['angola', 'rdc', 'zambia'],
        etiqueta_ids: [],
      },
    },
  };
  return {
    event,
    data,
    catalog,
    followupProposal,
    publicExpedients: { by_event: { [event.id]: { estado: 'publicado', actualizado_el: '2026-07-26' } } },
  };
}

test('genera un prompt controlado con identidad, evidencia verificada y contrato Markdown', () => {
  const input = fixture();
  const result = buildAnalysisPrompt({
    ...input,
    eventId: input.event.id,
    warningJustification: 'Trabajar solo con la evidencia ya verificada.',
    generatedAt: '2026-08-06',
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.template.id, ANALYSIS_PROMPT_TEMPLATE_ID);
  assert.equal(result.template.version, ANALYSIS_PROMPT_TEMPLATE_VERSION);
  assert.deepEqual(result.variables.fuentes_verificadas, ['src-verificada']);
  assert.deepEqual(result.variables.fuentes_reservadas, ['src-pendiente']);
  assert.deepEqual(result.variables.senales_incorporables, ['sig-verificada']);
  assert.deepEqual(result.variables.senales_reservadas, ['sig-pendiente']);
  assert.match(result.content, /macroevento_principal_id: "corredor-lobito-minerales"/);
  assert.match(result.content, /post_id: "\[PROPONER-ID-NUEVO-Y-UNICO\]"/);
  assert.match(result.content, /fuente_id: src-verificada/);
  assert.match(result.content, /Fuente reservada: src-pendiente/);
  assert.match(result.content, /no sobrescribas ni presentes como duplicado/i);
  assert.match(result.content, /MEMO_ADVERTENCIAS_V1/);
  assert.match(result.content, /advertencias_nuevas/);
  assert.match(result.content, /una advertencia separada por cada problema concreto/i);
  assert.doesNotMatch(result.content, /marcá \[VERIFICAR/);
});

test('crea o actualiza una única sesión local y no muta los datos canónicos', (context) => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-analysis-session-'));
  context.after(() => fs.rmSync(sessionsDir, { recursive: true, force: true }));
  const input = fixture();
  const original = structuredClone(input.data);
  const first = createAnalysisPromptSession({
    ...input,
    sessionsDir,
    eventId: input.event.id,
    warningJustification: 'Continuar con alcance limitado y verificable.',
    generatedAt: '2026-08-06',
    generatedTimestamp: '2026-08-06T12:00:00.000Z',
  });

  assert.equal(first.status, 'ready');
  assert.equal(first.file.operation, 'creado');
  assert.equal(first.session.estado, 'esperando_respuesta');
  assert.deepEqual(first.session.trazabilidad.pasos_completados, [1, 2, 3, 8, 9, 10]);
  assert.equal(first.session.seguridad.archivos_canonicos_modificados, 0);
  assert.equal(first.session.seguridad.archivos_sesion_escritos, 1);
  assert.deepEqual(input.data, original);
  assert.deepEqual(fs.readdirSync(sessionsDir), ['preparacion-corredor-lobito-minerales.json']);

  const second = createAnalysisPromptSession({
    ...input,
    sessionsDir,
    eventId: input.event.id,
    editorialFocus: 'Enfatizar la brecha entre ferrocarril e integración regional.',
    generatedAt: '2026-08-06',
    generatedTimestamp: '2026-08-06T12:30:00.000Z',
  });
  assert.equal(second.file.operation, 'actualizado');
  assert.equal(second.session.session_id, first.session.session_id);
  assert.equal(second.session.prompt_analisis.variables.enfoque_editorial, 'Enfatizar la brecha entre ferrocarril e integración regional.');
  assert.deepEqual(fs.readdirSync(sessionsDir), ['preparacion-corredor-lobito-minerales.json']);
});

test('recupera la preparación pendiente desde su archivo estable', (context) => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-analysis-resume-'));
  context.after(() => fs.rmSync(sessionsDir, { recursive: true, force: true }));
  const input = fixture();
  createAnalysisPromptSession({ ...input, sessionsDir, eventId: input.event.id });

  const restored = loadAnalysisPromptSession({ sessionsDir, eventId: input.event.id });
  assert.equal(restored.status, 'ready');
  assert.equal(restored.session.estado, 'esperando_respuesta');
  assert.equal(restored.session.prompt_analisis.template.version, ANALYSIS_PROMPT_TEMPLATE_VERSION);
  assert.equal(path.basename(sessionFileFor(sessionsDir, input.event.id)), restored.file.name);
});

test('recupera también una sesión después de la aplicación local controlada', (context) => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-analysis-applied-resume-'));
  context.after(() => fs.rmSync(sessionsDir, { recursive: true, force: true }));
  const input = fixture();
  const created = createAnalysisPromptSession({ ...input, sessionsDir, eventId: input.event.id });
  assert.equal(created.status, 'ready');
  const file = sessionFileFor(sessionsDir, input.event.id);
  const session = JSON.parse(fs.readFileSync(file, 'utf8'));
  session.estado = 'aplicacion_local_completada';
  session.aplicacion_local = {
    application_id: 'aplicacion-corredor-lobito-minerales-prueba',
    estado: 'aplicada',
  };
  fs.writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  const loaded = loadAnalysisPromptSession({ sessionsDir, eventId: input.event.id });
  assert.equal(loaded.status, 'ready');
  assert.equal(loaded.session.estado, 'aplicacion_local_completada');
  assert.equal(loaded.session.aplicacion_local.estado, 'aplicada');
});

test('bloquea identidades inválidas o una propuesta de otro macroevento', () => {
  const input = fixture();
  const missing = buildAnalysisPrompt({ ...input, eventId: 'inexistente' });
  assert.equal(missing.status, 'blocked');
  assert.equal(missing.blocks[0].code, 'missing-event');

  const mismatch = buildAnalysisPrompt({
    ...input,
    eventId: input.event.id,
    followupProposal: { ...input.followupProposal, macroevento_id: 'otro-proceso' },
  });
  assert.equal(mismatch.status, 'blocked');
  assert.equal(mismatch.blocks[0].code, 'followup-proposal-required');

  assert.throws(() => sessionFileFor('/tmp', '../escape'), /inválido/);
});
