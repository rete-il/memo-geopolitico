import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {
  EVALUATION_SCORE_KEYS, optionalScore, normalizeEventEvaluation, evaluationFromInputs,
  hasAssignedEvaluation, relevance, coverageGap, undercoverage, metricLabel,
} from '../public/evaluation-state.js';
import { preserveAnalyticalFields } from '../lib/analytical-fields.mjs';
import { normalizeCharacterization, normalizeLanguageCode } from '../public/controlled-values.js';
import { normalizeInternalCategories } from '../public/internal-categories.js';
import { normalizeEditorialVocabularies } from '../public/editorial-vocabularies.js';
import { INTERNAL_SCHEMA_VERSION, normalizeWarningContainers } from '../lib/warnings-contract.mjs';
import { normalizeSignalReference, normalizeTypedRelation } from '../lib/transversal-contract.mjs';

const scores = Object.fromEntries(EVALUATION_SCORE_KEYS.map((key) => [key, 3]));
const evaluated = { evaluacion: { ...scores, confianza: 'alta' } };
const unassigned = { estado_evaluacion: 'no_asignada', evaluacion: null };
const copy = (value) => JSON.parse(JSON.stringify(value));

test('la ausencia de evaluación permanece nula, incluso si hay cifras residuales', () => {
  for (const original of [unassigned, { ...unassigned, evaluacion: evaluated.evaluacion }]) {
    const normalized = normalizeEventEvaluation(original);
    assert.equal(normalized.estado_evaluacion, 'no_asignada');
    assert.ok(Object.values(normalized.evaluacion).every((value) => value === null));
    assert.equal(relevance(normalized), null);
    assert.equal(coverageGap(normalized), null);
    assert.equal(undercoverage(normalized), null);
    assert.equal(metricLabel(relevance(normalized)), 'Sin evaluación');
  }
});

test('vacíos, valores inválidos y evaluación parcial no producen métricas inventadas', () => {
  for (const value of ['', ' ', null, undefined, NaN, false, true, -1, 0, 6]) assert.equal(optionalScore(value), null);
  assert.equal(optionalScore('4'), 4);
  const partial = evaluationFromInputs({ impacto: '4', cobertura_observada: '' });
  assert.equal(partial.evaluacion.impacto, 4);
  assert.equal(partial.evaluacion.cobertura_observada, null);
  assert.equal(hasAssignedEvaluation(partial), false);
  assert.equal(relevance(partial), null);
  const empty = evaluationFromInputs(Object.fromEntries(EVALUATION_SCORE_KEYS.map((key) => [key, ''])));
  assert.equal(empty.estado_evaluacion, 'no_asignada');
  assert.ok(Object.values(empty.evaluacion).every((value) => value === null));
});

test('una evaluación editorial completa conserva valores, confianza y cálculos', () => {
  assert.deepEqual(normalizeEventEvaluation(evaluated), evaluated);
  const entered = evaluationFromInputs({ ...scores, confianza: 'alta' });
  assert.equal(entered.estado_evaluacion, 'asignada');
  assert.equal(relevance(entered), 81);
  assert.equal(coverageGap(entered), 27);
  assert.equal(undercoverage(entered), 3);
});

test('campos de pronóstico y análisis conservan estructura y no comparten referencias', () => {
  for (const parameters of [[{ id: 'ia', estados: ['anunciada', 'operativa'], fuente_ids: ['src-1'] }], { ia: { estado: 'anunciada' } }]) {
    const original = { hipotesis_principal: 'Hipótesis', delimitacion_exclusiones: ['exclusión'], incertidumbres: ['duda'], parametros_pronostico: parameters, analisis_expertos: [{ experto: 'Especialista', fuentes: ['src-1'] }], publicacion: { slug: 'proceso' } };
    const preserved = preserveAnalyticalFields(original);
    assert.deepEqual(preserved, original);
    assert.notEqual(preserved.parametros_pronostico, original.parametros_pronostico);
    assert.notEqual(preserved.analisis_expertos[0], original.analisis_expertos[0]);
  }
});

