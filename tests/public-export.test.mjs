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
