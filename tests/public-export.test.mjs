import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublicPackage,
  validatePublicPackage,
} from '../tools/lib/public-export.mjs';

const taxonomy = {
  categorias: [
    {
      id: 2,
      nombre: 'Infraestructura y conectividad estratégica',
      temas: [{ id: 21, nombre: 'Corredores ferroviarios', categoria_id: 2 }],
    },
  ],
};

const source = {
  actualizado: '2026-07-25',
  macroeventos: [
    {
      id: 'proceso-prueba',
      titulo: 'Proceso de prueba',
      descripcion: 'Síntesis pública',
      estado_editorial: 'borrador',
      fecha_corte: '2026-07-25',
      regiones: ['África austral'],
      categoria: 'infraestructura_conectividad',
      tema_ids: [21],
      actores: ['Angola'],
      indicadores: ['Indicador'],
      evaluacion: {
        impacto: 5,
        probabilidad: 4,
        alcance: 4,
        persistencia: 5,
        cobertura_observada: 2,
        incertidumbre: 3,
        confianza: 'media',
      },
      fuentes: [
        {
          id: 'src-prueba-001',
          medio: 'Reuters',
          titulo: 'Fuente',
          fecha: '2026-07-25',
          idioma: 'Inglés',
          tipo: 'Artículo académico',
          url: 'https://example.com/fuente',
          estado_verificacion: 'verificada',
        },
      ],
      senales: [
        {
          id: 'sig-prueba-001',
          fecha: '2026-07-25',
          titulo: 'Señal',
          descripcion: 'Descripción',
          fuente_ids: ['src-prueba-001'],
          estado_revision: 'revisada',
        },
        {
          id: 'sig-prueba-sin-fuente',
          fecha: '2026-07-25',
          titulo: 'Omitida',
          descripcion: 'No debe proyectarse',
          fuente_ids: [],
        },
      ],
      escenarios: {},
    },
  ],
};

test('la producción puede exponer un expediente en desarrollo saneado', () => {
  const result = buildPublicPackage(source, taxonomy, {
    includeUnpublished: true,
    includeInternal: false,
  });
  assert.equal(result.procesos.length, 1);
  assert.equal(result.procesos[0].publicacion.estado, 'borrador');
  assert.equal(result.procesos[0].senales.length, 1);
  assert.equal(result.procesos[0].metricas_editoriales, undefined);
  assert.equal(
    validatePublicPackage(result, { allowDevelopment: true }).valid,
    true,
  );
});

test('la vista local conserva el proceso y omite señales sin fuente', () => {
  const result = buildPublicPackage(source, taxonomy, {
    includeUnpublished: true,
    includeInternal: true,
  });
  assert.equal(result.procesos.length, 1);
  assert.equal(result.procesos[0].senales.length, 1);
  assert.equal(
    result.procesos[0].metricas_editoriales.senales_omitidas_sin_fuente,
    1,
  );
  assert.equal(
    validatePublicPackage(result, { allowDrafts: true }).valid,
    true,
  );
});

test('proyecta el rol rector, sus relaciones y los valores normalizados', () => {
  const input = structuredClone(source);
  input.macroeventos[0].es_macroevento_rector = true;
  input.macroeventos[0].macroevento_relacionado_ids = ['proceso-complementario'];
  input.macroeventos.push({
    ...structuredClone(input.macroeventos[0]),
    id: 'proceso-rector-secundario',
    titulo: 'Proceso rector secundario',
    macroevento_relacionado_ids: ['proceso-complementario'],
    fuentes: [],
    senales: [],
  });
  input.macroeventos.push({
    ...structuredClone(input.macroeventos[0]),
    id: 'proceso-complementario',
    titulo: 'Proceso complementario',
    es_macroevento_rector: false,
    macroevento_rector_id: 'proceso-prueba',
    macroevento_rector_ids: ['proceso-prueba', 'proceso-rector-secundario'],
    macroevento_relacionado_ids: ['proceso-prueba'],
    fuentes: [],
    senales: [],
  });
  const result = buildPublicPackage(input, taxonomy, {
    includeUnpublished: true,
    includeInternal: false,
  });
  const rector = result.procesos.find((item) => item.macroevento_id === 'proceso-prueba');
  const complement = result.procesos.find((item) => item.macroevento_id === 'proceso-complementario');
  assert.equal(rector.es_macroevento_rector, true);
  assert.deepEqual(rector.macroevento_relacionado_ids, ['proceso-complementario']);
  assert.equal(complement.macroevento_rector_id, 'proceso-prueba');
  assert.deepEqual(complement.macroevento_rector_ids, [
    'proceso-prueba',
    'proceso-rector-secundario',
  ]);
  assert.equal(result.fuentes[0].idioma, 'en');
  assert.equal(result.fuentes[0].tipo, 'articulo_academico');
  assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, true);
});

test('bloquea un vínculo rector hacia un proceso que no cumple ese rol', () => {
  const input = structuredClone(source);
  input.macroeventos[0].macroevento_rector_ids = ['proceso-inexistente'];
  const result = buildPublicPackage(input, taxonomy, {
    includeUnpublished: true,
    includeInternal: false,
  });
  const validation = validatePublicPackage(result, { allowDevelopment: true });
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join('\n'), /macroevento rector inexistente/);
});


