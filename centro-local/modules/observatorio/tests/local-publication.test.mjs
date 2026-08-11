import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { sessionFileFor } from '../lib/analysis-prompt.mjs';
import {
  applyLocalPublication,
  planLocalPublication,
  rollbackLocalPublication,
} from '../lib/local-publication.mjs';

const EVENT_ID = 'corredor-lobito-minerales';
const POST_ID = 'analisis-lobito-2026-08-08';
const SLUG = 'lobito-competencia-minerales-2026';
const PUBLISHED_ON = '2026-08-09';

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

Contenido revisado.${extra}
`;
}

function publicMarkdown(title = 'Lobito y los minerales críticos') {
  return markdown().replace('estado: "borrador"', 'estado: "publicado"')
    .replace('publicado_el: null', `publicado_el: "${PUBLISHED_ON}"`)
    .replace('actualizado_el: "2026-08-08"', `actualizado_el: "${PUBLISHED_ON}"`)
    .replace('titulo: "Lobito y los minerales críticos"', `titulo: "${title}"`);
}

function makeFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-local-publication-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const centerRoot = path.join(root, 'centro-local');
  const siteRoot = path.join(root, 'site');
  const sessionsDir = path.join(centerRoot, 'data', 'sesiones');
  const publicationsDir = path.join(centerRoot, 'data', 'promociones');
  const backupsDir = path.join(centerRoot, 'data', 'backups');
  const previewDir = path.join(siteRoot, 'src', 'content', 'publicaciones', '_preview');
  const publishedDir = path.join(siteRoot, 'src', 'content', 'publicaciones', 'publicadas');
  const previewFile = path.join(previewDir, `${SLUG}.md`);
  const publishedFile = path.join(publishedDir, `${SLUG}.md`);
  const publicFile = path.join(siteRoot, 'src', 'data', 'public', 'observatorio.json');
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });
  fs.mkdirSync(publishedDir, { recursive: true });
  fs.mkdirSync(path.dirname(publicFile), { recursive: true });
  fs.writeFileSync(path.join(siteRoot, 'package.json'), '{}\n');
  fs.writeFileSync(previewFile, markdown());
  fs.writeFileSync(publicFile, `${JSON.stringify({
    formato: 'memo-geopolitico-publico',
    schema_version: 2,
    generado_el: '2026-08-08',
    procesos: [{ macroevento_id: EVENT_ID, slug: EVENT_ID, titulo: 'Corredor de Lobito' }],
    fuentes: [{ fuente_id: 'src-verificada', titulo: 'Fuente', url: 'https://example.com/fuente' }],
  }, null, 2)}\n`);
  const session = {
    schema_version: 1,
    tipo: 'preparacion-analisis-seguimiento',
    macroevento_id: EVENT_ID,
    estado: 'integracion_local_completada',
    respuesta_chatgpt: {
      validacion: {
        estado: 'ready',
        metadata: {
          post_id: POST_ID,
          slug: SLUG,
          macroevento_principal_id: EVENT_ID,
        },
      },
    },
    aplicacion_local: { estado: 'aplicada', rollback_estado: 'bloqueada_por_integracion' },
    integracion_local: {
      integration_id: 'integracion-lobito-123456789abc',
      estado: 'aplicada',
      analysis_sha256: digest(Buffer.from(markdown())),
      rollback_estado: 'disponible',
    },
    trazabilidad: {},
    seguridad: { git_ejecutado: false },
  };
  const sessionFile = sessionFileFor(sessionsDir, EVENT_ID);
  fs.writeFileSync(sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  return {
    root,
    centerRoot,
    siteRoot,
    sessionsDir,
    publicationsDir,
    backupsDir,
    eventId: EVENT_ID,
    publishedOn: PUBLISHED_ON,
    previewFile,
    publishedFile,
    publicFile,
    sessionFile,
  };
}

test('prepara la publicación local sin escribir archivos ni carpetas transaccionales', (context) => {
  const fixture = makeFixture(context);
  const result = planLocalPublication(fixture);
  assert.equal(result.status, 'ready');
  assert.equal(result.analysis.operation, 'crear');
  assert.equal(result.analysis.target_relative, `src\\content\\publicaciones\\publicadas\\${SLUG}.md`);
  assert.equal(result.editorial_gate.unresolved_markers, 0);
  assert.equal(result.writes.git_operations, 0);
  assert.equal(fs.existsSync(fixture.publishedFile), false);
  assert.equal(fs.existsSync(fixture.publicationsDir), false);
  assert.equal(fs.existsSync(path.join(fixture.backupsDir, 'publicaciones')), false);
});

test('publica localmente con estado y fechas públicas sin modificar el preview', (context) => {
  const fixture = makeFixture(context);
  const previewBefore = fs.readFileSync(fixture.previewFile);
  const plan = planLocalPublication(fixture);
  const result = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
    appliedAt: '2026-08-09T08:00:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.reused, false);
  assert.equal(fs.readFileSync(fixture.publishedFile, 'utf8'), publicMarkdown());
  assert.deepEqual(fs.readFileSync(fixture.previewFile), previewBefore);
  const publicData = JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8'));
  const publicProcess = publicData.procesos.find((process) => process.macroevento_id === EVENT_ID);
  assert.equal(publicProcess.publicacion.estado, 'publicado');
  assert.equal(publicProcess.publicacion.publicado_el, PUBLISHED_ON);
  assert.equal(publicProcess.publicacion.actualizado_el, PUBLISHED_ON);
  assert.equal(publicProcess.progreso_publico.etapa, 'publicado');
  assert.equal(publicProcess.progreso_publico.proximo_paso, 'Mantener actualizado el expediente a medida que aparezcan nuevas señales verificadas.');
  assert.deepEqual(publicProcess.progreso_publico.hitos_completados, [
    'Expediente abierto y clasificado',
    'Revisión editorial completada',
    'Análisis publicado',
  ]);
  assert.equal(fs.existsSync(plan.publication_record.file), true);
  assert.equal(fs.existsSync(path.join(plan.backup.directory, 'MANIFIESTO.json')), true);
  assert.equal(result.session.estado, 'publicacion_local_completada');
  assert.equal(result.session.publicacion_local.rollback_estado, 'disponible');
  assert.equal(result.session.integracion_local.rollback_estado, 'bloqueada_por_publicacion');
  assert.equal(result.safety.publicacion_internet_realizada, false);
  assert.equal(result.safety.git_ejecutado, false);
});

test('repara el expediente público aunque el Markdown de producción ya coincida', (context) => {
  const fixture = makeFixture(context);
  fs.writeFileSync(fixture.publishedFile, publicMarkdown());
  const plan = planLocalPublication(fixture);
  assert.equal(plan.status, 'ready');
  assert.equal(plan.analysis.operation, 'sin_cambios');
  assert.equal(plan.public_expedient.operation, 'modificar');
  const result = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.reused, false);
  const publicData = JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8'));
  const publicProcess = publicData.procesos.find((process) => process.macroevento_id === EVENT_ID);
  assert.equal(publicProcess.publicacion.estado, 'publicado');
  assert.equal(result.session.publicacion_local.operation, 'sin_cambios');
  assert.equal(result.session.publicacion_local.public_expedient_operation, 'modificar');
});

test('exige una confirmación humana que incluya la revisión editorial, factual y visual', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalPublication(fixture);
  const result = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: false,
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'publication-confirmation-required');
  assert.equal(fs.existsSync(fixture.publishedFile), false);
});

test('rechaza un plan obsoleto si el destino cambia antes de confirmar', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalPublication(fixture);
  fs.writeFileSync(fixture.publishedFile, publicMarkdown('Edición concurrente'));
  const result = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'publication-plan-stale');
  assert.match(fs.readFileSync(fixture.publishedFile, 'utf8'), /Edición concurrente/);
});

test('bloquea marcadores editoriales internos antes de crear el plan', (context) => {
  const fixture = makeFixture(context);
  const content = markdown('\n\n[VERIFICAR: falta una fuente independiente].');
  fs.writeFileSync(fixture.previewFile, content);
  const session = JSON.parse(fs.readFileSync(fixture.sessionFile, 'utf8'));
  session.integracion_local.analysis_sha256 = digest(Buffer.from(content));
  fs.writeFileSync(fixture.sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  const result = planLocalPublication(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'unresolved-editorial-markers');
  assert.match(result.blocks[0].detail, /VERIFICAR: 1/);
  assert.match(result.blocks[0].detail, /Fase 8/);
  assert.match(result.blocks[0].detail, /Fase 7/);
});

test('bloquea cambios posteriores a la integración para preservar la fuente canónica', (context) => {
  const fixture = makeFixture(context);
  fs.appendFileSync(fixture.previewFile, '\nEdición posterior.\n');
  const result = planLocalPublication(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'preview-changed-after-integration');
  assert.equal(fs.existsSync(fixture.publishedFile), false);
});

test('rechaza una fuente vinculada que no existe en la proyección pública', (context) => {
  const fixture = makeFixture(context);
  const content = markdown().replace('src-verificada', 'src-inexistente');
  fs.writeFileSync(fixture.previewFile, content);
  const session = JSON.parse(fs.readFileSync(fixture.sessionFile, 'utf8'));
  session.integracion_local.analysis_sha256 = digest(Buffer.from(content));
  fs.writeFileSync(fixture.sessionFile, `${JSON.stringify(session, null, 2)}\n`);
  const result = planLocalPublication(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'invalid-publication-content');
  assert.match(result.blocks[0].detail, /src-inexistente/);
});

test('rechaza post_id duplicado en otra publicación activa', (context) => {
  const fixture = makeFixture(context);
  const duplicate = markdown().replace(`slug: "${SLUG}"`, 'slug: "otro-slug"');
  fs.writeFileSync(path.join(path.dirname(fixture.publishedFile), 'otra.md'), duplicate);
  const result = planLocalPublication(fixture);
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'duplicate-publication-post-id');
});

test('la reversión elimina una publicación nueva, restaura el expediente y rehabilita la reversión de Fase 8', (context) => {
  const fixture = makeFixture(context);
  const publicBefore = fs.readFileSync(fixture.publicFile, 'utf8');
  const plan = planLocalPublication(fixture);
  const applied = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  const result = rollbackLocalPublication({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    publicationsDir: fixture.publicationsDir,
    eventId: EVENT_ID,
    publicationId: applied.publication.publication_id,
    confirmed: true,
    rolledBackAt: '2026-08-09T09:00:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(fs.existsSync(fixture.publishedFile), false);
  assert.equal(fs.readFileSync(fixture.publicFile, 'utf8'), publicBefore);
  assert.equal(result.session.estado, 'integracion_local_completada');
  assert.equal(result.session.integracion_local.rollback_estado, 'disponible');
  assert.equal(result.session.publicacion_local.estado, 'revertida');
});

test('la reversión protege una edición posterior del Markdown público', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalPublication(fixture);
  const applied = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  fs.appendFileSync(fixture.publishedFile, '\nEdición posterior.\n');
  const result = rollbackLocalPublication({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    publicationsDir: fixture.publicationsDir,
    eventId: EVENT_ID,
    publicationId: applied.publication.publication_id,
    confirmed: true,
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'publication-changed-after-apply');
  assert.match(fs.readFileSync(fixture.publishedFile, 'utf8'), /Edición posterior/);
});

test('la reversión protege cambios posteriores del expediente público', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalPublication(fixture);
  const applied = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  const publicData = JSON.parse(fs.readFileSync(fixture.publicFile, 'utf8'));
  publicData.procesos[0].progreso_publico.proximo_paso = 'Actualización editorial posterior';
  fs.writeFileSync(fixture.publicFile, `${JSON.stringify(publicData, null, 2)}\n`);
  const result = rollbackLocalPublication({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    publicationsDir: fixture.publicationsDir,
    eventId: EVENT_ID,
    publicationId: applied.publication.publication_id,
    confirmed: true,
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'public-expedient-changed-after-apply');
  assert.match(fs.readFileSync(fixture.publicFile, 'utf8'), /Actualización editorial posterior/);
});

test('actualiza una publicación de la misma identidad y la reversión restaura la versión anterior', (context) => {
  const fixture = makeFixture(context);
  const previous = publicMarkdown('Versión pública anterior');
  fs.writeFileSync(fixture.publishedFile, previous);
  const plan = planLocalPublication(fixture);
  assert.equal(plan.status, 'ready');
  assert.equal(plan.analysis.operation, 'modificar');
  const applied = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  assert.equal(applied.status, 'ready');
  const restored = rollbackLocalPublication({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    publicationsDir: fixture.publicationsDir,
    eventId: EVENT_ID,
    publicationId: applied.publication.publication_id,
    confirmed: true,
  });
  assert.equal(restored.status, 'ready');
  assert.equal(fs.readFileSync(fixture.publishedFile, 'utf8'), previous);
});

test('la reversión rechaza registros que apuntan fuera de la carpeta pública autorizada', (context) => {
  const fixture = makeFixture(context);
  const plan = planLocalPublication(fixture);
  const applied = applyLocalPublication({
    ...fixture,
    expectedPlanId: plan.plan_id,
    confirmed: true,
    reviewConfirmed: true,
  });
  const recordFile = plan.publication_record.file;
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  const outside = path.join(fixture.root, 'no-tocar.md');
  fs.writeFileSync(outside, 'preservar\n');
  record.analysis.target_file = outside;
  fs.writeFileSync(recordFile, `${JSON.stringify(record, null, 2)}\n`);
  const result = rollbackLocalPublication({
    centerRoot: fixture.centerRoot,
    siteRoot: fixture.siteRoot,
    sessionsDir: fixture.sessionsDir,
    publicationsDir: fixture.publicationsDir,
    eventId: EVENT_ID,
    publicationId: applied.publication.publication_id,
    confirmed: true,
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'unsafe-publication-rollback-record');
  assert.equal(fs.readFileSync(outside, 'utf8'), 'preservar\n');
});

test('rechaza fechas de publicación fuera del formato canónico', (context) => {
  const fixture = makeFixture(context);
  const result = planLocalPublication({ ...fixture, publishedOn: '09/08/2026' });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'invalid-publication-date');
});
