import fs from 'node:fs';
import path from 'node:path';
import { validateMediaDataset } from './media-export.mjs';

const MODULE_WORKBOOK_NAME =
  'Medios_Matriz_Geopolitica_Navegacion_corregido.xlsx';

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function replaceStandaloneDataset(file, dataset) {
  const source = fs.readFileSync(file, 'utf8');
  const marker = 'window.MEDIA_DASHBOARD_DATA = ';
  const start = source.indexOf(marker);
  const lineBreak = source.indexOf('\n', start);
  const end = lineBreak >= 0 ? lineBreak : source.length;
  const currentStatement = source.slice(start, end).replace(/\r$/, '');
  if (start < 0 || !currentStatement.trimEnd().endsWith(';')) {
    throw new Error('No se encontró el bloque de datos del dashboard autónomo.');
  }
  const statement = `${marker}${JSON.stringify(dataset)};`;
  const carriageReturn = lineBreak >= 0 && source[end - 1] === '\r' ? '\r' : '';
  fs.writeFileSync(
    file,
    `${source.slice(0, start)}${statement}${carriageReturn}${source.slice(end)}`,
    'utf8',
  );
}

export function synchronizeMediaCatalog({
  root,
  workbookPath,
  dataset,
  generatedAt = new Date().toISOString().slice(0, 10),
}) {
  const validation = validateMediaDataset(dataset);
  if (!validation.valid) {
    throw new Error(`Catálogo inválido: ${validation.errors.join(' ')}`);
  }

  const mediaRoot = path.join(root, 'centro-local', 'modules', 'medios');
  const mediaDataRoot = path.join(mediaRoot, 'data');
  const moduleWorkbook = path.join(mediaDataRoot, MODULE_WORKBOOK_NAME);
  const generatedTimestamp = `${generatedAt}T00:00:00Z`;
  const total = dataset.records.length;

  const moduleDataset = {
    ...dataset,
    metadata: {
      ...dataset.metadata,
      archivo_fuente: MODULE_WORKBOOK_NAME,
      total_fuentes: total,
      total_medios: total,
      generado: generatedTimestamp,
    },
  };
  const observatoryCatalog = {
    ...dataset,
    schema_version: 1,
    metadata: {
      ...dataset.metadata,
      total_fuentes: total,
      total_medios: total,
      generado: generatedTimestamp,
      importado: generatedAt,
      catalogo: 'Observatorio de macroeventos geopolíticos',
    },
  };

  writeJson(path.join(root, 'src', 'data', 'public', 'medios.json'), dataset);
  writeJson(path.join(mediaDataRoot, 'medios.json'), moduleDataset);
  fs.writeFileSync(
    path.join(mediaDataRoot, 'medios-data.js'),
    `window.MEDIA_DASHBOARD_DATA = ${JSON.stringify(moduleDataset)};\n`,
    'utf8',
  );
  writeJson(
    path.join(
      root,
      'centro-local',
      'modules',
      'observatorio',
      'data',
      'catalogo-medios.json',
    ),
    observatoryCatalog,
  );

  if (path.resolve(workbookPath) !== path.resolve(moduleWorkbook)) {
    fs.copyFileSync(workbookPath, moduleWorkbook);
  }
  replaceStandaloneDataset(
    path.join(mediaRoot, 'dashboard-standalone.html'),
    moduleDataset,
  );

  return {
    total,
    validation,
    moduleWorkbook,
  };
}
