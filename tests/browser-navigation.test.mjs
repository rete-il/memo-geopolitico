import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { groupMatrixProcesses } from '../tools/lib/matrix-groups.mjs';
import { normalizeSearchText } from '../tools/lib/search-policy.mjs';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

class Element {
  listeners = new Map();
  attributes = new Map();
  dataset = {};
  value = '';
  hidden = false;
  tabIndex = 0;
  focused = false;
  rect = { left: 0, top: 0 };
  addEventListener(name, listener) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), listener]);
  }
  emit(name, additions = {}) {
    const event = { target: this, prevented: false, preventDefault() { this.prevented = true; }, ...additions };
    for (const listener of this.listeners.get(name) || []) listener(event);
    return event;
  }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  focus() { this.focused = true; }
  getBoundingClientRect() { return this.rect; }
}
class Input extends Element {}
class Select extends Element {}

function browser(address) {
  const window = new Element();
  const entries = [address];
  let index = 0;
  const setLocation = (address) => {
    const url = new URL(address, 'https://example.test');
    window.location = { pathname: url.pathname, search: url.search, hash: url.hash };
  };
  setLocation(address);
  window.history = {
    pushState(_state, _title, url) { entries.splice(++index, entries.length, url); setLocation(url); },
    replaceState(_state, _title, url) { entries[index] = url; setLocation(url); },
  };
  window.setTimeout = fn => fn();
  return {
    window, entries,
    back() { if (index) { setLocation(entries[--index]); window.emit('popstate'); } },
    forward() { if (index < entries.length - 1) { setLocation(entries[++index]); window.emit('popstate'); } },
  };
}

function load(file, globals, dependencies = {}) {
  const compiled = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = vm.createContext({ URLSearchParams, HTMLInputElement: Input, HTMLSelectElement: Select, exports: {},
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    }, ...globals });
  vm.runInContext(compiled, context);
  return context.exports;
}

function mountFilters(state) {
  const fields = new Map([['q', new Input()], ['region', new Select()]]);
  const form = new Element();
  form.elements = { namedItem: name => fields.get(name) || null };
  const renders = [];
  const filters = load('src/scripts/url-filters.ts', { window: state.window });
  filters.mountUrlFilters({
    form, names: ['q', 'region'], anchor: '#procesos',
    apply: () => renders.push([filters.filterValue(form, 'q'), filters.filterValue(form, 'region')]),
  });
  return { form, fields, renders };
}

test('filter URL survives Enter/reload and Back restores both controls and results', () => {
  const state = browser('/medios/?utm_source=boletin#procesos');
  const { fields, form, renders } = mountFilters(state);
  fields.get('q').value = 'T';
  form.emit('input', { target: fields.get('q') });
  fields.get('q').value = 'Taiwán';
  form.emit('input', { target: fields.get('q') });
  assert.equal(state.entries.length, 2, 'Typing is one history step, not one per character');
  assert.equal(form.emit('submit').prevented, true, 'Enter does not reload the document');
  assert.equal(state.entries.length, 2);
  assert.match(state.window.location.search, /utm_source=boletin/);
  assert.equal(new URLSearchParams(state.window.location.search).get('q'), 'Taiwán');

  const reload = mountFilters(browser(state.entries.at(-1)));
  assert.equal(reload.fields.get('q').value, 'Taiwán');
  assert.deepEqual(reload.renders.at(-1), ['Taiwán', '']);

  fields.get('region').value = 'asia';
  form.emit('input', { target: fields.get('region') });
  form.emit('change', { target: fields.get('region') });
  assert.equal(state.entries.length, 3, 'The select input/change pair is a single entry');
  state.back();
  assert.deepEqual(renders.at(-1), ['Taiwán', '']);
  state.back();
  assert.deepEqual(renders.at(-1), ['', '']);
  assert.equal(fields.get('q').value, '');
  state.forward();
  assert.deepEqual(renders.at(-1), ['Taiwán', '']);
});

test('reset preserves unrelated URL parameters and can be undone', () => {
  const state = browser('/observatorio/?q=China&region=asia&utm_source=mail#procesos');
  const { fields, form, renders } = mountFilters(state);
  for (const field of fields.values()) field.value = '';
  form.emit('reset');
  assert.equal(state.window.location.search, '?utm_source=mail');
  assert.deepEqual(renders.at(-1), ['', '']);
  state.back();
  assert.deepEqual(renders.at(-1), ['China', 'asia']);
});