const server = fs.readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
const { normalizeEvent, normalizeData } = vm.runInNewContext(
  `${server.slice(server.indexOf('function slug('), server.indexOf('function normalizeCatalog('))}\n({ normalizeEvent, normalizeData })`,
  {
    normalizeEventEvaluation, preserveAnalyticalFields,
    normalizeCharacterization, normalizeLanguageCode, normalizeWarningContainers,
    normalizeSignalReference, normalizeTypedRelation, normalizeInternalCategories,
    normalizeEditorialVocabularies, INTERNAL_SCHEMA_VERSION,
  },
);

test('guardar otro evento no elimina campos analíticos ni asigna cifras al no evaluado', () => {
  const event = { id: 'nuevo', titulo: 'Nuevo', ...unassigned, pregunta_seguimiento: '¿Qué cambia?', hipotesis_principal: 'Hipótesis', indicadores_fortalecimiento: ['continuidad'], condiciones_refutacion: ['ruptura'], parametros_pronostico: { ia: { estado: 'anunciada' } }, analisis_expertos: [{ experto: 'Especialista' }] };
  const normalized = [evaluated, event].map((item, index) => normalizeEvent(item, index, {}));
  assert.deepEqual(copy(normalized[0].evaluacion), evaluated.evaluacion);
  assert.equal(normalized[1].estado_evaluacion, 'no_asignada');
  assert.deepEqual(preserveAnalyticalFields(normalized[1]), preserveAnalyticalFields(event));
  assert.ok(Object.values(normalized[1].evaluacion).every((value) => value === null));
});

