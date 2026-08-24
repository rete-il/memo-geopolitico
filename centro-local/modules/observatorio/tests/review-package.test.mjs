import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { approveAnalysisResponse, saveAnalysisResponse } from '../lib/analysis-response.mjs';
import { sessionFileFor } from '../lib/analysis-prompt.mjs';
import { generateReviewPackage, resolvePreparedReviewPackage } from '../lib/review-package.mjs';

const EVENT_ID = 'corredor-lobito-minerales';

function markdown() {
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

La integración regional depende de componentes adicionales.

## Fuentes

- [Fuente autorizada](https://example.com/verified)
`;
}

function makeFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-review-package-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const sessionsDir = path.join(root, 'sessions');
  const packagesDir = path.join(root, 'packages');
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
      template: { id: 'memo-analisis-completo', version: '1.0' },
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
  return { root, sessionsDir, packagesDir, projectRoot, data, proposal };
}

function zipEntries(buffer) {
  const result = new Map();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString('utf8');
    result.set(name, buffer.subarray(contentStart, contentStart + size));
    offset = contentStart + size;
  }
  return result;
}

test('genera un ZIP con los nueve artefactos y completa el paso 13 sin escrituras canónicas', (context) => {
  const fixture = makeFixture(context);
  const result = generateReviewPackage({
    ...fixture,
    eventId: EVENT_ID,
    currentFollowupProposal: fixture.proposal,
    generatedAt: '2026-08-08T13:00:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.reused, false);
  assert.equal(result.session.estado, 'respuesta_aprobada');
  assert.equal(result.session.paquete_revision.estado, 'archivos_preparados');
  assert.ok(result.session.trazabilidad.pasos_completados.includes(13));
  assert.equal(result.safety.archivos_canonicos_creados, 0);
  assert.equal(result.safety.archivos_canonicos_modificados, 0);
  assert.equal(result.package.artifacts.length, 9);
  assert.equal(fs.readFileSync(path.join(fixture.packagesDir, result.file.name)).subarray(0, 2).toString(), 'PK');
});

test('incluye manifiesto, propuesta, diff, análisis, prompt, trazabilidad, instrucciones y checksums', (context) => {
  const fixture = makeFixture(context);
  const result = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: fixture.proposal, generatedAt: '2026-08-08T13:10:00.000Z' });
  const entries = zipEntries(fs.readFileSync(path.join(fixture.packagesDir, result.file.name)));
  const prefix = `${result.package.package_id}/`;
  for (const name of [
    'MANIFIESTO.json',
    'seguimiento/propuesta-seguimiento.json',
    'seguimiento/diferencias-seguimiento.json',
    'analisis/lobito-competencia-minerales-2026.md',
    'PROMPT-ANALISIS.txt',
    'INFORME-TRAZABILIDAD.md',
    'INSTRUCCIONES-VSCODE.md',
    'SHA256SUMS.txt',
  ]) assert.ok(entries.has(`${prefix}${name}`), `Falta ${name}`);
  const instructions = entries.get(`${prefix}INSTRUCCIONES-VSCODE.md`).toString('utf8');
  assert.match(instructions, /No copies el análisis a `src\/content\/publicaciones\/_preview\/`/);
  assert.match(instructions, /no ejecuta Git/i);
});

test('bloquea una respuesta que no fue aprobada', (context) => {
  const fixture = makeFixture(context);
  const file = sessionFileFor(fixture.sessionsDir, EVENT_ID);
  const session = JSON.parse(fs.readFileSync(file, 'utf8'));
  session.estado = 'respuesta_validada';
  session.respuesta_chatgpt.aprobada_el = null;
  fs.writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  const result = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: fixture.proposal });
  assert.equal(result.status, 'blocked');
  assert.equal(result.blocks[0].code, 'response-not-approved');
});

test('actualiza solo la revisión del proceso y conserva el análisis aprobado antes de integrar', (context) => {
  const fixture = makeFixture(context);
  const changed = structuredClone(fixture.proposal);
  changed.proposed_process.titulo = 'Título actualizado después del prompt';
  const result = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: changed });
  assert.equal(result.status, 'ready');
  assert.equal(result.session.respuesta_chatgpt.aprobada_el, '2026-08-08T12:00:00.000Z');
  assert.equal(result.session.propuesta_seguimiento.proposed_process.titulo, changed.proposed_process.titulo);
  assert.match(result.session.revisiones.analysis_revision, /^[a-f0-9]{64}$/);
  assert.match(result.session.revisiones.process_revision, /^[a-f0-9]{64}$/);
  assert.equal(result.package.analysis_revision, result.session.revisiones.analysis_revision);
  assert.equal(result.package.process_revision, result.session.revisiones.process_revision);
});

test('deriva un cambio posterior a integración a la actualización corta sin invalidar el análisis', (context) => {
  const fixture = makeFixture(context);
  const file = sessionFileFor(fixture.sessionsDir, EVENT_ID);
  const session = JSON.parse(fs.readFileSync(file, 'utf8'));
  session.estado = 'publicacion_local_completada';
  session.integracion_local = { estado: 'aplicada' };
  session.publicacion_local = { estado: 'aplicada' };
  fs.writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  const changed = structuredClone(fixture.proposal);
  changed.proposed_process.titulo = 'Título actualizado después de publicar';
  const result = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: changed });
  assert.equal(result.status, 'blocked');
  assert.equal(result.analysis_approval_preserved, true);
  assert.equal(result.blocks[0].code, 'process-revision-changed');
  assert.match(result.blocks[0].detail, /continúa válido/);
  assert.match(result.blocks[0].detail, /Actualizar proceso en evolución/);
});

test('revalida que post_id y slug continúen siendo únicos antes de empaquetar', (context) => {
  const fixture = makeFixture(context);
  fs.writeFileSync(
    path.join(fixture.projectRoot, 'src', 'content', 'publicaciones', 'publicadas', 'duplicado.md'),
    markdown(),
    'utf8',
  );
  const result = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: fixture.proposal });
  assert.equal(result.status, 'blocked');
  const codes = result.blocks.map((block) => block.code);
  assert.ok(codes.includes('duplicate-post-id'));
  assert.ok(codes.includes('duplicate-slug'));
});

test('una segunda solicitud reutiliza el mismo ZIP verificado', (context) => {
  const fixture = makeFixture(context);
  const first = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: fixture.proposal, generatedAt: '2026-08-08T14:00:00.000Z' });
  const second = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: fixture.proposal, generatedAt: '2026-08-08T14:10:00.000Z' });
  assert.equal(second.status, 'ready');
  assert.equal(second.reused, true);
  assert.equal(second.file.name, first.file.name);
  assert.equal(fs.readdirSync(fixture.packagesDir).length, 1);
});

test('la descarga resuelve solo el ZIP referenciado y comprueba su hash', (context) => {
  const fixture = makeFixture(context);
  const generated = generateReviewPackage({ ...fixture, eventId: EVENT_ID, currentFollowupProposal: fixture.proposal, generatedAt: '2026-08-08T15:00:00.000Z' });
  const resolved = resolvePreparedReviewPackage({ ...fixture, eventId: EVENT_ID });
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.filename, generated.file.name);
  fs.appendFileSync(resolved.file, 'alterado');
  const changed = resolvePreparedReviewPackage({ ...fixture, eventId: EVENT_ID });
  assert.equal(changed.status, 'blocked');
  assert.equal(changed.blocks[0].code, 'package-hash-mismatch');
});
