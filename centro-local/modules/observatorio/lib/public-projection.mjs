import { validatePublicPackage } from '../../../../tools/lib/public-export.mjs';

const clean = (value) => String(value ?? '').trim();
const clone = (value) => structuredClone(value);

export function mergeFollowupProjection(current, proposal) {
  const candidate = clone(current);
  const proposedProcess = clone(proposal?.proposed_process);
  const eventId = clean(proposal?.macroevento_id);
  if (!eventId || clean(proposedProcess?.macroevento_id) !== eventId) {
    throw new Error('La propuesta de seguimiento alteró el macroevento_id.');
  }
  if (!Array.isArray(candidate?.procesos) || !Array.isArray(candidate?.fuentes)) {
    throw new Error('El JSON público no contiene procesos y fuentes válidos.');
  }

  const matches = candidate.procesos
    .map((process, index) => ({ process, index }))
    .filter(({ process }) => clean(process?.macroevento_id) === eventId);
  if (matches.length > 1) throw new Error('El JSON público contiene el macroevento_id repetido.');
  if (matches.length === 1) candidate.procesos[matches[0].index] = proposedProcess;
  else candidate.procesos.push(proposedProcess);

  const sources = new Map(candidate.fuentes.map((source) => [clean(source?.fuente_id), source]));
  for (const source of proposal?.proposed_sources || []) {
    const sourceId = clean(source?.fuente_id);
    if (!sourceId) throw new Error('La propuesta contiene una fuente pública sin identidad.');
    sources.set(sourceId, clone(source));
  }
  candidate.fuentes = [...sources.values()].sort((left, right) => (
    clean(left?.fuente_id).localeCompare(clean(right?.fuente_id))
  ));
  candidate.generado_el = clean(proposal?.generado_el) || candidate.generado_el;
  return candidate;
}

export function promotePublicProcess(process, publishedOn) {
  const candidate = clone(process);
  candidate.publicacion = {
    ...(candidate.publicacion || {}),
    estado: 'publicado',
    publicado_el: publishedOn,
    actualizado_el: publishedOn,
  };

  const milestones = Array.isArray(candidate.progreso_publico?.hitos_completados)
    ? candidate.progreso_publico.hitos_completados.filter((item) => clean(item) && clean(item) !== 'Revisión editorial iniciada')
    : [];
  const addMilestone = (label) => {
    if (!milestones.includes(label)) milestones.push(label);
  };
  addMilestone('Expediente abierto y clasificado');
  if (candidate.fuente_ids?.length) addMilestone('Fuentes verificadas incorporadas');
  if (candidate.senales?.some((signal) => clean(signal?.estado_verificacion) === 'verificada')) {
    addMilestone('Señales verificadas incorporadas');
  }
  addMilestone('Revisión editorial completada');
  addMilestone('Análisis publicado');

  candidate.progreso_publico = {
    ...(candidate.progreso_publico || {}),
    etapa: 'publicado',
    proximo_paso: 'Mantener actualizado el expediente a medida que aparezcan nuevas señales verificadas.',
    hitos_completados: milestones,
  };
  return candidate;
}

function verifiedReferenceErrors(data) {
  const errors = [];
  const sources = new Map((data?.fuentes || []).map((source) => [clean(source?.fuente_id), source]));
  for (const process of data?.procesos || []) {
    const processLabel = clean(process?.titulo) || clean(process?.macroevento_id) || '(sin identidad)';
    for (const signal of process?.senales || []) {
      const signalLabel = clean(signal?.titulo) || clean(signal?.senal_id) || '(sin identidad)';
      for (const sourceId of signal?.fuente_ids || []) {
        const source = sources.get(clean(sourceId));
        if (source && clean(source.estado_verificacion) !== 'verificada') {
          errors.push(`${processLabel} / ${signalLabel}: la fuente ${sourceId} no está verificada.`);
        }
      }
    }
  }
  return errors;
}

export function validatePublicProjection(data, { eventId = '', allowDevelopment = true } = {}) {
  let canonical;
  try {
    canonical = validatePublicPackage(data, { allowDevelopment, allowDrafts: allowDevelopment });
  } catch (error) {
    canonical = { valid: false, errors: [`La validación canónica no pudo completarse: ${error.message}`], warnings: [] };
  }
  const errors = [...(canonical.errors || []), ...verifiedReferenceErrors(data)];
  const id = clean(eventId);
  if (id) {
    const matches = (data?.procesos || []).filter((process) => clean(process?.macroevento_id) === id);
    if (matches.length !== 1) {
      errors.push(matches.length
        ? `${id}: el macroevento está repetido en la proyección pública.`
        : `${id}: el macroevento no está representado en la proyección pública.`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings: canonical.warnings || [],
    validator: 'tools/lib/public-export.mjs#validatePublicPackage',
  };
}

export function assertValidPublicProjection(data, options = {}) {
  const validation = validatePublicProjection(data, options);
  if (!validation.valid) {
    const error = new Error(validation.errors.join(' '));
    error.code = 'PUBLIC_PROJECTION_INVALID';
    error.validation = validation;
    throw error;
  }
  return validation;
}
