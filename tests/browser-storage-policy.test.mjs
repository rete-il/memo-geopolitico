import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {
  browserStorageDefinitions,
  getViewPreference,
  saveViewPreference,
  updateViewPreference,
  clearViewPreference,
} from '../tools/lib/browser-storage-policy.mjs';

const key = browserStorageDefinitions[0].key;
const activatedAt = Date.parse('2026-09-29T18:30:15.123Z');
const expiresAt = Date.parse('2027-03-29T18:30:15.123Z');
const record = (view = 'cards', overrides = {}) => ({
  version: 2, consent: true, view, activatedAt, expiresAt, ...overrides,
});

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const writes = [];
  return {
    data,
    writes,
    getItem: (name) => data.get(name) ?? null,
    setItem(name, value) { writes.push(['set', name, value]); data.set(name, value); },
    removeItem(name) { writes.push(['remove', name]); data.delete(name); },
  };
}

test('reading a valid explicit choice restores either view without writing or renewing', () => {
  assert.equal(key, 'memo-observatory-view');
  for (const value of ['list', 'cards']) {
    const storage = memoryStorage({ [key]: JSON.stringify(record(value)) });
    assert.deepEqual(getViewPreference(storage, activatedAt + 1), { status: 'stored', value, expiresAt });
    assert.deepEqual(storage.writes, []);
  }
});

test('an absent preference does not create storage or consent', () => {
  const storage = memoryStorage({ other: 'untouched' });
  assert.deepEqual(getViewPreference(storage, activatedAt), { status: 'empty', value: null });
  assert.equal(updateViewPreference('cards', storage, activatedAt), false);
  assert.deepEqual(storage.writes, []);
  assert.equal(storage.getItem('other'), 'untouched');
});

test('legacy values and invalid records are removed without touching other site data', () => {
  const invalid = [
    'list', 'cards', '', 'grid', 'null', '[]', '"cards"',
    JSON.stringify(record('cards', { version: 1 })),
    JSON.stringify(record('cards', { consent: false })),
    JSON.stringify(record('cards', { consent: 'true' })),
    JSON.stringify(record('grid')),
    JSON.stringify(record('cards', { activatedAt: '2026-09-29' })),
    JSON.stringify(record('cards', { expiresAt: expiresAt + 1 })),
    JSON.stringify(record('cards', { expiresAt: activatedAt })),
    JSON.stringify(record('cards', { expiresAt: null })),
    JSON.stringify({ version: 2, view: 'cards', activatedAt, expiresAt }),
  ];
  for (const raw of invalid) {
    const storage = memoryStorage({ [key]: raw, other: 'untouched' });
    assert.deepEqual(getViewPreference(storage, activatedAt), { status: 'empty', value: null }, raw);
    assert.equal(storage.getItem(key), null);
    assert.equal(storage.getItem('other'), 'untouched');
    assert.deepEqual(storage.writes, [['remove', key]]);
    assert.equal(updateViewPreference('list', storage, activatedAt), false);
  }
});

test('explicit opt-in records consent and a fixed six-month expiry under the single existing key', () => {
  const storage = memoryStorage({ other: 'untouched' });
  assert.equal(saveViewPreference('cards', storage, activatedAt), true);
  assert.deepEqual(JSON.parse(storage.getItem(key)), record());
  assert.equal(storage.getItem('other'), 'untouched');
  assert.deepEqual([...storage.data.keys()], ['other', key]);
});

test('calendar expiry clamps month ends in UTC and preserves the time of day', () => {
  const examples = [
    ['2026-08-31T23:59:59.999Z', '2027-02-28T23:59:59.999Z'],
    ['2027-08-31T08:09:10.111Z', '2028-02-29T08:09:10.111Z'],
    ['2026-03-31T02:30:00.000Z', '2026-09-30T02:30:00.000Z'],
    ['2026-01-31T12:00:00.000Z', '2026-07-31T12:00:00.000Z'],
    ['2028-02-29T12:00:00.000Z', '2028-08-29T12:00:00.000Z'],
  ];
  for (const [start, end] of examples) {
    const storage = memoryStorage();
    const now = Date.parse(start);
    assert.equal(saveViewPreference('list', storage, now), true);
    const saved = JSON.parse(storage.getItem(key));
    assert.equal(saved.activatedAt, now);
    assert.equal(new Date(saved.expiresAt).toISOString(), end);
    assert.equal(getViewPreference(storage, now).status, 'stored');
  }
});

test('ordinary view changes preserve both dates instead of extending expiry', () => {
  const storage = memoryStorage({ [key]: JSON.stringify(record()) });
  assert.equal(updateViewPreference('list', storage, expiresAt - 1), true);
  assert.deepEqual(JSON.parse(storage.getItem(key)), record('list'));
  assert.deepEqual(getViewPreference(storage, expiresAt - 1), { status: 'stored', value: 'list', expiresAt });
});

