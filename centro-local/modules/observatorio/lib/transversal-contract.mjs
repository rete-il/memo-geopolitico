const clean = (value) => String(value ?? '').trim();
const unique = (items) => [...new Set((items || []).filter(Boolean))];

export const RELATION_TYPES = new Set([
  'subordinada',
  'relacionada',
  'amplificadora',
  'contenedora',
  'contextual',
  'coincidente',
]);

export const RELATION_DIRECTIONS = new Set(['origen_destino', 'bidireccional']);
export const RELATION_REVIEW_STATES = new Set(['pendiente', 'revisada', 'verificada']);

export function normalizeTypedRelation(relation = {}, index = 0) {
  return {
    id: clean(relation.id || `relacion-${index + 1}`),
    origen_id: clean(relation.origen_id),
    destino_id: clean(relation.destino_id),
    tipo: clean(relation.tipo).toLowerCase(),
    mecanismo: clean(relation.mecanismo),
    evidencia_senal_ids: unique((relation.evidencia_senal_ids || []).map(clean)),
    direccion: clean(relation.direccion || 'origen_destino'),
    reciprocidad: Boolean(relation.reciprocidad),
    estado_revision: clean(relation.estado_revision || 'pendiente'),
    justificacion: clean(relation.justificacion),
    condicion_refutacion: clean(relation.condicion_refutacion),
  };
}

export function normalizeSignalReference(reference = {}) {
  return {
    senal_id: clean(reference.senal_id),
    tipo_uso: clean(reference.tipo_uso).toLowerCase(),
    efecto_segundo_orden: clean(reference.efecto_segundo_orden),
  };
}

export function validateTransversalContract(data = {}) {
  const errors = [];
  const events = data.macroeventos || [];
  const eventIds = new Set(events.map((event) => event.id));
  const signalOwners = new Map();

  for (const event of events) {
    for (const signal of event.senales || []) {
      if (signal.propietario_macroevento_id !== event.id) {
        errors.push(`${event.id} / ${signal.id}: propietario canónico incorrecto o ausente.`);
      }
      if (signalOwners.has(signal.id)) {
        errors.push(`${signal.id}: la señal tiene más de un propietario.`);
      }
      signalOwners.set(signal.id, event.id);
    }
  }

  for (const event of events) {
    const seen = new Set();
    for (const reference of event.referencias_senal || []) {
      if (seen.has(reference.senal_id)) errors.push(`${event.id}: referencia de señal duplicada (${reference.senal_id}).`);
      seen.add(reference.senal_id);
      if (!signalOwners.has(reference.senal_id)) errors.push(`${event.id}: referencia una señal inexistente (${reference.senal_id}).`);
      if (signalOwners.get(reference.senal_id) === event.id) errors.push(`${event.id}: no debe referenciar como transversal una señal propia (${reference.senal_id}).`);
      if (!RELATION_TYPES.has(reference.tipo_uso) || reference.tipo_uso === 'subordinada') {
        errors.push(`${event.id}: tipo de uso transversal inválido (${reference.tipo_uso}).`);
      }
      if (!reference.efecto_segundo_orden) errors.push(`${event.id}: falta efecto de segundo orden para ${reference.senal_id}.`);
    }
  }

  const relationIds = new Set();
  for (const relation of data.relaciones_macroeventos || []) {
    const label = relation.id || '(relación sin ID)';
    if (!relation.id || relationIds.has(relation.id)) errors.push(`${label}: ID de relación ausente o duplicado.`);
    relationIds.add(relation.id);
    if (!eventIds.has(relation.origen_id) || !eventIds.has(relation.destino_id)) errors.push(`${label}: origen o destino inexistente.`);
    if (relation.origen_id === relation.destino_id) errors.push(`${label}: una relación no puede apuntar al mismo proceso.`);
    if (!RELATION_TYPES.has(relation.tipo)) errors.push(`${label}: tipo inválido (${relation.tipo}).`);
    if (!RELATION_DIRECTIONS.has(relation.direccion)) errors.push(`${label}: dirección inválida (${relation.direccion}).`);
    if (!RELATION_REVIEW_STATES.has(relation.estado_revision)) errors.push(`${label}: estado de revisión inválido (${relation.estado_revision}).`);
    if (!relation.mecanismo || !relation.justificacion || !relation.condicion_refutacion) errors.push(`${label}: faltan mecanismo, justificación o condición de refutación.`);
    if (relation.direccion === 'bidireccional' && !relation.reciprocidad) errors.push(`${label}: una relación bidireccional debe declarar reciprocidad.`);
    for (const signalId of relation.evidencia_senal_ids || []) {
      if (!signalOwners.has(signalId)) errors.push(`${label}: evidencia de señal inexistente (${signalId}).`);
    }
  }

  return { valid: errors.length === 0, errors };
}
