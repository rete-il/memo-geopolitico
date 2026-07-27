import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import matter from 'gray-matter';

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

const expected = new Set([
  'cables-submarinos-infraestructura-critica',
  'corredor-lobito-minerales',
  'corredor-medio-caucaso-sur',
  'hormuz-bab-el-mandeb-suez',
  'rail-baltica-movilidad-militar-europea',
]);

test('hay cinco publicaciones autorizadas de seis párrafos', () => {
  const files = fs.readdirSync(publishedDir).filter((name) => name.endsWith('.md'));
  assert.equal(files.length, 5);

  const slugs = new Set();
  for (const file of files) {
    const { data, content } = matter.read(path.join(publishedDir, file));
    slugs.add(data.slug);
    assert.equal(data.publicacion.estado, 'publicado');
    assert.equal(data.publicacion.publicado_el, '2026-07-26');

    const paragraphs = content
      .trim()
      .split(/\n\s*\n/)
      .filter((block) => !block.startsWith('#') && !block.startsWith('-'));
    assert.equal(paragraphs.length, 6, `${data.slug}: párrafos`);
  }

  assert.deepEqual(slugs, expected);
});

test('la nueva publicación no se duplica en la vista editorial', () => {
  const previewSlugs = new Set(
    fs
      .readdirSync(previewDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => path.basename(name, '.md')),
  );

  assert.equal(previewSlugs.has('corredor-lobito-minerales'), false);
  assert.equal(previewSlugs.size, 16);
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

test('Inicio presenta accesos a Publicaciones y Observatorio sin exponer borradores', () => {
  const homePage = fs.readFileSync(
    path.join(root, 'src', 'pages', 'index.astro'),
    'utf8',
  );

  assert.match(homePage, /publishedOnly:\s*true/);
  assert.match(homePage, /publicationCountLabel/);
  assert.match(homePage, /href="\/publicaciones\/"/);
  assert.match(homePage, /href="\/observatorio\/"/);
  assert.doesNotMatch(homePage, /PublicationCard/);
  assert.doesNotMatch(homePage, /ProcessCard/);
  assert.doesNotMatch(homePage, /Procesos en movimiento/);
  assert.doesNotMatch(homePage, /Trabajo en curso/);
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