test('expiration applies at the exact boundary and removes the preference', () => {
  for (const now of [expiresAt, expiresAt + 1]) {
    const storage = memoryStorage({ [key]: JSON.stringify(record()), other: 'untouched' });
    assert.deepEqual(getViewPreference(storage, now), { status: 'expired', value: null });
    assert.equal(storage.getItem(key), null);
    assert.equal(storage.getItem('other'), 'untouched');
    assert.deepEqual(storage.writes, [['remove', key]]);
    assert.deepEqual(getViewPreference(storage, now), { status: 'empty', value: null });
  }
});

test('updating an expired choice removes it and cannot renew consent', () => {
  const storage = memoryStorage({ [key]: JSON.stringify(record()) });
  assert.equal(updateViewPreference('list', storage, expiresAt), false);
  assert.equal(storage.getItem(key), null);
  assert.deepEqual(storage.writes, [['remove', key]]);
});

test('revocation prevents stale callers from recreating a preference', () => {
  const storage = memoryStorage({ [key]: JSON.stringify(record()), other: 'untouched' });
  assert.equal(getViewPreference(storage, activatedAt).status, 'stored');
  assert.equal(clearViewPreference(storage), true);
  assert.equal(updateViewPreference('list', storage, activatedAt + 1), false);
  assert.equal(storage.getItem(key), null);
  assert.equal(storage.getItem('other'), 'untouched');
  assert.deepEqual(storage.writes, [['remove', key]]);
  assert.equal(clearViewPreference(storage), true);
});

test('a new explicit opt-in after revocation starts a new six-month period', () => {
  const storage = memoryStorage({ [key]: JSON.stringify(record()) });
  clearViewPreference(storage);
  const later = Date.parse('2026-10-10T11:12:13.014Z');
  assert.equal(saveViewPreference('list', storage, later), true);
  assert.deepEqual(JSON.parse(storage.getItem(key)), record('list', {
    activatedAt: later,
    expiresAt: Date.parse('2027-04-10T11:12:13.014Z'),
  }));
});

test('invalid views and timestamps cannot write a preference', () => {
  const storage = memoryStorage({ [key]: JSON.stringify(record()) });
  for (const value of ['grid', '', null, undefined]) {
    assert.equal(saveViewPreference(value, storage, activatedAt), false);
    assert.equal(updateViewPreference(value, storage, activatedAt), false);
  }
  for (const now of [NaN, Infinity, '2026-09-29', 0.5, Number.MAX_SAFE_INTEGER]) {
    assert.equal(saveViewPreference('cards', storage, now), false);
    assert.equal(updateViewPreference('cards', storage, now), false);
    assert.deepEqual(getViewPreference(storage, now), { status: 'unavailable', value: null });
  }
  assert.deepEqual(storage.writes, []);
});

test('unavailable storage and all storage I/O failures return safe results', () => {
  const fail = () => { throw new Error('Storage denied'); };
  for (const storage of [null, { getItem: fail, setItem: fail, removeItem: fail }]) {
    assert.deepEqual(getViewPreference(storage, activatedAt), { status: 'unavailable', value: null });
    assert.equal(saveViewPreference('cards', storage, activatedAt), false);
    assert.equal(updateViewPreference('cards', storage, activatedAt), false);
    assert.equal(clearViewPreference(storage), false);
  }
  const readOnly = memoryStorage({ [key]: JSON.stringify(record()) });
  readOnly.setItem = fail;
  assert.equal(updateViewPreference('list', readOnly, activatedAt), false);
  assert.deepEqual(JSON.parse(readOnly.getItem(key)), record());
  for (const raw of ['cards', JSON.stringify(record())]) {
    const noRemoval = memoryStorage({ [key]: raw });
    noRemoval.removeItem = fail;
    assert.deepEqual(getViewPreference(noRemoval, expiresAt), { status: 'unavailable', value: null });
    assert.equal(updateViewPreference('list', noRemoval, expiresAt), false);
  }
});

test('SSR and a blocked browser localStorage getter are safe', () => {
  const source = readFileSync(new URL('../tools/lib/browser-storage-policy.mjs', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const blockedWindow = Object.defineProperty({}, 'localStorage', {
    get() { throw new Error('Browser denied access'); },
  });
  for (const globals of [{}, { window: blockedWindow }]) {
    const context = vm.createContext({ ...globals, exports: {} });
    vm.runInContext(compiled, context);
    const policy = context.exports;
    assert.equal(policy.getViewPreference().status, 'unavailable');
    assert.equal(policy.getViewPreference().value, null);
    assert.equal(policy.saveViewPreference('cards'), false);
    assert.equal(policy.updateViewPreference('cards'), false);
    assert.equal(policy.clearViewPreference(), false);
  }
});
