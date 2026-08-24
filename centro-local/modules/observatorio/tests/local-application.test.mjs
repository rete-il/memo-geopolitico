import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { approveAnalysisResponse, saveAnalysisResponse } from '../lib/analysis-response.mjs';
import { sessionFileFor } from '../lib/analysis-prompt.mjs';
import {
  applyLocalApplication,
  planLocalApplication,
  rollbackLocalApplication,
} from '../lib/local-application.mjs';
import { generateReviewPackage } from '../lib/review-package.mjs';

const EVENT_ID = 'corredor-lobito-minerales';

function markdown(extra = '') {
  return `---
schema_version: 2
post_id: "lobito-competencia-minerales-2026"
slug: "lobito-competencia-minerales-2026"
tipo_publicacion: "analisis"
titulo: "Lobito después del cierre financiero"
subtitulo: "Infraestructura, minerales y límites"
resumen: "Un análisis autónomo del corredor y sus incertidumbres."
autor_ids:
  - "rete"
publicacion:
  estado: "borrador"
  publicado_el: null
  actualizado_el: "2026-08-08"
macroevento_principal_id: "${EVENT_ID}"
macroevento_secundario_ids: []
fuente_ids:
  - "src-verificada"
recurso_visual_ids: []
post_relacionado_ids: []
---

## Un avance verificable

La financiación confirma un avance parcial según la [fuente autorizada](https://example.com/verified).

## Límites y escenarios

La integración regional depende de componentes adicionales.${extra}

## Fuentes

- [Fuente autorizada](https://example.com/verified)

<!-- MEMO_ADVERTENCIAS_V1
{
  "schema_version": 1,
  "advertencias_nuevas": []
}
-->
`;
}

function makeFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-local-application-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const centerRoot = path.join(root, 'centro-local');
  const sessionsDir = path.join(centerRoot, 'data', 'sesiones');
  const packagesDir = path.join(centerRoot, 'data', 'paquetes');
  const draftsDir = path.join(centerRoot, 'data', 'publicaciones', 'borradores');
  const applicationsDir = path.join(centerRoot, 'data', 'aplicaciones');
  const backupsDir = path.join(centerRoot, 'data', 'backups');
  const projectRoot = path.join(root, 'site');
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(path.join(projectRoot, 'src', 'content', 'publicaciones', 'publicadas'), { recursive: true });
  const data = {
    schema_version: 2,
    macroeventos: [{
      id: EVENT_ID,
      fuentes: [{ id: 'src-verificada', estado_verificacion: 'verificada', url: 'https://example.com/verified' }],
    }],
  };
  const proposal = {
    status: 'ready',
    schema_version: 1,
    tipo: 'propuesta-seguimiento',
    generado_el: '2026-08-08',
    macroevento_id: EVENT_ID,
    operation: 'actualizar',
    base: { existe: true, actualizado_el: '2026-08-01' },
    identity_preserved: true,
    proposed_process: { macroevento_id: EVENT_ID, titulo: 'Corredor de Lobito', senales: [], fuente_ids: ['src-verificada'] },
    proposed_sources: [{ fuente_id: 'src-verificada', url: 'https://example.com/verified' }],
    diff: [],
    metrics: { changes: 0, signals: 0, sources: 1, pending_sources_excluded: 0, signals_without_verified_source_excluded: 0 },
    safety: { files_created: 0, files_modified: 0, markdown_created: false, canonical_data_modified: false },
  };
  const session = {
    schema_version: 1,
    tipo: 'preparacion-analisis-seguimiento',
    session_id: 'prep-corredor-lobito-minerales-20260808',
    macroevento_id: EVENT_ID,
    estado: 'esperando_respuesta',
    creado_el: '2026-08-08T10:00:00.000Z',
    actualizado_el: '2026-08-08T10:00:00.000Z',
    resultados_seleccionados: ['proceso_en_evolucion', 'analisis_completo'],
    decision_advertencias: { justificacion: 'Continuar solo con la evidencia verificada disponible.' },
    propuesta_seguimiento: proposal,
    prompt_analisis: {
      template: { id: 'memo-analisis-completo', version: '1.1' },
      variables: { fuentes_verificadas: ['src-verificada'], fuentes_reservadas: [] },
      content: 'Prompt exacto de prueba',
    },
    respuesta_chatgpt: null,
    trazabilidad: { pasos_completados: [1, 2, 3, 8, 9, 10], siguiente_paso: 11 },
    seguridad: { archivos_canonicos_creados: 0, archivos_canonicos_modificados: 0, archivos_sesion_escritos: 1, git_ejecutado: false },
  };
  fs.writeFileSync(sessionFileFor(sessionsDir, EVENT_ID), `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  const saved = saveAnalysisResponse({ sessionsDir, data, projectRoot, eventId: EVENT_ID, markdown: markdown() });
  assert.equal(saved.status, 'ready');
  const approved = approveAnalysisResponse({
    sessionsDir,
    eventId: EVENT_ID,
    expectedHash: saved.validation.hash_sha256,
    approvedAt: '2026-08-08T12:00:00.000Z',
  });
  assert.equal(approved.status, 'ready');
  const packaged = generateReviewPackage({
    sessionsDir,
    packagesDir,
    data,
    projectRoot,
    eventId: EVENT_ID,
    currentFollowupProposal: proposal,
    generatedAt: '2026-08-08T13:00:00.000Z',
  });
  assert.equal(packaged.status, 'ready');
  return {
    root,
    centerRoot,
    sessionsDir,
    packagesDir,
    draftsDir,
    applicationsDir,
    backupsDir,
    projectRoot,
    data,
    currentFollowupProposal: proposal,
    eventId: EVENT_ID,
    packaged,
  };
}

test('prepara un plan verificable sin escribir el borrador ni crear carpetas de aplicación', (context) => {
  const fixture = makeFixture(context);
  const result = planLocalApplication(fixture);
  assert.equal(result.status, 'ready');
  assert.equal(result.analysis.operation, 'crear');
  assert.equal(result.writes.canonical_created, 1);
  assert.equal(result.writes.git_operations, 0);
  assert.equal(fs.existsSync(result.analysis.target_file), false);
  assert.equal(fs.existsSync(fixture.applicationsDir), false);
  assert.equal(fs.existsSync(fixture.backupsDir), false);
});

test('aplica el análisis como borrador canónico con registro, backup y sesión actualizada', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalApplication(fixture);
  const result = applyLocalApplication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    appliedAt: '2026-08-08T14:00:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.reused, false);
  assert.equal(fs.existsSync(plan.analysis.target_file), true);
  const expectedMarkdown = `${markdown().replace(/\n<!-- MEMO_ADVERTENCIAS_V1[\s\S]*$/, '').trimEnd()}\n`;
  assert.equal(fs.readFileSync(plan.analysis.target_file, 'utf8'), expectedMarkdown);
  assert.equal(fs.existsSync(plan.application_record.file), true);
  assert.equal(fs.existsSync(path.join(plan.backup.directory, 'MANIFIESTO.json')), true);
  assert.equal(result.session.estado, 'aplicacion_local_completada');
  assert.equal(result.session.aplicacion_local.rollback_estado, 'disponible');
  assert.equal(result.safety.archivos_publicos_modificados, 0);
  assert.equal(result.safety.git_ejecutado, false);
});

test('bloquea la aplicación si el destino cambió después de preparar el plan', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalApplication(fixture);
  fs.mkdirSync(fixture.draftsDir, { recursive: true });
  fs.writeFileSync(plan.analysis.target_file, 'edición posterior\n', 'utf8');
  const result = applyLocalApplication({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'application-plan-stale');
  assert.equal(fs.readFileSync(plan.analysis.target_file, 'utf8'), 'edición posterior\n');
});

test('rechaza identidades repetidas en otro borrador canónico', (context) => {
  const fixture = makeFixture(context);
  fs.mkdirSync(fixture.draftsDir, { recursive: true });
  fs.writeFileSync(path.join(fixture.draftsDir, 'otro.md'), markdown().replace('slug: "lobito-competencia-minerales-2026"', 'slug: "otro-slug"'), 'utf8');
  const result = planLocalApplication(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'duplicate-draft-post-id');
});

test('respalda un borrador anterior y la reversión lo restaura', (context) => {
  const fixture = makeFixture(context);
  fs.mkdirSync(fixture.draftsDir, { recursive: true });
  const target = path.join(fixture.draftsDir, 'lobito-competencia-minerales-2026.md');
  const previous = markdown('\n\nVersión anterior.');
  fs.writeFileSync(target, previous, 'utf8');
  const plan = planLocalApplication(fixture);
  assert.equal(plan.analysis.operation, 'modificar');
  const applied = applyLocalApplication({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  assert.equal(applied.status, 'ready');
  assert.notEqual(fs.readFileSync(target, 'utf8'), previous);
  const restored = rollbackLocalApplication({
    centerRoot: fixture.centerRoot,
    sessionsDir: fixture.sessionsDir,
    applicationsDir: fixture.applicationsDir,
    eventId: EVENT_ID,
    applicationId: applied.application.application_id,
    confirmed: true,
    rolledBackAt: '2026-08-08T15:00:00.000Z',
  });
  assert.equal(restored.status, 'ready');
  assert.equal(restored.restored.action, 'archivo_anterior_restaurado');
  assert.equal(fs.readFileSync(target, 'utf8'), previous);
});

test('la reversión elimina un borrador creado y conserva la sesión aprobada', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalApplication(fixture);
  const applied = applyLocalApplication({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  const restored = rollbackLocalApplication({
    centerRoot: fixture.centerRoot,
    sessionsDir: fixture.sessionsDir,
    applicationsDir: fixture.applicationsDir,
    eventId: EVENT_ID,
    applicationId: applied.application.application_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'ready');
  assert.equal(restored.restored.action, 'archivo_creado_eliminado');
  assert.equal(fs.existsSync(plan.analysis.target_file), false);
  assert.equal(restored.session.estado, 'respuesta_aprobada');
  assert.equal(restored.session.paquete_revision.estado, 'archivos_preparados');
});

test('la reversión protege ediciones realizadas después de aplicar', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalApplication(fixture);
  const applied = applyLocalApplication({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  fs.appendFileSync(plan.analysis.target_file, '\nEdición manual posterior.\n');
  const restored = rollbackLocalApplication({
    centerRoot: fixture.centerRoot,
    sessionsDir: fixture.sessionsDir,
    applicationsDir: fixture.applicationsDir,
    eventId: EVENT_ID,
    applicationId: applied.application.application_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'blocked');
  assert.equal(restored.blocks[0].code, 'draft-changed-after-application');
  assert.match(fs.readFileSync(plan.analysis.target_file, 'utf8'), /Edición manual posterior/);
});

test('la reversión de Fase 7 se bloquea mientras una integración de Fase 8 está activa', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalApplication(fixture);
  const applied = applyLocalApplication({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  const sessionFile = sessionFileFor(fixture.sessionsDir, EVENT_ID);
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  session.estado = 'integracion_local_completada';
  session.integracion_local = { estado: 'aplicada', rollback_estado: 'disponible' };
  fs.writeFileSync(sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  const restored = rollbackLocalApplication({
    centerRoot: fixture.centerRoot,
    sessionsDir: fixture.sessionsDir,
    applicationsDir: fixture.applicationsDir,
    eventId: EVENT_ID,
    applicationId: applied.application.application_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'blocked');
  assert.equal(restored.blocks[0].code, 'integration-active');
  assert.equal(fs.existsSync(plan.analysis.target_file), true);
});

test('la reversión rechaza un registro que señala fuera de las carpetas autorizadas', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalApplication(fixture);
  const applied = applyLocalApplication({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  const outsideFile = path.join(fixture.root, 'no-tocar.md');
  fs.copyFileSync(plan.analysis.target_file, outsideFile);
  const applicationFile = plan.application_record.file;
  const tampered = JSON.parse(fs.readFileSync(applicationFile, 'utf8'));
  tampered.analysis.target_file = outsideFile;
  fs.writeFileSync(applicationFile, `${JSON.stringify(tampered, null, 2)}\n`, 'utf8');
  const restored = rollbackLocalApplication({
    centerRoot: fixture.centerRoot,
    sessionsDir: fixture.sessionsDir,
    applicationsDir: fixture.applicationsDir,
    eventId: EVENT_ID,
    applicationId: applied.application.application_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'blocked');
  assert.equal(restored.blocks[0].code, 'unsafe-rollback-record');
  assert.equal(fs.existsSync(outsideFile), true);
  assert.equal(fs.existsSync(plan.analysis.target_file), true);
});

test('un ZIP alterado bloquea el plan antes de cualquier escritura canónica', (context) => {
  const fixture = makeFixture(context);
  fs.appendFileSync(path.join(fixture.packagesDir, fixture.packaged.file.name), 'alterado');
  const result = planLocalApplication(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'package-hash-mismatch');
  assert.equal(fs.existsSync(fixture.draftsDir), false);
});
