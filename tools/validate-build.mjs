import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const productionPages = validateLinks(production);
const previewPages = validateLinks(preview);
const homePublicationCards = (
  home.match(/class="publication-card publication-card--published"/g) || []
).length;
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

assert.equal(homePublicationCards, 4);
assert.equal(home.includes('data-process-card'), false);
assert.equal(home.includes('publication-card--in-progress'), false);
assert.equal(publicationArchiveCards, 5);
assert.equal(publications.includes('publication-card--in-progress'), false);
assert.equal(observatoryProcessCards, 17);
assert.equal(linkedPublicationTitles, 5);
assert.equal(dashboardProcessRows, 17);
assert.equal(/>(?:Guardar|Editar|Eliminar)</.test(dashboard), false);
assert.equal(countRoutes(production, 'publicaciones'), 5);
assert.equal(countRoutes(preview, 'publicaciones'), 17);
assert.equal(
  countRoutes(
    production,
    path.join('metodologia', 'relevancia-atencion-mediatica'),
  ),
  17,
);

console.log(
  JSON.stringify(
    {
      paginas_produccion: productionPages,
      paginas_editoriales: previewPages,
      publicaciones_en_inicio: homePublicationCards,
      publicaciones_publicas: 5,
      posts_editoriales: 17,
      expedientes: observatoryProcessCards,
      enlaces_de_titulo_a_posts: linkedPublicationTitles,
      filas_dashboard: dashboardProcessRows,
      paginas_metodologicas_especificas: 17,
      enlaces_internos_rotos: 0,
    },
    null,
    2,
  ),
);
