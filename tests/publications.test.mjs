import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import matter from 'gray-matter';
import { homeConfig } from '../src/config/home.ts';
import { selectHomeContent } from '../src/lib/home.ts';

const root = path.resolve(import.meta.dirname, '..');
const publishedDir = path.join(
  root,
  'src',
  'content',
  'publicaciones',
  'publicadas',
);
const previewDir = path.join(
  root,
  'src',
  'content',
  'publicaciones',
  '_preview',
);

test('las publicaciones autorizadas conservan identidad, estado y contenido publicable', () => {
  const files = fs.readdirSync(publishedDir).filter((name) => name.endsWith('.md'));
  assert.ok(files.length >= 5);

  const slugs = new Set();
  const postIds = new Set();
  for (const file of files) {
    const { data, content } = matter.read(path.join(publishedDir, file));
    assert.equal(slugs.has(data.slug), false, `${data.slug}: slug repetido`);
    assert.equal(postIds.has(data.post_id), false, `${data.post_id}: post_id repetido`);
    slugs.add(data.slug);
    postIds.add(data.post_id);
    assert.equal(data.publicacion.estado, 'publicado');
    assert.match(data.publicacion.publicado_el, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(data.publicacion.actualizado_el, /^\d{4}-\d{2}-\d{2}$/);
    assert.doesNotMatch(content, /\[(?:VERIFICAR|COMPLETAR|PENDIENTE)(?::|\])/i, `${data.slug}: marcador editorial interno`);

    const paragraphs = content
      .trim()
      .split(/\n\s*\n/)
      .filter((block) => !block.startsWith('#') && !block.startsWith('-'));
    assert.ok(paragraphs.length >= 6, `${data.slug}: contenido demasiado breve`);
  }

  assert.equal(slugs.size, files.length);
  assert.equal(postIds.size, files.length);
});

test('la vista editorial conserva identidades únicas al incorporar nuevos borradores', () => {
  const files = fs.readdirSync(previewDir).filter((name) => name.endsWith('.md'));
  const previewSlugs = new Set();
  const previewPostIds = new Set();

  for (const file of files) {
    const { data } = matter.read(path.join(previewDir, file));
    assert.equal(previewSlugs.has(data.slug), false, `${data.slug}: slug repetido`);
    assert.equal(previewPostIds.has(data.post_id), false, `${data.post_id}: post_id repetido`);
    previewSlugs.add(data.slug);
    previewPostIds.add(data.post_id);
  }

  assert.equal(previewSlugs.has('corredor-lobito-minerales'), false);
  assert.equal(previewSlugs.size, files.length);
  assert.equal(previewPostIds.size, files.length);
});

test('la carga resiste copias antiguas y Publicaciones expone solo textos publicados', () => {
  const contentConfig = fs.readFileSync(
    path.join(root, 'src', 'content.config.ts'),
    'utf8',
  );
  const publicationsPage = fs.readFileSync(
    path.join(root, 'src', 'pages', 'publicaciones', 'index.astro'),
    'utf8',
  );
  const publicationsHelper = fs.readFileSync(
    path.join(root, 'src', 'lib', 'publications.ts'),
    'utf8',
  );

  assert.match(
    contentConfig,
    /pattern:\s*'\{publicadas,_preview\}\/\*\*\/\*\.md'/,
  );
  assert.match(contentConfig, /generateId:/);
  assert.match(publicationsHelper, /preferredEntry/);
  assert.match(publicationsHelper, /publicationStatePriority/);
  assert.match(publicationsPage, />Publicados</);
  assert.doesNotMatch(publicationsPage, />Trabajo en curso</);
  assert.match(
    publicationsPage,
    /publishedOnly:\s*true/,
  );
});

test('Inicio compone lectura y seguimiento desde el corpus público sin exponer borradores', () => {
  const homePage = fs.readFileSync(
    path.join(root, 'src', 'pages', 'index.astro'),
    'utf8',
  );

  assert.match(homePage, /publishedOnly:\s*true/);
  assert.match(homePage, /includePreview:\s*false/);
  assert.match(homePage, /processes:\s*publicProcesses/);
  const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/public/observatorio.json'), 'utf8'));
  const publications = fs.readdirSync(publishedDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ id: file, data: matter.read(path.join(publishedDir, file)).data }));
  const home = selectHomeContent({
    publications, processes: data.procesos, themes: data.catalogos.temas,
    sourceById: new Map(data.fuentes.map((source) => [source.fuente_id, source])),
  }, homeConfig);
  assert.ok(home.featured);
  for (const view of [home.featured, ...home.latest]) {
    assert.equal(view.publication.data.publicacion.estado, 'publicado');
  }
  const catalogDestinations = homeConfig.paths.map((entry) => homeConfig.routes[entry.key]);
  assert.ok(catalogDestinations.includes('/publicaciones/'));
  assert.ok(catalogDestinations.includes('/observatorio/'));
  assert.equal(home.counts.publications, publications.length);
});

test('los enlaces de cada proceso separan publicación, expediente y metodología', () => {
  const processCard = fs.readFileSync(
    path.join(root, 'src', 'components', 'ProcessCard.astro'),
    'utf8',
  );
  const ratingPair = fs.readFileSync(
    path.join(root, 'src', 'components', 'RatingPair.astro'),
    'utf8',
  );
  const methodologyPage = fs.readFileSync(
    path.join(
      root,
      'src',
      'pages',
      'metodologia',
      'relevancia-atencion-mediatica',
      '[slug].astro',
    ),
    'utf8',
  );

  assert.match(processCard, /publicationHref\s*\?/);
  assert.match(processCard, /Abrir expediente/);
  assert.match(processCard, /\/observatorio\/\$\{process\.slug\}\//);
  assert.match(
    processCard,
    /\/metodologia\/relevancia-atencion-mediatica\/\$\{process\.slug\}\//,
  );
  assert.match(ratingPair, />Relevancia</);
  assert.match(ratingPair, /Brecha \{gap/);
  assert.doesNotMatch(ratingPair, /Relevancia geopolítica/);
  assert.doesNotMatch(ratingPair, /Brecha entre ambas/);
  assert.match(methodologyPage, /Las indicaciones y la evidencia cuantitativa/);
  assert.match(methodologyPage, /Metodología en desarrollo/);
});

test('el dashboard público usa el corpus saneado y no expone edición', () => {
  const dashboardPage = fs.readFileSync(
    path.join(root, 'src', 'pages', 'observatorio', 'dashboard', 'index.astro'),
    'utf8',
  );
  const observatoryPage = fs.readFileSync(
    path.join(root, 'src', 'pages', 'observatorio', 'index.astro'),
    'utf8',
  );

  assert.match(dashboardPage, /Consulta pública/);
  assert.match(dashboardPage, /Solo consulta/);
  assert.match(dashboardPage, /processes/);
  assert.match(dashboardPage, /sources/);
  assert.doesNotMatch(dashboardPage, />Guardar</);
  assert.doesNotMatch(dashboardPage, />Editar</);
  assert.doesNotMatch(dashboardPage, />Eliminar</);
  assert.match(observatoryPage, /\/observatorio\/dashboard\//);
  assert.match(observatoryPage, /Abrir dashboard/);
});
