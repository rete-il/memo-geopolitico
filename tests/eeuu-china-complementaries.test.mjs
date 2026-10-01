import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import { buildPublicPackage } from '../tools/lib/public-export.mjs';
import { validateTransversalContract } from '../centro-local/modules/observatorio/lib/transversal-contract.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const rectorId='eeuu-china-competencia-geoeconomica-interdependencias';
const expected=new Map([
  ['eeuu-china-cooperacion-riesgos-ia','sig-eeuu-china-dialogo-incidentes-ia-20260925'],
  ['eeuu-china-inversion-saliente-tecnologias-sensibles','sig-eeuu-china-inversion-saliente-20250102'],
  ['eeuu-china-comercio-bienes-no-sensibles','sig-eeuu-china-30for30-procedimientos-20260927'],
  ['eeuu-china-licencias-tierras-raras','sig-eeuu-china-tierras-raras-licencias-20250404'],
]);
test('los cuatro complementos de EE. UU.–China conservan evidencia única y análisis autónomos, sin absorber otros rectores',()=>{
  const data=read('../centro-local/modules/observatorio/data/macroeventos.json');
  const rector=data.macroeventos.find(x=>x.id===rectorId);
  const children=data.macroeventos.filter(x=>x.macroevento_rector_ids?.includes(rectorId));
  assert.deepEqual(new Set(children.map(x=>x.id)),new Set(expected.keys()));
  assert.equal(validateTransversalContract(data).valid,true);
  const signalOwners=new Map(data.macroeventos.flatMap(x=>x.senales.map(s=>[s.id,x.id])));
  const hub=matter.read(new URL('../src/content/publicaciones/publicadas/eeuu-china-competencia-tecnologica-cooperacion-ia.md',import.meta.url));
  for(const child of children){
    assert.equal(child.es_macroevento_rector,false);
    assert.deepEqual(child.macroevento_rector_ids,[rectorId]);
    assert.equal(signalOwners.get(expected.get(child.id)),child.id);
    assert.ok(rector.referencias_senal.some(x=>x.senal_id===expected.get(child.id)));
    assert.ok(!rector.senales.some(x=>x.id===expected.get(child.id)));
    assert.ok(child.senales.every(s=>s.fuente_ids.every(id=>child.fuentes.some(f=>f.id===id))));
    assert.ok(child.condiciones_refutacion.length&&child.indicadores_fortalecimiento.length&&child.indicadores_debilitamiento.length);
    assert.ok(child.escenarios.reversion);
    assert.equal(child.evaluacion,null);
    assert.equal(child.estado_evaluacion,'no_asignada');
    const article=matter.read(new URL(`../src/content/publicaciones/publicadas/${child.id}.md`,import.meta.url));
    const canonical=matter.read(new URL(`../centro-local/data/publicaciones/borradores/${child.id}.md`,import.meta.url));
    assert.deepEqual(article.data,canonical.data);
    assert.equal(article.content,canonical.content);
    assert.equal(article.data.macroevento_principal_id,child.id);
    assert.equal(typeof article.data.publicacion.publicado_el,'string');
    assert.ok(article.content.split(/\s+/).length>550);
    assert.ok(article.content.includes('/publicaciones/eeuu-china-competencia-tecnologica-cooperacion-ia/'));
    assert.ok(hub.content.includes(`/publicaciones/${child.id}/`));
  }
  assert.deepEqual(data.macroeventos.find(x=>x.id==='semiconductores-indo-pacifico-controles-diversificacion').macroevento_rector_ids,['indo-pacifico-taiwan-reconfiguracion-seguridad']);
  assert.equal(data.relaciones_macroeventos.filter(x=>x.origen_id===rectorId&&x.tipo==='subordinada').length,4);
  assert.equal(data.relaciones_macroeventos.filter(x=>x.origen_id===rectorId&&x.tipo!=='subordinada').length,3);
});

test('la proyección guardada conserva los complementos y un único parámetro IA con diálogo reportado y canal no verificado',()=>{
  const data=read('../centro-local/modules/observatorio/data/macroeventos.json');
  const taxonomy=read('../centro-local/modules/observatorio/data/taxonomia-temas.json');
  const saved=read('../src/data/public/observatorio.json');
  const generated=buildPublicPackage(data,taxonomy,{includeUnpublished:true,includeInternal:false});
  const parameters=data.macroeventos.flatMap(x=>x.parametros_pronostico||[]).filter(x=>x.id==='param-eeuu-china-cooperacion-riesgos-ia');
  assert.equal(parameters.length,1,'Una sola definición editable evita pronósticos divergentes.');
  assert.equal(parameters[0].estado_actual,'dialogo_inicial_reportado');
  assert.match(parameters[0].lectura_actual,/MOFCOM/);
  assert.match(parameters[0].lectura_actual,/sin verificarse/);
  assert.equal(parameters[0].probabilidades_asignadas,false);
  for(const id of [rectorId,...expected.keys()]){
    const stored=saved.procesos.find(x=>x.macroevento_id===id);
    const projected=generated.procesos.find(x=>x.macroevento_id===id);
    assert.ok(stored);
    for(const field of ['senales','referencias_senal','relaciones_tipadas','macroevento_rector_ids','valoraciones','parametros_pronostico'])assert.deepEqual(stored[field],projected[field],`${id}: ${field}`);
    assert.equal(stored.valoraciones.relevancia_geopolitica,null);
    for(const signal of stored.senales)assert.ok(signal.fuente_ids.every(sourceId=>saved.fuentes.some(f=>f.fuente_id===sourceId&&f.estado_verificacion==='verificada')));
  }
});
