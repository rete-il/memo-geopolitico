import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');

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
  assert.match(styles, /\.source-selection-row/);
  assert.match(styles, /@media\(max-width:560px\)[\s\S]*\.candidate-facts\{grid-template-columns:1fr\}/);
});

test('la navegación expone el generador y la importación permite decisiones de actualización', () => {
  assert.match(html, /data-view="search"/);
  assert.match(app, /configureCandidateAction/);
  assert.match(app, /applyCandidateDecisions/);
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
