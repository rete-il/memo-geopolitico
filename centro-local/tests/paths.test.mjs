import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { centerRoot, paths, siteRoot } from '../lib/paths.mjs';

test('todos los módulos viven bajo centro-local', () => {
  for (const root of [paths.observatorioRoot, paths.mediaRoot, paths.workflowRoot]) {
    assert.equal(root.startsWith(`${centerRoot}${path.sep}`), true);
  }
});

test('la raíz del sitio es el padre directo del Centro', () => {
  assert.equal(siteRoot, path.resolve(centerRoot, '..'));
});

test('las rutas fijas no dependen de letras de unidad ni perfiles de Windows', () => {
  const serialized = JSON.stringify(paths);
  assert.doesNotMatch(serialized, /C:\\Users|D:\\Memo/i);
});
