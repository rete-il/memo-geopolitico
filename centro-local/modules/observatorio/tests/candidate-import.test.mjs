import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANDIDATE_FORMAT_VERSION,
  applyCandidateDecisions,
  candidateExample,
  candidateFormatInstructions,
  configureCandidateAction,
  configureCandidateWarning,
  parseCandidateText,
  prepareCandidateBatch,
  warningDecisionReady,
} from '../public/candidate-import.js';
import { validateWarningsData } from '../lib/warnings-contract.mjs';

const taxonomy = {
  schema_version: 1,
  categorias: [{
    id: 2,
    nombre: 'Infraestructura y conectividad estratégica',
    temas: [
      { id: 22, nombre: 'Corredores ferroviarios', slug: 'corredores-ferroviarios' },
      { id: 23, nombre: 'Corredores comerciales', slug: 'corredores-comerciales' },
    ],
  }],
};

const catalog = {
  records: [{
    media_id: 'instituto-ejemplo',
    nombre: 'Instituto Ejemplo',
    url: 'https://instituto.example/',
  }],
};

function baseCandidate(overrides = {}) {
  return {
    id: 'nuevo-corredor-regional',
    titulo: 'Nuevo corredor regional de infraestructura',
    tipo_proceso: 'macroproceso_emergente',
    fecha_corte: '2026-07-23',
    regiones: ['África Austral'],
    categoria: 'infraestructura_conectividad',
    temas_internos: ['Corredores ferroviarios'],
    descripcion: 'Proceso de largo plazo con efectos logísticos y estratégicos.',
    actores: ['Estado A'],
    intereses: ['Conectividad'],
    horizonte: { min_anios: 3, max_anios: 8 },
    escenarios: { base: 'Base', adverso: 'Adverso', transformador: 'Transformador' },
    indicadores: ['Inversión anual'],
    palabras_clave: ['corredor'],
    evaluacion: {
      impacto: 4,
      probabilidad: 3,
      alcance: 4,
      persistencia: 4,
      propagacion: 3,
      subcobertura: 4,
      incertidumbre: 3,
      urgencia: 2,
      cobertura_observada: 2,
      confianza: 'media',
    },
    fuentes: [{
      id: 'fuente-1',
      medio: 'Instituto Ejemplo',
      titulo: 'Documento de referencia',
      fecha: '2026-07-20',
      idioma: 'es',
      tipo: 'informe',
      url: 'https://instituto.example/documento',
    }],
    senales: [{
      id: 'senal-1',
      fecha: '2026-07-20',
      titulo: 'Anuncio de inversión',
      tipo: 'inversion',
      descripcion: 'Se anuncia una inversión plurianual.',
      fuente_ids: ['fuente-1'],
    }],
    ...overrides,
  };
}

function baseWarning(overrides = {}) {
  return {
    advertencia_id: 'adv-evidencia-1',
    descripcion: 'La conclusión depende de una sola publicación y requiere corroboración.',
    tipo: 'laguna_evidencia',
    signal_ids: ['senal-1'],
    fuente_ids: ['fuente-1'],
    estado: 'pendiente',
    tratamiento: 'relevante',
    prioridad: 'media',
    ...overrides,
  };
}

function prepare(candidates, existingEvents = []) {
  return prepareCandidateBatch({
    metadata: { consulta: 'prueba' },
    candidates,
  }, {
    existingEvents,
    taxonomy,
    catalog,
    config: { horizonte_minimo_anios: 3, horizonte_maximo_anios: 10 },
    importedAt: '2026-07-23',
    batchId: 'lote-prueba',
  });
}

test('lee JSON puro, bloque Markdown y alias macroeventos', () => {
  const parsed = parseCandidateText(`\`\`\`json
  {"formato":"observatorio-candidatos","schema_version":1,"candidatos":[{"titulo":"A"}]}
  \`\`\``);
  assert.equal(parsed.candidates.length, 1);
  assert.equal(parsed.metadata.schema_version, 1);

  const alias = parseCandidateText('{"macroeventos":[{"titulo":"B"}]}');
  assert.equal(alias.candidates[0].titulo, 'B');
});

test('acepta lotes JSON mayores de 30.000 caracteres', () => {
  const description = 'Proceso geopolítico estructural. '.repeat(1100);
  const raw = JSON.stringify({
    formato: 'observatorio-candidatos',
    schema_version: 1,
    candidatos: [baseCandidate({ descripcion: description })],
  });
  assert.ok(raw.length > 30000);
  const parsed = parseCandidateText(raw);
  assert.equal(parsed.candidates.length, 1);
  assert.equal(parsed.candidates[0].descripcion, description);
});

