import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { validateAnalysisResponse } from './analysis-response.mjs';
import { sessionFileFor } from './analysis-prompt.mjs';
import { resolvePreparedReviewPackage } from './review-package.mjs';
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
  const boundary = `${path.resolve(root)}${path.sep}`;
  const candidate = path.resolve(root, ...segments);
  if (!candidate.startsWith(boundary)) throw new Error('La ruta calculada sale de la carpeta autorizada.');
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
    return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para aplicar')] };
  }
  try {
    return { status: 'ready', file, session: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
}

function zipEntries(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const contentEnd = contentStart + size;
    if (method !== 0 || (flags & 0x0008) || contentEnd > buffer.length) {
      throw new Error('El ZIP no usa el formato almacenado esperado.');
    }
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString('utf8');
    if (!name || name.includes('\\') || name.startsWith('/') || name.split('/').includes('..')) {
      throw new Error('El ZIP contiene una ruta no autorizada.');
    }
    if (entries.has(name)) throw new Error(`El ZIP repite el artefacto ${name}.`);
    entries.set(name, buffer.subarray(contentStart, contentEnd));
    offset = contentEnd;
  }
  if (!entries.size) throw new Error('El ZIP no contiene artefactos legibles.');
  return entries;
}

function parseJson(buffer, label) {
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} no contiene JSON válido: ${error.message}`);
  }
}

function verifiedPackageContent(resolved, session) {
  const packageData = session.paquete_revision;
  const rootFolder = clean(packageData?.root_folder);
  if (!VALID_ID.test(rootFolder)) throw new Error('La carpeta raíz declarada por el paquete no es válida.');
  const entries = zipEntries(resolved.content);
  const expectedNames = (packageData.artifacts || []).map((artifact) => `${rootFolder}/${artifact.path}`);
  if (entries.size !== expectedNames.length || expectedNames.some((name) => !entries.has(name))) {
    throw new Error('El contenido del ZIP no coincide con los artefactos registrados en la sesión.');
  }
  for (const artifact of packageData.artifacts || []) {
    const content = entries.get(`${rootFolder}/${artifact.path}`);
    if (sha256(content) !== artifact.sha256) throw new Error(`El hash de ${artifact.path} no coincide.`);
  }
  const manifest = parseJson(entries.get(`${rootFolder}/MANIFIESTO.json`), 'MANIFIESTO.json');
  if (manifest.package_id !== packageData.package_id || manifest.macroevento_id !== session.macroevento_id) {
    throw new Error('El manifiesto del ZIP pertenece a otra sesión o macroevento.');
  }
  const checksumText = entries.get(`${rootFolder}/SHA256SUMS.txt`).toString('utf8');
  const checksumLines = checksumText.split(/\r?\n/).filter(Boolean);
  for (const line of checksumLines) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) throw new Error('SHA256SUMS.txt contiene una línea inválida.');
    const content = entries.get(`${rootFolder}/${match[2]}`);
    if (!content || sha256(content) !== match[1]) throw new Error(`SHA256SUMS.txt no valida ${match[2]}.`);
  }
  const slug = clean(manifest.identidades?.analisis?.slug);
  const analysisPath = `analisis/${slug}.md`;
  const markdown = entries.get(`${rootFolder}/${analysisPath}`);
  if (!VALID_ID.test(slug) || !markdown) throw new Error('El análisis declarado no está disponible dentro del ZIP.');
  return { manifest, markdown: markdown.toString('utf8'), analysisPath };
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(item);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [item] : [];
  });
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

function duplicateDraft(draftsDir, targetFile, metadata) {
  for (const file of markdownFiles(draftsDir)) {
    if (path.resolve(file) === path.resolve(targetFile)) continue;
    const markdown = fs.readFileSync(file, 'utf8');
    if (frontmatterScalar(markdown, 'post_id') === metadata.post_id) {
      return issue('duplicate-draft-post-id', 'El post_id ya existe en otro borrador canónico', file);
    }
    if (frontmatterScalar(markdown, 'slug') === metadata.slug) {
      return issue('duplicate-draft-slug', 'El slug ya existe en otro borrador canónico', file);
    }
  }
  return null;
}

function relativeToCenter(centerRoot, file) {
  return path.relative(centerRoot, file).replaceAll('/', '\\');
}

function applicationFingerprint({ eventId, packageHash, candidateHash, previousHash, proposal }) {
  return sha256(jsonText(stable({
    eventId,
    packageHash,
    candidateHash,
    previousHash: previousHash || null,
    proposal: proposalComparable(proposal),
  })));
}

export function planLocalApplication({
  centerRoot,
  sessionsDir,
  packagesDir,
  draftsDir,
  applicationsDir,
  backupsDir,
  data,
  projectRoot,
  eventId,
  currentFollowupProposal,
} = {}) {
  const id = clean(eventId);
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  const { session } = loaded;
  if (session.respuesta_chatgpt?.validacion?.estado !== 'ready'
      || !session.respuesta_chatgpt?.aprobada_el) {
    return { status: 'blocked', blocks: [issue('response-not-approved', 'La respuesta todavía no está aprobada')] };
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
        'Cambió la revisión del proceso desde que se preparó el paquete',
        'El análisis aprobado continúa válido. Regenerá solo el paquete; no hace falta volver a aprobar el Markdown.',
      )],
    };
  }

  const resolved = resolvePreparedReviewPackage({ sessionsDir, packagesDir, eventId: id });
  if (resolved.status !== 'ready') return resolved;

  let packageContent;
  try {
    packageContent = verifiedPackageContent(resolved, session);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-package-content', 'El contenido del paquete no es aplicable', error.message)] };
  }
  const validation = validateAnalysisResponse({
    markdown: packageContent.markdown,
    data,
    eventId: id,
    session,
    projectRoot,
  });
  if (validation.status !== 'ready' || validation.hash_sha256 !== session.respuesta_chatgpt.hash_sha256) {
    return {
      status: 'blocked',
      blocks: validation.blocks.length
        ? validation.blocks
        : [issue('approved-response-changed', 'El análisis del paquete ya no coincide con la respuesta aprobada')],
    };
  }
  const metadata = validation.metadata || {};
  if (!VALID_ID.test(metadata.slug) || metadata.macroevento_principal_id !== id) {
    return { status: 'blocked', blocks: [issue('invalid-analysis-identity', 'La identidad del análisis no puede aplicarse')] };
  }

  let targetFile;
  try {
    targetFile = safeChild(draftsDir, `${metadata.slug}.md`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-draft-path', 'La ruta del borrador no es segura', error.message)] };
  }
  const duplicate = duplicateDraft(draftsDir, targetFile, metadata);
  if (duplicate) return { status: 'blocked', blocks: [duplicate] };

  const candidate = Buffer.from(finalNewline(packageContent.markdown), 'utf8');
  const candidateHash = sha256(candidate);
  const previous = fs.existsSync(targetFile) ? fs.readFileSync(targetFile) : null;
  const previousHash = previous ? sha256(previous) : '';
  const operation = previous
    ? previousHash === candidateHash ? 'sin_cambios' : 'modificar'
    : 'crear';
  const planId = applicationFingerprint({
    eventId: id,
    packageHash: resolved.metadata.archive_sha256,
    candidateHash,
    previousHash,
    proposal: currentFollowupProposal,
  });
  const applicationId = `aplicacion-${id}-${planId.slice(0, 12)}`;
  const backupDirectory = safeChild(backupsDir, 'aplicaciones', applicationId);
  const applicationFile = safeChild(applicationsDir, `${applicationId}.json`);
  const followupChanges = currentFollowupProposal.diff?.length || 0;
  return {
    status: 'ready',
    plan_id: planId,
    application_id: applicationId,
    macroevento_id: id,
    package_id: resolved.metadata.package_id,
    package_sha256: resolved.metadata.archive_sha256,
    analysis: {
      post_id: metadata.post_id,
      slug: metadata.slug,
      title: metadata.titulo,
      source_artifact: packageContent.analysisPath,
      target_file: targetFile,
      target_relative: relativeToCenter(centerRoot, targetFile),
      operation,
      candidate_sha256: candidateHash,
      previous_sha256: previousHash || null,
      bytes: candidate.length,
    },
    followup: {
      macroevento_id: id,
      differences: followupChanges,
      operation: followupChanges ? 'pendiente_integracion_fase_8' : 'sin_cambios',
      canonical_observatory_modified: false,
      note: followupChanges
        ? 'La proyección pública conserva diferencias; se integrará y comprobará en localhost durante la Fase 8.'
        : 'La proyección pública local ya coincide con el seguimiento preparado.',
    },
    backup: {
      directory: backupDirectory,
      directory_relative: relativeToCenter(centerRoot, backupDirectory),
      previous_file_will_be_copied: operation === 'modificar',
      rollback_available: operation !== 'sin_cambios',
    },
    application_record: {
      file: applicationFile,
      relative: relativeToCenter(centerRoot, applicationFile),
    },
    warnings: validation.warnings,
    writes: {
      canonical_created: operation === 'crear' ? 1 : 0,
      canonical_modified: operation === 'modificar' ? 1 : 0,
      canonical_unchanged: operation === 'sin_cambios' ? 1 : 0,
      session_files: operation === 'sin_cambios' ? 0 : 1,
      application_records: operation === 'sin_cambios' ? 0 : 1,
      git_operations: 0,
    },
    safety: {
      atomic_write: true,
      package_verified: true,
      response_revalidated: true,
      identity_preserved: true,
      public_files_modified: false,
      git_executed: false,
    },
    _candidate: candidate,
    _previous: previous,
    _session_file: loaded.file,
  };
}

function publicPlan(plan) {
  const { _candidate, _previous, _session_file, ...safe } = plan;
  return safe;
}

export function applyLocalApplication(options = {}) {
  const plan = planLocalApplication(options);
  if (plan.status !== 'ready') return plan;
  if (clean(options.expectedPlanId) !== plan.plan_id) {
    return { status: 'blocked', blocks: [issue('application-plan-stale', 'El plan cambió antes de aplicar', 'Volvé a comprobar los destinos y el backup.')] };
  }
  if (options.confirmed !== true) {
    return { status: 'blocked', blocks: [issue('confirmation-required', 'Falta la confirmación explícita de aplicación local')] };
  }
  if (plan.analysis.operation === 'sin_cambios') {
    return {
      status: 'ready',
      reused: true,
      plan: publicPlan(plan),
      application: options.existingApplication || null,
      safety: plan.safety,
    };
  }

  const loaded = sessionFromFile(options.sessionsDir, plan.macroevento_id);
  if (loaded.status !== 'ready') return loaded;
  const session = loaded.session;
  const targetFile = plan.analysis.target_file;
  const backupDirectory = plan.backup.directory;
  const backupFilesDirectory = path.join(backupDirectory, 'files');
  const previousBackupFile = path.join(backupFilesDirectory, path.basename(targetFile));
  const appliedAt = options.appliedAt || new Date().toISOString();
  const record = {
    schema_version: 1,
    tipo: 'aplicacion-local-controlada',
    application_id: plan.application_id,
    plan_id: plan.plan_id,
    package_id: plan.package_id,
    macroevento_id: plan.macroevento_id,
    aplicado_el: appliedAt,
    estado: 'aplicada',
    analysis: {
      post_id: plan.analysis.post_id,
      slug: plan.analysis.slug,
      target_file: targetFile,
      target_relative: plan.analysis.target_relative,
      operation: plan.analysis.operation,
      candidate_sha256: plan.analysis.candidate_sha256,
      previous_sha256: plan.analysis.previous_sha256,
      previous_existed: Boolean(plan._previous),
      previous_backup_file: plan._previous ? previousBackupFile : null,
    },
    followup: plan.followup,
    backup: {
      directory: backupDirectory,
      manifest: path.join(backupDirectory, 'MANIFIESTO.json'),
    },
    rollback: { estado: 'disponible', ejecutado_el: null },
    seguridad: {
      escritura_atomica: true,
      paquete_verificado: true,
      git_ejecutado: false,
      archivos_publicos_modificados: false,
    },
  };

  let targetWritten = false;
  try {
    fs.mkdirSync(backupFilesDirectory, { recursive: true });
    if (plan._previous) writeAtomic(previousBackupFile, plan._previous);
    writeAtomic(path.join(backupDirectory, 'MANIFIESTO.json'), Buffer.from(jsonText(record), 'utf8'));
    writeAtomic(targetFile, plan._candidate);
    targetWritten = true;
    if (sha256(fs.readFileSync(targetFile)) !== plan.analysis.candidate_sha256) {
      throw new Error('La verificación posterior del borrador no coincide con el contenido aprobado.');
    }
    writeAtomic(plan.application_record.file, Buffer.from(jsonText(record), 'utf8'));
    session.estado = 'aplicacion_local_completada';
    session.actualizado_el = appliedAt;
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: null,
      estado: plan.followup.differences
        ? 'borrador_aplicado_pendiente_integracion_publica'
        : 'borrador_aplicado_pendiente_qa_local',
    };
    session.aplicacion_local = {
      application_id: plan.application_id,
      plan_id: plan.plan_id,
      aplicado_el: appliedAt,
      estado: 'aplicada',
      target_relative: plan.analysis.target_relative,
      operation: plan.analysis.operation,
      candidate_sha256: plan.analysis.candidate_sha256,
      backup_relative: plan.backup.directory_relative,
      application_record_relative: plan.application_record.relative,
      rollback_estado: 'disponible',
      followup_changes: plan.followup.differences,
    };
    session.seguridad = {
      ...(session.seguridad || {}),
      archivos_canonicos_creados: plan.writes.canonical_created,
      archivos_canonicos_modificados: plan.writes.canonical_modified,
      archivos_publicos_modificados: 0,
      archivos_sesion_escritos: 1,
      archivos_aplicacion_creados: 1,
      backups_creados: 1,
      git_ejecutado: false,
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
  } catch (error) {
    if (targetWritten) {
      if (plan._previous) writeAtomic(targetFile, plan._previous);
      else if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);
    }
    return { status: 'blocked', blocks: [issue('application-write-failed', 'No se pudo completar la aplicación local', error.message)] };
  }

  return {
    status: 'ready',
    reused: false,
    plan: publicPlan(plan),
    application: record,
    session,
    safety: session.seguridad,
  };
}

export function rollbackLocalApplication({
  centerRoot,
  sessionsDir,
  applicationsDir,
  eventId,
  applicationId,
  confirmed,
  rolledBackAt = new Date().toISOString(),
} = {}) {
  const id = clean(eventId);
  const appId = clean(applicationId);
  if (confirmed !== true) {
    return { status: 'blocked', blocks: [issue('rollback-confirmation-required', 'Falta la confirmación explícita de restauración')] };
  }
  if (!VALID_ID.test(appId)) {
    return { status: 'blocked', blocks: [issue('invalid-application-id', 'El application_id no es válido')] };
  }
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  if (loaded.session.integracion_local?.estado === 'aplicada'
      && loaded.session.integracion_local?.rollback_estado === 'disponible') {
    return {
      status: 'blocked',
      blocks: [issue(
        'integration-active',
        'La integración de Fase 8 debe revertirse primero',
        'Restaurá la integración local antes de deshacer el borrador canónico de Fase 7.',
      )],
    };
  }
  let applicationFile;
  try {
    applicationFile = safeChild(applicationsDir, `${appId}.json`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-application-path', 'La ruta del registro no es segura', error.message)] };
  }
  if (!fs.existsSync(applicationFile)) {
    return { status: 'blocked', blocks: [issue('missing-application-record', 'No existe el registro de aplicación solicitado')] };
  }
  let record;
  try {
    record = JSON.parse(fs.readFileSync(applicationFile, 'utf8'));
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-application-record', 'El registro de aplicación no es válido', error.message)] };
  }
  if (record.application_id !== appId || record.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('application-identity-mismatch', 'El registro pertenece a otra aplicación')] };
  }
  if (record.estado !== 'aplicada' || record.rollback?.estado !== 'disponible') {
    return { status: 'blocked', blocks: [issue('rollback-not-available', 'La restauración ya no está disponible')] };
  }
  let targetFile;
  let previousBackupFile;
  try {
    const slug = clean(record.analysis?.slug);
    if (!VALID_ID.test(slug)) throw new Error('El slug guardado no es válido.');
    const draftsRoot = path.join(path.resolve(centerRoot), 'data', 'publicaciones', 'borradores');
    targetFile = safeChild(draftsRoot, `${slug}.md`);
    if (path.resolve(clean(record.analysis?.target_file)) !== targetFile) {
      throw new Error('El destino guardado no coincide con la carpeta canónica.');
    }
    const backupsRoot = path.join(path.resolve(centerRoot), 'data', 'backups');
    previousBackupFile = safeChild(backupsRoot, 'aplicaciones', appId, 'files', path.basename(targetFile));
    if (record.analysis.previous_existed
        && path.resolve(clean(record.analysis?.previous_backup_file)) !== previousBackupFile) {
      throw new Error('La copia anterior guardada no coincide con la carpeta de backups.');
    }
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-rollback-record', 'El registro contiene rutas no autorizadas', error.message)] };
  }
  if (!targetFile || !fs.existsSync(targetFile)) {
    return { status: 'blocked', blocks: [issue('applied-draft-missing', 'El borrador aplicado ya no está disponible')] };
  }
  const currentHash = sha256(fs.readFileSync(targetFile));
  if (currentHash !== record.analysis.candidate_sha256) {
    return { status: 'blocked', blocks: [issue('draft-changed-after-application', 'El borrador cambió después de la aplicación', 'No se restauró para evitar perder ediciones posteriores.')] };
  }

  try {
    if (record.analysis.previous_existed) {
      if (!fs.existsSync(previousBackupFile)) throw new Error('No se encontró la copia anterior del borrador.');
      const previous = fs.readFileSync(previousBackupFile);
      if (sha256(previous) !== record.analysis.previous_sha256) throw new Error('El hash de la copia anterior no coincide.');
      writeAtomic(targetFile, previous);
    } else {
      fs.unlinkSync(targetFile);
    }
    record.estado = 'revertida';
    record.rollback = { estado: 'completada', ejecutado_el: rolledBackAt };
    writeAtomic(applicationFile, Buffer.from(jsonText(record), 'utf8'));
    const session = loaded.session;
    session.estado = 'respuesta_aprobada';
    session.actualizado_el = rolledBackAt;
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: null,
      estado: 'archivos_preparados_pendientes_aplicacion',
    };
    session.aplicacion_local = {
      ...(session.aplicacion_local || {}),
      estado: 'revertida',
      rollback_estado: 'completada',
      revertida_el: rolledBackAt,
    };
    session.seguridad = {
      ...(session.seguridad || {}),
      archivos_canonicos_creados: 0,
      archivos_canonicos_modificados: 0,
      archivos_publicos_modificados: 0,
      git_ejecutado: false,
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
    return {
      status: 'ready',
      application: record,
      session,
      restored: {
        target_relative: relativeToCenter(centerRoot, targetFile),
        action: record.analysis.previous_existed ? 'archivo_anterior_restaurado' : 'archivo_creado_eliminado',
      },
      safety: { git_executed: false, public_files_modified: false },
    };
  } catch (error) {
    return { status: 'blocked', blocks: [issue('rollback-failed', 'No se pudo restaurar el estado anterior', error.message)] };
  }
}

export function serializeApplicationPlan(plan) {
  return plan?.status === 'ready' ? publicPlan(plan) : plan;
}
