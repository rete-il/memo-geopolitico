import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import matter from 'gray-matter';
import { destinationKey } from './lib/navigation-policy.mjs';

const root = path.resolve(import.meta.dirname, '..');
const build = path.join(root, process.argv[2] || 'dist');
const pages = new Map();
for (const name of fs.readdirSync(build, { recursive: true })) {
  if (name.endsWith('.html')) pages.set('/' + name.replaceAll('\\', '/').replace(/index\.html$/, ''), fs.readFileSync(path.join(build, name), 'utf8'));
}
const hrefs = html => [...html.matchAll(/\shref="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
const failures = [];
let anchors = 0;
for (const [route, html] of pages) {
  for (const href of hrefs(html)) {
    const url = new URL(href, 'https://memogeopolitico.com' + route);
    if (url.origin !== 'https://memogeopolitico.com' || !url.hash) continue;
    const target = pages.get(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/') || pages.get(url.pathname);
    if (!target) continue; // Full route validation belongs to validate-build.
    anchors++;
    const id = decodeURIComponent(url.hash.slice(1));
    if (!target.includes(`id="${id}"`) && !target.includes(`id='${id}'`)) failures.push(`${route} → ${href}`);
  }
}
let articles = 0;
for (const file of fs.readdirSync(path.join(root, 'src/content/publicaciones/publicadas'))) {
  if (!file.endsWith('.md')) continue;
  const { data } = matter.read(path.join(root, 'src/content/publicaciones/publicadas', file));
  const html = pages.get(`/publicaciones/${data.slug}/`);
  if (!html || !data.macroevento_principal_id) continue;
  articles++;
  const own = `/observatorio/${data.macroevento_principal_id}/`;
  const links = hrefs(html);
  assert.equal(links.filter(href => destinationKey(href) === destinationKey(own)).length, 0, data.slug + ': enlace genérico repetido al expediente');
  assert.equal(links.filter(href => href === own + '#cronologia').length, 1, data.slug + ': acceso único a cronología');
}
assert.deepEqual(failures, [], 'Anclas internas sin destino');
let opinions = 0;
for (const item of JSON.parse(fs.readFileSync(path.join(root, 'src/data/opinion/lecturas.json'), 'utf8'))) {
  const html = pages.get(`/opinion/${item.slug}/`);
  if (!html) continue;
  opinions++;
  assert.equal(hrefs(html).filter(href => destinationKey(href) === destinationKey(item.origen.url)).length, 1, item.slug + ': acceso único al original');
}
console.log(JSON.stringify({ pages: pages.size, articles, opinions, internalAnchors: anchors, brokenAnchors: failures.length }));
