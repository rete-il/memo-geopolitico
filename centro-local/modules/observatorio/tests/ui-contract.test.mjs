import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
const preparationHtml = fs.readFileSync(new URL('../public/preparacion.html', import.meta.url), 'utf8');
const preparationApp = fs.readFileSync(new URL('../public/preparacion.js', import.meta.url), 'utf8');
const preflightApp = fs.readFileSync(new URL('../public/preflight.js', import.meta.url), 'utf8');
const followupProposal = fs.readFileSync(new URL('../lib/followup-proposal.mjs', import.meta.url), 'utf8');
const analysisPrompt = fs.readFileSync(new URL('../lib/analysis-prompt.mjs', import.meta.url), 'utf8');
const analysisResponse = fs.readFileSync(new URL('../lib/analysis-response.mjs', import.meta.url), 'utf8');
const localApplication = fs.readFileSync(new URL('../lib/local-application.mjs', import.meta.url), 'utf8');
const localIntegration = fs.readFileSync(new URL('../lib/local-integration.mjs', import.meta.url), 'utf8');
const localPublication = fs.readFileSync(new URL('../lib/local-publication.mjs', import.meta.url), 'utf8');
const localProcessUpdate = fs.readFileSync(new URL('../lib/local-process-update.mjs', import.meta.url), 'utf8');
const publicSync = fs.readFileSync(new URL('../lib/public-sync.mjs', import.meta.url), 'utf8');
const reviewPackage = fs.readFileSync(new URL('../lib/review-package.mjs', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('../data/config.json', import.meta.url), 'utf8'));

const requiredIds = [
  'open-candidate-import',
  'candidate-import-editor',
  'close-candidate-import',
  'copy-candidate-format',
  'download-candidate-template',
  'candidate-json',
  'candidate-file',
  'analyze-candidates',
  'clear-candidate-import',
  'candidate-preview-section',
  'candidate-import-summary',
  'select-importable-candidates',
  'clear-candidate-selection',
  'candidate-preview-list',
  'candidate-import-confirmed',
  'candidate-selection-count',
  'cancel-candidate-import',
  'apply-candidate-import',
  'sg-axis',
  'sg-region',
  'sg-languages',
  'sg-topic-options',
  'sg-signal-options',
  'sg-source-options',
  'sg-recommend-sources',
  'sg-generate',
  'sg-prompt-preview',
  'sg-copy-prompt',
  'sg-download-prompt',
];

test('la interfaz declara todos los controles de la importación', () => {
  for (const id of requiredIds) assert.match(html, new RegExp(`id="${id}"`), `Falta #${id}`);
});

test('cada control principal tiene una acción enlazada', () => {
  for (const id of [
    'open-candidate-import',
    'copy-candidate-format',
    'download-candidate-template',
    'analyze-candidates',
    'select-importable-candidates',
    'clear-candidate-selection',
    'candidate-import-confirmed',
    'apply-candidate-import',
    'sg-recommend-sources',
    'sg-generate',
    'sg-copy-prompt',
    'sg-download-prompt',
  ]) {
    assert.match(app, new RegExp(`\\$\\('#${id}'\\)\\.(?:onclick|onchange)`), `Falta acción para #${id}`);
  }
});

test('la vista previa tiene reglas responsive y estados visuales', () => {
  assert.match(styles, /\.candidate-preview-card\.blocked/);
  assert.match(styles, /\.candidate-issues\.error/);
  assert.match(styles, /\.candidate-update-plan/);
  assert.match(styles, /\.candidate-warning-item\.blocked/);
  assert.match(styles, /\.candidate-warning-decision/);
  assert.match(styles, /\.source-selection-row/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.candidate-facts\{grid-template-columns:1fr\}/);
});

test('la navegación expone el generador y la importación permite decisiones de actualización', () => {
  assert.match(html, /data-view="search"/);
  assert.match(app, /configureCandidateAction/);
  assert.match(app, /applyCandidateDecisions/);
  assert.match(app, /configureCandidateWarning/);
  assert.match(app, /data-candidate-warning/);
  assert.match(html, /advertencias no marcadas se registrarán como no aplicadas/);
  assert.match(html, /Aplicar decisiones/);
});