test('accessible tabs retain filters and handle arrows, Home/End and browser history', () => {
  const state = browser('/observatorio/dashboard/?q=China#procesos');
  const ids = ['panorama', 'procesos', 'matriz'];
  const panels = new Map(ids.map(id => [id, new Element()]));
  const tabs = ids.map((id, index) => {
    const tab = new Element();
    tab.dataset.tab = id;
    tab.rect = { left: 0, top: index * 48 };
    tab.setAttribute('aria-controls', id);
    return tab;
  });
  const tablist = new Element();
  tablist.setAttribute('aria-orientation', 'vertical');
  tablist.querySelectorAll = () => tabs;
  const activated = [];
  const { mountAccessibleTabs } = load('src/scripts/accessible-tabs.ts', {
    window: state.window, document: { getElementById: id => panels.get(id) },
  });
  mountAccessibleTabs({ tablist, onActivate: id => activated.push(id) });
  const selected = () => tabs.filter(tab => tab.getAttribute('aria-selected') === 'true');
  assert.deepEqual(selected(), [tabs[1]]);
  assert.equal(tabs.filter(tab => tab.tabIndex === 0).length, 1);
  assert.equal(panels.get('procesos').hidden, false);
  assert.equal(tabs[1].emit('keydown', { key: 'ArrowDown' }).prevented, true);
  assert.deepEqual(selected(), [tabs[2]]);
  assert.equal(tabs[2].focused, true);
  assert.equal(state.window.location.hash, '#matriz');
  assert.equal(state.window.location.search, '?q=China');
  state.back();
  assert.deepEqual(selected(), [tabs[1]]);
  tabs[1].emit('keydown', { key: 'Home' });
  assert.deepEqual(selected(), [tabs[0]]);
  tabs[0].emit('keydown', { key: 'End' });
  assert.deepEqual(selected(), [tabs[2]]);
  tabs[2].emit('keydown', { key: 'ArrowDown' });
  assert.deepEqual(selected(), [tabs[0]], 'Arrow navigation wraps');
  assert.equal(tabs[0].emit('keydown', { key: 'Tab' }).prevented, false);
  assert.equal(activated.at(-1), 'panorama');

  tabs.forEach((tab, index) => { tab.rect = { left: index * 100, top: 0 }; });
  state.window.emit('resize');
  assert.equal(tablist.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(tabs[0].emit('keydown', { key: 'ArrowDown' }).prevented, false);
  assert.equal(tabs[0].emit('keydown', { key: 'ArrowRight' }).prevented, true);
  assert.deepEqual(selected(), [tabs[1]], 'Mobile horizontal tabs use Left/Right');
  tabs[1].emit('keydown', { key: 'ArrowLeft' });
  assert.deepEqual(selected(), [tabs[0]]);
  tabs.forEach((tab, index) => { tab.rect = { left: 0, top: index * 48 }; });
  state.window.emit('resize');
  assert.equal(tablist.getAttribute('aria-orientation'), 'vertical');
});

test('matrix groups expose every assigned process once and leave pending judgments unpositioned', () => {
  const { procesos: processes } = JSON.parse(read('src/data/public/observatorio.json'));
  const original = JSON.stringify(processes);
  const groups = groupMatrixProcesses(processes);
  assert.ok(groups.some(group => group.processes.length > 1), 'The catalog exercises repeated coordinates');
  const grouped = groups.flatMap(group => group.processes.map(process => process.macroevento_id));
  const rated = processes.filter(process => process.estado_evaluacion !== 'no_asignada'
    && ['relevancia_geopolitica', 'atencion_mediatica'].every(key =>
      typeof process.valoraciones[key] === 'number' && process.valoraciones[key] >= 1 && process.valoraciones[key] <= 5));
  const pending = processes.filter(process => !rated.includes(process));
  assert.equal(new Set(grouped).size, rated.length);
  assert.deepEqual(grouped.sort(), rated.map(process => process.macroevento_id).sort());
  assert.ok(pending.every(process => !grouped.includes(process.macroevento_id)));
  assert.equal(rated.length + pending.length, processes.length);
  for (const group of groups) {
    assert.ok(group.attention >= 1 && group.attention <= 5);
    assert.ok(group.relevance >= 1 && group.relevance <= 5);
    assert.ok(group.processes.every(process => process.valoraciones.atencion_mediatica === group.attention
      && process.valoraciones.relevancia_geopolitica === group.relevance));
  }
  assert.equal(new Set(groups.map(group => group.id)).size, groups.length);
  assert.equal(JSON.stringify(processes), original);
});

test('fractional matrix coordinates do not collide in the identifiers of accessible lists', () => {
  const sample = (atencion_mediatica, relevancia_geopolitica) => ({ valoraciones: { atencion_mediatica, relevancia_geopolitica } });
  const groups = groupMatrixProcesses([sample(2.4, 3), sample(2, 4.3)]);
  assert.equal(new Set(groups.map(group => group.id)).size, 2);
});

test('a matrix counter opens its complete list and moves focus without leaving the Matrix tab', () => {
  const state = browser('/observatorio/dashboard/?q=China#matriz');
  const summary = new Element();
  const group = new Element();
  group.open = false;
  group.querySelector = selector => selector === 'summary' ? summary : null;
  group.scrollIntoView = () => { group.scrolled = true; };
  const button = new Element();
  button.dataset.matrixGroup = 'matriz-grupo-a3-r3_8';
  button.setAttribute('aria-expanded', 'false');
  const document = {
    querySelector: () => null,
    querySelectorAll: selector => selector === '[data-matrix-group]' ? [button] : [],
    getElementById: id => id === button.dataset.matrixGroup ? group : null,
  };
  const globals = { window: state.window, document };
  load('src/scripts/public-observatory-dashboard.ts', globals, {
    '../../tools/lib/search-policy.mjs': { normalizeSearchText },
    './url-filters': load('src/scripts/url-filters.ts', globals),
    './accessible-tabs': load('src/scripts/accessible-tabs.ts', globals),
  });
  button.emit('click');
  group.emit('toggle');
  assert.equal(group.open, true);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(summary.focused, true);
  assert.equal(group.scrolled, true);
  assert.equal(state.window.location.hash, '#matriz');
  assert.equal(state.entries.length, 1);
  group.open = false;
  group.emit('toggle');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
});
