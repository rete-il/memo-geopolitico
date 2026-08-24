import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WARNING_TREATMENT_LABELS,
  filterAndSortWarnings,
  warningChangeSummary,
  warningPromptDecision,
  warningSummary,
} from '../public/warnings-ui.js';

function warning(overrides = {}) {
  return {
    advertencia_id: 'adv-prueba-001',
    descripcion: 'Advertencia de prueba.',
    estado: 'pendiente',
    tratamiento: 'relevante',
    prioridad: 'media',
    signal_ids: [],
    fuente_ids: [],
    creada_el: '2026-08-16T10:00:00Z',
    actualizada_el: '2026-08-16T10:00:00Z',
    ...overrides,
  };
}

test('la regla visible del prompt es derivada y no una decisión editable', () => {
  assert.equal(warningPromptDecision(warning()).included, true);
  assert.equal(warningPromptDecision(warning({ tratamiento: 'bloqueante' })).included, true);
  assert.equal(warningPromptDecision(warning({ tratamiento: 'observacion_posterior' })).included, false);
  assert.equal(warningPromptDecision(warning({ estado: 'resuelta' })).included, false);
  assert.equal(WARNING_TREATMENT_LABELS.observacion_posterior, 'Observación posterior');
});

test('el resumen separa tratamiento, resolución, descarte y radar', () => {
  const summary = warningSummary([
    warning({ tratamiento: 'bloqueante' }),
    warning({ advertencia_id: 'adv-002', tratamiento: 'relevante' }),
    warning({ advertencia_id: 'adv-003', tratamiento: 'observacion_posterior' }),
    warning({ advertencia_id: 'adv-004', estado: 'resuelta' }),
    warning({ advertencia_id: 'adv-005', estado: 'descartada' }),
  ]);
  assert.deepEqual(summary, {
    total: 5,
    pendingBlocking: 1,
    pendingRelevant: 1,
    resolved: 1,
    discarded: 1,
    radar: 1,
  });
});

test('los filtros combinan estado, tratamiento, vínculos y regla de prompt', () => {
  const items = [
    warning({ advertencia_id: 'adv-001', prioridad: 'alta', signal_ids: ['sig-1'], fuente_ids: ['src-1'] }),
    warning({ advertencia_id: 'adv-002', tratamiento: 'observacion_posterior', prioridad: 'baja' }),
    warning({ advertencia_id: 'adv-003', estado: 'resuelta', prioridad: 'alta' }),
  ];
  assert.deepEqual(filterAndSortWarnings(items, { estado: 'pendiente', signal: 'con', source: 'con', prompt: 'incluida' }).map((item) => item.advertencia_id), ['adv-001']);
  assert.deepEqual(filterAndSortWarnings(items, { prompt: 'excluida' }).map((item) => item.advertencia_id), ['adv-003', 'adv-002']);
});

test('el radar conserva solo observación posterior y ordena por prioridad y antigüedad', () => {
  const items = [
    warning({ advertencia_id: 'adv-media-nueva', tratamiento: 'observacion_posterior', prioridad: 'media', creada_el: '2026-08-16T12:00:00Z' }),
    warning({ advertencia_id: 'adv-alta', tratamiento: 'observacion_posterior', prioridad: 'alta', creada_el: '2026-08-16T13:00:00Z' }),
    warning({ advertencia_id: 'adv-media-antigua', tratamiento: 'observacion_posterior', prioridad: 'media', creada_el: '2026-08-15T12:00:00Z' }),
    warning({ advertencia_id: 'adv-relevante', tratamiento: 'relevante', prioridad: 'alta' }),
  ];
  assert.deepEqual(filterAndSortWarnings(items, { radar: true }).map((item) => item.advertencia_id), [
    'adv-alta',
    'adv-media-antigua',
    'adv-media-nueva',
  ]);
});

test('el historial distingue resolución, descarte, reapertura y reclasificación', () => {
  const base = warning();
  assert.equal(warningChangeSummary(base, { ...base, estado: 'resuelta' }).action, 'resuelta');
  assert.equal(warningChangeSummary(base, { ...base, estado: 'descartada' }).action, 'descartada');
  assert.equal(warningChangeSummary({ ...base, estado: 'resuelta' }, base).action, 'reabierta');
  assert.equal(warningChangeSummary(base, { ...base, tratamiento: 'bloqueante' }).action, 'reclasificada');
});