test('distingue expedientes públicos de encargos editoriales', () => {
  assert.match(html, /data-view="public-expedients">Expedientes</);
  assert.match(html, /data-view="expedients">Encargos editoriales</);
  assert.match(html, /No son los expedientes públicos del Observatorio/);
  assert.match(app, /\['Expedientes públicos', events\.length, 'Uno por macroevento'\]/);
  assert.match(app, /'Encargo editorial' : 'Encargos editoriales'/);
  assert.match(app, /function renderPublicExpedients\(\)/);
  assert.match(app, /payload\.public_expedients/);
  assert.match(app, /PUBLIC_STATE_LABELS/);
});

test('el resumen usa una sola fila de seis tarjetas en escritorio', () => {
  assert.match(styles, /@media\(min-width:1181px\)[\s\S]*?\.cards\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)\}/);
});

test('la Fase 1 expone la acción detrás de una bandera local', () => {
  assert.equal(config.features?.preparacion_analisis_seguimiento, true);
  assert.match(html, /id="event-preparation-action"[^>]*hidden/);
  assert.match(html, /id="prepare-analysis-followup"/);
  assert.match(app, /function preparationEnabled\(\)/);
  assert.match(app, /S\.changed/);
  assert.match(app, /S\.eventDraftChanged/);
});

test('la vista de preparación identifica el macroevento y permite volver', () => {
  for (const id of ['preparation-title', 'preparation-event-id', 'preparation-status', 'back-to-observatory']) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /macroevento_id/);
  assert.match(preparationApp, /\/api\/bootstrap/);
  assert.match(preparationApp, /preparacion_analisis_seguimiento/);
  assert.match(app, /function openRequestedLocation\(\)/);
});

