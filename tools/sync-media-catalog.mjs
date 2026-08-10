import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMediaDataset } from './lib/media-export.mjs';
import { synchronizeMediaCatalog } from './lib/media-sync.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workbookPath = path.resolve(
  process.argv[2] ||
    path.join(
      root,
      'centro-local',
      'data',
      'medios',
      'Medios_Matriz_Geopolitica_Navegacion_actualizado.xlsx',
    ),
);
const dataset = buildMediaDataset(workbookPath);
const result = synchronizeMediaCatalog({ root, workbookPath, dataset });

console.log(
  [
    `Catálogo de Medios sincronizado: ${result.total} fuentes.`,
    `Excel maestro: ${workbookPath}`,
    `Excel descargable: ${result.moduleWorkbook}`,
  ].join('\n'),
);
