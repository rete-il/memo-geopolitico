import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import {fileURLToPath} from 'node:url';
import {buildPublicPackage} from '../tools/lib/public-export.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const rid='derechas-transnacionales-reconfiguracion-america-latina';
test('derechas: seis procesos con análisis, propiedad de evidencia y navegación',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const branches=d.macroeventos.filter(m=>m.macroevento_rector_ids?.includes(rid));
 assert.equal(branches.length,6);
 const pkg=buildPublicPackage(d,read('../centro-local/modules/observatorio/data/taxonomia-temas.json'),{includeUnpublished:true});
 for(const m of branches){
  const p=matter.read(fileURLToPath(new URL(`../centro-local/data/publicaciones/borradores/${m.id}.md`,import.meta.url)));
  assert.equal(p.data.publicacion.estado,'publicado');assert.equal(p.data.macroevento_principal_id,m.id);
  assert.ok(p.content.includes(`/publicaciones/${rid}/`));
  assert.ok(m.escenarios.reversion&&m.condiciones_refutacion.length);
  assert.equal(pkg.procesos.find(x=>x.macroevento_id===m.id).publicacion.estado,'publicado');
  for(const s of m.senales){assert.equal(s.propietario_macroevento_id,m.id);assert.ok(s.fuente_ids.every(id=>m.fuentes.some(f=>f.id===id)));}
 }
});
test('derechas: conserva Mercosur y expedientes anteriores, sin resultados futuros inventados',()=>{
 const d=read('../centro-local/modules/observatorio/data/macroeventos.json');
 const root=d.macroeventos.find(m=>m.id===rid);
 assert.equal(root.senales.length,8);assert.equal(root.advertencias.length,4);
 assert.equal(root.fuentes.find(f=>f.id==='src-derechas-echoes-2025').fecha,'2025-06-26');
 assert.equal(root.senales.find(s=>s.id==='sig-derechas-opinion-no-uniforme-2024').fecha,'2024');
 const merc=d.macroeventos.filter(m=>m.id==='mercosur-diversificacion-comercial-autonomia');assert.equal(merc.length,1);assert.ok(!merc[0].macroevento_rector_ids.includes(rid));
 const exp=d.expedientes_editoriales.find(e=>e.id==='exp-derechas-transnacionales-america-latina-20260830');assert.equal(exp.estado,'publicado');assert.equal(exp.documentos_relacionados.length,7);
 const hemi=d.expedientes_editoriales.find(e=>e.id==='exp-estados-unidos-hemisferio-20260830');assert.ok(!hemi.signal_ids.some(x=>x.startsWith('sig-red-')));
 const religious=d.macroeventos.find(m=>m.id==='redes-religiosas-conservadoras-incidencia-publica');assert.match(religious.senales[0].descripcion,/convocatoria futura/);
 const digital=d.macroeventos.find(m=>m.id==='derechas-circulacion-digital-regulacion-electoral');assert.match(digital.senales[0].descripcion,/no prueban/);
});
