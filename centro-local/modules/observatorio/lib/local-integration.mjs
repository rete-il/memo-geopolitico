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

function finalNewline(value) {
  return `${String(value ?? '').replace(/\r\n?/g, '\n').trimEnd()}\n`;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function equal(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

function proposalComparable(proposal = {}) {
  return {
    macroevento_id: proposal.macroevento_id,
    operation: proposal.operation,
    identity_preserved: proposal.identity_preserved,
    proposed_process: proposal.proposed_process,
    proposed_sources: proposal.proposed_sources,
    diff: proposal.diff,
  };
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
  const boundary = `${resolvedRoot}${path.sep}`;
  const candidate = path.resolve(resolvedRoot, ...segments);
  if (!candidate.startsWith(boundary)) throw new Error('La ruta calculada sale de la carpeta autorizada.');
  return candidate;
}

function relativeWindows(root, file) {
  return path.relative(root, file).replaceAll('/', '\\');
}

function sessionFromFile(sessionsDir, eventId) {
  let file;
  try {
    file = sessionFileFor(sessionsDir, eventId);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-event-id', 'macroevento_id inválido', error.message)] };
  }
  if (!fs.existsSync(file)) {
    return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para integrar')] };
  }
  try {
    return { status: 'ready', file, session: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
}

function frontmatterScalar(markdown, key) {
  const header = String(markdown).match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1] || '';
  const match = header.match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'));
  if (!match) return '';
  const value = match[1].trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(item);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [item] : [];
  });
}

function duplicatePublication(siteRoot, targetFile, metadata) {
  const publicationRoot = path.join(siteRoot, 'src', 'content', 'publicaciones');
  for (const file of markdownFiles(publicationRoot)) {
    if (path.resolve(file) === path.resolve(targetFile)) continue;
    const markdown = fs.readFileSync(file, 'utf8');
    if (frontmatterScalar(markdown, 'post_id') === metadata.post_id) {
      return issue('duplicate-publication-post-id', 'El post_id ya existe en otra publicación del sitio', relativeWindows(siteRoot, file));
    }
    if (frontmatterScalar(markdown, 'slug') === metadata.slug) {
      return issue('duplicate-publication-slug', 'El slug ya existe en otra publicación del sitio', relativeWindows(siteRoot, file));
    }
  }
  return null;
}

function operationFor(previous, candidate) {
  if (!previous) return 'crear';
  return sha256(previous) === sha256(candidate) ? 'sin_cambios' : 'modificar';
}

function integrationFingerprint({ eventId, applicationId, canonicalHash, previewPreviousHash, publicPreviousHash, publicCandidateHash, proposal }) {
  return sha256(jsonText(stable({
    eventId,
    applicationId,
    canonicalHash,
    previewPreviousHash: previewPreviousHash || null,
    publicPreviousHash,
    publicCandidateHash,
    proposal: proposalComparable(proposal),
  })));
}

function restoreFile(file, previous) {
  if (previous) writeAtomic(file, previous);
  else if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function planLocalIntegration({
  centerRoot,
  siteRoot,
  sessionsDir,
  integrationsDir,
  backupsDir,
  eventId,
  currentFollowupProposal,
} = {}) {
  const id = clean(eventId);
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  const { session } = loaded;
  if (session.aplicacion_local?.estado !== 'aplicada') {
    return { status: 'blocked', blocks: [issue('local-application-required', 'La aplicación local de Fase 7 no está completada')] };
  }
  if (session.respuesta_chatgpt?.validacion?.estado !== 'ready'
      || !session.respuesta_chatgpt?.aprobada_el) {
    return { status: 'blocked', blocks: [issue('approved-response-required', 'La respuesta aprobada ya no está disponible para integrar')] };
  }
  if (session.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('session-identity-mismatch', 'La sesión pertenece a otro macroevento')] };
  }
  if (currentFollowupProposal?.status !== 'ready'
      || !equal(proposalComparable(currentFollowupProposal), proposalComparable(session.propuesta_seguimiento))) {
    return {
      status: 'blocked',
      analysis_approval_preserved: true,
      analysis_revision: session.revisiones?.analysis_revision || session.respuesta_chatgpt?.hash_sha256,
      process_revision: currentFollowupProposal?.status === 'ready' ? processRevision(currentFollowupProposal) : null,
      blocks: [issue(
        'process-revision-changed',
        'Cambió la revisión del proceso antes de la integración',
        'El análisis aprobado continúa válido. Actualizá únicamente la revisión del proceso; no hace falta volver a aprobar el Markdown.',
      )],
    };
  }

  const metadata = session.respuesta_chatgpt?.validacion?.metadata || {};
  const slug = clean(metadata.slug);
  const postId = clean(metadata.post_id);
  if (!VALID_ID.test(slug) || !VALID_ID.test(postId) || clean(metadata.macroevento_principal_id) !== id) {
    return { status: 'blocked', blocks: [issue('invalid-analysis-identity', 'La identidad del análisis aprobado no es integrable')] };
  }
  let canonicalFile;
  let previewFile;
  let publicFile;
  try {
    canonicalFile = safeChild(centerRoot, 'data', 'publicaciones', 'borradores', `${slug}.md`);
    previewFile = safeChild(siteRoot, 'src', 'content', 'publicaciones', '_preview', `${slug}.md`);
    publicFile = safeChild(siteRoot, 'src', 'data', 'public', 'observatorio.json');
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-integration-path', 'Una ruta de integración no es segura', error.message)] };
  }
  if (!fs.existsSync(path.join(siteRoot, 'package.json')) || !fs.existsSync(publicFile)) {
    return { status: 'blocked', blocks: [issue('invalid-site-root', 'No se encontró una copia local válida del sitio', path.resolve(siteRoot || ''))] };
  }
  if (!fs.existsSync(canonicalFile)) {
    return { status: 'blocked', blocks: [issue('canonical-draft-missing', 'No se encontró el borrador canónico aplicado')] };
  }
  const canonical = fs.readFileSync(canonicalFile);
  const canonicalHash = sha256(canonical);
  if (canonicalHash !== clean(session.aplicacion_local.candidate_sha256)) {
    return { status: 'blocked', blocks: [issue('canonical-draft-changed', 'El borrador canónico cambió después de la Fase 7', 'La integración se detuvo para conservar las ediciones posteriores.')] };
  }
  const approvedMarkdown = session.respuesta_chatgpt?.contenido_normalizado;
  if (!clean(approvedMarkdown)) {
    return { status: 'blocked', blocks: [issue('approved-response-content-missing', 'No se encontró el contenido aprobado para comprobar la integración')] };
  }
  const approvedCandidateHash = sha256(Buffer.from(finalNewline(approvedMarkdown), 'utf8'));
  if (canonicalHash !== approvedCandidateHash) {
    return {
      status: 'blocked',
      blocks: [issue(
        'canonical-approved-response-mismatch',
        'El borrador aplicado no coincide con la última respuesta aprobada',
        'Comprobá y aplicá nuevamente la Fase 7 antes de integrar; no edites el archivo manualmente.',
      )],
    };
  }
  const applicationId = clean(session.aplicacion_local.application_id);
  if (!VALID_ID.test(applicationId)) {
    return { status: 'blocked', blocks: [issue('invalid-application-id', 'La aplicación de Fase 7 no tiene una identidad válida')] };
  }
  let applicationFile;
  try {
    applicationFile = safeChild(centerRoot, 'data', 'aplicaciones', `${applicationId}.json`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-application-record', 'La ruta del registro de Fase 7 no es segura', error.message)] };
  }
  if (!fs.existsSync(applicationFile)) {
    return { status: 'blocked', blocks: [issue('missing-application-record', 'No se encontró el registro verificable de la Fase 7')] };
  }
  let applicationRecord;
  try {
    applicationRecord = JSON.parse(fs.readFileSync(applicationFile, 'utf8'));
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-application-record', 'El registro de Fase 7 no es válido', error.message)] };
  }
  if (applicationRecord.application_id !== applicationId
      || applicationRecord.macroevento_id !== id
      || applicationRecord.estado !== 'aplicada'
      || applicationRecord.rollback?.estado !== 'disponible') {
    return { status: 'blocked', blocks: [issue('application-record-mismatch', 'El registro de Fase 7 no confirma una aplicación activa')] };
  }
  if (clean(applicationRecord.analysis?.candidate_sha256) !== canonicalHash
      || path.resolve(clean(applicationRecord.analysis?.target_file)) !== canonicalFile) {
    return { status: 'blocked', blocks: [issue('application-record-content-mismatch', 'El registro de Fase 7 no coincide con el borrador canónico aplicado')] };
  }
  if (frontmatterScalar(canonical.toString('utf8'), 'slug') !== slug
      || frontmatterScalar(canonical.toString('utf8'), 'post_id') !== postId
      || frontmatterScalar(canonical.toString('utf8'), 'macroevento_principal_id') !== id) {
    return { status: 'blocked', blocks: [issue('canonical-identity-changed', 'El frontmatter del borrador ya no coincide con la respuesta aprobada')] };
  }
  const duplicate = duplicatePublication(siteRoot, previewFile, { slug, post_id: postId });
  if (duplicate) return { status: 'blocked', blocks: [duplicate] };

  let publicCurrent;
  let publicCandidateData;
  try {
    publicCurrent = fs.readFileSync(publicFile);
    const parsed = JSON.parse(publicCurrent.toString('utf8'));
    assertValidPublicProjection(parsed, { eventId: id });
    publicCandidateData = currentFollowupProposal.diff?.length
      ? mergeFollowupProjection(parsed, currentFollowupProposal)
      : parsed;
    assertValidPublicProjection(publicCandidateData, { eventId: id });
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-public-projection', 'El seguimiento público local no puede integrarse', error.message)] };
  }

  const publicCandidate = Buffer.from(jsonText(publicCandidateData), 'utf8');
  const previewPrevious = fs.existsSync(previewFile) ? fs.readFileSync(previewFile) : null;
  const previewOperation = operationFor(previewPrevious, canonical);
  const publicOperation = currentFollowupProposal.diff?.length
    ? operationFor(publicCurrent, publicCandidate)
    : 'sin_cambios';
  const fingerprint = integrationFingerprint({
    eventId: id,
    applicationId,
    canonicalHash,
    previewPreviousHash: previewPrevious ? sha256(previewPrevious) : '',
    publicPreviousHash: sha256(publicCurrent),
    publicCandidateHash: sha256(publicCandidate),
    proposal: currentFollowupProposal,
  });
  const integrationId = `integracion-${id}-${fingerprint.slice(0, 12)}`;
  let backupDirectory;
  let integrationFile;
  try {
    backupDirectory = safeChild(backupsDir, 'integraciones', integrationId);
    integrationFile = safeChild(integrationsDir, `${integrationId}.json`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-integration-record', 'La ruta del registro de integración no es segura', error.message)] };
  }
  const processSlug = clean(currentFollowupProposal.proposed_process?.slug) || id;
  return {
    status: 'ready',
    plan_id: fingerprint,
    integration_id: integrationId,
    macroevento_id: id,
    application_id: session.aplicacion_local.application_id,
    analysis: {
      post_id: postId,
      slug,
      canonical_file: canonicalFile,
      canonical_relative: relativeWindows(centerRoot, canonicalFile),
      canonical_sha256: canonicalHash,
      target_file: previewFile,
      target_relative: relativeWindows(siteRoot, previewFile),
      operation: previewOperation,
      candidate_sha256: canonicalHash,
      previous_sha256: previewPrevious ? sha256(previewPrevious) : null,
      bytes: canonical.length,
      preview_url: `/publicaciones/${slug}/`,
    },
    followup: {
      macroevento_id: id,
      differences: currentFollowupProposal.diff?.length || 0,
      target_file: publicFile,
      target_relative: relativeWindows(siteRoot, publicFile),
      operation: publicOperation,
      candidate_sha256: sha256(publicCandidate),
      previous_sha256: sha256(publicCurrent),
      preview_url: `/observatorio/${processSlug}/`,
      validation: assertValidPublicProjection(publicCandidateData, { eventId: id }),
    },
    backup: {
      directory: backupDirectory,
      directory_relative: relativeWindows(centerRoot, backupDirectory),
      rollback_available: previewOperation !== 'sin_cambios' || publicOperation !== 'sin_cambios',
    },
    integration_record: {
      file: integrationFile,
      relative: relativeWindows(centerRoot, integrationFile),
    },
    writes: {
      preview_created: previewOperation === 'crear' ? 1 : 0,
      preview_modified: previewOperation === 'modificar' ? 1 : 0,
      preview_unchanged: previewOperation === 'sin_cambios' ? 1 : 0,
      public_followup_modified: publicOperation === 'modificar' ? 1 : 0,
      session_files: previewOperation === 'sin_cambios' && publicOperation === 'sin_cambios' ? 0 : 1,
      integration_records: previewOperation === 'sin_cambios' && publicOperation === 'sin_cambios' ? 0 : 1,
      git_operations: 0,
    },
    checks: [
      'npm run check',
      'npm run build',
      'npm run build:preview',
      'npm run validate:build',
      'npm run dev:editorial',
    ],
    safety: {
      atomic_write: true,
      canonical_draft_verified: true,
      identities_verified: true,
      rollback_guarded_by_hash: true,
      production_markdown_created: false,
      git_executed: false,
      build_executed: false,
      deploy_executed: false,
    },
    _canonical: canonical,
    _preview_previous: previewPrevious,
    _public_previous: publicCurrent,
    _public_candidate: publicCandidate,
    _session_file: loaded.file,
  };
}

function publicPlan(plan) {
  const {
    _canonical,
    _preview_previous,
    _public_previous,
    _public_candidate,
    _session_file,
    ...safe
  } = plan;
  return safe;
}

export function applyLocalIntegration(options = {}) {
  const plan = planLocalIntegration(options);
  if (plan.status !== 'ready') return plan;
  if (clean(options.expectedPlanId) !== plan.plan_id) {
    return { status: 'blocked', blocks: [issue('integration-plan-stale', 'El plan cambió antes de integrar', 'Volvé a comprobar destinos, contenido y backup.')] };
  }
  if (options.confirmed !== true) {
    return { status: 'blocked', blocks: [issue('integration-confirmation-required', 'Falta la confirmación explícita de integración local')] };
  }
  if (plan.analysis.operation === 'sin_cambios' && plan.followup.operation === 'sin_cambios') {
    return {
      status: 'ready',
      reused: true,
      plan: publicPlan(plan),
      integration: options.existingIntegration || null,
      safety: plan.safety,
    };
  }

  const loaded = sessionFromFile(options.sessionsDir, plan.macroevento_id);
  if (loaded.status !== 'ready') return loaded;
  const appliedAt = options.appliedAt || new Date().toISOString();
  const backupFiles = path.join(plan.backup.directory, 'files');
  const previewBackupFile = path.join(backupFiles, 'preview-anterior.md');
  const publicBackupFile = path.join(backupFiles, 'observatorio-anterior.json');
  const record = {
    schema_version: 1,
    tipo: 'integracion-local-preview',
    integration_id: plan.integration_id,
    plan_id: plan.plan_id,
    application_id: plan.application_id,
    macroevento_id: plan.macroevento_id,
    integrado_el: appliedAt,
    estado: 'aplicada',
    analysis: {
      post_id: plan.analysis.post_id,
      slug: plan.analysis.slug,
      target_file: plan.analysis.target_file,
      target_relative: plan.analysis.target_relative,
      operation: plan.analysis.operation,
      candidate_sha256: plan.analysis.candidate_sha256,
      previous_sha256: plan.analysis.previous_sha256,
      previous_existed: Boolean(plan._preview_previous),
      previous_backup_file: plan._preview_previous ? previewBackupFile : null,
      preview_url: plan.analysis.preview_url,
    },
    followup: {
      macroevento_id: plan.followup.macroevento_id,
      differences: plan.followup.differences,
      target_file: plan.followup.target_file,
      target_relative: plan.followup.target_relative,
      operation: plan.followup.operation,
      candidate_sha256: plan.followup.candidate_sha256,
      previous_sha256: plan.followup.previous_sha256,
      previous_backup_file: plan.followup.operation === 'modificar' ? publicBackupFile : null,
      preview_url: plan.followup.preview_url,
    },
    backup: {
      directory: plan.backup.directory,
      manifest: path.join(plan.backup.directory, 'MANIFIESTO.json'),
    },
    rollback: { estado: 'disponible', ejecutado_el: null },
    seguridad: {
      escritura_atomica: true,
      borrador_canonico_verificado: true,
      publicacion_produccion_creada: false,
      git_ejecutado: false,
      build_ejecutado: false,
      deploy_ejecutado: false,
    },
  };

  let previewWritten = false;
  let publicWritten = false;
  try {
    fs.mkdirSync(backupFiles, { recursive: true });
    if (plan._preview_previous) writeAtomic(previewBackupFile, plan._preview_previous);
    if (plan.followup.operation === 'modificar') writeAtomic(publicBackupFile, plan._public_previous);
    writeAtomic(record.backup.manifest, Buffer.from(jsonText(record), 'utf8'));
    if (plan.analysis.operation !== 'sin_cambios') {
      writeAtomic(plan.analysis.target_file, plan._canonical);
      previewWritten = true;
    }
    if (plan.followup.operation === 'modificar') {
      writeAtomic(plan.followup.target_file, plan._public_candidate);
      publicWritten = true;
    }
    if (sha256(fs.readFileSync(plan.analysis.target_file)) !== plan.analysis.candidate_sha256) {
      throw new Error('La verificación posterior del análisis integrado no coincide.');
    }
    if (sha256(fs.readFileSync(plan.followup.target_file)) !== plan.followup.candidate_sha256) {
      throw new Error('La verificación posterior del seguimiento integrado no coincide.');
    }
    assertValidPublicProjection(
      JSON.parse(fs.readFileSync(plan.followup.target_file, 'utf8')),
      { eventId: plan.macroevento_id },
    );
    if (typeof options.afterTargetWrite === 'function') options.afterTargetWrite(plan);
    writeAtomic(plan.integration_record.file, Buffer.from(jsonText(record), 'utf8'));
    const session = loaded.session;
    session.estado = 'integracion_local_completada';
    session.actualizado_el = appliedAt;
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: null,
      estado: 'integracion_local_pendiente_qa',
    };
    session.aplicacion_local = {
      ...(session.aplicacion_local || {}),
      rollback_estado: 'bloqueada_por_integracion',
    };
    session.integracion_local = {
      integration_id: plan.integration_id,
      plan_id: plan.plan_id,
      integrado_el: appliedAt,
      estado: 'aplicada',
      analysis_target_relative: plan.analysis.target_relative,
      analysis_operation: plan.analysis.operation,
      analysis_sha256: plan.analysis.candidate_sha256,
      followup_target_relative: plan.followup.target_relative,
      followup_operation: plan.followup.operation,
      followup_sha256: plan.followup.candidate_sha256,
      backup_relative: plan.backup.directory_relative,
      integration_record_relative: plan.integration_record.relative,
      rollback_estado: 'disponible',
      analysis_preview_url: plan.analysis.preview_url,
      followup_preview_url: plan.followup.preview_url,
      qa_estado: 'pendiente',
      qa_datos: 'valido',
      validacion_publica: plan.followup.validation,
    };
    session.seguridad = {
      ...(session.seguridad || {}),
      archivos_preview_creados: plan.writes.preview_created,
      archivos_preview_modificados: plan.writes.preview_modified,
      archivos_publicos_modificados: plan.writes.public_followup_modified,
      archivos_integracion_creados: 1,
      backups_integracion_creados: 1,
      git_ejecutado: false,
      build_ejecutado: false,
      deploy_ejecutado: false,
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
    return {
      status: 'ready',
      reused: false,
      plan: publicPlan(plan),
      integration: record,
      session,
      safety: session.seguridad,
    };
  } catch (error) {
    if (publicWritten) restoreFile(plan.followup.target_file, plan._public_previous);
    if (previewWritten) restoreFile(plan.analysis.target_file, plan._preview_previous);
    record.estado = 'fallida_revertida';
    record.error = { mensaje: error.message, revertida_el: new Date().toISOString() };
    record.rollback = { estado: 'automatica_completada', ejecutado_el: record.error.revertida_el };
    try {
      writeAtomic(record.backup.manifest, Buffer.from(jsonText(record), 'utf8'));
      writeAtomic(plan.integration_record.file, Buffer.from(jsonText(record), 'utf8'));
    } catch {
      // La restauración de los destinos tiene prioridad; se conserva el error original.
    }
    return { status: 'blocked', blocks: [issue('integration-write-failed', 'No se pudo completar la integración local', error.message)] };
  }
}

export function rollbackLocalIntegration({
  centerRoot,
  siteRoot,
  sessionsDir,
  integrationsDir,
  eventId,
  integrationId,
  confirmed,
  rolledBackAt = new Date().toISOString(),
} = {}) {
  const id = clean(eventId);
  const recordId = clean(integrationId);
  if (confirmed !== true) {
    return { status: 'blocked', blocks: [issue('integration-rollback-confirmation-required', 'Falta la confirmación explícita de restauración')] };
  }
  if (!VALID_ID.test(recordId)) {
    return { status: 'blocked', blocks: [issue('invalid-integration-id', 'El integration_id no es válido')] };
  }
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  if (loaded.session.publicacion_local?.estado === 'aplicada') {
    return {
      status: 'blocked',
      blocks: [issue(
        'publication-rollback-required',
        'La publicación local debe restaurarse antes que la integración',
        'La Fase 9 conserva una publicación activa vinculada con este preview.',
      )],
    };
  }
  let integrationFile;
  try {
    integrationFile = safeChild(integrationsDir, `${recordId}.json`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-integration-record', 'La ruta del registro no es segura', error.message)] };
  }
  if (!fs.existsSync(integrationFile)) {
    return { status: 'blocked', blocks: [issue('missing-integration-record', 'No existe el registro de integración solicitado')] };
  }
  let record;
  try {
    record = JSON.parse(fs.readFileSync(integrationFile, 'utf8'));
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-integration-record', 'El registro de integración no es válido', error.message)] };
  }
  if (record.integration_id !== recordId || record.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('integration-identity-mismatch', 'El registro pertenece a otra integración')] };
  }
  if (record.estado !== 'aplicada' || record.rollback?.estado !== 'disponible') {
    return { status: 'blocked', blocks: [issue('integration-rollback-not-available', 'La restauración ya no está disponible')] };
  }

  let previewFile;
  let publicFile;
  let previewBackupFile;
  let publicBackupFile;
  try {
    const slug = clean(record.analysis?.slug);
    if (!VALID_ID.test(slug)) throw new Error('El slug guardado no es válido.');
    previewFile = safeChild(siteRoot, 'src', 'content', 'publicaciones', '_preview', `${slug}.md`);
    publicFile = safeChild(siteRoot, 'src', 'data', 'public', 'observatorio.json');
    if (path.resolve(clean(record.analysis?.target_file)) !== previewFile
        || path.resolve(clean(record.followup?.target_file)) !== publicFile) {
      throw new Error('Los destinos guardados no coinciden con las carpetas autorizadas.');
    }
    const backupRoot = safeChild(centerRoot, 'data', 'backups', 'integraciones', recordId, 'files');
    previewBackupFile = path.join(backupRoot, 'preview-anterior.md');
    publicBackupFile = path.join(backupRoot, 'observatorio-anterior.json');
    if (record.analysis.previous_existed
        && path.resolve(clean(record.analysis?.previous_backup_file)) !== previewBackupFile) {
      throw new Error('La copia anterior del análisis no coincide con el backup autorizado.');
    }
    if (record.followup.operation === 'modificar'
        && path.resolve(clean(record.followup?.previous_backup_file)) !== publicBackupFile) {
      throw new Error('La copia anterior del seguimiento no coincide con el backup autorizado.');
    }
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-integration-rollback-record', 'El registro contiene rutas no autorizadas', error.message)] };
  }

  if (!fs.existsSync(previewFile)
      || sha256(fs.readFileSync(previewFile)) !== record.analysis.candidate_sha256) {
    return { status: 'blocked', blocks: [issue('preview-changed-after-integration', 'El análisis de preview cambió después de integrarlo', 'No se restauró para evitar perder ediciones posteriores.')] };
  }
  if (!fs.existsSync(publicFile)
      || sha256(fs.readFileSync(publicFile)) !== record.followup.candidate_sha256) {
    return { status: 'blocked', blocks: [issue('followup-changed-after-integration', 'El seguimiento público cambió después de integrarlo', 'No se restauró para evitar perder ediciones posteriores.')] };
  }

  const previewCurrent = fs.readFileSync(previewFile);
  const publicCurrent = fs.readFileSync(publicFile);
  try {
    if (record.analysis.previous_existed) {
      if (!fs.existsSync(previewBackupFile)) throw new Error('No se encontró la copia anterior del análisis.');
      const previous = fs.readFileSync(previewBackupFile);
      if (sha256(previous) !== record.analysis.previous_sha256) throw new Error('El hash del análisis anterior no coincide.');
      writeAtomic(previewFile, previous);
    } else {
      fs.unlinkSync(previewFile);
    }
    if (record.followup.operation === 'modificar') {
      if (!fs.existsSync(publicBackupFile)) throw new Error('No se encontró la copia anterior del seguimiento.');
      const previous = fs.readFileSync(publicBackupFile);
      if (sha256(previous) !== record.followup.previous_sha256) throw new Error('El hash del seguimiento anterior no coincide.');
      writeAtomic(publicFile, previous);
    }
    record.estado = 'revertida';
    record.rollback = { estado: 'completada', ejecutado_el: rolledBackAt };
    writeAtomic(integrationFile, Buffer.from(jsonText(record), 'utf8'));
    const session = loaded.session;
    session.estado = 'aplicacion_local_completada';
    session.actualizado_el = rolledBackAt;
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: null,
      estado: 'borrador_aplicado_pendiente_integracion_publica',
    };
    session.aplicacion_local = {
      ...(session.aplicacion_local || {}),
      rollback_estado: 'disponible',
    };
    session.integracion_local = {
      ...(session.integracion_local || {}),
      estado: 'revertida',
      rollback_estado: 'completada',
      revertida_el: rolledBackAt,
    };
    session.seguridad = {
      ...(session.seguridad || {}),
      archivos_preview_creados: 0,
      archivos_preview_modificados: 0,
      archivos_publicos_modificados: 0,
      git_ejecutado: false,
      build_ejecutado: false,
      deploy_ejecutado: false,
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
    return {
      status: 'ready',
      integration: record,
      session,
      restored: {
        analysis_action: record.analysis.previous_existed ? 'archivo_anterior_restaurado' : 'archivo_creado_eliminado',
        followup_action: record.followup.operation === 'modificar' ? 'archivo_anterior_restaurado' : 'sin_cambios',
      },
      safety: { git_executed: false, build_executed: false, deploy_executed: false },
    };
  } catch (error) {
    restoreFile(previewFile, previewCurrent);
    restoreFile(publicFile, publicCurrent);
    return { status: 'blocked', blocks: [issue('integration-rollback-failed', 'No se pudo restaurar la integración local', error.message)] };
  }
}

export function serializeIntegrationPlan(plan) {
  return plan?.status === 'ready' ? publicPlan(plan) : plan;
}
