import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMediaDataset } from './lib/media-export.mjs';
import { validatePublicPackage } from './lib/public-export.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const productionPath = path.join(root, 'src', 'data', 'public', 'observatorio.json');
const mediaPath = path.join(root, 'src', 'data', 'public', 'medios.json');
const previewPath = path.join(root, 'local-preview', 'observatorio.json');

const results = {
  produccion: validatePublicPackage(read(productionPath), {
    allowDevelopment: true,
  }),
  medios: validateMediaDataset(read(mediaPath)),
};

if (fs.existsSync(previewPath)) {
  results.vista_local = validatePublicPackage(read(previewPath), {
    allowDrafts: true,
  });
}

const invalid = Object.entries(results).filter(([, result]) => !result.valid);
if (invalid.length) {
  console.error(JSON.stringify(results, null, 2));
  process.exit(1);
}

console.log(
  Object.entries(results)
    .map(
      ([key, result]) =>
        `${key}: válido (${result.warnings.length} advertencias)`,
    )
    .join('\n'),
);
