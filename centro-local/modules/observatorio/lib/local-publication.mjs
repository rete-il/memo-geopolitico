import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { sessionFileFor } from './analysis-prompt.mjs';
import {
  assertValidPublicProjection,
  promotePublicProcess,
} from './public-projection.mjs';
import { hasUnresolvedBlockingWarning } from './warnings-contract.mjs';

const clean = (value) => String(value ?? '').trim();
const VALID_ID = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;
const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;

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
    return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para publicar')] };
  }
  try {
    return { status: 'ready', file, session: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
}

function splitFrontmatter(markdown) {
  const text = String(markdown);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  if (!match) throw new Error('El Markdown no contiene un frontmatter completo.');
  return { header: match[1], body: match[2] };
}

function scalarValue(raw) {
  const value = clean(raw);
  if (value === 'null' || value === '~') return null;
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

function topLevelScalar(header, key) {
  const match = String(header).match(new RegExp(`^${key}:\\s*(.*?)\\s*$`, 'm'));
  return match ? scalarValue(match[1]) : undefined;
}

function topLevelList(header, key) {
  const lines = String(header).split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*(?:\\[\\])?\\s*$`).test(line));
  if (start < 0) return [];
  if (/\[\]\s*$/.test(lines[start])) return [];
  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[^\s#][^:]*:/.test(line)) break;
    const match = line.match(/^\s+-\s+(.*?)\s*$/);
    if (match) values.push(clean(scalarValue(match[1])));
  }
  return values.filter(Boolean);
}

function publicationFields(header) {
  const lines = String(header).split(/\r?\n/);
  const start = lines.findIndex((line) => /^publicacion:\s*$/.test(line));
  if (start < 0) throw new Error('Falta el bloque publicacion.');
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[^\s#][^:]*:/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const fields = {};
  const positions = {};
  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(/^\s{2}(estado|publicado_el|actualizado_el):\s*(.*?)\s*$/);
    if (!match) continue;
    if (positions[match[1]] !== undefined) throw new Error(`El campo publicacion.${match[1]} está repetido.`);
    positions[match[1]] = index;
    fields[match[1]] = scalarValue(match[2]);
  }
  for (const required of ['estado', 'publicado_el', 'actualizado_el']) {
    if (positions[required] === undefined) throw new Error(`Falta publicacion.${required}.`);
  }
  return { fields, positions, lines };
}

function publicationCandidate(markdown, publishedOn) {
  const { header, body } = splitFrontmatter(markdown);
  const { fields, positions, lines } = publicationFields(header);
  if (!['borrador', 'en_revision', 'listo', 'publicado'].includes(clean(fields.estado))) {
    throw new Error(`Estado editorial no publicable: ${clean(fields.estado) || '(vacío)'}.`);
  }
  lines[positions.estado] = '  estado: "publicado"';
  lines[positions.publicado_el] = `  publicado_el: "${publishedOn}"`;
  lines[positions.actualizado_el] = `  actualizado_el: "${publishedOn}"`;
  return Buffer.from(`---\n${lines.join('\n')}\n---${body.replace(/^\r?\n/, '\n')}`, 'utf8');
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(item);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [item] : [];
  });
}

function publicationIdentity(markdown) {
  const { header } = splitFrontmatter(markdown);
  return {
    post_id: clean(topLevelScalar(header, 'post_id')),
    slug: clean(topLevelScalar(header, 'slug')),
    macroevento_id: clean(topLevelScalar(header, 'macroevento_principal_id')),
    source_ids: topLevelList(header, 'fuente_ids'),
    publication: publicationFields(header).fields,
  };
}

function duplicatePublication(siteRoot, sourceFile, targetFile, metadata) {
  const publicationRoot = path.join(siteRoot, 'src', 'content', 'publicaciones');
  for (const file of markdownFiles(publicationRoot)) {
    const resolved = path.resolve(file);
    if (resolved === path.resolve(sourceFile) || resolved === path.resolve(targetFile)) continue;
    let identity;
    try {
      identity = publicationIdentity(fs.readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    if (identity.post_id === metadata.post_id) {
      return issue('duplicate-publication-post-id', 'El post_id ya existe en otra publicación activa', relativeWindows(siteRoot, file));
    }
    if (identity.slug === metadata.slug) {
      return issue('duplicate-publication-slug', 'El slug ya existe en otra publicación activa', relativeWindows(siteRoot, file));
    }
  }
  return null;
}

function unresolvedMarkers(markdown) {
  const patterns = [
    ['VERIFICAR', /\[VERIFICAR(?::|\])/gi],
    ['COMPLETAR', /\[COMPLETAR(?::|\])/gi],
    ['PENDIENTE', /\[PENDIENTE(?::|\])/gi],
    ['TODO', /(?:^|\s)TODO\s*:/gim],
  ];
  return patterns.flatMap(([label, pattern]) => {
    const matches = String(markdown).match(pattern) || [];
    return matches.map(() => label);
  });
}

function validatePublicReferences(publicFile, metadata) {
  const data = JSON.parse(fs.readFileSync(publicFile, 'utf8'));
  if (data?.formato !== 'memo-geopolitico-publico' || data?.schema_version !== 2) {
    throw new Error('El JSON público no cumple memo-geopolitico-publico v2.');
  }
  const processMatches = (data.procesos || []).filter((process) => clean(process?.macroevento_id) === metadata.macroevento_id);
  if (processMatches.length !== 1) throw new Error('El macroevento principal no aparece una sola vez en la proyección pública.');
  const sourceIds = new Set((data.fuentes || []).map((source) => clean(source?.fuente_id)).filter(Boolean));
  const missing = metadata.source_ids.filter((sourceId) => !sourceIds.has(sourceId));
  if (missing.length) throw new Error(`Faltan fuentes públicas vinculadas: ${missing.join(', ')}.`);
  return { data, process: processMatches[0] };
}

function publicDataCandidate(data, eventId, processCandidate) {
  const candidate = JSON.parse(JSON.stringify(data));
  const matches = (candidate.procesos || [])
    .map((process, index) => ({ process, index }))
    .filter(({ process }) => clean(process?.macroevento_id) === eventId);
  if (matches.length !== 1) throw new Error('El macroevento principal no aparece una sola vez en la proyección pública.');
  candidate.procesos[matches[0].index] = processCandidate;
  return Buffer.from(jsonText(candidate), 'utf8');
}

function processFromPublicDataBuffer(buffer, eventId) {
  const data = JSON.parse(buffer.toString('utf8'));
  const matches = (data.procesos || []).filter((process) => clean(process?.macroevento_id) === eventId);
  if (matches.length !== 1) throw new Error('El macroevento principal no aparece una sola vez en la proyección pública.');
  return matches[0];
}

function operationFor(previous, candidate) {
  if (!previous) return 'crear';
  return sha256(previous) === sha256(candidate) ? 'sin_cambios' : 'modificar';
}

function publicationFingerprint({
  eventId,
  integrationId,
  sourceHash,
  previousHash,
  candidateHash,
  publicDataPreviousHash,
  publicDataCandidateHash,
  publishedOn,
}) {
  return sha256(jsonText({
    eventId,
    integrationId,
    sourceHash,
    previousHash: previousHash || null,
    candidateHash,
    publicDataPreviousHash,
    publicDataCandidateHash,
    publishedOn,
  }));
}

function restoreFile(file, previous) {
  if (previous) writeAtomic(file, previous);
  else if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function planLocalPublication({
  centerRoot,
  siteRoot,
  sessionsDir,
  publicationsDir,
  backupsDir,
  data,
  eventId,
  publishedOn,
} = {}) {
  const id = clean(eventId);
  const publicationDate = clean(publishedOn);
  if (!VALID_DATE.test(publicationDate) || Number.isNaN(Date.parse(`${publicationDate}T00:00:00Z`))) {
    return { status: 'blocked', blocks: [issue('invalid-publication-date', 'La fecha de publicación no es válida', 'Usá AAAA-MM-DD.')] };
  }
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  const { session } = loaded;
  if (!['integracion_local_completada', 'publicacion_local_completada'].includes(session.estado)
      || session.integracion_local?.estado !== 'aplicada') {
    return { status: 'blocked', blocks: [issue('local-integration-required', 'La integración local de Fase 8 no está completada')] };
  }
  if (session.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('session-identity-mismatch', 'La sesión pertenece a otro macroevento')] };
  }
  const event = data ? (data.macroeventos || []).find((item) => clean(item?.id) === id) : null;
  if (data && !event) {
    return { status: 'blocked', blocks: [issue('publication-event-missing', 'No se encontró el expediente interno del macroevento')] };
  }
  if (event && hasUnresolvedBlockingWarning(event, { sessionId: session.session_id })) {
    const blockingIds = (event.advertencias || [])
      .filter((warning) => (
        warning?.estado === 'pendiente'
        && warning?.tratamiento === 'bloqueante'
        && !(event.excepciones_advertencias || []).some((exception) => (
          clean(exception?.advertencia_id) === clean(warning?.advertencia_id)
          && clean(exception?.session_id) === clean(session.session_id)
        ))
      ))
      .map((warning) => warning.advertencia_id);
    return {
      status: 'blocked',
      blocks: [issue('unresolved-blocking-warnings', 'La publicación está bloqueada por advertencias pendientes', `Gestioná o resolvé estas advertencias en el expediente: ${blockingIds.join(', ')}.`)],
    };
  }
  const approved = session.respuesta_chatgpt?.validacion?.metadata || {};
  const slug = clean(approved.slug);
  const postId = clean(approved.post_id);
  if (!VALID_ID.test(slug) || !VALID_ID.test(postId) || clean(approved.macroevento_principal_id) !== id) {
    return { status: 'blocked', blocks: [issue('invalid-analysis-identity', 'La identidad aprobada del análisis no es publicable')] };
  }

  let sourceFile;
  let targetFile;
  let publicFile;
  try {
    sourceFile = safeChild(siteRoot, 'src', 'content', 'publicaciones', '_preview', `${slug}.md`);
    targetFile = safeChild(siteRoot, 'src', 'content', 'publicaciones', 'publicadas', `${slug}.md`);
    publicFile = safeChild(siteRoot, 'src', 'data', 'public', 'observatorio.json');
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-publication-path', 'Una ruta de publicación no es segura', error.message)] };
  }
  if (!fs.existsSync(path.join(siteRoot, 'package.json')) || !fs.existsSync(publicFile)) {
    return { status: 'blocked', blocks: [issue('invalid-site-root', 'No se encontró una copia local válida del sitio', path.resolve(siteRoot || ''))] };
  }
  if (!fs.existsSync(sourceFile)) {
    return { status: 'blocked', blocks: [issue('preview-missing', 'No se encontró el análisis integrado en preview')] };
  }

  const source = fs.readFileSync(sourceFile);
  const sourceHash = sha256(source);
  if (sourceHash !== clean(session.integracion_local.analysis_sha256)) {
    return { status: 'blocked', blocks: [issue('preview-changed-after-integration', 'El preview cambió después de la Fase 8', 'Actualizá primero el borrador canónico y repetí la integración para preservar la trazabilidad.')] };
  }
  let metadata;
  let candidate;
  let publicPrevious;
  let publicCandidate;
  let processPrevious;
  let processCandidate;
  let publicValidation;
  try {
    metadata = publicationIdentity(source.toString('utf8'));
    if (metadata.post_id !== postId || metadata.slug !== slug || metadata.macroevento_id !== id) {
      throw new Error('post_id, slug o macroevento_principal_id no coinciden con la respuesta aprobada.');
    }
    if (!metadata.source_ids.length) throw new Error('El análisis no contiene fuente_ids.');
    const publicReferences = validatePublicReferences(publicFile, metadata);
    processPrevious = publicReferences.process;
    processCandidate = promotePublicProcess(processPrevious, publicationDate);
    publicPrevious = fs.readFileSync(publicFile);
    publicCandidate = publicDataCandidate(publicReferences.data, id, processCandidate);
    publicValidation = assertValidPublicProjection(
      JSON.parse(publicCandidate.toString('utf8')),
      { eventId: id, allowDevelopment: true },
    );
    candidate = publicationCandidate(source.toString('utf8'), publicationDate);
    const candidateMetadata = publicationIdentity(candidate.toString('utf8'));
    if (candidateMetadata.publication.estado !== 'publicado'
        || candidateMetadata.publication.publicado_el !== publicationDate
        || candidateMetadata.publication.actualizado_el !== publicationDate) {
      throw new Error('La transformación del estado público no pudo verificarse.');
    }
    if (processCandidate.publicacion?.estado !== 'publicado'
        || processCandidate.publicacion?.publicado_el !== publicationDate
        || processCandidate.publicacion?.actualizado_el !== publicationDate
        || processCandidate.progreso_publico?.etapa !== 'publicado') {
      throw new Error('La promoción del expediente público no pudo verificarse.');
    }
  } catch (error) {
    const projectionInvalid = error.code === 'PUBLIC_PROJECTION_INVALID';
    return {
      status: 'blocked',
      blocks: [issue(
        projectionInvalid ? 'public-projection-invalid' : 'invalid-publication-content',
        projectionInvalid
          ? 'La proyección pública completa no supera la validación canónica'
          : 'El análisis no cumple el contrato de publicación',
        error.message,
      )],
    };
  }
  const markers = unresolvedMarkers(source.toString('utf8'));
  if (markers.length) {
    const counts = Object.entries(markers.reduce((result, marker) => {
      result[marker] = (result[marker] || 0) + 1;
      return result;
    }, {})).map(([marker, count]) => `${marker}: ${count}`).join('; ');
    return { status: 'blocked', blocks: [issue('unresolved-editorial-markers', 'El análisis conserva marcadores editoriales internos', `${counts}. Para conservar la trazabilidad, restaurá primero la integración de Fase 8 y la aplicación de Fase 7; corregí y volvé a aprobar la respuesta, y después repetí el paquete, la aplicación y la integración.`)] };
  }
  const duplicate = duplicatePublication(siteRoot, sourceFile, targetFile, metadata);
  if (duplicate) return { status: 'blocked', blocks: [duplicate] };

  const previous = fs.existsSync(targetFile) ? fs.readFileSync(targetFile) : null;
  if (previous) {
    try {
      const previousMetadata = publicationIdentity(previous.toString('utf8'));
      if (previousMetadata.post_id !== postId || previousMetadata.slug !== slug) {
        return { status: 'blocked', blocks: [issue('publication-target-identity-mismatch', 'El destino público pertenece a otra publicación')] };
      }
    } catch (error) {
      return { status: 'blocked', blocks: [issue('invalid-existing-publication', 'La publicación existente no puede actualizarse', error.message)] };
    }
  }
  const operation = operationFor(previous, candidate);
  const publicDataOperation = operationFor(publicPrevious, publicCandidate);
  const fingerprint = publicationFingerprint({
    eventId: id,
    integrationId: session.integracion_local.integration_id,
    sourceHash,
    previousHash: previous ? sha256(previous) : '',
    candidateHash: sha256(candidate),
    publicDataPreviousHash: sha256(publicPrevious),
    publicDataCandidateHash: sha256(publicCandidate),
    publishedOn: publicationDate,
  });
  const publicationId = `publicacion-${id}-${fingerprint.slice(0, 12)}`;
  let backupDirectory;
  let publicationRecord;
  try {
    backupDirectory = safeChild(backupsDir, 'publicaciones', publicationId);
    publicationRecord = safeChild(publicationsDir, `${publicationId}.json`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-publication-record', 'La ruta del registro de publicación no es segura', error.message)] };
  }
  return {
    status: 'ready',
    plan_id: fingerprint,
    publication_id: publicationId,
    macroevento_id: id,
    integration_id: session.integracion_local.integration_id,
    published_on: publicationDate,
    analysis: {
      post_id: postId,
      slug,
      source_file: sourceFile,
      source_relative: relativeWindows(siteRoot, sourceFile),
      source_sha256: sourceHash,
      target_file: targetFile,
      target_relative: relativeWindows(siteRoot, targetFile),
      operation,
      candidate_sha256: sha256(candidate),
      previous_sha256: previous ? sha256(previous) : null,
      previous_existed: Boolean(previous),
      public_url: `/publicaciones/${slug}/`,
    },
    public_expedient: {
      file: publicFile,
      relative: relativeWindows(siteRoot, publicFile),
      operation: publicDataOperation,
      previous_sha256: sha256(publicPrevious),
      candidate_sha256: sha256(publicCandidate),
      previous_process_sha256: sha256(Buffer.from(jsonText(processPrevious), 'utf8')),
      candidate_process_sha256: sha256(Buffer.from(jsonText(processCandidate), 'utf8')),
      state_before: clean(processPrevious.publicacion?.estado),
      state_after: 'publicado',
      progress_before: clean(processPrevious.progreso_publico?.etapa),
      progress_after: 'publicado',
      validation: publicValidation,
    },
    editorial_gate: {
      unresolved_markers: 0,
      unresolved_blocking_warnings: 0,
      linked_sources: metadata.source_ids.length,
      macroevent_verified: true,
      requires_human_confirmation: operation !== 'sin_cambios',
      public_data_valid: true,
    },
    backup: {
      directory: backupDirectory,
      directory_relative: relativeWindows(centerRoot, backupDirectory),
      previous_file_will_be_copied: Boolean(previous) && operation === 'modificar',
      previous_public_data_will_be_copied: publicDataOperation !== 'sin_cambios',
      rollback_available: operation !== 'sin_cambios' || publicDataOperation !== 'sin_cambios',
    },
    publication_record: {
      file: publicationRecord,
      relative: relativeWindows(centerRoot, publicationRecord),
    },
    writes: {
      production_markdown_created: operation === 'crear' ? 1 : 0,
      production_markdown_modified: operation === 'modificar' ? 1 : 0,
      production_markdown_unchanged: operation === 'sin_cambios' ? 1 : 0,
      public_data_modified: publicDataOperation === 'modificar' ? 1 : 0,
      public_data_unchanged: publicDataOperation === 'sin_cambios' ? 1 : 0,
      publication_records: operation === 'sin_cambios' && publicDataOperation === 'sin_cambios' ? 0 : 1,
      git_operations: 0,
    },
    checks: [
      'npm run test',
      'npm run validate:data',
      'npm run check',
      'npm run build',
      'npm run build:preview',
      'npm run validate:build',
      'git --no-pager diff --check',
    ],
    safety: {
      atomic_write: true,
      preview_hash_verified: true,
      identities_verified: true,
      references_verified: true,
      rollback_guarded_by_hash: true,
      production_markdown_created: operation === 'crear',
      public_expedient_promoted: publicDataOperation !== 'sin_cambios',
      internet_published: false,
      git_executed: false,
      build_executed: false,
      deploy_executed: false,
    },
    _source: source,
    _candidate: candidate,
    _previous: previous,
    _public_previous: publicPrevious,
    _public_candidate: publicCandidate,
    _process_previous: processPrevious,
    _process_candidate: processCandidate,
    _session_file: loaded.file,
  };
}

function publicPlan(plan) {
  const {
    _source,
    _candidate,
    _previous,
    _public_previous,
    _public_candidate,
    _process_previous,
    _process_candidate,
    _session_file,
    ...safe
  } = plan;
  return safe;
}

export function applyLocalPublication(options = {}) {
  const plan = planLocalPublication(options);
  if (plan.status !== 'ready') return plan;
  if (clean(options.expectedPlanId) !== plan.plan_id) {
    return { status: 'blocked', blocks: [issue('publication-plan-stale', 'El plan cambió antes de publicar localmente', 'Volvé a comprobar fecha, contenido, destino y backup.')] };
  }
  if (options.confirmed !== true || options.reviewConfirmed !== true) {
    return { status: 'blocked', blocks: [issue('publication-confirmation-required', 'Falta confirmar la revisión editorial, factual y visual')] };
  }
  if (plan.analysis.operation === 'sin_cambios' && plan.public_expedient.operation === 'sin_cambios') {
    return {
      status: 'ready',
      reused: true,
      plan: publicPlan(plan),
      publication: options.existingPublication || null,
      safety: plan.safety,
    };
  }

  const loaded = sessionFromFile(options.sessionsDir, plan.macroevento_id);
  if (loaded.status !== 'ready') return loaded;
  const appliedAt = options.appliedAt || new Date().toISOString();
  const backupFiles = path.join(plan.backup.directory, 'files');
  const previousBackupFile = path.join(backupFiles, 'publicacion-anterior.md');
  const previousPublicDataBackupFile = path.join(backupFiles, 'observatorio-anterior.json');
  const record = {
    schema_version: 1,
    tipo: 'publicacion-local-controlada',
    publication_id: plan.publication_id,
    plan_id: plan.plan_id,
    integration_id: plan.integration_id,
    macroevento_id: plan.macroevento_id,
    publicado_localmente_el: appliedAt,
    publicado_el: plan.published_on,
    estado: 'aplicada',
    analysis: {
      post_id: plan.analysis.post_id,
      slug: plan.analysis.slug,
      source_file: plan.analysis.source_file,
      source_relative: plan.analysis.source_relative,
      source_sha256: plan.analysis.source_sha256,
      target_file: plan.analysis.target_file,
      target_relative: plan.analysis.target_relative,
      operation: plan.analysis.operation,
      candidate_sha256: plan.analysis.candidate_sha256,
      previous_sha256: plan.analysis.previous_sha256,
      previous_existed: plan.analysis.previous_existed,
      previous_backup_file: plan.analysis.previous_existed && plan.analysis.operation !== 'sin_cambios' ? previousBackupFile : null,
      public_url: plan.analysis.public_url,
    },
    public_expedient: {
      file: plan.public_expedient.file,
      relative: plan.public_expedient.relative,
      operation: plan.public_expedient.operation,
      previous_sha256: plan.public_expedient.previous_sha256,
      candidate_sha256: plan.public_expedient.candidate_sha256,
      previous_process_sha256: plan.public_expedient.previous_process_sha256,
      candidate_process_sha256: plan.public_expedient.candidate_process_sha256,
      previous_backup_file: plan.public_expedient.operation !== 'sin_cambios' ? previousPublicDataBackupFile : null,
      state_before: plan.public_expedient.state_before,
      state_after: plan.public_expedient.state_after,
      progress_before: plan.public_expedient.progress_before,
      progress_after: plan.public_expedient.progress_after,
    },
    review: {
      editorial_factual_visual_confirmed: true,
      unresolved_markers: 0,
    },
    backup: {
      directory: plan.backup.directory,
      manifest: path.join(plan.backup.directory, 'MANIFIESTO.json'),
    },
    rollback: { estado: 'disponible', ejecutado_el: null },
    seguridad: {
      escritura_atomica: true,
      fuente_preview_verificada: true,
      proyeccion_publica_validada: true,
      publicacion_internet_realizada: false,
      git_ejecutado: false,
      build_ejecutado: false,
      deploy_ejecutado: false,
    },
  };

  let targetWritten = false;
  let publicDataWritten = false;
  try {
    fs.mkdirSync(backupFiles, { recursive: true });
    if (plan._previous && plan.analysis.operation !== 'sin_cambios') writeAtomic(previousBackupFile, plan._previous);
    if (plan.public_expedient.operation !== 'sin_cambios') writeAtomic(previousPublicDataBackupFile, plan._public_previous);
    writeAtomic(record.backup.manifest, Buffer.from(jsonText(record), 'utf8'));
    if (plan.analysis.operation !== 'sin_cambios') {
      writeAtomic(plan.analysis.target_file, plan._candidate);
      targetWritten = true;
      if (sha256(fs.readFileSync(plan.analysis.target_file)) !== plan.analysis.candidate_sha256) {
        throw new Error('La verificación posterior del Markdown público no coincide.');
      }
    }
    if (plan.public_expedient.operation !== 'sin_cambios') {
      writeAtomic(plan.public_expedient.file, plan._public_candidate);
      publicDataWritten = true;
      if (sha256(fs.readFileSync(plan.public_expedient.file)) !== plan.public_expedient.candidate_sha256) {
        throw new Error('La verificación posterior del expediente público no coincide.');
      }
    }
    assertValidPublicProjection(
      JSON.parse(fs.readFileSync(plan.public_expedient.file, 'utf8')),
      { eventId: plan.macroevento_id, allowDevelopment: true },
    );
    if (typeof options.afterTargetWrite === 'function') options.afterTargetWrite(plan);
    writeAtomic(plan.publication_record.file, Buffer.from(jsonText(record), 'utf8'));
    const session = loaded.session;
    session.estado = 'publicacion_local_completada';
    session.actualizado_el = appliedAt;
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: 'qa_publicacion_local',
      estado: 'publicacion_local_pendiente_qa_git',
    };
    session.integracion_local = {
      ...(session.integracion_local || {}),
      rollback_estado: 'bloqueada_por_publicacion',
    };
    session.publicacion_local = {
      publication_id: plan.publication_id,
      plan_id: plan.plan_id,
      integration_id: plan.integration_id,
      publicado_localmente_el: appliedAt,
      publicado_el: plan.published_on,
      estado: 'aplicada',
      target_relative: plan.analysis.target_relative,
      operation: plan.analysis.operation,
      candidate_sha256: plan.analysis.candidate_sha256,
      public_expedient_relative: plan.public_expedient.relative,
      public_expedient_operation: plan.public_expedient.operation,
      public_expedient_candidate_sha256: plan.public_expedient.candidate_sha256,
      backup_relative: plan.backup.directory_relative,
      publication_record_relative: plan.publication_record.relative,
      rollback_estado: 'disponible',
      public_url: plan.analysis.public_url,
      qa_estado: 'pendiente',
      qa_datos: 'valido',
      validacion_publica: plan.public_expedient.validation,
      git_estado: 'no_iniciado',
    };
    session.seguridad = {
      ...(session.seguridad || {}),
      archivos_markdown_publicos_creados: plan.writes.production_markdown_created,
      archivos_markdown_publicos_modificados: plan.writes.production_markdown_modified,
      archivos_publicacion_creados: 1,
      archivos_datos_publicos_modificados: plan.writes.public_data_modified,
      backups_publicacion_creados: 1,
      publicacion_internet_realizada: false,
      git_ejecutado: false,
      build_ejecutado: false,
      deploy_ejecutado: false,
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
    return {
      status: 'ready',
      reused: false,
      plan: publicPlan(plan),
      publication: record,
      session,
      safety: session.seguridad,
    };
  } catch (error) {
    if (targetWritten) restoreFile(plan.analysis.target_file, plan._previous);
    if (publicDataWritten) writeAtomic(plan.public_expedient.file, plan._public_previous);
    record.estado = 'fallida_revertida';
    record.error = { mensaje: error.message, revertida_el: new Date().toISOString() };
    record.rollback = { estado: 'automatica_completada', ejecutado_el: record.error.revertida_el };
    try {
      writeAtomic(record.backup.manifest, Buffer.from(jsonText(record), 'utf8'));
      writeAtomic(plan.publication_record.file, Buffer.from(jsonText(record), 'utf8'));
    } catch {
      // La restauración de los destinos tiene prioridad; se conserva el error original.
    }
    return { status: 'blocked', blocks: [issue('publication-write-failed', 'No se pudo completar la publicación local', error.message)] };
  }
}

export function rollbackLocalPublication({
  centerRoot,
  siteRoot,
  sessionsDir,
  publicationsDir,
  eventId,
  publicationId,
  confirmed,
  rolledBackAt = new Date().toISOString(),
} = {}) {
  const id = clean(eventId);
  const recordId = clean(publicationId);
  if (confirmed !== true) {
    return { status: 'blocked', blocks: [issue('publication-rollback-confirmation-required', 'Falta la confirmación explícita de restauración')] };
  }
  if (!VALID_ID.test(recordId)) {
    return { status: 'blocked', blocks: [issue('invalid-publication-id', 'El publication_id no es válido')] };
  }
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  let recordFile;
  try {
    recordFile = safeChild(publicationsDir, `${recordId}.json`);
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-publication-record', 'La ruta del registro no es segura', error.message)] };
  }
  if (!fs.existsSync(recordFile)) {
    return { status: 'blocked', blocks: [issue('missing-publication-record', 'No existe el registro de publicación solicitado')] };
  }
  let record;
  try {
    record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-publication-record', 'El registro de publicación no es válido', error.message)] };
  }
  if (record.publication_id !== recordId || record.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('publication-identity-mismatch', 'El registro pertenece a otra publicación')] };
  }
  if (record.estado !== 'aplicada' || record.rollback?.estado !== 'disponible') {
    return { status: 'blocked', blocks: [issue('publication-rollback-not-available', 'La restauración ya no está disponible')] };
  }

  let targetFile;
  let publicFile;
  let previousBackupFile;
  let previousPublicDataBackupFile;
  try {
    const slug = clean(record.analysis?.slug);
    if (!VALID_ID.test(slug)) throw new Error('El slug guardado no es válido.');
    targetFile = safeChild(siteRoot, 'src', 'content', 'publicaciones', 'publicadas', `${slug}.md`);
    if (path.resolve(clean(record.analysis?.target_file)) !== targetFile) {
      throw new Error('El destino guardado no coincide con la carpeta pública autorizada.');
    }
    publicFile = safeChild(siteRoot, 'src', 'data', 'public', 'observatorio.json');
    if (record.public_expedient
        && path.resolve(clean(record.public_expedient?.file)) !== publicFile) {
      throw new Error('El expediente público guardado no coincide con el destino autorizado.');
    }
    const backupRoot = safeChild(centerRoot, 'data', 'backups', 'publicaciones', recordId, 'files');
    previousBackupFile = path.join(backupRoot, 'publicacion-anterior.md');
    previousPublicDataBackupFile = path.join(backupRoot, 'observatorio-anterior.json');
    if (record.analysis.previous_existed
        && record.analysis.operation !== 'sin_cambios'
        && path.resolve(clean(record.analysis?.previous_backup_file)) !== previousBackupFile) {
      throw new Error('La copia anterior no coincide con el backup autorizado.');
    }
    if (record.public_expedient?.operation !== 'sin_cambios'
        && path.resolve(clean(record.public_expedient?.previous_backup_file)) !== previousPublicDataBackupFile) {
      throw new Error('La copia anterior del expediente público no coincide con el backup autorizado.');
    }
  } catch (error) {
    return { status: 'blocked', blocks: [issue('unsafe-publication-rollback-record', 'El registro contiene rutas no autorizadas', error.message)] };
  }
  if (record.analysis.operation !== 'sin_cambios'
      && (!fs.existsSync(targetFile)
        || sha256(fs.readFileSync(targetFile)) !== record.analysis.candidate_sha256)) {
    return { status: 'blocked', blocks: [issue('publication-changed-after-apply', 'La publicación local cambió después de crearla', 'No se restauró para evitar perder ediciones posteriores.')] };
  }
  if (record.public_expedient?.operation !== 'sin_cambios') {
    if (!fs.existsSync(publicFile)) {
      return { status: 'blocked', blocks: [issue('public-expedient-missing-after-apply', 'No se encontró la proyección pública después de la publicación')] };
    }
    let currentProcess;
    try {
      currentProcess = processFromPublicDataBuffer(fs.readFileSync(publicFile), id);
    } catch (error) {
      return { status: 'blocked', blocks: [issue('public-expedient-invalid-after-apply', 'No se pudo comprobar el expediente público actual', error.message)] };
    }
    const currentProcessHash = sha256(Buffer.from(jsonText(currentProcess), 'utf8'));
    if (currentProcessHash !== record.public_expedient.candidate_process_sha256) {
      return { status: 'blocked', blocks: [issue('public-expedient-changed-after-apply', 'El expediente público cambió después de publicarlo', 'No se restauró para evitar perder actualizaciones posteriores.')] };
    }
  }

  const targetCurrent = fs.existsSync(targetFile) ? fs.readFileSync(targetFile) : null;
  const publicCurrent = fs.existsSync(publicFile) ? fs.readFileSync(publicFile) : null;
  try {
    if (record.analysis.operation !== 'sin_cambios') {
      if (record.analysis.previous_existed) {
        if (!fs.existsSync(previousBackupFile)) throw new Error('No se encontró la copia pública anterior.');
        const previous = fs.readFileSync(previousBackupFile);
        if (sha256(previous) !== record.analysis.previous_sha256) throw new Error('El hash de la publicación anterior no coincide.');
        writeAtomic(targetFile, previous);
      } else {
        fs.unlinkSync(targetFile);
      }
    }
    if (record.public_expedient?.operation !== 'sin_cambios') {
      if (!fs.existsSync(previousPublicDataBackupFile)) throw new Error('No se encontró la copia anterior del expediente público.');
      const previousPublicData = fs.readFileSync(previousPublicDataBackupFile);
      if (sha256(previousPublicData) !== record.public_expedient.previous_sha256) {
        throw new Error('El hash de la proyección pública anterior no coincide.');
      }
      const previousProcess = processFromPublicDataBuffer(previousPublicData, id);
      if (sha256(Buffer.from(jsonText(previousProcess), 'utf8')) !== record.public_expedient.previous_process_sha256) {
        throw new Error('El hash del expediente público anterior no coincide.');
      }
      const currentPublicData = JSON.parse(fs.readFileSync(publicFile, 'utf8'));
      const matches = (currentPublicData.procesos || [])
        .map((process, index) => ({ process, index }))
        .filter(({ process }) => clean(process?.macroevento_id) === id);
      if (matches.length !== 1) throw new Error('El macroevento principal no aparece una sola vez en la proyección pública actual.');
      currentPublicData.procesos[matches[0].index] = previousProcess;
      writeAtomic(publicFile, Buffer.from(jsonText(currentPublicData), 'utf8'));
    }
    record.estado = 'revertida';
    record.rollback = { estado: 'completada', ejecutado_el: rolledBackAt };
    writeAtomic(recordFile, Buffer.from(jsonText(record), 'utf8'));
    const session = loaded.session;
    session.estado = 'integracion_local_completada';
    session.actualizado_el = rolledBackAt;
    session.trazabilidad = {
      ...(session.trazabilidad || {}),
      siguiente_paso: null,
      estado: 'integracion_local_pendiente_qa',
    };
    session.integracion_local = {
      ...(session.integracion_local || {}),
      rollback_estado: 'disponible',
    };
    session.publicacion_local = {
      ...(session.publicacion_local || {}),
      estado: 'revertida',
      rollback_estado: 'completada',
      revertida_el: rolledBackAt,
    };
    session.seguridad = {
      ...(session.seguridad || {}),
      archivos_markdown_publicos_creados: 0,
      archivos_markdown_publicos_modificados: 0,
      archivos_datos_publicos_modificados: 0,
      publicacion_internet_realizada: false,
      git_ejecutado: false,
      build_ejecutado: false,
      deploy_ejecutado: false,
    };
    writeAtomic(loaded.file, Buffer.from(jsonText(session), 'utf8'));
    return {
      status: 'ready',
      publication: record,
      session,
      restored: {
        action: record.analysis.operation === 'sin_cambios'
          ? 'markdown_sin_cambios'
          : (record.analysis.previous_existed ? 'archivo_anterior_restaurado' : 'archivo_publico_creado_eliminado'),
        public_expedient: record.public_expedient?.operation === 'sin_cambios'
          ? 'sin_cambios'
          : 'estado_publico_anterior_restaurado',
      },
      safety: { internet_published: false, git_executed: false, build_executed: false, deploy_executed: false },
    };
  } catch (error) {
    if (targetCurrent) restoreFile(targetFile, targetCurrent);
    else if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);
    if (publicCurrent) writeAtomic(publicFile, publicCurrent);
    return { status: 'blocked', blocks: [issue('publication-rollback-failed', 'No se pudo restaurar la publicación local', error.message)] };
  }
}

export function serializePublicationPlan(plan) {
  return plan?.status === 'ready' ? publicPlan(plan) : plan;
}
