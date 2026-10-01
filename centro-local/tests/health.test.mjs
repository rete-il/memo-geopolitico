import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { collectDataHealth } from '../lib/health.mjs';
import { checkInstallation } from '../server.mjs';

test('reconoce los datos reales incluidos en el Centro', () => {
  const health = collectDataHealth();
  assert.equal(health.ok, true);
  const corpus = JSON.parse(fs.readFileSync(new URL('../modules/observatorio/data/macroeventos.json', import.meta.url), 'utf8'));
  const eventIds = new Set(corpus.macroeventos.map((event) => event.id));
  assert.equal(eventIds.size, corpus.macroeventos.length, 'No debe haber identidades duplicadas.');
  assert.ok(corpus.macroeventos.every((event) => typeof event.id === 'string' && event.id.trim()), 'Todas las fichas deben tener identidad.');
  for (const id of ['rusia-ucrania-redes-seguridad-sostenimiento', 'indo-pacifico-taiwan-reconfiguracion-seguridad', 'eeuu-china-competencia-geoeconomica-interdependencias']) {
    assert.ok(eventIds.has(id), `Debe reconocerse el proceso canónico ${id}.`);
  }
  assert.equal(health.observatorio.macroeventos, eventIds.size);
  assert.equal(health.observatorio.senales, corpus.macroeventos.flatMap((event) => event.senales || []).length);
  assert.equal(health.observatorio.fuentes, corpus.macroeventos.flatMap((event) => event.fuentes || []).length);
  assert.equal(health.observatorio.temas, 314);
  assert.equal(health.medios.canonical, 107);
  assert.equal(health.medios.derived, 107);
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
