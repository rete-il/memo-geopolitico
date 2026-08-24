import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  migrateWarningsSchemaV3,
  validateWarningsData,
} from '../lib/warnings-contract.mjs';
import { migrateWarningsFile } from '../tools/migrate-advertencias-v3.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');

function legacyData() {
  return {
    schema_version: 2,
    titulo: 'Observatorio de prueba',
    actualizado: '2026-08-16',
    notas: 'Este campo debe conservarse exactamente.',
    macroeventos: [
      {
        id: 'evento-uno',
        titulo: 'Evento uno',
        senales: [{ id: 'sig-uno' }],
        fuentes: [{ id: 'src-uno' }],
        campo_no_relacionado: { conservar: true },
      },
      {
        id: 'evento-dos',
        titulo: 'Evento dos',
        senales: [],
        fuentes: [],
      },
    ],
    expedientes_editoriales: [{ id: 'exp-uno', macroevento_ids: ['evento-uno'] }],
  };
}

test('migra registros sin advertencias a v3 sin perder campos existentes', () => {
  const original = legacyData();
  const before = structuredClone(original);
  const migration = migrateWarningsSchemaV3(original);

  assert.equal(migration.changed, true);
  assert.equal(migration.data.schema_version, 3);
  assert.deepEqual(original, before, 'la migración pura no debe mutar la entrada');
  assert.deepEqual(migration.data.macroeventos.map((event) => event.advertencias), [[], []]);
  assert.deepEqual(migration.data.macroeventos.map((event) => event.excepciones_advertencias), [[], []]);
  assert.deepEqual(migration.data.macroeventos[0].campo_no_relacionado, { conservar: true });
  assert.deepEqual(migration.data.expedientes_editoriales, before.expedientes_editoriales);
  assert.equal(validateWarningsData(migration.data).valid, true);
});
test('la migración pura es idempotente', () => {
  const first = migrateWarningsSchemaV3(legacyData());
  const second = migrateWarningsSchemaV3(first.data);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.deepEqual(second.data, first.data);
});

test('preserva advertencias y excepciones ya presentes al completar v3', () => {
  const input = legacyData();
  input.macroeventos[0].advertencias = [];
  input.macroeventos[0].excepciones_advertencias = [];
  const migration = migrateWarningsSchemaV3(input);
  assert.deepEqual(migration.data.macroeventos[0].advertencias, []);
  assert.deepEqual(migration.data.macroeventos[0].excepciones_advertencias, []);
});

test('la migración de archivo crea un backup exacto y persiste después de recargar', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-warnings-v3-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const dataPath = path.join(directory, 'data', 'macroeventos.json');
  const backupsDir = path.join(directory, 'backups');
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  const originalText = `${JSON.stringify(legacyData(), null, 2)}\n`;
  fs.writeFileSync(dataPath, originalText, 'utf8');

  const first = migrateWarningsFile({
    dataPath,
    backupsDir,
    now: new Date('2026-08-16T12:00:00.000Z'),
  });
  assert.equal(first.status, 'migrated');
  assert.equal(first.changed, true);
  assert.equal(fs.readFileSync(first.backupPath, 'utf8'), originalText);
  assert.equal(hash(fs.readFileSync(first.backupPath)), hash(originalText));
  assert.equal(fs.readdirSync(backupsDir).length, 1);

  const reloaded = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  assert.equal(reloaded.schema_version, 3);
  assert.equal(reloaded.macroeventos.length, 2);
  assert.ok(reloaded.macroeventos.every((event) => Array.isArray(event.advertencias)));
  assert.ok(reloaded.macroeventos.every((event) => Array.isArray(event.excepciones_advertencias)));
  assert.equal(validateWarningsData(reloaded).valid, true);
  assert.equal(fs.readdirSync(path.dirname(dataPath)).some((name) => name.includes('.tmp-')), false);

  const migratedHash = hash(fs.readFileSync(dataPath));
  const second = migrateWarningsFile({
    dataPath,
    backupsDir,
    now: new Date('2026-08-16T12:05:00.000Z'),
  });
  assert.equal(second.status, 'unchanged');
  assert.equal(second.changed, false);
  assert.equal(second.backupPath, null);
  assert.equal(hash(fs.readFileSync(dataPath)), migratedHash);
  assert.equal(fs.readdirSync(backupsDir).length, 1, 'la segunda ejecución no crea otro backup');
});

test('un backup v2 puede volver a normalizarse a v3', () => {
  const backup = legacyData();
  const restored = migrateWarningsSchemaV3(backup);
  assert.equal(restored.data.schema_version, 3);
  assert.ok(restored.data.macroeventos.every((event) => Array.isArray(event.advertencias)));
  assert.ok(restored.data.macroeventos.every((event) => Array.isArray(event.excepciones_advertencias)));
});

test('cancela antes de escribir si encuentra contenedores o referencias inválidas', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-warnings-invalid-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const dataPath = path.join(directory, 'macroeventos.json');
  const backupsDir = path.join(directory, 'backups');
  const invalid = legacyData();
  invalid.macroeventos[0].advertencias = 'no-es-lista';
  const originalText = `${JSON.stringify(invalid, null, 2)}\n`;
  fs.writeFileSync(dataPath, originalText, 'utf8');

  assert.throws(
    () => migrateWarningsFile({ dataPath, backupsDir }),
    (error) => error.code === 'WARNINGS_MIGRATION_INVALID',
  );
  assert.equal(fs.readFileSync(dataPath, 'utf8'), originalText);
  assert.equal(fs.existsSync(backupsDir), false);
});
