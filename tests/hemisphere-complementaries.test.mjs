import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import {fileURLToPath} from 'node:url';
import {buildPublicPackage} from '../tools/lib/public-export.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const rid='estados-unidos-reordenamiento-hemisferio-occidental';
test('hemisferio: seis análisis autónomos, evidencia propia y navegación completa',()=>{
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
  for(const s of m.senales){assert.equal(s.propietario_macroevento_id,m.id);assert.ok(s.fuente_ids.every(id=>m.fuentes.some(f=>f.id===id)));}
 }
});
test('hemisferio: conserva autonomía panameña y actualiza el expediente exacto',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const p=d.macroeventos.filter(m=>m.id==='panama-gobernanza-portuaria');
 assert.equal(p.length,1);assert.ok(!p[0].macroevento_rector_ids?.includes(rid));
 assert.ok(p[0].senales.some(s=>s.id==='sig-hemi-panama-concesiones-20260223'));
 assert.equal(d.macroeventos.find(m=>m.id===rid).senales.length,10);
 const exp=d.expedientes_editoriales.find(e=>e.id==='exp-estados-unidos-hemisferio-20260830');
 assert.equal(exp.estado,'publicado');assert.equal(exp.documentos_relacionados.length,7);
 for(const id of ['exp-indo-pacifico-taiwan-20260831','exp-remilitarizacion-industrial-20260830'])assert.ok(!d.expedientes_editoriales.find(e=>e.id===id).signal_ids.some(x=>x.startsWith('sig-hemi-')));
});
test('hemisferio: no convierte calendarios ni aplicación provisional en resultados completos',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const signals=d.macroeventos.flatMap(m=>m.senales);
 assert.match(signals.find(s=>s.id==='sig-hemi-mexico-estados-unidos-seguridad-soberania-1').descripcion,/seguía en curso/);
 assert.match(signals.find(s=>s.id==='sig-hemi-mercosur-diversificacion-comercial-autonomia-1').descripcion,/No equivale a ratificación plena/);
 assert.match(signals.find(s=>s.id==='sig-hemi-tmec-cadenas-regionales-limites-coercion-2').descripcion,/no acredita cierre/);
 assert.match(signals.find(s=>s.id==='sig-hemisferio-aranceles-frontera-2025').descripcion,/Antecedente histórico/);
});
