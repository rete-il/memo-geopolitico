import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicPackage } from '../../../../tools/lib/public-export.mjs';
import {
  derivePromptInclusion,
  hasUnresolvedBlockingWarning,
  validateWarningsData,
} from '../lib/warnings-contract.mjs';

const clone = (value) => structuredClone(value);

function pendingWarning(overrides = {}) {
  return {
    advertencia_id: 'adv-prueba-001',
    descripcion: 'La evidencia todavía no alcanza para sostener la afirmación.',
    tipo: 'evidencia_insuficiente',
    signal_ids: [],
    fuente_ids: [],
    estado: 'pendiente',
    tratamiento: 'relevante',
    prioridad: 'media',
    creada_el: '2026-08-16T10:00:00Z',
    actualizada_el: '2026-08-16T10:00:00Z',
    resuelta_el: null,
    resuelta_con_fuente_ids: [],
    ...overrides,
  };
}

function baseEvent(overrides = {}) {
  return {
    id: 'evento-prueba',
    titulo: 'Evento de prueba',
    descripcion: 'Proceso estructural usado como fixture.',
    categoria: 'infraestructura_conectividad',
    estado_editorial: 'publicado',
    fecha_corte: '2026-08-16',
    regiones: ['Global'],
    tema_ids: [],
    actores: [],
    indicadores: [],
    evaluacion: { impacto: 3, probabilidad: 3, alcance: 3, persistencia: 3 },
    escenarios: {},
    fuentes: [
      {
        id: 'src-prueba-001',
        medio: 'Fuente de prueba',
        titulo: 'Documento primario',
        fecha: '2026-08-16',
        idioma: 'es',
        tipo: 'documento',
        url: 'https://example.com/documento',
        estado_verificacion: 'verificada',
      },
    ],
    senales: [
      {
        id: 'sig-prueba-001',
        fecha: '2026-08-16',
        titulo: 'Señal documentada',
        descripcion: 'Descripción de la señal.',
        estado_revision: 'verificada',
        fuente_ids: ['src-prueba-001'],
      },
    ],
    advertencias: [],
    excepciones_advertencias: [],
    ...overrides,
  };
}

function baseData(event = baseEvent()) {
  return {
    schema_version: 3,
    actualizado: '2026-08-16',
    macroeventos: [event],
    expedientes_editoriales: [],
  };
}

function codes(validation) {
  return validation.issues.map((entry) => entry.code);
}

test('acepta una advertencia mínima pendiente con listas vacías', () => {
  const data = baseData(baseEvent({ advertencias: [pendingWarning()] }));
  const validation = validateWarningsData(data);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
});

test('acepta historial editorial cronológico con fecha, actor y detalle', () => {
  const data = baseData(baseEvent({ advertencias: [pendingWarning({
    actualizada_el: '2026-08-16T11:00:00Z',
    historial: [
      {
        cambio_id: 'hist-adv-prueba-001-creada',
        accion: 'creada',
        detalle: 'Advertencia creada en el expediente.',
        realizada_el: '2026-08-16T10:00:00Z',
        realizada_por: 'rete',
      },
      {
        cambio_id: 'hist-adv-prueba-001-actualizada',
        accion: 'actualizada',
        detalle: 'Notas editoriales actualizadas.',
        realizada_el: '2026-08-16T11:00:00Z',
        realizada_por: 'rete',
      },
    ],
  })] }));
  const validation = validateWarningsData(data);
  assert.equal(validation.valid, true, validation.errors.join('\n'));
});

test('bloquea historial sin actor, fuera de orden o posterior a actualizada_el', () => {
  const data = baseData(baseEvent({ advertencias: [pendingWarning({
    historial: [
      {
        cambio_id: 'hist-prueba-002',
        accion: 'actualizada',
        detalle: 'Segundo cambio.',
        realizada_el: '2026-08-16T11:00:00Z',
        realizada_por: '',
      },
      {
        cambio_id: 'hist-prueba-001',
        accion: 'creada',
        detalle: 'Primer cambio.',
        realizada_el: '2026-08-16T10:00:00Z',
        realizada_por: 'rete',
      },
    ],
  })] }));
  const validation = validateWarningsData(data);
  assert.ok(codes(validation).includes('warning.history.missing_actor'));
  assert.ok(codes(validation).includes('warning.history.out_of_order'));
  assert.ok(codes(validation).includes('warning.history.after_updated'));
});

test('acepta una advertencia completa resuelta por evidencia', () => {
  const decidedAt = '2026-08-16T12:30:00Z';
  const warning = pendingWarning({
    signal_ids: ['sig-prueba-001'],
    fuente_ids: ['src-prueba-001'],
    estado: 'resuelta',
    tratamiento: 'bloqueante',
    prioridad: 'alta',
    notas_editoriales: 'Resolución comprobada y trazable.',
    actualizada_el: decidedAt,
    resuelta_el: decidedAt,
    resuelta_con_fuente_ids: ['src-prueba-001'],
    resolucion: {
      tipo: 'evidencia',
      motivo: 'La fuente primaria confirma el dato.',
      decidida_el: decidedAt,
      decidida_por: 'rete',
      fuente_ids: ['src-prueba-001'],
    },
    incluir_en_prompt: false,
  });
  const validation = validateWarningsData(baseData(baseEvent({ advertencias: [warning] })));
  assert.equal(validation.valid, true, validation.errors.join('\n'));
});

