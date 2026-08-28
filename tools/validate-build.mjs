import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const production = path.join(root, 'dist');
const preview = path.join(root, 'dist-preview');

function htmlFiles(directory) {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
    }
  };
  visit(directory);
  return files;
}

function routeTarget(buildDirectory, sourceFile, href) {
  const cleanHref = href.split('#')[0].split('?')[0];
  if (!cleanHref || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(cleanHref)) {
    return null;
  }

  const absolute = cleanHref.startsWith('/')
    ? path.join(buildDirectory, cleanHref)
    : path.resolve(path.dirname(sourceFile), cleanHref);

  if (path.extname(absolute)) return absolute;
  return path.join(absolute, 'index.html');
}

function validateLinks(buildDirectory) {
  const broken = [];
  const files = htmlFiles(buildDirectory);

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/\shref=(?:"([^"]+)"|'([^']+)')/g)) {
      const href = match[1] || match[2];
      const target = routeTarget(buildDirectory, file, href);
      if (target && !fs.existsSync(target)) {
        broken.push({
          source: path.relative(buildDirectory, file),
          href,
          target: path.relative(buildDirectory, target),
        });
      }
    }
  }

  assert.deepEqual(broken, [], `Enlaces internos rotos:\n${JSON.stringify(broken, null, 2)}`);
  return files.length;
}

function countRoutes(buildDirectory, directory) {
  const routeDirectory = path.join(buildDirectory, directory);
  return fs
    .readdirSync(routeDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).length;
}

function expectedEditorialPublicationRoutes() {
  const publicationRoot = path.join(root, 'src', 'content', 'publicaciones');
  const files = ['publicadas', '_preview'].flatMap((directory) =>
    fs
      .readdirSync(path.join(publicationRoot, directory))
      .filter((name) => name.endsWith('.md'))
      .map((name) => path.join(publicationRoot, directory, name)),
  );
  return new Set(files.map((file) => matter.read(file).data.post_id)).size;
}

function expectedPublishedPublicationRoutes() {
  const publishedDirectory = path.join(root, 'src', 'content', 'publicaciones', 'publicadas');
  const publications = fs
    .readdirSync(publishedDirectory)
    .filter((name) => name.endsWith('.md'))
    .map((name) => matter.read(path.join(publishedDirectory, name)).data);
  return {
    posts: new Set(publications.map((publication) => publication.post_id)).size,
    linkedProcesses: new Set(
      publications.flatMap((publication) => [
        publication.macroevento_principal_id,
        ...(publication.macroevento_secundario_ids || []),
      ]),
    ).size,
  };
}

const home = fs.readFileSync(path.join(production, 'index.html'), 'utf8');
const publications = fs.readFileSync(
  path.join(production, 'publicaciones', 'index.html'),
  'utf8',
);
const observatory = fs.readFileSync(
  path.join(production, 'observatorio', 'index.html'),
  'utf8',
);
const dashboard = fs.readFileSync(
  path.join(production, 'observatorio', 'dashboard', 'index.html'),
  'utf8',
);
const sitemap = fs.readFileSync(
  path.join(production, 'sitemap.xml'),
  'utf8',
);
const energyTheme = fs.readFileSync(
  path.join(
    production,
    'temas',
    'energia-recursos-estrategicos',
    'index.html',
  ),
  'utf8',
);

const productionPages = validateLinks(production);
const previewPages = validateLinks(preview);
const publicationArchiveCards = (
  publications.match(/class="publication-card publication-card--published"/g) ||
  []
).length;
const observatoryProcessCards = (
  observatory.match(/<article[^>]*data-process-card/g) || []
).length;
const linkedPublicationTitles = (
  observatory.match(/<h2>\s*<a href="\/publicaciones\//g) || []
).length;
const dashboardProcessRows = (
  dashboard.match(/<tr[^>]*data-dashboard-process/g) || []
).length;
const observatoryStateLinks = (
  observatory.match(/href="\/observatorio\/estado\//g) || []
).length;
const publicationThemeLinks = (
  publications.match(/class="meta-link meta-link--theme/g) || []
).length;
const publicationCardMetadata = [
  ...publications.matchAll(/<div class="card-meta">([\s\S]*?)<\/div>/g),
].map((match) => match[1]);
const stateRouteCount = countRoutes(
  production,
  path.join('observatorio', 'estado'),
);
const observatoryData = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'public', 'observatorio.json'), 'utf8'),
);
const expectedProcessCount = observatoryData.procesos.length;
const editorialPublicationRoutes = expectedEditorialPublicationRoutes();
const publishedPublicationRoutes = expectedPublishedPublicationRoutes();

assert.equal(home.includes('home-path--publications'), true);
assert.equal(home.includes('home-path--observatory'), true);
assert.equal(home.includes('data-process-card'), false);
assert.equal(home.includes('publication-card--in-progress'), false);
assert.equal(publicationArchiveCards, publishedPublicationRoutes.posts);
assert.ok(publicationThemeLinks >= publishedPublicationRoutes.posts);
assert.equal(
  publicationCardMetadata.some((metadata) => />Análisis</.test(metadata)),
  false,
);
assert.equal(
  publicationCardMetadata.some((metadata) => />Publicado</.test(metadata)),
  false,
);
assert.equal(publications.includes('publication-card--in-progress'), false);
assert.equal(observatoryProcessCards, expectedProcessCount);
assert.equal(linkedPublicationTitles, publishedPublicationRoutes.linkedProcesses);
assert.equal(observatoryStateLinks, expectedProcessCount);
assert.equal(dashboardProcessRows, expectedProcessCount);
assert.equal(/>(?:Guardar|Editar|Eliminar)</.test(dashboard), false);
assert.equal(countRoutes(production, 'publicaciones'), publishedPublicationRoutes.posts);
assert.equal(countRoutes(preview, 'publicaciones'), editorialPublicationRoutes);
assert.equal(stateRouteCount, 4);
assert.ok(
  (energyTheme.match(/publication-card--published/g) || []).length > 0,
);
assert.ok(
  (energyTheme.match(/data-process-card/g) || []).length > 0,
);
assert.equal(
  sitemap.includes(
    '/publicaciones/africa-oriental-puertas-entrada/',
  ),
  false,
);
assert.equal(
  countRoutes(
    production,
    path.join('metodologia', 'relevancia-atencion-mediatica'),
  ),
  expectedProcessCount,
);

console.log(
  JSON.stringify(
    {
      paginas_produccion: productionPages,
      paginas_editoriales: previewPages,
      accesos_principales_en_inicio: 2,
      publicaciones_publicas: publishedPublicationRoutes.posts,
      posts_editoriales: editorialPublicationRoutes,
      expedientes: observatoryProcessCards,
      enlaces_de_titulo_a_posts: linkedPublicationTitles,
      enlaces_de_estado: observatoryStateLinks,
      paginas_de_estado: stateRouteCount,
      enlaces_tematicos_en_publicaciones: publicationThemeLinks,
      filas_dashboard: dashboardProcessRows,
      paginas_metodologicas_especificas: expectedProcessCount,
      enlaces_internos_rotos: 0,
    },
    null,
    2,
  ),
);
