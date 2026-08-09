import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { sessionFileFor } from '../lib/analysis-prompt.mjs';
import {
  applyLocalIntegration,
  planLocalIntegration,
  rollbackLocalIntegration,
} from '../lib/local-integration.mjs';

const EVENT_ID = 'corredor-lobito-minerales';
const POST_ID = 'analisis-lobito-2026-08-08';
const SLUG = 'lobito-competencia-minerales-2026';

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

function markdown(extra = '') {
  return `---
schema_version: 2
post_id: "${POST_ID}"
slug: "${SLUG}"
tipo_publicacion: "analisis"
titulo: "Lobito y los minerales críticos"
subtitulo: "Infraestructura y límites"
resumen: "Un análisis autónomo."
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

## Avance verificable

Contenido aprobado.${extra}
`;
}

function publicProcess(title = 'Corredor de Lobito') {
  return {
    schema_version: 2,
    macroevento_id: EVENT_ID,
    slug: EVENT_ID,
    titulo: title,
    sintesis: 'Seguimiento público.',
    publicacion: { estado: 'publicado', publicado_el: '2026-07-26', actualizado_el: '2026-07-26' },
    clasificacion: { tema_principal_id: null, tema_secundario_ids: [], subtema_ids: [], geografia: { alcance: 'transfronterizo', region_ids: [], subregion_ids: [], pais_ids: [], espacio_ids: [] }, actor_ids: [], etiqueta_ids: [] },
    por_que_importa: 'Importa.',
    senales: [{ senal_id: 'senal-1', fuente_ids: ['src-verificada'] }],
    fuente_ids: ['src-verificada'],
  };
}

function makeFixture(context, { differences = 0 } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-local-integration-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const centerRoot = path.join(root, 'centro-local');
  const siteRoot = path.join(root, 'site');
  const sessionsDir = path.join(centerRoot, 'data', 'sesiones');
  const integrationsDir = path.join(centerRoot, 'data', 'integraciones');
  const applicationsDir = path.join(centerRoot, 'data', 'aplicaciones');
  const backupsDir = path.join(centerRoot, 'data', 'backups');
  const draftsDir = path.join(centerRoot, 'data', 'publicaciones', 'borradores');
  const previewDir = path.join(siteRoot, 'src', 'content', 'publicaciones', '_preview');
  const publishedDir = path.join(siteRoot, 'src', 'content', 'publicaciones', 'publicadas');
  const publicFile = path.join(siteRoot, 'src', 'data', 'public', 'observatorio.json');
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(draftsDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });
  fs.mkdirSync(publishedDir, { recursive: true });
  fs.mkdirSync(path.dirname(publicFile), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, 'package.json'), '{}\n');

  const canonical = markdown();
  const canonicalFile = path.join(draftsDir, `${SLUG}.md`);
  fs.writeFileSync(canonicalFile, canonical);
  const currentProcess = publicProcess();
  const publicData = {
    formato: 'memo-geopolitico-publico',
    schema_version: 2,
    generado_el: '2026-08-01',
    procesos: [currentProcess],
    fuentes: [{ fuente_id: 'src-verificada', titulo: 'Fuente', url: 'https://example.com/verified' }],
    recursos_visuales: [],
    catalogos: {},
  };
  fs.writeFileSync(publicFile, `${JSON.stringify(publicData, null, 2)}\n`);
  const proposedProcess = differences ? publicProcess('Corredor de Lobito actualizado') : currentProcess;
  const proposal = {
    status: 'ready',
    schema_version: 1,
    tipo: 'propuesta-seguimiento',
    generado_el: '2026-08-08',
    macroevento_id: EVENT_ID,
    operation: 'actualizar',
    identity_preserved: true,
    proposed_process: proposedProcess,
    proposed_sources: publicData.fuentes,
    diff: differences ? [{ field: 'titulo', action: 'modificar', before: currentProcess.titulo, after: proposedProcess.titulo }] : [],
  };
  const session = {
    schema_version: 1,
    tipo: 'preparacion-analisis-seguimiento',
    session_id: 'prep-lobito-integracion',
    macroevento_id: EVENT_ID,
    estado: 'aplicacion_local_completada',
    propuesta_seguimiento: proposal,
    respuesta_chatgpt: {
      aprobada_el: '2026-08-08T15:00:00.000Z',
      contenido_normalizado: canonical.trim(),
      hash_sha256: digest(canonical.trim()),
      validacion: {
        estado: 'ready',
        metadata: {
          post_id: POST_ID,
          slug: SLUG,
          macroevento_principal_id: EVENT_ID,
        },
      },
    },
    aplicacion_local: {
      application_id: 'aplicacion-lobito-123456789abc',
      estado: 'aplicada',
      candidate_sha256: digest(Buffer.from(canonical)),
      rollback_estado: 'disponible',
    },
    trazabilidad: {},
    seguridad: { git_ejecutado: false },
  };
  fs.mkdirSync(applicationsDir, { recursive: true });
  fs.writeFileSync(path.join(applicationsDir, `${session.aplicacion_local.application_id}.json`), `${JSON.stringify({
    schema_version: 1,
    tipo: 'aplicacion-local-controlada',
    application_id: session.aplicacion_local.application_id,
    macroevento_id: EVENT_ID,
    estado: 'aplicada',
    analysis: {
      post_id: POST_ID,
      slug: SLUG,
      target_file: canonicalFile,
      candidate_sha256: digest(Buffer.from(canonical)),
    },
    rollback: { estado: 'disponible', ejecutado_el: null },
  }, null, 2)}\n`);
  fs.writeFileSync(sessionFileFor(sessionsDir, EVENT_ID), `${JSON.stringify(session, null, 2)}\n`);
  return {
    root,
    centerRoot,
    siteRoot,
    sessionsDir,
    integrationsDir,
    backupsDir,
    eventId: EVENT_ID,
    currentFollowupProposal: proposal,
    canonicalFile,
    previewFile: path.join(previewDir, `${SLUG}.md`),
    publicFile,
  };
}

