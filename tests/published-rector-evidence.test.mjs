import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validatePublicPackage } from '../tools/lib/public-export.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/public/observatorio.json', import.meta.url), 'utf8'));
test('un rector publicado puede utilizar evidencia transversal resoluble sin duplicarla', () => {
  assert.equal(validatePublicPackage(data, { allowDevelopment: true }).valid, true);
  const copy = structuredClone(data);
  const rector = copy.procesos.find(p => p.macroevento_id === 'acoplamiento-conflictos-regionales-confrontacion-sistemica-mundial');
  assert.equal(rector.senales.length, 0);
  assert.equal(rector.publicacion.estado, 'publicado');
  rector.referencias_senal = [{ senal_id: 'inexistente' }];
  const result = validatePublicPackage(copy, { allowDevelopment: true });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('requiere señales')));
  assert.ok(result.errors.some(error => error.includes('referencia transversal inexistente')));
});
