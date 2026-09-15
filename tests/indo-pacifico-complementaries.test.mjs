import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';
import { buildPublicPackage } from '../tools/lib/public-export.mjs';

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const rectorId = 'indo-pacifico-taiwan-reconfiguracion-seguridad';

test('Indo-Pacífico conserva nueve análisis canónicos con evidencia y jerarquía navegable', () => {
  const data = read('../centro-local/modules/observatorio/data/macroeventos.json');
  const taxonomy = read('../centro-local/modules/observatorio/data/taxonomia-temas.json');
  const branches = data.macroeventos.filter(m => m.macroevento_rector_ids?.includes(rectorId));
  assert.equal(branches.length, 9);
  const projected = buildPublicPackage(data, taxonomy, {includeUnpublished:true, includeInternal:false});
  for (const branch of branches) {
    assert.ok(branch.senales.length > 0);
    assert.ok(branch.condiciones_refutacion.length > 0);
    assert.ok(branch.escenarios.reversion);
    assert.ok(data.relaciones_macroeventos.some(r => r.origen_id === rectorId && r.destino_id === branch.id && r.tipo === 'subordinada'));
    assert.ok(projected.procesos.find(p => p.macroevento_id === branch.id).macroevento_rector_ids.includes(rectorId));
    const post = matter.read(fileURLToPath(new URL(`../centro-local/data/publicaciones/borradores/${branch.id}.md`, import.meta.url)));
    assert.equal(post.data.macroevento_principal_id, branch.id);
    assert.equal(typeof post.data.publicacion.actualizado_el, 'string');
    assert.match(post.content, /Condiciones de refutación/);
    for (const signal of branch.senales) {
      assert.equal(signal.propietario_macroevento_id, branch.id);
      assert.ok(signal.fuente_ids.every(id => branch.fuentes.some(source => source.id === id)));
    }
  }
  assert.equal(data.macroeventos.find(m => m.id === rectorId).senales.length, 12);
  const rector = matter.read(fileURLToPath(new URL(`../centro-local/data/publicaciones/borradores/${rectorId}.md`, import.meta.url)));
  for (const branch of branches) assert.ok(rector.content.includes(branch.id));
});
