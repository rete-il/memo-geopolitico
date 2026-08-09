import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadAnalysisPromptSession, sessionFileFor } from '../lib/analysis-prompt.mjs';
import {
  approveAnalysisResponse,
  renderMarkdownPreview,
  saveAnalysisResponse,
  validateAnalysisResponse,
} from '../lib/analysis-response.mjs';

const EVENT_ID = 'corredor-lobito-minerales';

function fixture() {
  const data = {
    schema_version: 2,
    macroeventos: [{
      id: EVENT_ID,
      fuentes: [
        { id: 'src-verificada', estado_verificacion: 'verificada', url: 'https://example.com/verified' },
        { id: 'src-pendiente', estado_verificacion: 'pendiente', url: 'https://example.com/pending' },
      ],
    }],
  };
  const session = {
    schema_version: 1,
    tipo: 'preparacion-analisis-seguimiento',
    session_id: 'prep-corredor-lobito-minerales-20260808',
    macroevento_id: EVENT_ID,
    estado: 'esperando_respuesta',
    creado_el: '2026-08-08T10:00:00.000Z',
    actualizado_el: '2026-08-08T10:00:00.000Z',
    prompt_analisis: {
      template: { id: 'memo-analisis-completo', version: '1.0' },
      variables: { fuentes_verificadas: ['src-verificada'], fuentes_reservadas: ['src-pendiente'] },
      content: 'Prompt controlado',
    },
    respuesta_chatgpt: null,
    trazabilidad: { pasos_completados: [1, 2, 3, 8, 9, 10], siguiente_paso: 11 },
    seguridad: { archivos_canonicos_creados: 0, archivos_canonicos_modificados: 0, archivos_sesion_escritos: 1, git_ejecutado: false },
  };
  return { data, session };
}

function validMarkdown(overrides = {}) {
  const values = {
    post_id: 'lobito-competencia-minerales-2026',
    slug: 'lobito-competencia-minerales-2026',
    macroevento_id: EVENT_ID,
    source_id: 'src-verificada',
    url: 'https://example.com/verified',
    ...overrides,
  };
  return `---
schema_version: 2
post_id: "${values.post_id}"
slug: "${values.slug}"
tipo_publicacion: "analisis"
titulo: "Lobito después del cierre financiero"
subtitulo: "Infraestructura, minerales y límites de la integración"
resumen: "Un análisis autónomo del corredor y sus principales incertidumbres."
autor_ids:
  - "rete"
publicacion:
  estado: "borrador"
  publicado_el: null
  actualizado_el: "2026-08-08"
macroevento_principal_id: "${values.macroevento_id}"
macroevento_secundario_ids: []
clasificacion:
  tema_principal_id: "energia-recursos-estrategicos"
fuente_ids:
  - "${values.source_id}"
recurso_visual_ids: []
post_relacionado_ids: []
---

## El corredor entra en una nueva etapa

La financiación ferroviaria confirma un avance parcial según la [fuente autorizada](${values.url}).

## Lo que todavía no está resuelto

La integración regional depende de componentes adicionales y revisión humana.

## Fuentes

- [Fuente autorizada](${values.url})
`;
}

