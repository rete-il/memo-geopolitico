import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildPublicPackage } from '../tools/lib/public-export.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(name, import.meta.url),'utf8'));
const id='acoplamiento-conflictos-regionales-confrontacion-sistemica-mundial';
test('las ramificaciones mundiales tienen evidencia propietaria, análisis canónico y proyección pública',()=>{
  const data=read('../centro-local/modules/observatorio/data/macroeventos.json');
  const taxonomy=read('../centro-local/modules/observatorio/data/taxonomia-temas.json');
  const branches=data.macroeventos.filter(m=>m.macroevento_rector_ids?.includes(id));
  assert.equal(branches.length,3);
  const publicData=buildPublicPackage(data,taxonomy,{includeUnpublished:true,includeInternal:false});
  for(const branch of branches){
    assert.ok(branch.senales.length>0);
    assert.ok(branch.condiciones_refutacion.length>0);
    assert.ok(branch.escenarios.reversion);
    assert.ok(data.relaciones_macroeventos.some(r=>r.origen_id===id&&r.destino_id===branch.id&&r.tipo==='subordinada'));
    assert.ok(publicData.procesos.find(p=>p.macroevento_id===branch.id).macroevento_rector_ids.includes(id));
    const file=new URL(`../centro-local/data/publicaciones/borradores/${branch.id}.md`,import.meta.url);
    const post=matter.read(fileURLToPath(file));
    assert.equal(post.data.macroevento_principal_id,branch.id);
    assert.equal(typeof post.data.publicacion.actualizado_el,'string');
    assert.match(post.content,/Condiciones de refutación/);
    for(const s of branch.senales){
      assert.equal(s.propietario_macroevento_id,branch.id);
      assert.ok(s.fuente_ids.every(fid=>branch.fuentes.some(f=>f.id===fid)));
    }
  }
  assert.equal(data.macroeventos.find(m=>m.id===id).senales.length,0);
});
