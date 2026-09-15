import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import { fileURLToPath } from 'node:url';
import { buildPublicPackage } from '../tools/lib/public-export.mjs';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const rectorId = 'erosion-control-armamentos-disuasion-nuclear-multipolar';

test('los siete complementarios nucleares conservan análisis canónico, evidencia y navegación', () => {
  const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
  const taxonomy=read('../centro-local/modules/observatorio/data/taxonomia-temas.json');
  const branches=d.macroeventos.filter(m=>m.macroevento_rector_ids?.includes(rectorId));
  assert.equal(branches.length,7);
  const pkg=buildPublicPackage(d,taxonomy,{includeUnpublished:true,includeInternal:false});
  for(const m of branches){
    assert.ok(m.senales.length && m.condiciones_refutacion.length && m.escenarios.reversion);
    assert.ok(pkg.procesos.find(p=>p.macroevento_id===m.id).macroevento_rector_ids.includes(rectorId));
    const post=matter.read(fileURLToPath(new URL(`../centro-local/data/publicaciones/borradores/${m.id}.md`,import.meta.url)));
    assert.equal(post.data.macroevento_principal_id,m.id);
    assert.equal(post.data.publicacion.estado,'publicado');
    assert.equal(typeof post.data.publicacion.actualizado_el,'string');
    for(const signal of m.senales){
      assert.equal(signal.propietario_macroevento_id,m.id);
      assert.ok(signal.fuente_ids.every(id=>m.fuentes.some(f=>f.id===id)));
    }
  }
});

test('trasladar antecedentes nucleares no duplica señales ni rompe sus referencias',()=>{
  const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
  const root=d.macroeventos.find(m=>m.id===rectorId);
  const signals=d.macroeventos.flatMap(m=>m.senales);
  for(const id of ['sig-nuclear-new-start-expira-2026','sig-nuclear-npt-2026-sin-consenso','sig-nuclear-ctbt-resiliencia-2026']){
    assert.equal(signals.filter(s=>s.id===id).length,1);
    assert.notEqual(signals.find(s=>s.id===id).propietario_macroevento_id,rectorId);
    assert.ok(root.referencias_senal.some(r=>r.senal_id===id));
  }
  assert.equal(d.macroeventos.filter(m=>m.macroevento_rector_ids?.includes('indo-pacifico-taiwan-reconfiguracion-seguridad')).length,9);
});
