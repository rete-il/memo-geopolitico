import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  validateTransversalContract,
} from '../centro-local/modules/observatorio/lib/transversal-contract.mjs';
import {
  buildPublicPackage,
  validatePublicPackage,
} from '../tools/lib/public-export.mjs';

const read = (file) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));

test('el corpus canónico declara propiedad única y relaciones tipadas auditables', () => {
  const data = read('../centro-local/modules/observatorio/data/macroeventos.json');
  const result = validateTransversalContract(data);
  const rectors = data.macroeventos.filter((event) => event.es_macroevento_rector);

  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.ok(data.relaciones_macroeventos.length > 0);
  assert.equal(new Set(data.relaciones_macroeventos.map((relation) => relation.id)).size, data.relaciones_macroeventos.length);
  const relationById = new Map(data.relaciones_macroeventos.map((relation) => [relation.id, relation]));
  const chinaId = 'eeuu-china-competencia-geoeconomica-interdependencias';
  for (const [id, destination] of [
    ['rel-eeuu-china-semiconductores', 'semiconductores-indo-pacifico-controles-diversificacion'],
    ['rel-eeuu-china-africa-central', 'africa-central-minerales-criticos-cadenas-tecnologicas'],
    ['rel-eeuu-china-remilitarizacion', 'remilitarizacion-industrial-cadenas-estrategicas-bloques'],
  ]) {
    assert.equal(relationById.get(id)?.origen_id, chinaId);
    assert.equal(relationById.get(id)?.destino_id, destination);
  }
  assert.ok(rectors.some((event) => event.id === chinaId));
  const rectorSignals = rectors.flatMap((event) => event.senales);
  assert.equal(new Set(rectorSignals.map((signal) => signal.id)).size, rectorSignals.length);
  for (const rector of rectors) {
    assert.ok(rector.senales.every((signal) => signal.propietario_macroevento_id === rector.id));
  }
  assert.equal(
    data.macroeventos.flatMap((event) => event.senales).every(
      (signal) => Boolean(signal.propietario_macroevento_id),
    ),
    true,
  );
});

test('el contrato bloquea doble propiedad, referencias huérfanas y relaciones sin mecanismo', () => {
  const data = read('../centro-local/modules/observatorio/data/macroeventos.json');
  const broken = structuredClone(data);
  broken.macroeventos[0].senales[0].propietario_macroevento_id = broken.macroeventos[1].id;
  broken.macroeventos[0].referencias_senal.push({
    senal_id: 'senal-inexistente',
    tipo_uso: 'contextual',
    efecto_segundo_orden: 'No debe aceptarse.',
  });
  broken.relaciones_macroeventos[0].mecanismo = '';

  const result = validateTransversalContract(broken);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /propietario canónico incorrecto/);
  assert.match(result.errors.join('\n'), /señal inexistente/);
  assert.match(result.errors.join('\n'), /faltan mecanismo/);
});

test('la proyección pública conserva mecanismos y referencias sin campos editoriales internos', () => {
  const data = read('../centro-local/modules/observatorio/data/macroeventos.json');
  const taxonomy = read('../centro-local/modules/observatorio/data/taxonomia-temas.json');
  const projection = buildPublicPackage(data, taxonomy, {
    includeUnpublished: true,
    includeInternal: false,
    generatedAt: '2026-09-01',
  });
  const result = validatePublicPackage(projection, { allowDevelopment: true });
  const relations = projection.procesos.flatMap((process) => process.relaciones_tipadas || []);

  assert.equal(result.valid, true, result.errors.join('\n'));
  const projectedProcessIds = new Set(projection.procesos.map((process) => process.macroevento_id));
  assert.deepEqual(projectedProcessIds, new Set(data.macroeventos.map((event) => event.id)));
  assert.equal(relations.length, data.relaciones_macroeventos.length * 2);
  for (const relation of data.relaciones_macroeventos) {
    const endpoints = projection.procesos.filter((process) => process.relaciones_tipadas.some((item) => item.relacion_id === relation.id));
    assert.deepEqual(new Set(endpoints.map((process) => process.macroevento_id)), new Set([relation.origen_id, relation.destino_id]), `Extremos de ${relation.id}`);
    for (const endpoint of endpoints) {
      const copies = endpoint.relaciones_tipadas.filter((item) => item.relacion_id === relation.id);
      assert.equal(copies.length, 1, `Una sola copia de ${relation.id} en cada extremo.`);
      assert.deepEqual(copies[0], {
        relacion_id: relation.id,
        origen_id: relation.origen_id,
        destino_id: relation.destino_id,
        tipo: relation.tipo,
        mecanismo: relation.mecanismo,
        evidencia_senal_ids: [...new Set(relation.evidencia_senal_ids || [])],
        direccion: relation.direccion || 'origen_destino',
        reciprocidad: Boolean(relation.reciprocidad),
      });
    }
  }
  assert.equal(relations.every((relation) => relation.mecanismo), true);
  assert.equal(relations.some((relation) => 'justificacion' in relation), false);
  assert.equal(relations.some((relation) => 'estado_revision' in relation), false);
});