test('rechaza formatos o versiones declaradas que no son compatibles', () => {
  assert.throws(
    () => parseCandidateText('{"formato":"otro-formato","schema_version":1,"candidatos":[{}]}'),
    /Formato no compatible/,
  );
  assert.throws(
    () => parseCandidateText('{"formato":"observatorio-candidatos","schema_version":99,"candidatos":[{}]}'),
    /Versión de candidatos no compatible/,
  );
});

test('normaliza un candidato como borrador pendiente y conserva vínculos internos', () => {
  const batch = prepare([baseCandidate()]);
  const report = batch.candidates[0];
  assert.equal(report.blocked, false);
  assert.equal(report.value.estado_editorial, 'borrador');
  assert.equal(report.value.estado_verificacion, 'pendiente');
  assert.equal(report.value.clasificacion_tematica.origen, 'ia');
  assert.equal(report.value.clasificacion_tematica.estado_revision, 'pendiente');
  assert.deepEqual(report.value.tema_ids, [22]);
  assert.equal(report.value.fuentes[0].medio_catalogado, true);
  assert.equal(report.value.fuentes[0].media_id, 'instituto-ejemplo');
  assert.equal(report.value.fuentes[0].estado_verificacion, 'pendiente');
  assert.deepEqual(report.value.senales[0].fuente_ids, [report.value.fuentes[0].id]);
  assert.equal(report.value.importacion.lote_id, 'lote-prueba');
});

test('convierte enlaces Markdown en URL directa y conserva localizaciones de texto', () => {
  const report = prepare([baseCandidate({
    fuentes: [{
      id: 'fuente-1',
      medio: 'Instituto Ejemplo',
      titulo: 'Documento de referencia',
      fecha: '2026-07-20',
      idioma: 'es',
      tipo: 'informe',
      url: '[https://instituto.example/documento](https://instituto.example/documento)',
    }],
    senales: [{
      id: 'senal-1',
      fecha: '2026-07-20',
      titulo: 'Anuncio de inversión',
      tipo: 'inversion',
      descripcion: 'Se anuncia una inversión plurianual.',
      fuente_ids: ['fuente-1'],
      localizaciones: ['País A', { etiqueta: 'Puerto B', pais: 'País B', latitud: 12.3, longitud: 45.6 }],
    }],
  })]).candidates[0];
  assert.equal(report.blocked, false);
  assert.equal(report.value.fuentes[0].url, 'https://instituto.example/documento');
  assert.deepEqual(report.value.senales[0].localizaciones, [
    { etiqueta: 'País A', pais: '', latitud: null, longitud: null },
    { etiqueta: 'Puerto B', pais: 'País B', latitud: 12.3, longitud: 45.6 },
  ]);
});

test('trata una coincidencia exacta con evidencia nueva como actualización', () => {
  const existing = [{
    id: 'nuevo-corredor-regional',
    titulo: 'Macroevento existente',
    fuentes: [],
    senales: [],
    regiones: ['África Austral'],
    tema_ids: [22],
  }];
  const byId = prepare([baseCandidate()], existing).candidates[0];
  assert.equal(byId.blocked, false);
  assert.equal(byId.action, 'update');
  assert.equal(byId.target_id, 'nuevo-corredor-regional');
  assert.equal(byId.update_plan.new_sources.length, 1);
  assert.equal(byId.update_plan.new_signals.length, 1);

  const byTitle = prepare([baseCandidate({ id: 'otro-id', titulo: 'Macroevento existente' })], existing).candidates[0];
  assert.equal(byTitle.blocked, false);
  assert.equal(byTitle.action, 'update');
  assert.equal(byTitle.target_id, 'nuevo-corredor-regional');
});

test('bloquea una coincidencia exacta cuando no aporta novedad material', () => {
  const first = prepare([baseCandidate()]).candidates[0].value;
  const repeated = prepare([baseCandidate()], [first]).candidates[0];
  assert.equal(repeated.blocked, true);
  assert.equal(repeated.action, 'no_change');
  assert.match(repeated.errors[0], /no aporta señales ni publicaciones nuevas/);
});

