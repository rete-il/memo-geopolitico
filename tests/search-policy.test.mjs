import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { normalizeSearchText, processSearchText } from '../tools/lib/search-policy.mjs';
import * as storagePolicy from '../tools/lib/browser-storage-policy.mjs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('la búsqueda ignora tildes, mayúsculas y espacios repetidos sin cambiar puntuación', () => {
  assert.equal(normalizeSearchText('  TAIWA\u0301N\t y  Unión\u00a0Europea  '), 'taiwan y union europea');
  assert.equal(normalizeSearchText('Taiwán'), normalizeSearchText('Taiwan'));
  assert.equal(normalizeSearchText('G-20 / 2026'), 'g-20 / 2026');
  assert.equal(normalizeSearchText(undefined), '');
});

test('el catálogo completo permite encontrar cada actor por su nombre sin alterar los IDs', () => {
  const data = JSON.parse(read('src/data/public/observatorio.json'));
  const before = JSON.stringify(data);
  const catalogs = Object.fromEntries(Object.entries({
    temas: 'temas', subtemas: 'subtemas', etiquetas: 'etiquetas', actores: 'actores',
    regiones: 'regiones', subregiones: 'subregiones', paises: 'paises_territorios', espacios: 'espacios_geopoliticos',
  }).map(([key, source]) => [key, new Map(data.catalogos[source].map((item) => [item.id, item]))]));
  const index = data.procesos.map((process) => ({
    id: process.macroevento_id,
    text: processSearchText(process, catalogs),
  }));
  const matches = (query) => index.filter((item) => item.text.includes(normalizeSearchText(query))).map((item) => item.id);
  assert.ok(matches('Taiwan').length > 0);
  assert.deepEqual(matches('Taiwan'), matches('Taiwán'));
  assert.deepEqual(matches('  TAIWÁN  '), matches('Taiwán'));
  for (const process of data.procesos) {
    for (const id of process.clasificacion.actor_ids) {
      const actor = catalogs.actores.get(id);
      if (actor) assert.ok(matches(actor.nombre).includes(process.macroevento_id), actor.nombre);
    }
  }
  assert.equal(JSON.stringify(data), before);
});

class Input {
  value = '';
  listeners = new Map();
  addEventListener(name, callback) { this.listeners.set(name, callback); }
}

function runBrowserScript(source, document, additions = {}) {
  const location = { pathname: '/', search: '', hash: '' };
  const updateURL = (_state, _unused, target) => {
    const next = new URL(target, 'https://example.test');
    Object.assign(location, { pathname: next.pathname, search: next.search, hash: next.hash });
  };
  const context = vm.createContext({
    document,
    HTMLInputElement: Input,
    HTMLSelectElement: class extends Input {},
    URLSearchParams,
    window: { location, setTimeout: (fn) => fn(), addEventListener() {}, history: { replaceState: updateURL, pushState: updateURL } },
    ...additions,
  });
  const load = (code) => {
    const compiled = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const moduleExports = {};
    const require = (name) => {
      if (name.endsWith('/search-policy.mjs')) return { normalizeSearchText };
      if (name.endsWith('/browser-storage-policy.mjs')) return storagePolicy;
      if (['./url-filters', './accessible-tabs'].includes(name)) return load(read(`src/scripts/${name.slice(2)}.ts`));
      throw new Error(`Unexpected dependency: ${name}`);
    };
    vm.runInContext(`(function(exports, require) { ${compiled}\n })`, context)(moduleExports, require);
    return moduleExports;
  };
  load(source);
}

for (const [script, formSelector, rowsSelector] of [
  ['observatory-filters.ts', '[data-observatory-filters]', '[data-process-card]'],
  ['media-filters.ts', '[data-media-filters]', '[data-media-row]'],
  ['public-observatory-dashboard.ts', '[data-dashboard-filters]', '[data-dashboard-process]'],
]) {
  test(`${script}: el texto es tolerante y los filtros por ID mantienen coincidencia exacta`, () => {
    const fields = new Map(['q', 'region'].map((name) => [name, new Input()]));
    const form = new Input();
    form.elements = { namedItem: (name) => fields.get(name) || null };
    const rows = [
      { dataset: { search: 'Taiwán y Unión\u00a0  Europea', region: 'reg-Asia' }, hidden: false },
      { dataset: { search: 'Canadá', region: 'reg-America' }, hidden: false },
    ];
    runBrowserScript(read(`src/scripts/${script}`), {
      querySelector: (selector) => selector === formSelector ? form : null,
      querySelectorAll: (selector) => selector === rowsSelector ? rows : [],
    });
    const filter = (query, region = '') => {
      fields.get('q').value = query;
      fields.get('region').value = region;
      form.listeners.get('input')({ target: fields.get('q') });
      return rows.filter((row) => !row.hidden);
    };
    for (const query of ['Taiwan', '  TAIWA\u0301N ', 'union    EUROPEA']) {
      assert.deepEqual(filter(query), [rows[0]]);
    }
    assert.equal(filter('Taiwan', 'reg-asia').length, 0);
    assert.deepEqual(filter('Taiwan', 'reg-Asia'), [rows[0]]);
    assert.equal(filter('   ').length, 2);
    assert.equal(rows[0].dataset.region, 'reg-Asia');
  });
}

test('el directorio de etiquetas comparte el tratamiento de texto de los otros buscadores', () => {
  const source = read('src/pages/etiquetas/index.astro').match(/<script>([\s\S]*?)<\/script>/)[1];
  const input = new Input();
  const items = [
    { dataset: { labelName: 'Política   económica' }, hidden: false },
    { dataset: { labelName: 'Seguridad' }, hidden: false },
  ];
  runBrowserScript(source, {
    querySelector: (selector) => selector === '[data-label-search]' ? input : null,
    querySelectorAll: (selector) => selector === '[data-label-name]' ? items : [],
  });
  input.value = '  politica ECONOMICA  ';
  input.listeners.get('input')();
  assert.deepEqual(items.map((item) => item.hidden), [false, true]);
  input.value = '';
  input.listeners.get('input')();
  assert.deepEqual(items.map((item) => item.hidden), [false, false]);
});