test('guardar otra ficha del corpus real conserva clasificación, seguimiento y trazabilidad de EE. UU.–China', () => {
  const corpus = JSON.parse(fs.readFileSync(new URL('../data/macroeventos.json', import.meta.url), 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(new URL('../data/catalogo-medios.json', import.meta.url), 'utf8'));
  const targetId = 'eeuu-china-competencia-geoeconomica-interdependencias';
  const original = corpus.macroeventos.find((event) => event.id === targetId);
  assert.ok(original, 'La ficha incorporada debe existir en el corpus canónico.');
  const protectedKeys = ['clasificacion', 'nota_fecha_corte', 'estado_seguimiento', 'parametros_pronostico', 'analisis_expertos'];
  for (const key of protectedKeys) assert.ok(Object.hasOwn(original, key), `El corpus debe contener ${key}.`);

  const changed = copy(corpus);
  const other = changed.macroeventos.find((event) => event.id !== targetId);
  other.titulo += ' — revisión de prueba';
  // The real save path normalizes the whole payload, including untouched events.
  const stored = copy(normalizeData(changed, catalog));
  const reloaded = copy(normalizeData(stored, catalog));
  assert.equal(reloaded.macroeventos.find((event) => event.id === other.id).titulo, other.titulo);
  assert.deepEqual(reloaded.macroeventos.map((event) => event.id), corpus.macroeventos.map((event) => event.id));
  const retained = reloaded.macroeventos.find((event) => event.id === targetId);
  for (const key of protectedKeys) assert.deepEqual(retained[key], original[key], `No debe alterarse ${key} al guardar otra ficha.`);
  assert.equal(retained.estado_evaluacion, 'no_asignada');
  assert.ok(Object.values(retained.evaluacion).every((value) => value === null));
  for (const event of corpus.macroeventos) {
    const saved = reloaded.macroeventos.find((item) => item.id === event.id);
    assert.deepEqual(preserveAnalyticalFields(saved), preserveAnalyticalFields(event), `Campos analíticos de ${event.id}`);
  }
});

const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
test('abrir y guardar la ficha real conserva los vacíos; asignarlos requiere introducir cifras', () => {
  const event = normalizeEvent({ ...unassigned, id: 'nuevo', titulo: 'Nuevo', parametros_pronostico: { ia: { estado: 'anunciada' } } }, 0, {});
  const nodes = new Map();
  const $ = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, { value: '', textContent: '', querySelector: () => null, prepend() {} });
    return nodes.get(selector);
  };
  const scoreMap = { '#s-impact': 'impacto', '#s-prob': 'probabilidad', '#s-reach': 'alcance', '#s-persistence': 'persistencia', '#s-spread': 'propagacion', '#s-gap': 'subcobertura', '#s-uncertainty': 'incertidumbre', '#s-urgency': 'urgencia', '#s-coverage': 'cobertura_observada' };
  const context = {
    $, S: { eventDraft: event, data: { macroeventos: [event] }, taxonomy: {} }, scoreMap,
    normalizeEventEvaluation, evaluationFromInputs, metricLabel, rel: relevance, gapRaw: coverageGap,
    Option: class { constructor(label, value) { this.label = label; this.value = value; } },
    eventRectorIds: () => [], setEventRectorIds() {},
    normalizeCharacterization: (value) => value, slug: (value) => value,
    commas: (value) => value.split(',').map((part) => part.trim()).filter(Boolean),
    lines: (value) => value.split('\n').map((part) => part.trim()).filter(Boolean),
  };
  for (const name of ['renderEventCategoryOptions', 'renderThemeEditor', 'renderEventRelations', 'renderEventUpdateHistory', 'renderSignalCards', 'renderSourceCards', 'clearWarningFilters', 'renderWarningCards', 'activateEventRecordTab', 'analyzeDiversity', 'diversityHtml']) context[name] = () => '';
  const functions = vm.runInNewContext(
    app.slice(app.indexOf('function fillEventFields('), app.indexOf('function renderEventUpdateHistory('))
    + app.slice(app.indexOf('function gatherEvent('), app.indexOf('function renderSignalCards('))
    + '\n({ fillEventFields, gatherEvent })', context,
  );
  functions.fillEventFields(event, 'edit');
  const saved = functions.gatherEvent();
  assert.equal(saved.estado_evaluacion, 'no_asignada');
  assert.ok(Object.values(saved.evaluacion).every((value) => value === null));
  assert.deepEqual(copy(saved.parametros_pronostico), { ia: { estado: 'anunciada' } });
  assert.equal($('#calc-rel').textContent, 'Sin evaluación');
  assert.equal($('#calc-gap').textContent, 'Sin evaluación');
  for (const selector of Object.keys(scoreMap)) $(selector).value = '4';
  $('#s-confidence').value = 'alta';
  const assigned = functions.gatherEvent();
  assert.equal(assigned.estado_evaluacion, 'asignada');
  assert.equal(relevance(assigned), 256);
});

test('la matriz real excluye fichas sin evaluación y explica su ausencia', () => {
  const nodes = { '#matrix-chart': {}, '#matrix-table': {} };
  const { renderMatrix } = vm.runInNewContext(
    `${app.slice(app.indexOf('function renderMatrix('), app.indexOf('function renderTaxonomy('))}\n({ renderMatrix })`,
    {
      S: { data: { macroeventos: [{ ...evaluated, id: 'evaluado', titulo: 'Evaluado' }, { ...unassigned, id: 'sin-evaluacion', titulo: 'Sin evaluación' }] } },
      $: (selector) => nodes[selector], esc: String,
      hasAssignedEvaluation, rel: relevance, gapRaw: coverageGap, gapLevel: undercoverage,
      byMetricDescending: (a, b) => relevance(b) - relevance(a),
    },
  );
  renderMatrix();
  assert.match(nodes['#matrix-chart'].innerHTML, /data-edit-event="evaluado"/);
  assert.doesNotMatch(nodes['#matrix-chart'].innerHTML, /data-edit-event="sin-evaluacion"/);
  assert.match(nodes['#matrix-table'].innerHTML, /1 macroevento sin evaluación completa, excluido/);
  assert.doesNotMatch(nodes['#matrix-table'].innerHTML, /null\/5|NaN|undefined/);
});