test('prepara un plan de integración sin escribir ni crear carpetas transaccionales', (context) => {
  const fixture = makeFixture(context);
  const result = planLocalIntegration(fixture);
  assert.equal(result.status, 'ready');
  assert.equal(result.analysis.operation, 'crear');
  assert.equal(result.followup.operation, 'sin_cambios');
  assert.equal(result.writes.git_operations, 0);
  assert.equal(fs.existsSync(result.analysis.target_file), false);
  assert.equal(fs.existsSync(fixture.integrationsDir), false);
  assert.equal(fs.existsSync(path.join(fixture.backupsDir, 'integraciones')), false);
});

test('reconoce la Fase 7 por su registro y hashes aunque la etiqueta general haya retrocedido', (context) => {
  const fixture = makeFixture(context);
  const sessionFile = sessionFileFor(fixture.sessionsDir, EVENT_ID);
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  session.estado = 'respuesta_aprobada';
  fs.writeFileSync(sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  const result = planLocalIntegration(fixture);
  assert.equal(result.status, 'ready');
  assert.equal(result.analysis.operation, 'crear');
});

test('bloquea un borrador aplicado que no coincide con la última respuesta aprobada', (context) => {
  const fixture = makeFixture(context);
  const sessionFile = sessionFileFor(fixture.sessionsDir, EVENT_ID);
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  session.estado = 'respuesta_aprobada';
  session.respuesta_chatgpt.contenido_normalizado = `${markdown().trim()}\n\nCorrección aprobada.`;
  fs.writeFileSync(sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  const result = planLocalIntegration(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'canonical-approved-response-mismatch');
  assert.equal(fs.existsSync(fixture.previewFile), false);
});

test('integra el análisis en preview, conserva el seguimiento y actualiza la sesión', (context) => {
  const fixture = makeFixture(context);
  const beforePublic = fs.readFileSync(fixture.publicFile);
  const plan = planLocalIntegration(fixture);
  const result = applyLocalIntegration({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    appliedAt: '2026-08-08T16:00:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(fs.readFileSync(fixture.previewFile, 'utf8'), markdown());
  assert.deepEqual(fs.readFileSync(fixture.publicFile), beforePublic);
  assert.equal(fs.existsSync(plan.integration_record.file), true);
  assert.equal(fs.existsSync(path.join(plan.backup.directory, 'MANIFIESTO.json')), true);
  assert.equal(result.session.estado, 'integracion_local_completada');
  assert.equal(result.session.integracion_local.rollback_estado, 'disponible');
  assert.equal(result.session.aplicacion_local.rollback_estado, 'bloqueada_por_integracion');
  assert.equal(result.safety.git_ejecutado, false);
  assert.equal(result.safety.build_ejecutado, false);
});

test('bloquea la integración si el destino cambió después de preparar el plan', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalIntegration(fixture);
  fs.writeFileSync(fixture.previewFile, 'edición posterior\n');
  const result = applyLocalIntegration({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'integration-plan-stale');
  assert.equal(fs.readFileSync(fixture.previewFile, 'utf8'), 'edición posterior\n');
});

test('rechaza post_id repetido en otra publicación del sitio', (context) => {
  const fixture = makeFixture(context);
  const duplicate = markdown().replace(`slug: "${SLUG}"`, 'slug: "otro-slug"');
  fs.writeFileSync(path.join(fixture.siteRoot, 'src', 'content', 'publicaciones', 'publicadas', 'otra.md'), duplicate);
  const result = planLocalIntegration(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'duplicate-publication-post-id');
});

test('integra diferencias de seguimiento y la reversión restaura ambos destinos', (context) => {
  const fixture = makeFixture(context, { differences: 1 });
  const publicBefore = fs.readFileSync(fixture.publicFile);
  const plan = planLocalIntegration(fixture);
  assert.equal(plan.followup.operation, 'modificar');
  const applied = applyLocalIntegration({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  assert.equal(applied.status, 'ready');
  assert.equal(JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8')).procesos[0].titulo, 'Corredor de Lobito actualizado');
  const restored = rollbackLocalIntegration({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    integrationsDir: fixture.integrationsDir,
    eventId: EVENT_ID,
    integrationId: applied.integration.integration_id,
    confirmed: true,
    rolledBackAt: '2026-08-08T17:00:00.000Z',
  });
  assert.equal(restored.status, 'ready');
  assert.equal(fs.existsSync(fixture.previewFile), false);
  assert.deepEqual(fs.readFileSync(fixture.publicFile), publicBefore);
  assert.equal(restored.session.estado, 'aplicacion_local_completada');
  assert.equal(restored.session.aplicacion_local.rollback_estado, 'disponible');
});

test('la reversión protege una edición posterior del preview', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalIntegration(fixture);
  const applied = applyLocalIntegration({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  fs.appendFileSync(fixture.previewFile, '\nEdición manual posterior.\n');
  const restored = rollbackLocalIntegration({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    integrationsDir: fixture.integrationsDir,
    eventId: EVENT_ID,
    integrationId: applied.integration.integration_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'blocked');
  assert.equal(restored.blocks[0].code, 'preview-changed-after-integration');
  assert.match(fs.readFileSync(fixture.previewFile, 'utf8'), /Edición manual posterior/);
});

test('la reversión exige restaurar primero una publicación local activa de Fase 9', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalIntegration(fixture);
  const applied = applyLocalIntegration({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  const sessionFile = sessionFileFor(fixture.sessionsDir, EVENT_ID);
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  session.estado = 'publicacion_local_completada';
  session.publicacion_local = { publication_id: 'publicacion-lobito-activa', estado: 'aplicada' };
  session.integracion_local.rollback_estado = 'bloqueada_por_publicacion';
  fs.writeFileSync(sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  const restored = rollbackLocalIntegration({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    integrationsDir: fixture.integrationsDir,
    eventId: EVENT_ID,
    integrationId: applied.integration.integration_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'blocked');
  assert.equal(restored.blocks[0].code, 'publication-rollback-required');
  assert.equal(fs.existsSync(fixture.previewFile), true);
});

test('la reversión rechaza un registro que apunta fuera de las rutas autorizadas', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalIntegration(fixture);
  const applied = applyLocalIntegration({ ...fixture, expectedPlanId: plan.plan_id, confirmed: true });
  const outside = path.join(fixture.root, 'no-tocar.md');
  fs.writeFileSync(outside, 'preservar\n');
  const record = JSON.parse(fs.readFileSync(plan.integration_record.file, 'utf8'));
  record.analysis.target_file = outside;
  fs.writeFileSync(plan.integration_record.file, `${JSON.stringify(record, null, 2)}\n`);
  const restored = rollbackLocalIntegration({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    integrationsDir: fixture.integrationsDir,
    eventId: EVENT_ID,
    integrationId: applied.integration.integration_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'blocked');
  assert.equal(restored.blocks[0].code, 'unsafe-integration-rollback-record');
  assert.equal(fs.readFileSync(outside, 'utf8'), 'preservar\n');
});

test('un cambio en el borrador canónico bloquea el plan antes de escribir en src', (context) => {
  const fixture = makeFixture(context);
  fs.appendFileSync(fixture.canonicalFile, '\nEdición posterior.\n');
  const result = planLocalIntegration(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'canonical-draft-changed');
  assert.equal(fs.existsSync(fixture.previewFile), false);
});
