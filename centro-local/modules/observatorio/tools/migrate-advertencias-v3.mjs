import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INTERNAL_SCHEMA_VERSION,
  migrateWarningsSchemaV3,
  validateWarningsData,
} from '../lib/warnings-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const moduleRoot = path.resolve(path.dirname(__filename), '..');

function timestamp(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}
function writeJsonAtomic(file, value, mode) {
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      mode,
      flag: 'wx',
    });
    fs.renameSync(temporary, file);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
}

function reserveBackupPath(backupsDir, now) {
  const stem = `macroeventos-${timestamp(now)}-before-v${INTERNAL_SCHEMA_VERSION}`;
  let candidate = path.join(backupsDir, `${stem}.json`);
  let suffix = 2;
  while (fs.existsSync(candidate)) candidate = path.join(backupsDir, `${stem}-${suffix++}.json`);
  return candidate;
}

export function migrateWarningsFile({
  dataPath = path.join(moduleRoot, 'data', 'macroeventos.json'),
  backupsDir = path.join(moduleRoot, 'backups'),
  now = new Date(),
} = {}) {
  const resolvedDataPath = path.resolve(dataPath);
  const resolvedBackupsDir = path.resolve(backupsDir);
  const originalText = fs.readFileSync(resolvedDataPath, 'utf8');
  let original;
  try {
    original = JSON.parse(originalText);
  } catch (error) {
    throw new Error(`No se pudo leer ${resolvedDataPath} como JSON: ${error.message}`);
  }

  const migration = migrateWarningsSchemaV3(original);
  const validation = validateWarningsData(migration.data);
  if (!validation.valid) {
    const error = new Error(`La migración fue cancelada por ${validation.errors.length} error(es):\n- ${validation.errors.join('\n- ')}`);
    error.code = 'WARNINGS_MIGRATION_INVALID';
    error.validation = validation;
    throw error;
  }

  if (!migration.changed) {
    return {
      status: 'unchanged',
      changed: false,
      dataPath: resolvedDataPath,
      backupPath: null,
      macroeventos: migration.data.macroeventos.length,
      schemaVersion: migration.data.schema_version,
    };
  }

  fs.mkdirSync(resolvedBackupsDir, { recursive: true });
  const backupPath = reserveBackupPath(resolvedBackupsDir, now);
  fs.writeFileSync(backupPath, originalText, { encoding: 'utf8', flag: 'wx' });

  try {
    const mode = fs.statSync(resolvedDataPath).mode;
    writeJsonAtomic(resolvedDataPath, migration.data, mode);
  } catch (error) {
    error.message = `El backup quedó disponible en ${backupPath}, pero la escritura atómica falló: ${error.message}`;
    throw error;
  }

  return {
    status: 'migrated',
    changed: true,
    dataPath: resolvedDataPath,
    backupPath,
    macroeventos: migration.data.macroeventos.length,
    schemaVersion: migration.data.schema_version,
  };
}

function printResult(result) {
  if (!result.changed) {
    console.log(`Sin cambios: ${result.dataPath} ya utiliza el esquema interno v${result.schemaVersion}.`);
    return;
  }
  console.log(`Migración completada: ${result.macroeventos} macroeventos utilizan el esquema interno v${result.schemaVersion}.`);
  console.log(`Archivo actualizado: ${result.dataPath}`);
  console.log(`Backup previo: ${result.backupPath}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === __filename) {
  try {
    printResult(migrateWarningsFile());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
