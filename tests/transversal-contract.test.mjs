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
  assert.equal(data.relaciones_macroeventos.length, 41);
  assert.equal(new Set(data.relaciones_macroeventos.map((relation) => relation.id)).size, 41);
  assert.equal(rectors.flatMap((event) => event.senales).length, 87);
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
  assert.equal(relations.length, 82);
  assert.equal(relations.every((relation) => relation.mecanismo), true);
  assert.equal(relations.some((relation) => 'justificacion' in relation), false);
  assert.equal(relations.some((relation) => 'estado_revision' in relation), false);
});