test('usa similitud y publicaciones compartidas para sugerir una actualización', () => {
  const existing = [{
    id: 'corredor-regional-existente',
    titulo: 'Corredor regional de infraestructura estratégica',
    fuentes: [{ id: 'src-existente', url: 'https://instituto.example/documento' }],
    senales: [],
    regiones: ['África Austral'],
    tema_ids: [22],
  }];
  const similarCandidate = baseCandidate({
    id: 'candidato-distinto',
    titulo: 'Corredor regional de infraestructura estratégica emergente',
  });
  const report = prepare([similarCandidate], existing).candidates[0];
  assert.equal(report.blocked, false);
  assert.equal(report.action, 'update');
  assert.equal(report.target_id, 'corredor-regional-existente');
  assert.ok(report.duplicates.some((item) => item.type === 'possible_match'));
  assert.equal(report.update_plan.new_sources.length, 0);
  assert.equal(report.update_plan.new_signals.length, 1);
});

test('bloquea campos obligatorios ausentes y URLs inválidas', () => {
  const report = prepare([baseCandidate({
    titulo: '',
    descripcion: '',
    regiones: [],
    categoria: '',
    fuentes: [{ medio: 'Fuente', titulo: 'Documento', url: 'http://example.org/documento' }],
  })]).candidates[0];
  assert.equal(report.blocked, true);
  assert.ok(report.errors.some((item) => item.includes('título')));
  assert.ok(report.errors.some((item) => item.includes('HTTPS')));
});

test('asigna IDs globalmente únicos a fuentes y señales del lote', () => {
  const first = baseCandidate();
  const second = baseCandidate({
    id: 'segundo-candidato',
    titulo: 'Segundo macroevento independiente',
  });
  const batch = prepare([first, second]);
  const sourceIds = batch.candidates.flatMap((item) => item.value.fuentes.map((source) => source.id));
  const signalIds = batch.candidates.flatMap((item) => item.value.senales.map((signal) => signal.id));
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  assert.equal(new Set(signalIds).size, signalIds.length);
});

test('la plantilla y las instrucciones declaran el contrato vigente', () => {
  const example = candidateExample();
  assert.equal(example.schema_version, CANDIDATE_FORMAT_VERSION);
  assert.ok(Array.isArray(example.candidatos));
  const instructions = candidateFormatInstructions();
  assert.match(instructions, /Devolvé únicamente JSON válido/);
  assert.match(instructions, /"candidatos"/);
  assert.match(instructions, /"accion_sugerida"/);
  assert.match(instructions, /"macroevento_existente_id"/);
  assert.match(instructions, /"advertencias"/);
  assert.match(instructions, /advertencia_id/);
  assert.match(instructions, /observacion_posterior/);
});

test('normaliza idiomas y caracterizaciones al importar candidatos', () => {
  const report = prepare([baseCandidate({
    categoria: 'Acuerdo de defensa regional',
    fuentes: [{
      ...baseCandidate().fuentes[0],
      idioma: 'Inglés',
      tipo: 'Artículo académico',
    }],
    senales: [{
      ...baseCandidate().senales[0],
      tipo: 'Financiación',
    }],
  })]).candidates[0];
  assert.equal(report.value.categoria, 'acuerdo_de_defensa_regional');
  assert.equal(report.value.fuentes[0].idioma, 'en');
  assert.equal(report.value.fuentes[0].tipo, 'articulo_academico');
  assert.equal(report.value.senales[0].tipo, 'financiacion');
  assert.equal(report.value.es_macroevento_rector, false);
  assert.deepEqual(report.value.macroevento_relacionado_ids, []);
});

test('aplica una actualización selectiva sin cambiar identidad ni estado editorial', () => {
  const existing = prepare([baseCandidate({
    id: 'corredor-existente',
    titulo: 'Corredor existente',
  })]).candidates[0].value;
  existing.estado_editorial = 'validado';
  existing.estado_verificacion = 'verificado';

  const report = prepare([baseCandidate({
    id: 'corredor-existente',
    titulo: 'Corredor existente',
    descripcion: 'Nueva fase material con ampliación geográfica y financiera demostrable.',
    fuentes: [{
      id: 'fuente-nueva',
      medio: 'Instituto Ejemplo',
      titulo: 'Nuevo documento',
      fecha: '2026-07-23',
      idioma: 'es',
      tipo: 'informe',
      url: 'https://instituto.example/nuevo-documento',
    }],
    senales: [{
      id: 'senal-nueva',
      fecha: '2026-07-23',
      titulo: 'Nuevo acuerdo financiero',
      tipo: 'financiacion',
      descripcion: 'Se firma un acuerdo plurianual.',
      fuente_ids: ['fuente-nueva'],
    }],
  })], [existing]).candidates[0];
  assert.equal(report.action, 'update');
  report.selected = true;
  const descriptionChange = report.update_plan.field_changes.find((item) => item.key === 'descripcion');
  assert.ok(descriptionChange);
  descriptionChange.selected = true;

  const result = applyCandidateDecisions({
    schema_version: 2,
    macroeventos: [existing],
    expedientes_editoriales: [],
  }, [report], {
    batchId: 'lote-actualizacion',
    importedAt: '2026-07-24',
  });
  const updated = result.data.macroeventos[0];
  assert.equal(updated.id, existing.id);
  assert.equal(updated.estado_editorial, 'validado');
  assert.equal(updated.estado_verificacion, 'verificado');
  assert.equal(updated.fuentes.length, existing.fuentes.length + 1);
  assert.equal(updated.senales.length, existing.senales.length + 1);
  assert.equal(updated.descripcion, report.value.descripcion);
  assert.equal(updated.actualizaciones.length, 1);
  assert.deepEqual(updated.actualizaciones[0].campos_modificados, ['descripcion']);
  assert.equal(result.applied.updates, 1);
});

