import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import {fileURLToPath} from 'node:url';
import {buildPublicPackage} from '../tools/lib/public-export.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const rid='africa-central-minerales-criticos-cadenas-tecnologicas';
test('minerales enlaza seis análisis canónicos con fuentes y mantiene Lobito autónomo',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const branches=d.macroeventos.filter(m=>m.macroevento_rector_ids?.includes(rid));
 assert.equal(branches.length,6);
 assert.ok(!branches.some(m=>m.id==='corredor-lobito-minerales'));
 const pkg=buildPublicPackage(d,read('../centro-local/modules/observatorio/data/taxonomia-temas.json'),{includeUnpublished:true});
 for(const m of branches){
  const path=fileURLToPath(new URL(`../centro-local/data/publicaciones/borradores/${m.id}.md`,import.meta.url));
  const post=matter.read(path);
  assert.equal(post.data.publicacion.estado,'publicado');
  assert.equal(post.data.macroevento_principal_id,m.id);
  assert.ok(post.content.includes(`/publicaciones/${rid}/`));
  assert.ok(m.escenarios.reversion && m.condiciones_refutacion.length);
  assert.ok(pkg.procesos.find(p=>p.macroevento_id===m.id).macroevento_rector_ids.includes(rid));
  for(const sig of m.senales){
   assert.equal(sig.propietario_macroevento_id,m.id);
   assert.ok(sig.fuente_ids.every(fid=>m.fuentes.some(f=>f.id===fid)));
  }
 }
});
test('antecedentes trasladados conservan identidad única y precisión documental',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const root=d.macroeventos.find(m=>m.id===rid),signals=d.macroeventos.flatMap(m=>m.senales);
 for(const id of ['sig-africa-central-cuota-cobalto-2025','sig-africa-central-sicomines-renegociacion-2024','sig-africa-central-m23-rubaya-2025']){
  assert.equal(signals.filter(s=>s.id===id).length,1);
  assert.ok(root.referencias_senal.some(r=>r.senal_id===id));
 }
 assert.equal(signals.find(s=>s.id==='sig-africa-central-sicomines-renegociacion-2024').fecha,'2024-01');
 assert.equal(signals.find(s=>s.id==='sig-min-anodos').fecha,'2025-12-29');
 assert.ok(root.incertidumbres.some(s=>s.includes('S/2026/466')));
});
