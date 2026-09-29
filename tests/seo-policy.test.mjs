import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { geographicCatalogEntries, pageMetaTitle } from '../tools/lib/seo-policy.mjs';
import { collectCanonicalRedirects, writeCanonicalRedirects } from '../tools/lib/seo-redirects.mjs';

test('el metatítulo distingue contenido editorial y tipo de catálogo sin cambiar el título original', () => {
  const title = 'Turquía';
  const roles = [
    ['/publicaciones/turquia/', 'Análisis'], ['/observatorio/turquia/', 'Expediente'],
    ['/actores/turquia/', 'Actor'], ['/regiones/turquia/', 'Geografía'],
    ['/espacios-geopoliticos/turquia/', 'Espacio geopolítico'], ['/opinion/turquia/', 'Opinión'],
  ];
  const titles = roles.map(([route, role]) => {
    const result = pageMetaTitle(title, route);
    assert.equal(result, `${title} | ${role} · Memo Geopolítico`);
    return result;
  });
  assert.equal(new Set(titles).size, roles.length);
  assert.equal(pageMetaTitle('Observatorio', '/observatorio/'), 'Observatorio · Memo Geopolítico');
  assert.equal(pageMetaTitle('Procesos rectores', '/observatorio/rectores/'), 'Procesos rectores · Memo Geopolítico');
  assert.equal(pageMetaTitle('Memo Geopolítico', '/'), 'Memo Geopolítico');
});

test('cada geografía tiene un destino único y los espacios conservan sus rutas anteriores como alias', () => {
  const catalogs = JSON.parse(fs.readFileSync(new URL('../src/data/public/observatorio.json', import.meta.url))).catalogos;
  const entries = geographicCatalogEntries(catalogs);
  assert.equal(new Set(entries.map(entry => entry.path)).size, entries.length);
  for (const item of catalogs.espacios_geopoliticos) {
    const entry = entries.find(entry => entry.item.id === item.id);
    assert.equal(entry.path, `/espacios-geopoliticos/${item.slug}/`);
    assert.deepEqual(entry.aliases, [`/regiones/${item.slug}/`]);
  }
  for (const item of [...catalogs.regiones, ...catalogs.subregiones, ...catalogs.paises_territorios]) {
    const entry = entries.find(entry => entry.item.id === item.id);
    assert.equal(entry.path, `/regiones/${item.slug}/`);
    assert.deepEqual(entry.aliases, []);
  }
  assert.throws(() => geographicCatalogEntries({ regiones: [{ id: 'a', slug: 'igual' }], espacios_geopoliticos: [{ id: 'b', slug: 'igual' }] }), /ambigua/);
});

function fixture(context) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'memo-canonical-redirects-'));
  context.after(() => {
    assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const write = (relative, content) => {
    const file = path.join(directory, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  return { directory, write };
}

test('el build conserva redirects previos y fuerza 301 para alias con HTML local; es repetible', context => {
  const { directory, write } = fixture(context);
  write('_redirects', '/directorio /medios/ 301\n');
  write('regiones/mar/index.html', '<meta name="memo:redirect" content="/espacios-geopoliticos/mar/">');
  write('espacios-geopoliticos/mar/index.html', '<h1>Mar</h1>');
  assert.deepEqual(writeCanonicalRedirects(directory), [{ from: '/regiones/mar/', to: '/espacios-geopoliticos/mar/' }]);
  const first = fs.readFileSync(path.join(directory, '_redirects'), 'utf8');
  assert.match(first, /^\/directorio \/medios\/ 301\n/);
  assert.match(first, /\/regiones\/mar\/ \/espacios-geopoliticos\/mar\/ 301!/);
  assert.match(first, /\/regiones\/mar \/espacios-geopoliticos\/mar\/ 301!/);
  writeCanonicalRedirects(directory);
  assert.equal(fs.readFileSync(path.join(directory, '_redirects'), 'utf8'), first);
});

test('el build rechaza destinos inexistentes, externos y cadenas en lugar de publicar redirects rotos', context => {
  const { directory, write } = fixture(context);
  write('regiones/mar/index.html', '<meta name="memo:redirect" content="/espacios-geopoliticos/mar/">');
  assert.throws(() => collectCanonicalRedirects(directory), /inexistente/);
  write('regiones/mar/index.html', '<meta name="memo:redirect" content="https://example.org/">');
  assert.throws(() => collectCanonicalRedirects(directory), /inválida/);
  write('regiones/mar/index.html', '<meta name="memo:redirect" content="/espacios-geopoliticos/mar/">');
  write('espacios-geopoliticos/mar/index.html', '<meta name="memo:redirect" content="/regiones/mar/">');
  assert.throws(() => collectCanonicalRedirects(directory), /cadenas ni ciclos/);
});
