import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { markdownToHtml, markdownToMdast } from 'satteri';
import {
  createPublicationBibliographyPlugin, publicationSourceErrors,
  resolvePublicationSources, sourceUrlKey, unifyPublicationBibliography,
} from '../tools/lib/publication-bibliography.mjs';
import { publicationHeadingsPlugin } from '../tools/lib/publication-headings.mjs';
import { readingNavigationPlugin } from '../tools/lib/remark-reading-navigation.mjs';

const source = (id, url = `https://example.org/${id}`) => ({
  fuente_id: id, titulo: `Fuente ${id}`, url, medio: 'Institución', fecha: '2026-01-02', estado_verificacion: 'verificada',
});
const publication = { slug: 'articulo', macroevento_principal_id: 'proceso', fuente_ids: ['a', 'b'], publicacion: { estado: 'publicado' } };
const compile = (markdown, data = publication, sources = [source('a'), source('b')]) => markdownToHtml(markdown, {
  mdastPlugins: [publicationHeadingsPlugin, readingNavigationPlugin, createPublicationBibliographyPlugin(() => sources)],
  data: { astro: { frontmatter: data } },
});

test('una bibliografía final conserva citas en prosa, notas, alcance y secciones posteriores', async () => {
  const { html } = await compile('Una [cita](https://example.org/a).\n\n## Fuentes\n\n- [Original](https://example.org/a). **Límite** importante.\n\n## Ampliación\n\nTexto posterior intacto.\n\n## Fuentes de la ampliación\n\n- [Original otra vez](https://example.org/a). Otra nota editorial.');
  assert.equal((html.match(/<h2 id="fuentes">Fuentes<\/h2>/g) || []).length, 1);
  const [body, bibliography] = html.split('<h2 id="fuentes">');
  assert.match(body, /Una <a href="https:\/\/example.org\/a">cita<\/a>/);
  assert.match(body, /Texto posterior intacto/);
  assert.match(bibliography, /<strong>Límite<\/strong> importante/);
  assert.match(bibliography, /Fuentes de la ampliación/);
  assert.match(bibliography, /Otra nota editorial/);
  assert.equal((bibliography.match(/href="https:\/\/example.org\/a"/g) || []).length, 1);
  assert.equal((bibliography.match(/href="https:\/\/example.org\/b"/g) || []).length, 1);
});

test('artículos sin bibliografía reciben fuentes sin duplicar URL compartida por dos identificadores', async () => {
  const { html } = await compile('Texto de lectura.', publication, [source('a'), source('b', 'https://example.org/a')]);
  assert.match(html, /<h2 id="fuentes">Fuentes<\/h2>/);
  assert.equal((html.match(/href=/g) || []).length, 1);
  assert.match(html, /Institución · 2026-01-02/);
});

test('referencias Markdown, consultas y fragmentos se conservan sin eliminar notas', async () => {
  const { html } = await compile('Cita [original][fuente].\n\n## Fuentes\n\n- [Principal][fuente]. Alcance A.\n- [Misma][fuente]. Alcance B.\n- [Anexo](https://example.org/a#anexo).\n- [Consulta](https://example.org/a?q=1).\n\n[fuente]: https://example.org/a', { ...publication, fuente_ids: ['a'] }, [source('a')]);
  const bibliography = html.split('<h2 id="fuentes">')[1];
  assert.equal((bibliography.match(/href="https:\/\/example.org\/a"/g) || []).length, 1);
  assert.match(bibliography, /a#anexo/);
  assert.match(bibliography, /a\?q=1/);
  assert.match(bibliography, /Alcance B/);
});

test('una fuente inexistente o pendiente bloquea la publicación en vez de desaparecer', async () => {
  assert.match(publicationSourceErrors(publication, [source('a')]).join(' '), /inexistente \(b\)/);
  assert.throws(() => resolvePublicationSources(publication, [source('a')]), /articulo.*inexistente \(b\)/);
  assert.throws(() => compile('Texto.', publication, [source('a'), { ...source('b'), estado_verificacion: 'pendiente' }]), /sin verificación pública \(b\)/);
  assert.deepEqual(publicationSourceErrors({ ...publication, publicacion: { estado: 'borrador' } }, [source('a'), { ...source('b'), estado_verificacion: 'pendiente' }]), []);
});

test('un documento ajeno a publicaciones no recibe transformaciones', async () => {
  const { html } = await compile('## Fuentes\n\nTexto institucional.', {}, []);
  assert.equal(html, markdownToHtml('## Fuentes\n\nTexto institucional.').html);
});

test('un borrador sin paquete privado conserva su contenido y no bloquea la compilación pública', () => {
  const markdown = 'Texto de borrador.\n\n## Fuentes\n\n[Original](https://example.org/a).';
  const result = markdownToHtml(markdown, {
    mdastPlugins: [createPublicationBibliographyPlugin(() => null)],
    data: { astro: { frontmatter: { ...publication, publicacion: { estado: 'borrador' } } } },
  });
  assert.equal(result.html, markdownToHtml(markdown).html);
});

test('todo el catálogo publicado resuelve sus fuentes y conserva cada nodo de lectura', async () => {
  const root = new URL('../', import.meta.url);
  const catalog = JSON.parse(fs.readFileSync(new URL('src/data/public/observatorio.json', root), 'utf8')).fuentes;
  const directory = new URL('src/content/publicaciones/publicadas/', root);
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.md'))) {
    const { data, content } = matter.read(path.join(fileURLToPath(directory), file));
    const sources = resolvePublicationSources(data, catalog);
    const tree = markdownToMdast(content);
    const changed = unifyPublicationBibliography(structuredClone(tree), sources);
    const heading = changed.children.findIndex(node => node.type === 'heading' && node.data?.hProperties?.id === 'fuentes');
    assert.notEqual(heading, -1, file);
    // The original non-bibliographical reading blocks must survive byte-for-byte
    // as AST nodes; only their position relative to the moved bibliography changes.
    let inBibliography = false;
    const originalBody = tree.children.filter(node => {
      if (node.type === 'heading' && node.depth <= 2) inBibliography = /^Fuentes(?:\s|$)/iu.test(node.children.map(x => x.value || '').join(''));
      return !inBibliography;
    });
    assert.deepEqual(changed.children.slice(0, heading), originalBody, file);
    const urls = [];
    function visit(node) { if (node.type === 'link') urls.push(sourceUrlKey(node.url)); (node.children || []).forEach(visit); }
    changed.children.slice(heading + 1).forEach(visit);
    const external = urls.filter(url => /^https?:/.test(url));
    assert.equal(new Set(external).size, external.length, file + ': bibliografía duplicada');
    for (const item of sources) assert.ok(external.includes(sourceUrlKey(item.url)), file + ': fuente perdida');
    const { html } = await compile(content, data, catalog);
    assert.equal((html.match(/<h2 id="fuentes">Fuentes<\/h2>/g) || []).length, 1, file);
  }
});
