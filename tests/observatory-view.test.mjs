import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const key = 'memo-observatory-view';
const initialNow = Date.UTC(2026, 8, 29, 12);
const day = 24 * 60 * 60 * 1000;

class Element {
  listeners = new Map();
  attrs = new Map();
  dataset = {};
  checked = false;
  textContent = '';
  addEventListener(name, callback) {
    this.listeners.set(name, [...(this.listeners.get(name) || []), callback]);
  }
  setAttribute(name, value) {
    this.attrs.set(name, value);
    if (name === 'data-view') this.dataset.view = value;
  }
  emit(name, event = {}) {
    for (const callback of this.listeners.get(name) || []) callback({ target: this, ...event });
  }
}

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  const blocked = { read: false, write: false, remove: false };
  return {
    data, calls, blocked,
    getItem(name) {
      if (blocked.read) throw new Error('Read denied');
      return data.get(name) ?? null;
    },
    setItem(name, value) {
      if (blocked.write) throw new Error('Write denied');
      calls.push(['set', name, value]);
      data.set(name, value);
    },
    removeItem(name) {
      if (blocked.remove) throw new Error('Removal denied');
      calls.push(['remove', name]);
      data.delete(name);
    },
  };
}

function compile(relativePath, context, dependencies = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const require = name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  vm.runInContext(`(function(exports, require) { ${compiled}\n })`, context)(exports, require);
  return exports;
}

function mount(storage = memoryStorage(), { now = initialNow, getterDenied = false } = {}) {
  const clock = { now };
  class ControlledDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const timers = new Map();
  let nextTimer = 0;
  const window = new Element();
  Object.defineProperty(window, 'localStorage', {
    get() {
      if (getterDenied) throw new Error('Browser denied access');
      return storage;
    },
  });
  window.setTimeout = (callback, delay) => {
    const id = ++nextTimer;
    timers.set(id, { callback, delay, at: clock.now + delay });
    return id;
  };
  window.clearTimeout = id => timers.delete(id);
  const results = new Element();
  results.setAttribute('data-view', 'list');
  const remember = new Element();
  const status = new Element();
  const buttons = ['list', 'cards'].map(view => {
    const button = new Element();
    button.dataset.view = view;
    return button;
  });
  const document = new Element();
  document.hidden = false;
  const elements = new Map([
    ['[data-process-results]', results], ['[data-remember-view]', remember],
    ['[data-view-preference-status]', status],
  ]);
  document.querySelector = selector => elements.get(selector) || null;
  document.querySelectorAll = selector => selector === 'button[data-view]' ? buttons
    : selector === '[data-view]' ? [...buttons, results] : [];
  const context = vm.createContext({ window, document, Date: ControlledDate, Intl });
  const policy = compile('../tools/lib/browser-storage-policy.mjs', context);
  compile('../src/scripts/observatory-view.ts', context, {
    '../../tools/lib/browser-storage-policy.mjs': policy,
  });
  return {
    storage, results, remember, status, buttons, timers, window, document,
    record: () => JSON.parse(storage.getItem(key)),
    click(view) { buttons.find(button => button.dataset.view === view).emit('click'); },
    consent(checked) { remember.checked = checked; remember.emit('change'); },
    advance(milliseconds) {
      clock.now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= clock.now) { timers.delete(id); timer.callback(); }
      }
    },
  };
}

test('view changes start with consent off and never persist before an explicit check', () => {
  const ui = mount();
  assert.equal(ui.remember.checked, false);
  assert.equal(ui.results.dataset.view, 'list');
  ui.click('cards');
  assert.equal(ui.results.dataset.view, 'cards');
  assert.equal(ui.buttons[1].attrs.get('aria-pressed'), 'true');
  ui.click('list');
  ui.click('cards');
  assert.deepEqual(ui.storage.calls, []);
  assert.equal(ui.storage.getItem(key), null);
  assert.equal(mount(ui.storage).results.dataset.view, 'list');
});

test('checking saves the selected view for six calendar months; updates and reload never renew it', () => {
  const ui = mount();
  ui.click('cards');
  ui.consent(true);
  const original = ui.record();
  assert.equal(original.view, 'cards');
  assert.equal(original.consent, true);
  assert.equal(original.activatedAt, initialNow);
  assert.equal(original.expiresAt, Date.UTC(2027, 2, 29, 12));
  ui.advance(day);
  ui.click('list');
  assert.equal(ui.record().view, 'list');
  assert.equal(ui.record().activatedAt, original.activatedAt);
  assert.equal(ui.record().expiresAt, original.expiresAt);
  ui.click('cards');
  const callsBeforeReload = ui.storage.calls.length;
  const reloaded = mount(ui.storage, { now: initialNow + 2 * day });
  assert.equal(reloaded.results.dataset.view, 'cards');
  assert.equal(reloaded.remember.checked, true);
  assert.equal(reloaded.record().expiresAt, original.expiresAt);
  assert.equal(ui.storage.calls.length, callsBeforeReload);
  assert.ok([...reloaded.timers.values()].every(timer => timer.delay <= 2_147_483_647));
  const writes = ui.storage.calls.length;
  reloaded.results.emit('click', { target: { tagName: 'A' } });
  assert.equal(ui.storage.calls.length, writes, 'Clicking an article is not a view-change action');
});

