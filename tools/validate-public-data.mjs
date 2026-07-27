import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { validateMediaDataset } from './lib/media-export.mjs';
import { validatePublicPackage } from './lib/public-export.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const productionPath = path.join(root, 'src', 'data', 'public', 'observatorio.json');
const mediaPath = path.join(root, 'src', 'data', 'public', 'medios.json');
const previewPath = path.join(root, 'local-preview', 'observatorio.json');
const publicationsPath = path.join(
  root,
  'src',
  'content',
  'publicaciones',
);
const productionPackage = read(productionPath);

function markdownFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(file));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(file);
  }
  return files;
}

function validatePublicationMetadata(directory, publicData) {
  const errors = [];
  const warnings = [];
  const themeIds = new Set(publicData.catalogos.temas.map((item) => item.id));
  const subthemeIds = new Set(
    publicData.catalogos.subtemas.map((item) => item.id),
  );

  for (const file of markdownFiles(directory)) {
    const relative = path.relative(root, file);
    const data = matter.read(file).data;
    const classification = data.clasificacion || {};
    const primary = classification.tema_principal_id;
    const secondary = classification.tema_secundario_ids || [];
    const subthemes = classification.subtema_ids || [];

    if (!primary) errors.push(`${relative}: falta tema principal.`);
    if (primary && !themeIds.has(primary)) {
      errors.push(`${relative}: tema principal inexistente (${primary}).`);
    }
    if (secondary.includes(primary)) {
      errors.push(`${relative}: el tema principal está repetido como secundario.`);
    }
    if (new Set(secondary).size !== secondary.length) {
      errors.push(`${relative}: hay temas secundarios duplicados.`);
    }
    if (new Set(subthemes).size !== subthemes.length) {
      errors.push(`${relative}: hay subtemas duplicados.`);
    }
    for (const id of secondary) {
      if (!themeIds.has(id)) {
        errors.push(`${relative}: tema secundario inexistente (${id}).`);
      }
    }
    for (const id of subthemes) {
      if (!subthemeIds.has(id)) {
        errors.push(`${relative}: subtema inexistente (${id}).`);
      }
    }
    const topicCount = new Set([primary, ...secondary, ...subthemes].filter(Boolean))
      .size;
    if (topicCount > 3) {
      warnings.push(
        `${relative}: ${topicCount} clasificaciones temáticas; revisar legibilidad editorial.`,
      );
    }
    if (
      relative.includes(
        `${path.sep}publicaciones${path.sep}publicadas${path.sep}`,
      ) &&
      data.publicacion?.estado !== 'publicado'
    ) {
      errors.push(
        `${relative}: un archivo público debe tener estado publicado.`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

const results = {
  produccion: validatePublicPackage(productionPackage, {
    allowDevelopment: true,
  }),
  publicaciones: validatePublicationMetadata(
    publicationsPath,
    productionPackage,
  ),
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