test('bloquea advertencia_id duplicado', () => {
  const warning = pendingWarning();
  const validation = validateWarningsData(baseData(baseEvent({ advertencias: [warning, clone(warning)] })));
  assert.ok(codes(validation).includes('warning.duplicate_id'));
});

for (const [field, value, expectedCode] of [
  ['estado', 'cerrada', 'warning.invalid_state'],
  ['tratamiento', 'urgente', 'warning.invalid_treatment'],
  ['prioridad', 'critica', 'warning.invalid_priority'],
]) {
  test(`bloquea ${field} inválido`, () => {
    const validation = validateWarningsData(baseData(baseEvent({
      advertencias: [pendingWarning({ [field]: value })],
    })));
    assert.ok(codes(validation).includes(expectedCode));
  });
}

test('bloquea referencias a fuentes y señales inexistentes', () => {
  const validation = validateWarningsData(baseData(baseEvent({
    advertencias: [pendingWarning({
      signal_ids: ['sig-inexistente'],
      fuente_ids: ['src-inexistente'],
    })],
  })));
  assert.ok(codes(validation).includes('warning.unknown_signal'));
  assert.ok(codes(validation).includes('warning.unknown_source'));
});

test('bloquea una excepción con advertencia inexistente o alcance inválido', () => {
  const validation = validateWarningsData(baseData(baseEvent({
    advertencias: [pendingWarning({ tratamiento: 'bloqueante' })],
    excepciones_advertencias: [{
      excepcion_id: 'exc-prueba-001',
      advertencia_id: 'adv-inexistente',
      session_id: 'prep-prueba-001',
      alcance: 'continuar_sin_limites',
      motivo: 'Prueba negativa.',
      decidida_el: '2026-08-16T12:00:00Z',
      decidida_por: 'rete',
    }],
  })));
  assert.ok(codes(validation).includes('exception.unknown_warning'));
  assert.ok(codes(validation).includes('exception.invalid_scope'));
});

test('una advertencia resuelta exige resolución explícita', () => {
  const validation = validateWarningsData(baseData(baseEvent({
    advertencias: [pendingWarning({
      estado: 'resuelta',
      resuelta_el: '2026-08-16T12:00:00Z',
    })],
  })));
  assert.ok(codes(validation).includes('warning.missing_resolution'));
});

test('incluir_en_prompt se deriva y una excepción no cambia la advertencia', () => {
  const warning = pendingWarning({ tratamiento: 'bloqueante' });
  const exception = {
    excepcion_id: 'exc-prueba-001',
    advertencia_id: warning.advertencia_id,
    session_id: 'prep-prueba-001',
    alcance: 'omitir_afirmacion',
    motivo: 'La generación omite la afirmación cuestionada.',
    decidida_el: '2026-08-16T12:00:00Z',
    decidida_por: 'rete',
  };
  const event = baseEvent({ advertencias: [warning], excepciones_advertencias: [exception] });
  assert.equal(derivePromptInclusion(warning), true);
  assert.equal(derivePromptInclusion(warning, { exceptions: [exception], sessionId: exception.session_id }), true);
  assert.equal(hasUnresolvedBlockingWarning(event), true);
  assert.equal(hasUnresolvedBlockingWarning(event, { sessionId: exception.session_id }), false);
  assert.equal(warning.estado, 'pendiente');
  assert.equal(warning.tratamiento, 'bloqueante');
});

test('publicar_solo_proceso excluye la advertencia del prompt de esa sesión', () => {
  const warning = pendingWarning({ tratamiento: 'bloqueante' });
  const exception = {
    advertencia_id: warning.advertencia_id,
    session_id: 'prep-prueba-002',
    alcance: 'publicar_solo_proceso',
  };
  assert.equal(derivePromptInclusion(warning, {
    exceptions: [exception],
    sessionId: exception.session_id,
  }), false);
});

test('la proyección pública ignora advertencias, excepciones, resolución y notas', () => {
  const warning = pendingWarning({
    notas_editoriales: 'SECRETO-EDITORIAL-ETAPA1',
    tratamiento: 'bloqueante',
  });
  const event = baseEvent({
    advertencias: [warning],
    excepciones_advertencias: [{
      excepcion_id: 'exc-prueba-001',
      advertencia_id: warning.advertencia_id,
      session_id: 'prep-prueba-001',
      alcance: 'omitir_afirmacion',
      motivo: 'SECRETO-EXCEPCION-ETAPA1',
      decidida_el: '2026-08-16T12:00:00Z',
      decidida_por: 'rete',
    }],
  });
  const publicData = buildPublicPackage(baseData(event), {}, {
    includeUnpublished: true,
    includeInternal: true,
    generatedAt: '2026-08-16',
  });
  const serialized = JSON.stringify(publicData);
  assert.equal(serialized.includes('advertencias'), false);
  assert.equal(serialized.includes('excepciones_advertencias'), false);
  assert.equal(serialized.includes('resolucion'), false);
  assert.equal(serialized.includes('SECRETO-EDITORIAL-ETAPA1'), false);
  assert.equal(serialized.includes('SECRETO-EXCEPCION-ETAPA1'), false);
  assert.equal(publicData.schema_version, 2);
});
