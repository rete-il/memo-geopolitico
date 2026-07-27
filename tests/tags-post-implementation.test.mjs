import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (...segments) =>
  fs.readFileSync(path.join(root, ...segments), 'utf8');

test('las tarjetas limitan las etiquetas accesorias a las dos primeras', () => {
  const taxonomy = read('src', 'lib', 'taxonomy.ts');
  const publicationCard = read(
    'src',
    'components',
    'PublicationCard.astro',
  );
  const processCard = read('src', 'components', 'ProcessCard.astro');

  assert.match(
    taxonomy,
    /labelReferences\(classification, maps\)\.slice\(0, 2\)/,
  );
  assert.match(publicationCard, /cardLabelReferences/);
  assert.match(processCard, /cardLabelReferences/);
  assert.doesNotMatch(publicationCard, /\+\{?\w+/);
  assert.doesNotMatch(processCard, /\+\{?\w+/);
});

test('las páginas detalladas trasladan la clasificación completa al final', () => {
  const publication = read(
    'src',
    'pages',
    'publicaciones',
    '[slug].astro',
  );
  const process = read('src', 'pages', 'observatorio', '[slug].astro');
  const footer = read('src', 'components', 'ClassificationFooter.astro');

  assert.match(publication, /ClassificationFooter/);
  assert.match(process, /ClassificationFooter/);
  assert.doesNotMatch(publication, /class="detail-topics"/);
  assert.doesNotMatch(process, /class="detail-topics"/);
  assert.match(footer, />Temas y etiquetas</);
  assert.match(footer, />Tema principal</);
  assert.match(footer, />Otros temas</);
  assert.match(footer, />Etiquetas relacionadas</);
  assert.match(footer, /labelReferences/);
});

test('el directorio de etiquetas combina únicamente contenido público', () => {
  const directory = read('src', 'pages', 'etiquetas', 'index.astro');
  const detail = read('src', 'pages', 'etiquetas', '[slug].astro');
  const sitemap = read('src', 'pages', 'sitemap.xml.ts');

  for (const source of [directory, detail]) {
    assert.match(source, /publishedOnly:\s*true/);
    assert.match(source, /publicProcessesForLabel/);
    assert.match(source, /publicationEntriesForLabel/);
  }
  assert.match(directory, /Intl\.Collator\('es'/);
  assert.match(directory, /items\.length >= 25/);
  assert.match(detail, /Todavía no hay publicaciones relacionadas/);
  assert.match(detail, /Todavía no hay expedientes del Observatorio/);
  assert.match(detail, /← Ver todas las etiquetas/);
  assert.match(sitemap, /publicProcessesForLabel/);
  assert.match(sitemap, /publicationEntriesForLabel/);
});