test('permite resolver manualmente una coincidencia dudosa', () => {
  const target = prepare([baseCandidate({
    id: 'corredor-objetivo',
    titulo: 'Corredor objetivo',
  })]).candidates[0].value;
  const report = prepare([baseCandidate({
    id: 'candidato-ambiguo',
    titulo: 'Proceso distinto',
    regiones: ['Oriente Medio'],
    temas_internos: [],
    actores: ['Actor Z'],
    palabras_clave: ['otro'],
    fuentes: [{
      id: 'fuente-otra',
      medio: 'Instituto Ejemplo',
      titulo: 'Otro documento',
      fecha: '2026-07-23',
      url: 'https://instituto.example/otro-documento',
    }],
    senales: [{
      id: 'senal-otra',
      fecha: '2026-07-23',
      titulo: 'Otra señal',
      descripcion: 'Otra dinámica.',
      fuente_ids: ['fuente-otra'],
    }],
    accion_sugerida: 'actualizacion',
    macroevento_existente_id: 'id-inexistente',
  })], [target]).candidates[0];
  assert.equal(report.action, 'review');
  configureCandidateAction(report, 'update', target);
  assert.equal(report.action, 'update');
  assert.equal(report.target_id, target.id);
  assert.ok(report.update_plan);
});

test('normaliza advertencias con vínculos válidos y exige confirmación individual', () => {
  const report = prepare([baseCandidate({ advertencias: [baseWarning()] })]).candidates[0];
  const item = report.item_plan.warnings[0];
  assert.equal(report.blocked, false);
  assert.equal(report.value.advertencias.length, 1);
  assert.deepEqual(item.value.signal_ids, [report.value.senales[0].id]);
  assert.deepEqual(item.value.fuente_ids, [report.value.fuentes[0].id]);
  assert.equal(item.value.estado, 'pendiente');
  assert.equal(item.value.tratamiento, 'relevante');
  assert.equal(warningDecisionReady(item), true);
  assert.equal(item.selected, false);
});

test('una advertencia sin estado o tratamiento no se aplica hasta la decisión humana', () => {
  const report = prepare([baseCandidate({
    advertencias: [baseWarning({ estado: '', tratamiento: '' })],
  })]).candidates[0];
  const item = report.item_plan.warnings[0];
  assert.equal(report.blocked, false);
  assert.equal(warningDecisionReady(item), false);
  assert.ok(item.conflicts.some((conflict) => conflict.code === 'warning.missing_state'));
  assert.ok(item.conflicts.some((conflict) => conflict.code === 'warning.missing_treatment'));
  configureCandidateWarning(item, { estado: 'pendiente' });
  configureCandidateWarning(item, { tratamiento: 'bloqueante' });
  assert.equal(warningDecisionReady(item), true);
  assert.equal(item.conflicts.some((conflict) => conflict.decision_required), false);
});

test('un advertencia_id duplicado bloquea sólo el ítem afectado', () => {
  const report = prepare([baseCandidate({
    advertencias: [baseWarning(), baseWarning({ descripcion: 'Segunda advertencia con el mismo ID.' })],
  })]).candidates[0];
  assert.equal(report.blocked, false);
  assert.equal(report.item_plan.warnings[0].blocked, false);
  assert.equal(report.item_plan.warnings[1].blocked, true);
  assert.ok(report.item_plan.warnings[1].conflicts.some((conflict) => conflict.code === 'warning.duplicate_id'));
});