test('la Fase 2 conserva un preflight puro aunque fases posteriores guarden una sesión', () => {
  assert.match(preparationApp, /runPreflight/);
  assert.match(preflightApp, /export function runPreflight/);
  assert.doesNotMatch(preflightApp, /fetch\(|localStorage|sessionStorage/);
  assert.doesNotMatch(preparationApp, /\/api\/data|localStorage|sessionStorage/);
  assert.match(preparationHtml, /no aplica el análisis, no modifica los datos canónicos/i);
});

test('el preflight separa excepciones y mantiene la trazabilidad plegada', () => {
  for (const id of [
    'preflight-blocks',
    'preflight-warnings',
    'preflight-information',
    'warning-justification',
    'confirm-warnings',
    'editorial-trace',
    'trace-steps',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationHtml, /<details id="editorial-trace"/);
  assert.doesNotMatch(preparationHtml, /<details id="editorial-trace"[^>]*\sopen(?:\s|>)/);
  assert.match(preparationApp, /Continuar con advertencias/);
  assert.match(preflightApp, /TRACE_STEPS/);
});

test('la nueva vista conserva responsive y accesibilidad básica', () => {
  assert.match(preparationHtml, /class="skip-link"/);
  assert.match(preparationHtml, /role="status"[^>]*aria-live="polite"/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*\.preparation-results\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.preflight-kpis\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(styles, /\.btn\.preparation/);
});

test('la Fase 3 genera propuesta y diferencias sin aplicar datos', () => {
  for (const id of [
    'followup-action',
    'generate-followup-proposal',
    'followup-action-status',
    'followup-workspace',
    'followup-diff-details',
    'followup-diff-list',
    'followup-proposal-details',
    'followup-proposal-json',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /\/api\/followup-proposal\?macroevento_id=/);
  assert.match(server, /url\.pathname === '\/api\/followup-proposal'/);
  assert.match(followupProposal, /identity_preserved:\s*true/);
  assert.match(followupProposal, /canonical_data_modified:\s*false/);
  assert.match(preparationApp, /fetch\(`\/api\/followup-proposal\?macroevento_id=\$\{encodeURIComponent\(currentEventId\)\}`,[\s\S]*cache:\s*'no-store'/);
  assert.doesNotMatch(followupProposal, /writeFile|renameSync|unlink|rmSync/);
});

test('la revisión de seguimiento es responsive y comunica que no aplica cambios', () => {
  assert.match(preparationApp, /0 archivos creados/i);
  assert.match(preparationHtml, /No crea Markdown/i);
  assert.match(styles, /\.followup-review-grid/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*\.followup-review-grid\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.followup-diff-item dl\{grid-template-columns:1fr\}/);
});

test('la Fase 4 genera, copia y recupera un prompt mediante una sesión local acotada', () => {
  for (const id of [
    'analysis-prompt-action',
    'analysis-editorial-focus',
    'generate-analysis-prompt',
    'analysis-prompt-action-status',
    'analysis-prompt-workspace',
    'analysis-prompt-metadata',
    'analysis-prompt-content',
    'copy-analysis-prompt',
    'analysis-session-file',
    'analysis-copy-status',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /method:\s*'POST'/);
  assert.match(preparationApp, /\/api\/analysis-prompt/);
  assert.match(preparationApp, /\/api\/preparation-session\?macroevento_id=/);
  assert.match(preparationApp, /navigator\.clipboard/);
  assert.match(server, /url\.pathname === '\/api\/analysis-prompt'/);
  assert.match(server, /url\.pathname === '\/api\/preparation-session'/);
  assert.match(analysisPrompt, /estado:\s*'esperando_respuesta'/);
  assert.match(analysisPrompt, /archivos_canonicos_modificados:\s*0/);
  assert.match(analysisPrompt, /path\.join\(sessionsDir, `preparacion-\$\{id\}\.json`\)/);
});

test('la Fase 4 mantiene responsive, foco visible y comunicación explícita del archivo escrito', () => {
  assert.match(preparationHtml, /role="status"[^>]*aria-live="polite"/);
  assert.match(preparationApp, /Es el único archivo creado o actualizado en esta fase/);
  assert.match(styles, /\.analysis-prompt-layout/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*\.analysis-prompt-layout\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*#analysis-prompt-content\{min-height:430px\}/);
});

test('la Fase 5 recibe archivo o pegado, valida, previsualiza y exige aprobación humana', () => {
  for (const id of [
    'analysis-response-action',
    'open-analysis-response',
    'analysis-response-workspace',
    'analysis-response-file',
    'analysis-response-content',
    'validate-analysis-response',
    'analysis-response-results',
    'analysis-response-blocks',
    'analysis-response-warnings',
    'analysis-warning-decisions',
    'analysis-warning-decision-progress',
    'analysis-warning-decision-list',
    'analysis-response-metadata-list',
    'analysis-response-preview-body',
    'approve-analysis-response',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /\/api\/analysis-response/);
  assert.match(preparationApp, /\/api\/analysis-response\/approve/);
  assert.match(preparationApp, /\/api\/analysis-response\/warning-decision/);
  assert.match(preparationApp, /\.text\(\)/);
  assert.match(server, /url\.pathname === '\/api\/analysis-response'/);
  assert.match(server, /url\.pathname === '\/api\/analysis-response\/approve'/);
  assert.match(server, /url\.pathname === '\/api\/analysis-response\/warning-decision'/);
  assert.match(analysisResponse, /contenido_original/);
  assert.match(analysisResponse, /estado = 'respuesta_aprobada'/);
  assert.match(analysisResponse, /archivos_canonicos_modificados:\s*0/);
});

test('la Fase 5 conserva preview seguro, responsive y sin escritura canónica', () => {
  assert.match(analysisResponse, /escapeHtml/);
  assert.match(analysisResponse, /rel="noreferrer"/);
  assert.match(styles, /\.analysis-response-input-grid/);
  assert.match(styles, /\.markdown-preview/);
  assert.match(styles, /\.analysis-warning-decision-card/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*\.analysis-response-input-grid,\.analysis-response-preview-grid\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.analysis-response-metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.doesNotMatch(analysisResponse, /src[\\/]content|macroeventos\.json|git\s/);
});

test('la Fase 6 genera un paquete descargable y conserva separados preparación y aplicación', () => {
  for (const id of [
    'review-package-action',
    'generate-review-package',
    'review-package-action-status',
    'review-package-workspace',
    'review-package-metrics',
    'review-package-files',
    'download-review-package',
    'review-package-manifest',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /\/api\/review-package/);
  assert.match(preparationApp, /\/api\/review-package\/download\?macroevento_id=/);
  assert.match(server, /url\.pathname === '\/api\/review-package'/);
  assert.match(server, /url\.pathname === '\/api\/review-package\/download'/);
  assert.match(reviewPackage, /tipo:\s*'paquete-revision-vscode'/);
  assert.match(reviewPackage, /archivos_canonicos_modificados:\s*0/);
  assert.match(reviewPackage, /aplicacion_habilitada:\s*false/);
  assert.doesNotMatch(reviewPackage, /child_process|execSync|spawnSync/);
});

test('el paquete de revisión es responsive y enumera sus artefactos sin tablas esenciales', () => {
  assert.match(styles, /\.review-package-layout/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*\.review-package-layout\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.review-package-files li\{grid-template-columns:1fr/);
  assert.match(preparationHtml, /ARCHIVOS PREPARADOS · NO PUBLICADOS/);
  assert.match(preparationHtml, /role="status"[^>]*aria-live="polite"/);
});

test('la Fase 7 separa plan, confirmación, aplicación y reversión local', () => {
  for (const id of [
    'local-application-action',
    'prepare-local-application',
    'local-application-action-status',
    'local-application-workspace',
    'local-application-metrics',
    'local-application-files',
    'confirm-local-application',
    'apply-local-application',
    'local-application-result',
    'confirm-local-rollback',
    'rollback-local-application',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /\/api\/local-application\/plan/);
  assert.match(preparationApp, /\/api\/local-application\/apply/);
  assert.match(preparationApp, /\/api\/local-application\/rollback/);
  assert.match(server, /url\.pathname === '\/api\/local-application\/plan'/);
  assert.match(server, /url\.pathname === '\/api\/local-application\/apply'/);
  assert.match(server, /url\.pathname === '\/api\/local-application\/rollback'/);
  assert.match(localApplication, /application-plan-stale/);
  assert.match(localApplication, /writeAtomic/);
  assert.match(localApplication, /draft-changed-after-application/);
  assert.doesNotMatch(localApplication, /child_process|execSync|spawnSync|\bgit\s+(?:add|commit|push)/i);
});

test('la Fase 7 usa un borrador fuera de src y conserva responsive y accesibilidad', () => {
  assert.match(server, /data', 'publicaciones', 'borradores/);
  assert.match(preparationHtml, /confirmo los destinos y autorizo esta escritura únicamente en la copia local/i);
  assert.match(preparationHtml, /role="status"[^>]*aria-live="polite"/);
  assert.match(styles, /\.local-application-layout/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*\.local-application-layout\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.local-application-files li\{grid-template-columns:1fr/);
});

test('la Fase 8 separa plan, confirmación, integración, QA y reversión', () => {
  for (const id of [
    'local-integration-action',
    'prepare-local-integration',
    'local-integration-action-status',
    'local-integration-workspace',
    'local-integration-metrics',
    'local-integration-files',
    'confirm-local-integration',
    'apply-local-integration',
    'local-integration-result',
    'local-integration-commands',
    'open-analysis-preview',
    'open-followup-preview',
    'confirm-local-integration-rollback',
    'rollback-local-integration',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /\/api\/local-integration\/plan/);
  assert.match(preparationApp, /\/api\/local-integration\/apply/);
  assert.match(preparationApp, /\/api\/local-integration\/rollback/);
  assert.match(server, /url\.pathname === '\/api\/local-integration\/plan'/);
  assert.match(server, /url\.pathname === '\/api\/local-integration\/apply'/);
  assert.match(server, /url\.pathname === '\/api\/local-integration\/rollback'/);
  assert.match(localIntegration, /integration-plan-stale/);
  assert.match(localIntegration, /preview-changed-after-integration/);
  assert.match(localIntegration, /src', 'content', 'publicaciones', '_preview'/);
  assert.doesNotMatch(localIntegration, /child_process|execSync|spawnSync|\bgit\s+(?:add|commit|push)/i);
});

test('la Fase 8 es responsive y comunica que preview no equivale a publicación', () => {
  assert.match(preparationHtml, /no se crea una publicación de producción/i);
  assert.match(preparationHtml, /no ejecuta check, build, Git ni despliegue/i);
  assert.match(preparationHtml, /role="status"[^>]*aria-live="polite"/);
  assert.match(styles, /\.local-integration-layout/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*\.local-integration-layout\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*\.local-integration-action-controls\{flex:0 1 auto\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.local-integration-files li\{grid-template-columns:1fr/);
});

test('la Fase 9 separa plan, confirmación editorial, publicación local, QA y reversión', () => {
  for (const id of [
    'local-publication-action',
    'local-publication-date',
    'prepare-local-publication',
    'local-publication-action-status',
    'local-publication-workspace',
    'local-publication-metrics',
    'local-publication-files',
    'confirm-local-publication',
    'apply-local-publication',
    'local-publication-result',
    'local-publication-commands',
    'open-local-publication',
    'confirm-local-publication-rollback',
    'rollback-local-publication',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /\/api\/local-publication\/plan/);
  assert.match(preparationApp, /\/api\/local-publication\/apply/);
  assert.match(preparationApp, /\/api\/local-publication\/rollback/);
  assert.match(server, /url\.pathname === '\/api\/local-publication\/plan'/);
  assert.match(server, /url\.pathname === '\/api\/local-publication\/apply'/);
  assert.match(server, /url\.pathname === '\/api\/local-publication\/rollback'/);
  assert.match(localPublication, /publication-plan-stale/);
  assert.match(localPublication, /unresolved-editorial-markers/);
  assert.match(localPublication, /src', 'content', 'publicaciones', 'publicadas'/);
  assert.match(localPublication, /reviewConfirmed/);
  assert.doesNotMatch(localPublication, /child_process|execSync|spawnSync|\bgit\s+(?:add|commit|push)/i);
});

test('la Fase 9 comunica el límite entre publicación local e Internet y conserva responsive', () => {
  assert.match(preparationHtml, /no ejecuta Git, no lo sube a GitHub y no modifica el sitio de Internet/i);
  assert.match(preparationHtml, /revisé íntegramente el texto, sus fuentes y su visualización/i);
  assert.match(preparationHtml, /role="status"[^>]*aria-live="polite"/);
  assert.match(styles, /\.local-publication-action-controls label/);
  assert.match(styles, /@media\(max-width:700px\)[\s\S]*\.local-publication-action-controls label\{grid-template-columns:1fr\}/);
});

test('la ruta corta separa el proceso del análisis y valida el paquete completo', () => {
  for (const id of [
    'global-status-panel',
    'global-status-items',
    'sync-readiness',
    'process-update-action',
    'prepare-process-update',
    'process-update-workspace',
    'confirm-process-update',
    'apply-process-update',
    'confirm-responsive-qa',
    'run-final-qa',
  ]) {
    assert.match(preparationHtml, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(preparationApp, /Señales exportables/);
  assert.match(preparationApp, /\/api\/local-process-update\/plan/);
  assert.match(preparationApp, /\/api\/local-process-update\/apply/);
  assert.match(preparationApp, /\/api\/final-qa/);
  assert.match(server, /url\.pathname === '\/api\/local-process-update\/plan'/);
  assert.match(server, /url\.pathname === '\/api\/local-process-update\/apply'/);
  assert.match(server, /url\.pathname === '\/api\/final-qa'/);
  assert.match(localProcessUpdate, /assertValidPublicProjection/);
  assert.match(localProcessUpdate, /analysis_approval_preserved/);
  assert.match(localProcessUpdate, /writeAtomic/);
  assert.doesNotMatch(localProcessUpdate, /child_process|execSync|spawnSync|\bgit\s+(?:add|commit|push)/i);
  assert.match(styles, /\.global-status-items/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.global-status-items\{grid-template-columns:1fr\}/);
});

test('el editor permite explicar relevancia, organizar un rector y gestionar caracterizaciones', () => {
  for (const id of [
    'e-why',
    'e-is-rector',
    'e-rector-id',
    'e-related-search',
    'e-related-selected',
    'e-related-options',
    'event-category-options',
    'signal-type-options',
    'source-type-options',
    'language-options',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(app, /function renderEventRelations\(\)/);
  assert.match(app, /normalizeLanguageCode/);
  assert.match(app, /normalizeCharacterization/);
  assert.match(styles, /\.relation-picker/);
});

test('el dashboard sincroniza la proyección pública mediante plan, confirmación y respaldo', () => {
  assert.match(html, /id="sync-public"[^>]*disabled/);
  assert.match(html, /id="sync-public"[^>]*>Comprobando…<\/button>/);
  assert.match(app, /\$\('#sync-public'\)\.onclick = syncPublicProjection/);
  assert.match(app, /refreshPublicSyncReadiness/);
  assert.match(app, /counts\?\.created/);
  assert.match(app, /button\.disabled = created > 0|if \(created > 0\)[\s\S]*button\.disabled = false/);
  assert.match(app, /Sin eventos nuevos/);
  assert.match(app, /Sitio sincronizado/);
  assert.match(app, /\/api\/public-sync\/plan/);
  assert.match(app, /\/api\/public-sync\/apply/);
  assert.match(app, /Se conservarán los estados editoriales/);
  assert.match(server, /url\.pathname === '\/api\/public-sync\/plan'/);
  assert.match(server, /url\.pathname === '\/api\/public-sync\/apply'/);
  assert.match(publicSync, /public-process-removal-blocked/);
  assert.match(publicSync, /public-sync-plan-stale/);
  assert.match(publicSync, /publication_states_preserved: true/);
  assert.match(publicSync, /writeAtomic/);
  assert.doesNotMatch(publicSync, /child_process|execSync|spawnSync|\bgit\s+(?:add|commit|push)|netlify/i);
});

test('la Etapa 2 expone Advertencias al mismo nivel que Señales y Fuentes', () => {
  for (const id of [
    'event-record-tabs',
    'event-tab-signals-button',
    'event-tab-sources-button',
    'event-tab-warnings-button',
    'event-tab-warnings',
    'warning-summary',
    'warning-cards',
    'add-warning',
    'warning-editor',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(app, /function activateEventRecordTab/);
  assert.match(app, /ArrowLeft/);
  assert.match(app, /ArrowRight/);
});

test('Advertencias ofrece resumen, filtros combinables, radar y regla derivada', () => {
  for (const id of [
    'warning-filter-state',
    'warning-filter-treatment',
    'warning-filter-priority',
    'warning-filter-signal',
    'warning-filter-source',
    'warning-filter-prompt',
    'warning-radar',
    'clear-warning-filters',
    'warning-prompt-rule',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(html, /Observación posterior/);
  assert.match(app, /filterAndSortWarnings/);
  assert.match(app, /warningPromptDecision/);
  assert.doesNotMatch(html, /id="warning-prompt-rule"[^>]*(?:input|select)/);
});

test('el detalle permite gestionar estado, tratamiento, prioridad, vínculos y trazabilidad', () => {
  for (const id of [
    'warning-state',
    'warning-treatment',
    'warning-priority',
    'warning-actor',
    'warning-signal-options',
    'warning-source-options',
    'warning-resolution-section',
    'warning-resolution-type',
    'warning-resolution-reason',
    'warning-resolution-source-options',
    'warning-history',
    'warning-exceptions',
    'warning-generations',
    'warning-confirmed',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `Falta #${id}`);
  }
  assert.match(app, /function quickWarningChange/);
  assert.match(app, /warningHistoryEntry/);
  assert.match(app, /confirm\(`/);
  assert.match(html, /Confirmo esta decisión editorial/);
});

test('Advertencias conserva foco visible y adaptación a 1024, 768 y 390 px', () => {
  assert.match(styles, /\.event-record-tab\.active/);
  assert.match(styles, /\.warning-card\.selected/);
  assert.match(styles, /@media\(max-width:1024px\)[\s\S]*\.warning-summary\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
  assert.match(styles, /@media\(max-width:768px\)[\s\S]*\.warning-detail-grid\{grid-template-columns:1fr\}/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.warning-quick-actions\{grid-template-columns:1fr\}/);
});
