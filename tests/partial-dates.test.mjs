import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDate } from '../src/lib/text.ts';

test('una fuente fechada solo por año no recibe un día inventado', () => {
  assert.equal(formatDate('2026'), '2026');
  assert.equal(formatDate('2026-01-13'), '13 de enero de 2026');
  assert.equal(formatDate(null), 'Sin fecha');
});