test('conserva referencias desconocidas como vínculos pendientes sin inventarlas', () => {
  const report = prepare([baseCandidate({
    advertencias: [baseWarning({ signal_ids: ['senal-inexistente'], fuente_ids: ['fuente-inexistente'] })],
  })]).candidates[0];
  const item = report.item_plan.warnings[0];
  assert.deepEqual(item.value.signal_ids, []);
  assert.deepEqual(item.value.fuente_ids, []);
  assert.deepEqual(item.value.vinculos_pendientes.signal_ids, ['senal-inexistente']);
  assert.deepEqual(item.value.vinculos_pendientes.fuente_ids, ['fuente-inexistente']);
  assert.equal(item.blocked, false);
  report.selected = true;
  item.selected = true;
  const result = applyCandidateDecisions({ schema_version: 3, macroeventos: [], expedientes_editoriales: [] }, [report]);
  const imported = result.data.macroeventos[0].advertencias[0];
  assert.deepEqual(imported.vinculos_pendientes.signal_ids, ['senal-inexistente']);
  assert.deepEqual(imported.vinculos_pendientes.fuente_ids, ['fuente-inexistente']);
  assert.equal(result.applied.pending_links, 1);
  assert.equal(validateWarningsData(result.data).valid, true);
});

test('en una actualización el ID ya existente afecta sólo esa advertencia', () => {
  const existing = prepare([baseCandidate()]).candidates[0].value;
  existing.advertencias = [{
    ...baseWarning(),
    tipo: 'laguna-evidencia',
    creada_el: '2026-07-20T12:00:00.000Z',
    actualizada_el: '2026-07-20T12:00:00.000Z',
    resuelta_el: null,
    resuelta_con_fuente_ids: [],
    resolucion: null,
  }];
  const report = prepare([baseCandidate({
    advertencias: [
      baseWarning(),
      baseWarning({ advertencia_id: 'adv-evidencia-2', descripcion: 'Otra limitación independiente.' }),
    ],
  })], [existing]).candidates[0];
  assert.equal(report.action, 'update');
  assert.equal(report.blocked, false);
  assert.equal(report.update_plan.new_warnings[0].blocked, true);
  assert.equal(report.update_plan.new_warnings[1].blocked, false);
});

test('un lote de 15 aísla candidatos e ítems defectuosos', () => {
  const candidates = Array.from({ length: 15 }, (_, index) => baseCandidate({
    id: `macroevento-lote-${index + 1}`,
    titulo: index === 7 ? '' : `Macroevento de prueba ${index + 1}`,
    advertencias: index === 4
      ? [baseWarning({ advertencia_id: 'adv-duplicada' }), baseWarning({ advertencia_id: 'adv-duplicada', descripcion: 'Duplicada.' })]
      : [baseWarning({ advertencia_id: `adv-lote-${index + 1}` })],
  }));
  const batch = prepare(candidates);
  assert.equal(batch.summary.total, 15);
  assert.equal(batch.summary.blocked, 1);
  assert.equal(batch.candidates[4].blocked, false);
  assert.equal(batch.candidates[4].item_plan.warnings.filter((item) => item.blocked).length, 1);
  assert.equal(batch.candidates.filter((item) => !item.blocked).length, 14);
});

test('registra por separado respuesta original, normalización y decisiones no aplicadas', () => {
  const raw = JSON.stringify({
    formato: 'observatorio-candidatos',
    schema_version: 3,
    consulta: 'prueba de trazabilidad',
    candidatos: [baseCandidate({ advertencias: [baseWarning()] })],
  }, null, 2);
  const parsed = parseCandidateText(raw);
  const batch = prepareCandidateBatch(parsed, {
    existingEvents: [], taxonomy, catalog,
    config: { horizonte_minimo_anios: 3, horizonte_maximo_anios: 10 },
    importedAt: '2026-07-23', batchId: 'lote-trazable',
  });
  batch.candidates[0].selected = true;
  const result = applyCandidateDecisions({ schema_version: 3, macroeventos: [], expedientes_editoriales: [] }, batch.candidates, {
    batchId: batch.metadata.batch_id,
    importedAt: batch.metadata.imported_at,
    importedTimestamp: batch.metadata.imported_timestamp,
    originalText: batch.metadata.original_text,
    formatVersion: batch.metadata.schema_version,
    query: batch.metadata.consulta,
  });
  const trace = result.data.importaciones_candidatos[0];
  assert.equal(trace.respuesta_original, raw);
  assert.equal(trace.resultado_normalizado.length, 1);
  assert.equal(trace.decisiones[0].advertencias[0].decision, 'no_aplicada');
  assert.equal(result.data.macroeventos[0].advertencias.length, 0);
});
