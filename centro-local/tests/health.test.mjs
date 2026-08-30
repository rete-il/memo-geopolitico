import assert from 'node:assert/strict';
import test from 'node:test';
import { collectDataHealth } from '../lib/health.mjs';
import { checkInstallation } from '../server.mjs';

test('reconoce los datos reales incluidos en el Centro', () => {
  const health = collectDataHealth();
  assert.equal(health.ok, true);
  assert.equal(health.observatorio.macroeventos, 45);
  assert.equal(health.observatorio.temas, 314);
  assert.equal(health.medios.canonical, 106);
  assert.equal(health.medios.derived, 106);
  assert.equal(health.medios.in_sync, true);
  assert.equal(health.workflow.etapas, 13);
  assert.equal(health.workflow.documentos, 2);
});

test('la instalación integrada no requiere configuración de rutas', () => {
  const report = checkInstallation();
  assert.equal(report.ok, true);
  assert.equal(report.configuration_required, false);
  assert.deepEqual(report.missing, []);
});

test('el Excel y la vista de Medios permanecen sincronizados', () => {
  const health = collectDataHealth();
  assert.equal(health.medios.warning, null);
});
