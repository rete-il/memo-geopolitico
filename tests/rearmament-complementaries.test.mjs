import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import {fileURLToPath} from 'node:url';
import {buildPublicPackage} from '../tools/lib/public-export.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const rid='remilitarizacion-industrial-cadenas-estrategicas-bloques';
test('seis complementarios de remilitarización tienen análisis, evidencia y navegación',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const branches=d.macroeventos.filter(m=>m.macroevento_rector_ids?.includes(rid));
 assert.equal(branches.length,6);
 const pkg=buildPublicPackage(d,read('../centro-local/modules/observatorio/data/taxonomia-temas.json'),{includeUnpublished:true});
 for(const m of branches){
  const p=matter.read(fileURLToPath(new URL(`../centro-local/data/publicaciones/borradores/${m.id}.md`,import.meta.url)));
  assert.equal(p.data.publicacion.estado,'publicado');
  assert.equal(p.data.macroevento_principal_id,m.id);
  assert.ok(p.content.includes(`/publicaciones/${rid}/`));
  assert.ok(m.escenarios.reversion && m.condiciones_refutacion.length);
  assert.equal(pkg.procesos.find(x=>x.macroevento_id===m.id).publicacion.estado,'publicado');
  for(const sig of m.senales){
   assert.equal(sig.propietario_macroevento_id,m.id);
   assert.ok(sig.fuente_ids.every(fid=>m.fuentes.some(f=>f.id===fid)));
  }
 }
});
test('mantiene expedientes previos y distingue hitos de planes industriales',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 for(const id of ['base-industrial-defensa-guerra-rusia-ucrania','industria-defensa-turca-proyeccion-regional','aukus-australia-capacidad-submarina-industrial']){
  const found=d.macroeventos.filter(m=>m.id===id);assert.equal(found.length,1);
  assert.ok(!(found[0].macroevento_rector_ids||[found[0].macroevento_rector_id]).includes(rid));
 }
 const root=d.macroeventos.find(m=>m.id===rid);
 assert.equal(root.senales.length,10);
 const exp=d.expedientes_editoriales.find(e=>e.id==='exp-remilitarizacion-industrial-20260830');
 assert.equal(exp.estado,'publicado');
 assert.ok(exp.documentos_relacionados.some(p=>p.endsWith(`${rid}.md`)));
 const ip=d.expedientes_editoriales.find(e=>e.id==='exp-indo-pacifico-taiwan-20260831');
 assert.ok(ip.signal_ids.includes('sig-ip-strait-thunder'));
 assert.ok(!ip.signal_ids.some(id=>id.startsWith('sig-rearm-')));
 const signals=d.macroeventos.flatMap(m=>m.senales);
 assert.match(signals.find(s=>s.id==='sig-rearm-mou').descripcion,/2027/);
 assert.match(signals.find(s=>s.id==='sig-rearm-safe').descripcion,/prefinanciación/);
 assert.equal(signals.find(s=>s.id==='sig-rearm-k2').fecha,'2025-08');
 assert.equal(signals.filter(s=>s.id==='sig-remilitarizacion-nato-produccion-2025').length,1);
});
