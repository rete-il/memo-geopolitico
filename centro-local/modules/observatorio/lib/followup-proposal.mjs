import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PROPOSAL_FIELDS = [
  'titulo',
  'sintesis',
  'que_esta_ocurriendo',
  'clasificacion',
  'valoraciones',
  'senales',
  'fuente_ids',
  'indicadores_seguimiento',
  'escenarios',
  'macroevento_relacionado_ids',
  'macroevento_rector_ids',
];

const clone = (value) => (value === undefined ? undefined : structuredClone(value));
const clean = (value) => String(value ?? '').trim();

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, comparable(value[key])]));
  }
  return value;
}

function equal(left, right) {
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
}

function arrayIdentity(field, item) {
  if (field === 'senales') return item?.senal_id;
  if (typeof item === 'string') return item;
  return null;
}

function arrayDetail(field, before = [], after = []) {
  const beforeIds = new Set(before.map((item) => arrayIdentity(field, item)).filter(Boolean));
  const afterIds = new Set(after.map((item) => arrayIdentity(field, item)).filter(Boolean));
  const added = [...afterIds].filter((id) => !beforeIds.has(id));
  const removed = [...beforeIds].filter((id) => !afterIds.has(id));
  const modified = [...afterIds].filter((id) => {
    if (!beforeIds.has(id)) return false;
    return !equal(
      before.find((item) => arrayIdentity(field, item) === id),
      after.find((item) => arrayIdentity(field, item) === id),
    );
  });
  return { added, removed, modified };
}

export function diffFollowupProcesses(current, proposed) {
  const changes = [];
  for (const field of PROPOSAL_FIELDS) {
    const before = current?.[field];
    const after = proposed?.[field];
    if (equal(before, after)) continue;
    const action = before === undefined
      ? 'agregar'
      : after === undefined
        ? 'retirar'
        : 'modificar';
    const entry = {
      field,
      action,
      before: clone(before),
      after: clone(after),
    };
    if (Array.isArray(before) || Array.isArray(after)) {
      entry.summary = arrayDetail(field, before || [], after || []);
    }
    changes.push(entry);
  }
  return changes;
}

function preserveIndependentState(proposed, current) {
  if (!current) return proposed;
  const result = clone(proposed);
  for (const field of ['publicacion', 'progreso_publico']) {
    if (current[field]) result[field] = clone(current[field]);
  }
  for (const field of ['por_que_importa', 'claves_estructurales', 'cronologia', 'recurso_visual_ids']) {
    const proposedValue = result[field];
    const empty = proposedValue === '' || (Array.isArray(proposedValue) && proposedValue.length === 0);
    if (empty && current[field]) result[field] = clone(current[field]);
  }
  return result;
}

async function loadExporter(projectRoot) {
  const exporterPath = path.join(projectRoot, 'tools', 'lib', 'public-export.mjs');
  if (!fs.existsSync(exporterPath)) {
    const error = new Error(`No se encontró la herramienta canónica: ${exporterPath}`);
    error.code = 'PUBLIC_EXPORTER_NOT_FOUND';
    throw error;
  }
  const version = fs.statSync(exporterPath).mtimeMs;
  const module = await import(`${pathToFileURL(exporterPath).href}?v=${version}`);
  if (typeof module.buildPublicPackage !== 'function') {
    const error = new Error('La herramienta pública no expone buildPublicPackage.');
    error.code = 'PUBLIC_EXPORTER_INVALID';
    throw error;
  }
  return module.buildPublicPackage;
}

export async function generateFollowupProposal({
  projectRoot,
  data,
  taxonomy,
  eventId,
  publicExpedients = {},
  buildPublicPackage,
  generatedAt = new Date().toISOString().slice(0, 10),
} = {}) {
  const id = clean(eventId);
  const matches = Array.isArray(data?.macroeventos)
    ? data.macroeventos.filter((event) => event?.id === id)
    : [];

  if (!id || matches.length !== 1) {
    return {
      status: 'blocked',
      macroevento_id: id,
      blocks: [{
        code: !id ? 'missing-event-id' : matches.length > 1 ? 'duplicate-event' : 'missing-event',
        title: !id ? 'Falta macroevento_id' : matches.length > 1 ? 'macroevento_id duplicado' : 'Macroevento no encontrado',
      }],
    };
  }

  let exporter = buildPublicPackage;
  try {
    exporter ||= await loadExporter(projectRoot);
  } catch (error) {
    return {
      status: 'blocked',
      macroevento_id: id,
      blocks: [{
        code: error.code || 'public-exporter-error',
        title: 'Ruta canónica de exportación no resuelta',
        detail: error.message,
      }],
    };
  }

  const packageData = exporter({
    schema_version: data.schema_version,
    actualizado: data.actualizado,
    macroeventos: [clone(matches[0])],
  }, clone(taxonomy || {}), {
    includeUnpublished: true,
    includeInternal: false,
    generatedAt,
  });
  const generated = packageData?.procesos?.find((process) => process.macroevento_id === id);
  if (!generated) {
    return {
      status: 'blocked',
      macroevento_id: id,
      blocks: [{
        code: 'proposal-not-generated',
        title: 'La herramienta canónica no generó el proceso',
        detail: 'No se creó una propuesta pública para el macroevento seleccionado.',
      }],
    };
  }

  const current = publicExpedients?.process_by_event?.[id] || null;
  const proposed = preserveIndependentState(generated, current);
  if (proposed.macroevento_id !== id) {
    return {
      status: 'blocked',
      macroevento_id: id,
      blocks: [{
        code: 'identity-changed',
        title: 'La propuesta alteró el macroevento_id',
        detail: `Se esperaba “${id}” y se obtuvo “${proposed.macroevento_id || 'vacío'}”.`,
      }],
    };
  }

  const changes = diffFollowupProcesses(current, proposed);
  const sources = (packageData?.fuentes || []).filter((source) => proposed.fuente_ids?.includes(source.fuente_id));
  const canonicalSignals = matches[0].senales || [];
  const verifiedSignals = canonicalSignals.filter((signal) => (
    ['revisada', 'verificada', 'confirmada'].includes(clean(signal?.estado_revision).toLowerCase())
  )).length;
  const exportableSignals = proposed.senales?.length || 0;
  const verifiedSources = (matches[0].fuentes || []).filter((source) => (
    clean(source?.estado_verificacion).toLowerCase() === 'verificada'
  )).length;
  return {
    status: 'ready',
    schema_version: 1,
    tipo: 'propuesta-seguimiento',
    generado_el: generatedAt,
    macroevento_id: id,
    operation: current ? 'actualizar' : 'crear',
    base: {
      existe: Boolean(current),
      actualizado_el: current?.publicacion?.actualizado_el || '',
    },
    identity_preserved: true,
    proposed_process: proposed,
    proposed_sources: sources,
    diff: changes,
    metrics: {
      changes: changes.length,
      signals: exportableSignals,
      signals_verified: verifiedSignals,
      signals_exportable: exportableSignals,
      sources: proposed.fuente_ids?.length || 0,
      sources_verified: verifiedSources,
      sources_exportable: proposed.fuente_ids?.length || 0,
      pending_sources_excluded: (matches[0].fuentes || []).filter((source) => source.estado_verificacion !== 'verificada').length,
      signals_without_verified_source_excluded: Math.max(0, canonicalSignals.length - exportableSignals),
      verified_signals_not_exportable: Math.max(0, verifiedSignals - exportableSignals),
    },
    safety: {
      files_created: 0,
      files_modified: 0,
      markdown_created: false,
      canonical_data_modified: false,
    },
  };
}
