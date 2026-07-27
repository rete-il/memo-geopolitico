import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildMediaDataset, validateMediaDataset } from './lib/media-export.mjs';
import {
  buildPublicPackage,
  validatePublicPackage,
} from './lib/public-export.mjs';
import {
  choosePublicationFiles,
  migratePublication,
} from './lib/publication-migration.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) continue;
    const [rawKey, inlineValue] = current.slice(2).split('=', 2);
    const next = inlineValue ?? argv[index + 1];
    values[rawKey] = next;
    if (inlineValue === undefined) index += 1;
  }
  return values;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

const args = parseArgs(process.argv.slice(2));
let config = {};
if (args.config) config = readJson(path.resolve(args.config));

const paths = {
  observatorio: args.observatorio || config.observatorio,
  taxonomia: args.taxonomia || config.taxonomia,
  medios: args.medios || config.medios,
  publicaciones: args.publicaciones || config.publicaciones,
};

const missing = Object.entries(paths)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  console.error(
    `Faltan rutas: ${missing.join(', ')}. Usá --config local-sources.json o los argumentos correspondientes.`,
  );
  process.exit(1);
}

for (const [key, value] of Object.entries(paths)) {
  paths[key] = path.resolve(value);
  if (!fs.existsSync(paths[key])) {
    console.error(`No existe ${key}: ${paths[key]}`);
    process.exit(1);
  }
}

const source = readJson(paths.observatorio);
const taxonomy = readJson(paths.taxonomia);
const generatedAt = new Date().toISOString().slice(0, 10);

const productionPackage = buildPublicPackage(source, taxonomy, {
  includeUnpublished: true,
  includeInternal: false,
  generatedAt,
});
const previewPackage = buildPublicPackage(source, taxonomy, {
  includeUnpublished: true,
  includeInternal: true,
  generatedAt,
});

const previewPostsDir = path.join(
  root,
  'src',
  'content',
  'publicaciones',
  '_preview',
);
fs.rmSync(previewPostsDir, { recursive: true, force: true });
fs.mkdirSync(previewPostsDir, { recursive: true });

const publishedPostsDir = path.join(
  root,
  'src',
  'content',
  'publicaciones',
  'publicadas',
);
const publishedByProcessId = new Map();
if (fs.existsSync(publishedPostsDir)) {
  for (const name of fs.readdirSync(publishedPostsDir)) {
    if (!name.endsWith('.md')) continue;
    const parsed = matter.read(path.join(publishedPostsDir, name));
    const processId = parsed.data.macroevento_principal_id;
    if (!processId || parsed.data.publicacion?.estado !== 'publicado') continue;
    publishedByProcessId.set(processId, parsed.data);
  }
}

const processById = new Map(
  previewPackage.procesos.map((item) => [item.macroevento_id, item]),
);
const productionProcessById = new Map(
  productionPackage.procesos.map((item) => [item.macroevento_id, item]),
);
const publicationFiles = choosePublicationFiles(paths.publicaciones);
const migrationSummary = [];

for (const file of publicationFiles) {
  const legacyId = path.basename(file, '.md');
  const published = publishedByProcessId.get(legacyId);
  if (published) {
    migrationSummary.push({
      post_id: published.post_id,
      estado: 'publicado',
      fuente_ids: published.fuente_ids?.length || 0,
    });
    continue;
  }
  const process = processById.get(legacyId);
  const migrated = migratePublication(file, process, previewPackage.fuentes);
  const relatedProcess = processById.get(migrated.data.macroevento_principal_id);
  const relatedProductionProcess = productionProcessById.get(
    migrated.data.macroevento_principal_id,
  );
  for (const item of [relatedProcess, relatedProductionProcess].filter(Boolean)) {
    item.publicacion.estado = migrated.data.publicacion.estado;
    item.progreso_publico.etapa = migrated.data.publicacion.estado;
    const steps = {
      borrador: 'Completar la documentación y verificar las señales pendientes.',
      en_revision: 'Revisar coherencia, fuentes y valoraciones antes de autorizar la publicación.',
      listo: 'Realizar el control final y decidir la fecha de publicación.',
      publicado: 'Mantener el seguimiento e incorporar nuevas señales verificadas.',
    };
    item.progreso_publico.proximo_paso =
      steps[migrated.data.publicacion.estado] || steps.borrador;
    if (
      ['en_revision', 'listo', 'publicado'].includes(
        migrated.data.publicacion.estado,
      ) &&
      !item.progreso_publico.hitos_completados.includes(
        'Revisión editorial iniciada',
      )
    ) {
      item.progreso_publico.hitos_completados.push(
        'Revisión editorial iniciada',
      );
    }
    if (
      ['listo', 'publicado'].includes(migrated.data.publicacion.estado) &&
      !item.progreso_publico.hitos_completados.includes(
        'Control editorial completado',
      )
    ) {
      item.progreso_publico.hitos_completados.push(
        'Control editorial completado',
      );
    }
    if (
      migrated.data.publicacion.estado === 'publicado' &&
      !item.progreso_publico.hitos_completados.includes(
        'Publicación autorizada',
      )
    ) {
      item.progreso_publico.hitos_completados.push('Publicación autorizada');
    }
    if (!item.por_que_importa && migrated.whyItMatters) {
      item.por_que_importa = stripMarkdown(migrated.whyItMatters);
    }
  }
  const output = path.join(previewPostsDir, `${migrated.data.slug}.md`);
  fs.writeFileSync(output, migrated.content, 'utf8');
  migrationSummary.push({
    post_id: migrated.data.post_id,
    estado: migrated.data.publicacion.estado,
    fuente_ids: migrated.data.fuente_ids.length,
  });
}

const productionValidation = validatePublicPackage(productionPackage, {
  allowDevelopment: true,
});
const previewValidation = validatePublicPackage(previewPackage, {
  allowDrafts: true,
});
if (!productionValidation.valid || !previewValidation.valid) {
  console.error(
    JSON.stringify(
      {
        production: productionValidation,
        preview: previewValidation,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const media = buildMediaDataset(paths.medios);
const mediaValidation = validateMediaDataset(media);
if (!mediaValidation.valid) {
  console.error(JSON.stringify(mediaValidation, null, 2));
  process.exit(1);
}

writeJson(path.join(root, 'src', 'data', 'public', 'observatorio.json'), productionPackage);
writeJson(path.join(root, 'local-preview', 'observatorio.json'), previewPackage);
writeJson(path.join(root, 'src', 'data', 'public', 'medios.json'), media);
writeJson(path.join(root, 'local-preview', 'sync-report.json'), {
  generado_el: generatedAt,
  entradas: paths,
  produccion: {
    procesos: productionPackage.procesos.length,
    fuentes: productionPackage.fuentes.length,
  },
  vista_local: {
    procesos: previewPackage.procesos.length,
    fuentes: previewPackage.fuentes.length,
    publicaciones: migrationSummary.length,
  },
  medios: media.records.length,
  publicaciones: migrationSummary,
  validacion: {
    produccion: productionValidation,
    vista_local: previewValidation,
    medios: mediaValidation,
  },
});

console.log(
  [
    'Sincronización completada.',
    `Producción: ${productionPackage.procesos.length} expedientes saneados.`,
    `Vista local: ${previewPackage.procesos.length} procesos y ${migrationSummary.length} publicaciones.`,
    `Medios: ${media.records.length} registros.`,
  ].join('\n'),
);