test('unchecking revokes persistence immediately while preserving the visible view', () => {
  const ui = mount();
  ui.click('cards');
  ui.consent(true);
  ui.consent(false);
  assert.equal(ui.remember.checked, false);
  assert.equal(ui.results.dataset.view, 'cards');
  assert.equal(ui.storage.getItem(key), null);
  assert.equal(ui.timers.size, 0);
  const calls = ui.storage.calls.length;
  ui.click('list');
  ui.click('cards');
  assert.equal(ui.storage.calls.length, calls);
  assert.equal(mount(ui.storage).results.dataset.view, 'list');
});

test('clearing from another tab revokes persistence without changing this tab’s visible view', () => {
  for (const eventKey of [key, null]) {
    const ui = mount();
    ui.click('cards');
    ui.consent(true);
    ui.storage.removeItem(key);
    ui.window.emit('storage', { key: eventKey });
    assert.equal(ui.remember.checked, false);
    assert.equal(ui.results.dataset.view, 'cards');
    assert.equal(ui.timers.size, 0);
    const calls = ui.storage.calls.length;
    ui.click('list');
    ui.click('cards');
    assert.equal(ui.storage.calls.length, calls);
    ui.window.emit('pageshow', { persisted: true });
    assert.equal(ui.results.dataset.view, 'list', 'Restoring a cached page respects revoked consent');
  }
});

test('legacy values are discarded rather than interpreted as opt-in', () => {
  const storage = memoryStorage({ [key]: 'cards', unrelated: 'preserved' });
  const ui = mount(storage);
  assert.equal(ui.remember.checked, false);
  assert.equal(ui.results.dataset.view, 'list');
  assert.equal(storage.getItem(key), null);
  assert.equal(storage.getItem('unrelated'), 'preserved');
  ui.click('cards');
  assert.equal(storage.calls.filter(call => call[0] === 'set').length, 0);
});

test('a stale tab cannot recreate a preference removed before its storage event arrives', () => {
  const ui = mount();
  ui.consent(true);
  ui.storage.removeItem(key);
  assert.equal(ui.remember.checked, true, 'The UI has not received the external change yet');
  const writes = ui.storage.calls.filter(call => call[0] === 'set').length;
  ui.click('cards');
  assert.equal(ui.results.dataset.view, 'cards');
  assert.equal(ui.remember.checked, false);
  assert.equal(ui.storage.getItem(key), null);
  assert.equal(ui.storage.calls.filter(call => call[0] === 'set').length, writes);
});

test('expiry in an open tab revokes storage and never silently extends consent', () => {
  const ui = mount();
  ui.click('cards');
  ui.consent(true);
  const expiresAt = ui.record().expiresAt;
  const writes = ui.storage.calls.filter(call => call[0] === 'set').length;
  ui.advance(expiresAt - initialNow);
  assert.equal(ui.remember.checked, false);
  assert.equal(ui.results.dataset.view, 'cards');
  assert.equal(ui.storage.getItem(key), null);
  assert.match(ui.status.textContent, /vencid/i);
  ui.click('list');
  ui.click('cards');
  assert.equal(ui.storage.calls.filter(call => call[0] === 'set').length, writes);
  assert.equal(mount(ui.storage, { now: expiresAt + day }).results.dataset.view, 'list');
});

test('denied storage preserves view controls and reports an unsuccessful opt-in', () => {
  for (const mode of ['getter', 'all-io', 'write']) {
    const storage = memoryStorage();
    if (mode === 'all-io') Object.assign(storage.blocked, { read: true, write: true, remove: true });
    if (mode === 'write') storage.blocked.write = true;
    const ui = mount(storage, { getterDenied: mode === 'getter' });
    ui.click('cards');
    ui.consent(true);
    assert.equal(ui.remember.checked, false);
    assert.equal(ui.results.dataset.view, 'cards');
    assert.match(ui.status.textContent, /No se pudo guardar/);
    ui.click('list');
    assert.equal(ui.results.dataset.view, 'list');
    assert.equal(storage.calls.filter(call => call[0] === 'set').length, 0);
  }
});

test('an update failure changes the visible view without claiming it was saved', () => {
  const ui = mount();
  ui.click('cards');
  ui.consent(true);
  const original = ui.record();
  ui.storage.blocked.write = true;
  ui.click('list');
  assert.equal(ui.results.dataset.view, 'list');
  assert.equal(ui.record().view, 'cards');
  assert.equal(ui.record().expiresAt, original.expiresAt);
  assert.match(ui.status.textContent, /no se pudo actualizar/i);
});

test('a failed deletion does not reactivate consent on visibility/storage events', () => {
  const ui = mount();
  ui.click('cards');
  ui.consent(true);
  ui.storage.blocked.remove = true;
  ui.consent(false);
  assert.equal(ui.remember.checked, false);
  assert.match(ui.status.textContent, /No se pudo borrar/);
  ui.document.emit('visibilitychange');
  ui.window.emit('storage', { key });
  assert.equal(ui.remember.checked, false);
  const calls = ui.storage.calls.length;
  ui.click('list');
  assert.equal(ui.results.dataset.view, 'list');
  assert.equal(ui.storage.calls.length, calls);
  ui.storage.blocked.remove = false;
  ui.consent(true);
  assert.equal(ui.remember.checked, true, 'Only another successful explicit check can reactivate storage');
  assert.equal(ui.record().view, 'list');
});
