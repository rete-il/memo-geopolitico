import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildMediaDataset, validateMediaDataset } from '../tools/lib/media-export.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const expectedMediaCount = 106;
const canonical = buildMediaDataset(
  path.join(
    root,
    'centro-local',
    'data',
    'medios',
    'Medios_Matriz_Geopolitica_Navegacion_actualizado.xlsx',
  ),
);

function readJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8'));
}

const publicCatalog = readJson('src', 'data', 'public', 'medios.json');
const mediaDashboard = readJson(
  'centro-local',
  'modules',
  'medios',
  'data',
  'medios.json',
);
const observatoryCatalog = readJson(
  'centro-local',
  'modules',
  'observatorio',
  'data',
  'catalogo-medios.json',
);

test('las tres vistas derivadas coinciden con el Excel maestro', () => {
  assert.equal(validateMediaDataset(canonical).valid, true);
  assert.equal(canonical.records.length, expectedMediaCount);
  for (const catalog of [publicCatalog, mediaDashboard, observatoryCatalog]) {
    assert.equal(catalog.records.length, expectedMediaCount);
    assert.deepEqual(catalog.records, canonical.records);
  }
});

test('Geopolitical Futures conserva su ficha completa y su ID estable', () => {
  const source = canonical.records.find(
    (item) => item.media_id === 'geopolitical-futures',
  );
  assert.ok(source);
  assert.equal(source.nombre, 'Geopolitical Futures');
  assert.equal(source.url, 'https://geopoliticalfutures.com/');
  assert.equal(source.puntuacion, 3.7);
  assert.equal(source.confianza, 'Media-alta');
  assert.equal(source.estado, 'Nuevo recomendado');
  assert.match(source.uso, /Escenarios/);
  assert.match(source.corroborar_con, /Reuters\/AP/);
});
