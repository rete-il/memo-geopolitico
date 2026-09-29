import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from 'satteri';
import { publicationHeadingsPlugin } from '../tools/lib/publication-headings.mjs';
import { readingNavigationPlugin } from '../tools/lib/remark-reading-navigation.mjs';

async function render(markdown, frontmatter) {
  return markdownToHtml(markdown, {
    mdastPlugins: [publicationHeadingsPlugin, readingNavigationPlugin],
    data: { astro: { frontmatter } },
  }).html;
}

test('omite el título repetido sin modificar párrafos, énfasis ni fuentes', async () => {
  const html = await render('# Un **análisis**   común\n\nPrimer párrafo con una [fuente](https://example.org/).\n\n## Evidencia\n\nDatos.', {
    titulo: 'Un análisis común', slug: 'analisis', macroevento_principal_id: 'proceso',
  });
  assert.doesNotMatch(html, /<h1\b/);
  assert.doesNotMatch(html, /Un <strong>análisis<\/strong>/);
  assert.match(html, /<p>Primer párrafo con una <a href="https:\/\/example.org\/">fuente<\/a>\.<\/p>/);
  assert.match(html, /<h2>Evidencia<\/h2>/);
  assert.match(html, /<p>Datos\.<\/p>/);
});

test('un H1 distinto se conserva como H2 con su contenido y sus subsecciones', async () => {
  const html = await render('# Una **sección** distinta\n\nContenido propio.\n\n## Detalle\n\n### Cita\n\nTexto.', { titulo: 'Título de la página' });
  assert.doesNotMatch(html, /<h1\b/);
  assert.match(html, /<h2>Una <strong>sección<\/strong> distinta<\/h2>/);
  assert.match(html, /<p>Contenido propio\.<\/p>/);
  assert.match(html, /<h2>Detalle<\/h2>/);
  assert.match(html, /<h3>Cita<\/h3>/);
});

test('conserva títulos de documentos sin título frontal y no trata ejemplos de código como encabezados', async () => {
  const standalone = await render('# Título autónomo\n\nTexto.', {});
  assert.match(standalone, /<h1>Título autónomo<\/h1>/);
  const example = await render('```markdown\n# Título de ejemplo\n```\n\n## Desarrollo', { titulo: 'Título de ejemplo' });
  assert.match(example, /# Título de ejemplo/);
  assert.match(example, /<h2>Desarrollo<\/h2>/);
});

test('la normalización respeta diferencias de palabras y puntuación', async () => {
  const html = await render('# ¿Un análisis común?\n\nContenido.', { titulo: 'Un análisis común' });
  assert.match(html, /<h2>¿Un análisis común\?<\/h2>/);
  assert.match(html, /<p>Contenido\.<\/p>/);
});

test('coexiste con la política de navegación sin perder referencias distintas', async () => {
  const html = await render('# Título\n\n[Expediente](/observatorio/proceso/)\n\n# Fuentes [externas](https://example.org/)\n\n[Señal](/observatorio/proceso/#senal)', {
    titulo: 'Título', slug: 'articulo', macroevento_principal_id: 'proceso',
  });
  assert.doesNotMatch(html, /<h1\b|Expediente/);
  assert.match(html, /<h2>Fuentes <a href="https:\/\/example.org\/">externas<\/a><\/h2>/);
  assert.match(html, /href="\/observatorio\/proceso\/#senal"/);
});
