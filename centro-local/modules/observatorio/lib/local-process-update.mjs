import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { sessionFileFor } from './analysis-prompt.mjs';
import {
  assertValidPublicProjection,
  mergeFollowupProjection,
} from './public-projection.mjs';
import { processRevision } from './revisions.mjs';

const clean = (value) => String(value ?? '').trim();
const VALID_ID = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;

function issue(code, title, detail = '') {
  return { code, title, detail };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(
    path.dirname(file),
    `.${path.basename(file)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
  );
  try {
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function safeChild(root, ...segments) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, ...segments);
  if (!candidate.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('La ruta calculada sale de la carpeta autorizada.');
  }
  return candidate;
}

function sessionFromFile(sessionsDir, eventId) {
  let file;
  try {
    file = sessionFileFor(sessionsDir, eventId);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-event-id', 'macroevento_id inválido', error.message)] };
  }
  if (!fs.existsSync(file)) {
    return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para actualizar el proceso')] };
  }
  try {
    return { status: 'ready', file, session: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
}

function fingerprint({ eventId, previousHash, candidateHash, revision }) {
  return sha256(jsonText({ eventId, previousHash, candidateHash, revision }));
}

export function planLocalProcessUpdate({
  centerRoot,
  siteRoot,
  sessionsDir,
  processUpdatesDir,
  backupsDir,
  eventId,
  currentFollowupProposal,
} = {}) {
  const id = clean(eventId);
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  const { session } = loaded;
  if (session.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('session-identity-mismatch', 'La sesión pertenece a otro macroevento')] };
  }
  if (currentFollowupProposal?.status !== 'ready'
      || clean(currentFollowupProposal?.macroevento_id) !== id
      || currentFollowupProposal?.identity_preserved !== true) {
    return { status: 'blocked', blocks: [issue('invalid-followup-proposal', 'La propuesta actual del proceso no es aplicable')] };
  }

  let publicFile;
  let recordFile;
  let backupDirectory;
  try {
    publicFile = safeChild(siteRoot, 'src', 'data', 'public', 'observatorio.json');
    if (!fs.existsSync(path.join(siteRoot, 'package.json')) || !fs.existsSync(publicFile)) {
      throw new Error('No se encontró una copia local válida del sitio.');
    }
    if (!VALID_ID.test(id)) throw new Error('El macroevento_id no es seguro.');
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-site-root', 'No se pudo resolver la proyección pública local', error.message)] };
  }

  let previous;
  let candidateData;
  let candidate;
  let validation;
  try {
    previous = fs.readFileSync(publicFile);
    candidateData = mergeFollowupProjection(JSON.parse(previous.toString('utf8')), currentFollowupProposal);
    validation = assertValidPublicProjection(candidateData, { eventId: id, allowDevelopment: true });
    candidate = Buffer.from(jsonText(candidateData), 'utf8');
  } catch (error) {
    return {
      status: 'blocked',
      blocks: [issue(
        error.code === 'PUBLIC_PROJECTION_INVALID' ? 'public-projection-invalid' : 'process-update-invalid',
        'La actualización del proceso no supera la validación canónica',
        error.message,
      )],
    };
  }

  const previousHash = sha256(previous);
  const candidateHash = sha256(candidate);
  const revision = processRevision(currentFollowupProposal);
  const planId = fingerprint({ eventId: id, previousHash, candidateHash, revision });
  const updateId = `actualizacion-proceso-${id}-${planId.slice(0, 12)}`;
  try {
    recordFile = safeChild(processUpdatesDir, `${updateId}.json`);
    backupDirectory = safeChild(backupsDir, 'actualizaciones-proceso', updateId);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-process-update-record', 'La ruta del registro no es segura', error.message)] };
  }

  return {
    status: 'ready',
    plan_id: planId,
    update_id: updateId,
    macroevento_id: id,
    operation: previousHash === candidateHash ? 'sin_cambios' : 'modificar',
    process_revision: revision,
    analysis_revision: session.revisiones?.analysis_revision || session.respuesta_chatgpt?.hash_sha256 || null,
    analysis_approval_preserved: Boolean(session.respuesta_chatgpt?.aprobada_el),
    metrics: {
      differences: currentFollowupProposal.diff?.length || 0,
      signals_verified: currentFollowupProposal.metrics?.signals_verified || 0,
      signals_exportable: currentFollowupProposal.metrics?.signals_exportable ?? currentFollowupProposal.metrics?.signals ?? 0,
      sources_verified: currentFollowupProposal.metrics?.sources_verified || 0,
      sources_exportable: currentFollowupProposal.metrics?.sources_exportable ?? currentFollowupProposal.metrics?.sources ?? 0,
    },
    target: {
      file: publicFile,
      relative: path.relative(siteRoot, publicFile).replaceAll('/', '\\'),
      previous_sha256: previousHash,
      candidate_sha256: candidateHash,
    },
    backup: {
      directory: backupDirectory,
      relative: path.relative(centerRoot, backupDirectory).replaceAll('/', '\\'),
    },
    record: {
      file: recordFile,
      relative: path.relative(centerRoot, recordFile).replaceAll('/', '\\'),
    },
    validation,
    safety: {
      atomic_write: true,
      rollback_on_failure: true,
      analysis_markdown_modified: false,
      analysis_approval_preserved: true,
      git_executed: false,
      deploy_executed: false,
    },
    _previous: previous,
    _candidate: candidate,
    _session_file: loaded.file,
  };
}

export function serializeProcessUpdatePlan(plan) {
  if (plan?.status !== 'ready') return plan;
  const { _previous, _candidate, _session_file, ...safe } = plan;
  return safe;
}

export function applyLocalProcessUpdate(options = {}) {
  const plan = planLocalProcessUpdate(options);
  if (plan.status !== 'ready') return plan;
  if (clean(options.expectedPlanId) !== plan.plan_id) {
    return { status: 'blocked', blocks: [issue('process-update-plan-stale', 'El plan cambió antes de actualizar', 'Volvé a comprobar la revisión del proceso.')] };
  }
  if (options.confirmed !== true) {
    return { status: 'blocked', blocks: [issue('process-update-confirmation-required', 'Falta confirmar la actualización local del proceso')] };
  }
  if (plan.operation === 'sin_cambios') {
    return { status: 'ready', reused: true, plan: serializeProcessUpdatePlan(plan), session: sessionFromFile(options.sessionsDir, plan.macroevento_id).session };
  }

  const loaded = sessionFromFile(options.sessionsDir, plan.macroevento_id);
  if (loaded.status !== 'ready') return loaded;
  const appliedAt = options.appliedAt || new Date().toISOString();
  const backupFile = path.join(plan.backup.directory, 'observatorio-anterior.json');
  const manifestFile = path.join(plan.backup.directory, 'MANIFIESTO.json');
  const record = {
    schema_version: 1,
    tipo: 'actualizacion-local-proceso',
    update_id: plan.update_id,
    plan_id: plan.plan_id,
    macroevento_id: plan.macroevento_id,
    aplicado_el: appliedAt,
    estado: 'aplicada',
    process_revision: plan.process_revision,
    analysis_revision: plan.analysis_revision,
    analysis_approval_preserved: plan.analysis_approval_preserved,
    target: {
      file: plan.target.file,
      relative: plan.target.relative,
      previous_sha256: plan.target.previous_sha256,
      candidate_sha256: plan.target.candidate_sha256,
      previous_backup_file: backupFile,
    },
    validation: plan.validation,
    rollback: { estado: 'disponible', ejecutado_el: null },
    seguridad: plan.safety,
  };

  let targetWritten = false;
  try {
    fs.mkdirSync(plan.backup.directory, { recursive: true });
    writeAtomic(backupFile, plan._previous);
    writeAtomic(manifestFile, Buffer.from(jsonText(record), 'utf8'));
    writeAtomic(plan.target.file, plan._candidate);
    targetWritten = true;
    const written = fs.readFileSync(plan.target.file);
    if (sha256(written) !== plan.target.candidate_sha256) {
      throw new Error('La verificación posterior del archivo actualizado no coincide.');
    }
    assertValidPublicProjection(JSON.parse(written.toString('utf8')), {
      eventId: plan.macroevento_id,
      allowDevelopment: true,
    });
    if (typeof options.afterTargetWrite === 'function') options.afterTargetWrite(plan);
    writeAtomic(plan.record.file, Buffer.from(jsonText(record), 'utf8'));

    const session = loaded.session;
    session.actualizado_el = appliedAt;
    session.propuesta_seguimiento = structuredClone(options.currentFollowupProposal);
    session.revisiones = {
      ...(session.revisiones || {}),
      analysis_revision: plan.analysis_revision,
      process_revision: plan.process_revision,
    };
    if (session.paquete_revision?.estado === 'archivos_preparados') {
      session.paquete_revision.estado = 'obsoleto_por_revision_proceso';
    }
    if (session.integracion_local?.estado === 'aplicada') {
      session.integracion_local.rollback_estado = 'bloqueada_por_actualizacion_proceso';
    }
    if (session.publicacion_local?.estado === 'aplicada') {
      session.publicacion_local.rollback_estado = 'bloqueada_por_actualizacion_proceso';
      session.publicacion_local.qa_datos = 'valido';
      session.publicacion_local.qa_estado = 'pendiente_sitio';
      session.publicacion_local.git_estado = 'cambios_locales_pendientes';
    }
    session.actualizacion_proceso = {
      update_id: plan.update_id,
      plan_id: plan.plan_id,
      aplicado_el: appliedAt,
      estado: 'aplicada',
      target_relative: plan.target.relative,
      candidate_sha256: plan.target.candidate_sha256,
      backup_relative: plan.backup.relative,
      record_relative: plan.record.relative,
      rollback_estado: 'disponible',
      qa_datos: 'valido',
      qa_sitio: 'pendiente',
      git_estado: 'cambios_locales_pendientes',
    };
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: 'qa_sitio_y_revision_git',
      estado: 'proceso_actualizado_pendiente_qa_sitio',
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
    return {
      status: 'ready',
      reused: false,
      plan: serializeProcessUpdatePlan(plan),
      update: record,
      session,
      safety: plan.safety,
    };
  } catch (error) {
    if (targetWritten) writeAtomic(plan.target.file, plan._previous);
    record.estado = 'fallida_revertida';
    record.error = { mensaje: error.message, revertida_el: new Date().toISOString() };
    record.rollback = { estado: 'automatica_completada', ejecutado_el: record.error.revertida_el };
    try {
      writeAtomic(manifestFile, Buffer.from(jsonText(record), 'utf8'));
      writeAtomic(plan.record.file, Buffer.from(jsonText(record), 'utf8'));
    } catch {
      // La restauración del destino tiene prioridad; el error original se devuelve al usuario.
    }
    return { status: 'blocked', blocks: [issue('process-update-write-failed', 'No se pudo completar la actualización del proceso', error.message)] };
  }
}