test('valida un Markdown con identidad nueva, vínculo exacto y fuente autorizada', () => {
  const input = fixture();
  const result = validateAnalysisResponse({
    ...input,
    eventId: EVENT_ID,
    markdown: validMarkdown(),
    receivedAt: '2026-08-08T11:00:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.blocks.length, 0);
  assert.equal(result.metadata.macroevento_principal_id, EVENT_ID);
  assert.deepEqual(result.metadata.fuente_ids, ['src-verificada']);
  assert.equal(result.metrics.links, 1);
  assert.match(result.preview_html, /<h3>El corredor entra en una nueva etapa<\/h3>/);
  assert.match(result.preview_html, /rel="noreferrer"/);
});

test('rechaza identidad del macroevento, fuentes reservadas y enlaces no autorizados', () => {
  const input = fixture();
  const result = validateAnalysisResponse({
    ...input,
    eventId: EVENT_ID,
    markdown: validMarkdown({
      post_id: EVENT_ID,
      slug: EVENT_ID,
      macroevento_id: 'otro-macroevento',
      source_id: 'src-pendiente',
      url: 'https://example.com/pending',
    }),
  });
  assert.equal(result.status, 'blocked');
  const codes = result.blocks.map((item) => item.code);
  assert.ok(codes.includes('event-identity-mismatch'));
  assert.ok(codes.includes('post-id-reuses-event-id'));
  assert.ok(codes.includes('slug-reuses-event-id'));
  assert.ok(codes.includes('unauthorized-source-ids'));
  assert.ok(codes.includes('reserved-source-used'));
});

test('detecta frontmatter ausente, marcadores y una identidad ya existente', (context) => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-response-identities-'));
  context.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  const publicationDir = path.join(projectRoot, 'src', 'content', 'publicaciones', 'publicadas');
  fs.mkdirSync(publicationDir, { recursive: true });
  fs.writeFileSync(path.join(publicationDir, 'existente.md'), validMarkdown(), 'utf8');
  const input = fixture();

  const missing = validateAnalysisResponse({ ...input, projectRoot, eventId: EVENT_ID, markdown: '## Sin frontmatter' });
  assert.ok(missing.blocks.some((item) => item.code === 'missing-frontmatter'));

  const duplicate = validateAnalysisResponse({ ...input, projectRoot, eventId: EVENT_ID, markdown: validMarkdown() });
  assert.ok(duplicate.blocks.some((item) => item.code === 'duplicate-post-id'));
  assert.ok(duplicate.blocks.some((item) => item.code === 'duplicate-slug'));

  const placeholder = validateAnalysisResponse({
    ...input,
    eventId: EVENT_ID,
    markdown: validMarkdown({ post_id: '[PROPONER-ID]', slug: '[PROPONER-SLUG]' }),
  });
  assert.ok(placeholder.blocks.some((item) => item.code === 'unresolved-frontmatter-placeholders'));
});

test('acepta una envoltura Markdown con advertencia y conserva el original', (context) => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-response-save-'));
  context.after(() => fs.rmSync(sessionsDir, { recursive: true, force: true }));
  const input = fixture();
  fs.writeFileSync(sessionFileFor(sessionsDir, EVENT_ID), `${JSON.stringify(input.session, null, 2)}\n`, 'utf8');
  const wrapped = `\`\`\`markdown\n${validMarkdown().trim()}\n\`\`\``;
  const originalData = structuredClone(input.data);
  const result = saveAnalysisResponse({
    sessionsDir,
    data: input.data,
    eventId: EVENT_ID,
    markdown: wrapped,
    receivedAt: '2026-08-08T11:30:00.000Z',
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.session.estado, 'respuesta_validada');
  assert.equal(result.session.respuesta_chatgpt.contenido_original, wrapped);
  assert.ok(result.validation.warnings.some((item) => item.code === 'outer-code-fence'));
  assert.deepEqual(input.data, originalData);
  assert.deepEqual(fs.readdirSync(sessionsDir), [`preparacion-${EVENT_ID}.json`]);
  assert.equal(result.safety.archivos_canonicos_modificados, 0);
});

test('guarda bloqueos sin aprobarlos y permite reemplazar la respuesta en la misma sesión', (context) => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-response-retry-'));
  context.after(() => fs.rmSync(sessionsDir, { recursive: true, force: true }));
  const input = fixture();
  fs.writeFileSync(sessionFileFor(sessionsDir, EVENT_ID), `${JSON.stringify(input.session, null, 2)}\n`, 'utf8');

  const invalid = saveAnalysisResponse({ sessionsDir, data: input.data, eventId: EVENT_ID, markdown: 'Respuesta incompleta' });
  assert.equal(invalid.status, 'blocked');
  assert.equal(invalid.session.estado, 'respuesta_recibida');
  const blockedApproval = approveAnalysisResponse({ sessionsDir, eventId: EVENT_ID, expectedHash: invalid.validation.hash_sha256 });
  assert.equal(blockedApproval.status, 'blocked');

  const corrected = saveAnalysisResponse({ sessionsDir, data: input.data, eventId: EVENT_ID, markdown: validMarkdown() });
  assert.equal(corrected.status, 'ready');
  assert.equal(corrected.session.estado, 'respuesta_validada');
  assert.deepEqual(fs.readdirSync(sessionsDir), [`preparacion-${EVENT_ID}.json`]);
});

test('la aprobación exige el hash validado y deja la sesión lista para la Fase 6', (context) => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-response-approval-'));
  context.after(() => fs.rmSync(sessionsDir, { recursive: true, force: true }));
  const input = fixture();
  fs.writeFileSync(sessionFileFor(sessionsDir, EVENT_ID), `${JSON.stringify(input.session, null, 2)}\n`, 'utf8');
  const saved = saveAnalysisResponse({ sessionsDir, data: input.data, eventId: EVENT_ID, markdown: validMarkdown() });

  const mismatch = approveAnalysisResponse({ sessionsDir, eventId: EVENT_ID, expectedHash: 'otro-hash' });
  assert.equal(mismatch.status, 'blocked');
  assert.equal(mismatch.blocks[0].code, 'response-changed');

  const approved = approveAnalysisResponse({
    sessionsDir,
    eventId: EVENT_ID,
    expectedHash: saved.validation.hash_sha256,
    approvedAt: '2026-08-08T12:00:00.000Z',
  });
  assert.equal(approved.status, 'ready');
  assert.equal(approved.session.estado, 'respuesta_aprobada');
  assert.deepEqual(approved.session.trazabilidad.pasos_completados, [1, 2, 3, 8, 9, 10, 11, 12]);
  assert.equal(approved.session.trazabilidad.siguiente_paso, 13);
  assert.equal(approved.safety.archivos_canonicos_creados, 0);

  const restored = loadAnalysisPromptSession({ sessionsDir, eventId: EVENT_ID });
  assert.equal(restored.status, 'ready');
  assert.equal(restored.session.estado, 'respuesta_aprobada');
});

test('la vista previa escapa HTML y representa tablas sin ejecutar contenido', () => {
  const html = renderMarkdownPreview(`## Título\n\n<script>alert(1)</script>\n\n| Actor | Interés |\n|---|---|\n| Angola | Infraestructura |`);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<table>/);
  assert.match(html, /<th>Actor<\/th>/);
});