test('una evaluación no asignada conserva ausencia de cifras y confianza al proyectar', () => {
  for (const evaluation of [undefined, null, {}, { impacto: null, probabilidad: null, alcance: null, persistencia: null, cobertura_observada: null }]) {
    const input = structuredClone(source);
    input.macroeventos[0].evaluacion = evaluation;
    input.macroeventos[0].estado_evaluacion = 'no_asignada';
    const result = buildPublicPackage(input, taxonomy, { includeUnpublished: true });
    assert.equal(result.procesos[0].estado_evaluacion, 'no_asignada');
    assert.deepEqual(result.procesos[0].valoraciones, {
      relevancia_geopolitica: null, atencion_mediatica: null,
      brecha: null, confianza: null, incertidumbre: null,
    });
    assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, true);
  }
});

test('no completa valoraciones incompletas y mantiene una evaluación explícita completa', () => {
  const missing = structuredClone(source);
  delete missing.macroeventos[0].evaluacion.cobertura_observada;
  const result = buildPublicPackage(missing, taxonomy, { includeUnpublished: true });
  assert.equal(result.procesos[0].valoraciones.relevancia_geopolitica, null);
  const assigned = buildPublicPackage(source, taxonomy, { includeUnpublished: true }).procesos[0];
  assert.equal(assigned.estado_evaluacion, 'asignada');
  assert.deepEqual(assigned.valoraciones, {
    relevancia_geopolitica: 4.5, atencion_mediatica: 2, brecha: 2.5,
    confianza: 'media', incertidumbre: 3,
  });
});

test('el estado sin asignar prevalece sobre valores heredados del importador', () => {
  const input = structuredClone(source);
  input.macroeventos[0].estado_evaluacion = 'no_asignada';
  const result = buildPublicPackage(input, taxonomy, { includeUnpublished: true });
  assert.equal(result.procesos[0].valoraciones.atencion_mediatica, null);
  result.procesos[0].valoraciones.atencion_mediatica = 3;
  assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, false);
});

test('Estados Unidos y China se proyectan como países sin crear espacios accidentales', () => {
  const input = structuredClone(source);
  input.macroeventos[0].regiones = ['Global', 'Estados Unidos', 'China'];
  const result = buildPublicPackage(input, taxonomy, { includeUnpublished: true });
  assert.deepEqual(result.procesos[0].clasificacion.geografia.pais_ids, ['USA', 'CHN']);
  assert.deepEqual(result.procesos[0].clasificacion.geografia.espacio_ids, []);
  const usa = result.catalogos.paises_territorios.find(item => item.id === 'USA');
  assert.equal(usa.parent_id, 'americas');
  assert.equal(usa.slug, 'estados-unidos-america');
  assert.equal(result.catalogos.paises_territorios.find(item => item.id === 'CHN').slug, 'china');
});

test('conserva estados y reglas de pronóstico con expertos atribuidos y controla referencias', () => {
  const input = structuredClone(source);
  input.macroeventos[0].analisis_expertos = [{
    id: 'op-prueba', autor: 'Especialista', fuente_id: 'src-prueba-001', fecha: '2026-07-25',
    tipo: 'interpretacion', sintesis: 'Lectura atribuida.', limite: 'No equivale a acuerdo.', nota_interna: 'privada',
  }];
  input.macroeventos[0].parametros_pronostico = [{
    id: 'param-prueba', nombre: 'Cooperación', tipo: 'cualitativo_condicional', fecha_evaluacion: '2026-07-25',
    estado_actual: 'anunciada', lectura_actual: 'Ejecución pendiente.', pregunta: '¿Se ejecuta?',
    senal_ids: ['sig-prueba-001'], fuente_ids: ['src-prueba-001'], analisis_experto_ids: ['op-prueba'],
    probabilidades_asignadas: false, automatiza_puntuaciones: false,
    estados_observables: [{ estado: 'operativa', evidencia_necesaria: 'Prueba documentada.', efecto: 'Reforzar.' }],
    reglas_de_actualizacion: [{ id: 'regla-prueba', condicion: 'Prueba realizada.', efecto_pronostico: 'Revisar.', fuente_ids: ['src-prueba-001'] }],
    reglas_editoriales: ['Una propuesta no es un compromiso.'],
    revision: { horizonte_operativo: 'Tres meses', hito_oficial: { periodo: '2026-11', descripcion: 'Reunión prevista.', fuente_ids: ['src-prueba-001'] }, cortes_editoriales_propuestos: [], disparadores: ['Comunicado'], nota: 'Sin automatización.' },
    nota_interna: 'privada',
  }];
  const result = buildPublicPackage(input, taxonomy, { includeUnpublished: true });
  const projected = result.procesos[0];
  assert.equal(projected.analisis_expertos[0].nota_interna, undefined);
  assert.equal(projected.parametros_pronostico[0].nota_interna, undefined);
  const { nota_interna, ...expectedParameter } = input.macroeventos[0].parametros_pronostico[0];
  assert.deepEqual(projected.parametros_pronostico[0], expectedParameter);
  assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, true);
  projected.parametros_pronostico[0].revision.hito_oficial.fuente_ids.push('fuente-ausente');
  assert.equal(validatePublicPackage(result, { allowDevelopment: true }).valid, false);
  assert.equal(input.macroeventos[0].parametros_pronostico[0].revision.hito_oficial.fuente_ids.length, 1);
});
