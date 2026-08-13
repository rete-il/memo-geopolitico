import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { sessionFileFor } from '../lib/analysis-prompt.mjs';
import {
  applyLocalProcessUpdate,
  planLocalProcessUpdate,
} from '../lib/local-process-update.mjs';

const EVENT_ID = 'chancay-corredores-bioceanicos';
const SOURCE_ID = 'src-chancay-001';

function process(signals = []) {
  return {
    schema_version: 2,
    macroevento_id: EVENT_ID,
    slug: EVENT_ID,
    titulo: 'Chancay y corredores bioceánicos',
    sintesis: 'Seguimiento público.',
    publicacion: { estado: 'publicado', publicado_el: '2026-08-13', actualizado_el: '2026-08-13' },
    progreso_publico: { etapa: 'publicado', proximo_paso: 'Mantener seguimiento.', hitos_completados: [] },
    clasificacion: {
      tema_principal_id: 'infraestructura-conectividad',
      tema_secundario_ids: [],
      subtema_ids: [],
      geografia: { alcance: 'transfronterizo', region_ids: [], subregion_ids: [], pais_ids: [], espacio_ids: [] },
      actor_ids: [],
      etiqueta_ids: [],
    },
    por_que_importa: 'Modifica la conectividad regional.',
    senales: signals,
    fuente_ids: [SOURCE_ID],
  };
}

function makeFixture(context, { validProposal = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-process-update-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const centerRoot = path.join(root, 'centro-local');
  const siteRoot = path.join(root, 'site');
  const sessionsDir = path.join(centerRoot, 'data', 'sesiones');
  const processUpdatesDir = path.join(centerRoot, 'data', 'actualizaciones-proceso');
  const backupsDir = path.join(centerRoot, 'data', 'backups');
  const publicFile = path.join(siteRoot, 'src', 'data', 'public', 'observatorio.json');
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(path.dirname(publicFile), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, 'package.json'), '{}\n');
  const source = {
    fuente_id: SOURCE_ID,
    titulo: 'Fuente verificada',
    url: 'https://example.com/chancay',
    estado_verificacion: 'verificada',
  };
  const publicData = {
    formato: 'memo-geopolitico-publico',
    schema_version: 2,
    generado_el: '2026-08-13',
    procesos: [process([])],
    fuentes: [source],
    catalogos: {
      temas: [{ id: 'infraestructura-conectividad', nombre: 'Infraestructura y conectividad', slug: 'infraestructura-conectividad' }],
      subtemas: [],
      actores: [],
    },
  };
  fs.writeFileSync(publicFile, `${JSON.stringify(publicData, null, 2)}\n`);
  const signals = validProposal ? [{
    senal_id: 'sig-chancay-001',
    titulo: 'Nueva conexión verificada',
    fuente_ids: [SOURCE_ID],
    estado_verificacion: 'verificada',
  }] : [];
  const proposal = {
    status: 'ready',
    macroevento_id: EVENT_ID,
    operation: 'actualizar',
    identity_preserved: true,
    generado_el: '2026-08-13',
    proposed_process: process(signals),
    proposed_sources: [source],
    diff: [{ field: 'senales', action: 'modificar' }],
    metrics: {
      signals_verified: validProposal ? 1 : 0,
      signals_exportable: validProposal ? 1 : 0,
      sources_verified: 1,
      sources_exportable: 1,
    },
  };
  const session = {
    schema_version: 1,
    session_id: 'prep-chancay',
    macroevento_id: EVENT_ID,
    estado: 'publicacion_local_completada',
    propuesta_seguimiento: { ...proposal, proposed_process: process([]) },
    revisiones: { analysis_revision: 'a'.repeat(64), process_revision: 'b'.repeat(64) },
    respuesta_chatgpt: {
      aprobada_el: '2026-08-13T07:21:00.000Z',
      hash_sha256: 'a'.repeat(64),
      validacion: { estado: 'ready' },
    },
    integracion_local: { estado: 'aplicada', rollback_estado: 'bloqueada_por_publicacion' },
    publicacion_local: { estado: 'aplicada', rollback_estado: 'disponible', qa_estado: 'pendiente' },
  };
  const sessionFile = sessionFileFor(sessionsDir, EVENT_ID);
  fs.writeFileSync(sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  return {
    centerRoot,
    siteRoot,
    sessionsDir,
    processUpdatesDir,
    backupsDir,
    eventId: EVENT_ID,
    currentFollowupProposal: proposal,
    publicFile,
    sessionFile,
  };
}

test('prepara en memoria una reparación válida de un proceso publicado sin señales', (context) => {
  const fixture = makeFixture(context);
  const result = planLocalProcessUpdate(fixture);
  assert.equal(result.status, 'ready');
  assert.equal(result.operation, 'modificar');
  assert.equal(result.validation.valid, true);
  assert.equal(result.metrics.signals_verified, 1);
  assert.equal(result.metrics.signals_exportable, 1);
  assert.equal(result.analysis_approval_preserved, true);
  assert.equal(fs.existsSync(fixture.processUpdatesDir), false);
});

test('actualiza solo el expediente público, conserva la aprobación y registra backup', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalProcessUpdate(fixture);
  const result = applyLocalProcessUpdate({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    appliedAt: '2026-08-13T12:30:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.session.estado, 'publicacion_local_completada');
  assert.equal(result.session.respuesta_chatgpt.aprobada_el, '2026-08-13T07:21:00.000Z');
  assert.equal(result.session.actualizacion_proceso.qa_datos, 'valido');
  assert.equal(result.session.publicacion_local.qa_estado, 'pendiente_sitio');
  assert.equal(result.session.publicacion_local.rollback_estado, 'bloqueada_por_actualizacion_proceso');
  const data = JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8'));
  assert.equal(data.procesos[0].senales.length, 1);
  assert.equal(fs.existsSync(result.plan.record.file), true);
  assert.equal(fs.existsSync(path.join(result.plan.backup.directory, 'observatorio-anterior.json')), true);
});

test('rechaza una actualización cuyo resultado publicado continúa sin señales', (context) => {
  const fixture = makeFixture(context, { validProposal: false });
  const result = planLocalProcessUpdate(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'public-projection-invalid');
  assert.match(result.blocks[0].detail, /un proceso publicado requiere señales/);
});

test('detecta un plan obsoleto antes de escribir', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalProcessUpdate(fixture);
  const data = JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8'));
  data.generado_el = '2026-08-14';
  fs.writeFileSync(fixture.publicFile, `${JSON.stringify(data, null, 2)}\n`);
  const result = applyLocalProcessUpdate({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'process-update-plan-stale');
  assert.equal(JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8')).generado_el, '2026-08-14');
});

test('un fallo posterior a la escritura restaura el destino y marca la transacción fallida', (context) => {
  const fixture = makeFixture(context);
  const before = fs.readFileSync(fixture.publicFile);
  const plan = planLocalProcessUpdate(fixture);
  const result = applyLocalProcessUpdate({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    afterTargetWrite() { throw new Error('fallo inducido después de escribir'); },
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'process-update-write-failed');
  assert.deepEqual(fs.readFileSync(fixture.publicFile), before);
  const record = JSON.parse(fs.readFileSync(plan.record.file, 'utf8'));
  assert.equal(record.estado, 'fallida_revertida');
  assert.equal(record.rollback.estado, 'automatica_completada');
  assert.match(record.error.mensaje, /fallo inducido/);
});