test('el JSON público guardado conserva cada relación en ambos extremos y su evidencia identificable', () => {
  const canonical = read('../centro-local/modules/observatorio/data/macroeventos.json');
  const stored = read('../src/data/public/observatorio.json');
  const processById = new Map(stored.procesos.map(process => [process.macroevento_id, process]));
  const sourceById = new Map(stored.fuentes.map(source => [source.fuente_id, source]));
  const canonicalOwner = new Map(canonical.macroeventos.flatMap(event => event.senales.map(signal => [signal.id, event.id])));
  const publicSignals = new Map();
  assert.equal(processById.size, stored.procesos.length, 'Las identidades públicas son únicas.');
  assert.equal(sourceById.size, stored.fuentes.length, 'Los IDs de fuentes públicas son únicos.');
  for (const process of stored.procesos) {
    for (const signal of process.senales) {
      assert.equal(publicSignals.has(signal.senal_id), false, 'Cada señal pública tiene un solo propietario: ' + signal.senal_id);
      assert.equal(signal.propietario_macroevento_id, process.macroevento_id, 'Propietario público de ' + signal.senal_id);
      publicSignals.set(signal.senal_id, { process, signal });
    }
  }
  const applicableRelations = canonical.relaciones_macroeventos.filter(relation =>
    processById.has(relation.origen_id) && processById.has(relation.destino_id));
  assert.ok(applicableRelations.length > 0, 'El corpus ejercita relaciones con ambos extremos públicos.');
  for (const relation of applicableRelations) {
    const occurrences = stored.procesos.flatMap(process => (process.relaciones_tipadas || [])
      .filter(item => item.relacion_id === relation.id).map(item => ({ owner: process.macroevento_id, item })));
    assert.equal(occurrences.length, 2, 'Dos copias públicas, una por extremo: ' + relation.id);
    assert.deepEqual(new Set(occurrences.map(occurrence => occurrence.owner)),
      new Set([relation.origen_id, relation.destino_id]), 'Extremos públicos exactos: ' + relation.id);
    const expected = {
      relacion_id: relation.id, origen_id: relation.origen_id, destino_id: relation.destino_id,
      tipo: relation.tipo, mecanismo: relation.mecanismo,
      evidencia_senal_ids: [...new Set(relation.evidencia_senal_ids || [])],
      direccion: relation.direccion || 'origen_destino', reciprocidad: Boolean(relation.reciprocidad),
    };
    for (const occurrence of occurrences) assert.deepEqual(occurrence.item, expected, 'Contenido público de ' + relation.id + ' en ' + occurrence.owner);
    for (const id of expected.evidencia_senal_ids) {
      const evidence = publicSignals.get(id);
      assert.ok(evidence, 'La evidencia pública existe: ' + id);
      assert.equal(evidence.process.macroevento_id, canonicalOwner.get(id), 'La evidencia mantiene su propietario canónico: ' + id);
      assert.ok(evidence.signal.fuente_ids.length > 0, 'La evidencia conserva fuentes: ' + id);
      for (const sourceId of evidence.signal.fuente_ids) {
        const source = sourceById.get(sourceId);
        assert.ok(source, 'Identidad de fuente pública: ' + sourceId);
        assert.ok(evidence.process.fuente_ids.includes(sourceId), 'Fuente vinculada al propietario: ' + sourceId);
        assert.equal(source.estado_verificacion, 'verificada', 'Evidencia pública verificada: ' + sourceId);
      }
    }
  }
});
