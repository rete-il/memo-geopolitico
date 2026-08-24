import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { assertValidPublicProjection } from './public-projection.mjs';

const clean = (value) => String(value ?? '').trim();
const clone = (value) => (value === undefined ? undefined : structuredClone(value));

function issue(code, title, detail = '') {
  return { code, title, detail };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function jsonText(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, comparable(value[key])]),
    );
  }
  return value;
}

function equal(left, right) {
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
}

function unique(values) {
  return [...new Set((values || []).map(clean).filter(Boolean))];
}

function safeChild(root, ...segments) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, ...segments);
  if (!candidate.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('La ruta calculada sale de la carpeta autorizada.');
  }
  return candidate;
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

function isEmpty(value) {
  return value === ''
    || value === null
    || value === undefined
    || (Array.isArray(value) && value.length === 0);
}

function newestDate(left, right) {
  const dates = [clean(left), clean(right)].filter(Boolean).sort();
  return dates.at(-1) || '';
}

function mergeByIdentity(current = [], generated = [], identity) {
  const generatedById = new Map(
    generated.map((item) => [clean(item?.[identity]), clone(item)]).filter(([id]) => id),
  );
  const merged = [];
  const used = new Set();
  for (const item of current) {
    const id = clean(item?.[identity]);
    if (!id || used.has(id)) continue;
    merged.push(generatedById.has(id) ? generatedById.get(id) : clone(item));
    used.add(id);
  }
  for (const item of generated) {
    const id = clean(item?.[identity]);
    if (!id || used.has(id)) continue;
    merged.push(clone(item));
    used.add(id);
  }
  return merged;
}

function mergeCatalogs(current = {}, generated = {}) {
  const result = { ...clone(current), ...clone(generated) };
  for (const key of new Set([...Object.keys(current || {}), ...Object.keys(generated || {})])) {
    const before = current?.[key];
    const after = generated?.[key];
    if (!Array.isArray(before) && !Array.isArray(after)) continue;
    result[key] = mergeByIdentity(before || [], after || [], 'id');
  }
  return result;
}

function mergeProgress(current = {}, generated = {}) {
  const milestones = unique([
    ...(current.hitos_completados || []),
    ...(generated.hitos_completados || []),
  ]);
  return {
    ...clone(generated),
    ...clone(current),
    hitos_completados: milestones,
  };
}

export function mergePublicProcess(current, generated) {
  if (!current) return clone(generated);
  const result = clone(generated);
  result.publicacion = {
    ...(clone(generated.publicacion) || {}),
    estado: current.publicacion?.estado || generated.publicacion?.estado,
    publicado_el: current.publicacion?.publicado_el ?? generated.publicacion?.publicado_el ?? null,
    actualizado_el: newestDate(
      current.publicacion?.actualizado_el,
      generated.publicacion?.actualizado_el,
    ),
  };
  result.progreso_publico = mergeProgress(
    current.progreso_publico,
    generated.progreso_publico,
  );

  for (const field of [
    'por_que_importa',
    'claves_estructurales',
    'cronologia',
    'recurso_visual_ids',
  ]) {
    if (isEmpty(result[field]) && !isEmpty(current[field])) result[field] = clone(current[field]);
  }

  result.senales = mergeByIdentity(current.senales || [], generated.senales || [], 'senal_id');
  result.fuente_ids = unique([...(current.fuente_ids || []), ...(generated.fuente_ids || [])]);
  return result;
}

async function loadExporter(siteRoot) {
  const exporterPath = safeChild(siteRoot, 'tools', 'lib', 'public-export.mjs');
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

function planFingerprint(previous, candidate) {
  return sha256(JSON.stringify({
    previous: sha256(previous),
    candidate: sha256(candidate),
  }));
}

function serializeItem(item) {
  return {
    macroevento_id: item.macroevento_id,
    titulo: item.titulo,
    estado: item.publicacion?.estado || 'borrador',
  };
}

export function serializePublicSyncPlan(plan) {
  if (plan?.status !== 'ready') return plan;
  const { _previous, _candidate, ...safe } = plan;
  return safe;
}

export async function planPublicSync({
  centerRoot,
  siteRoot,
  backupsDir,
  data,
  taxonomy,
  buildPublicPackage,
  assertProjection = assertValidPublicProjection,
  generatedAt = new Date().toISOString().slice(0, 10),
} = {}) {
  let publicFile;
  let backupDirectory;
  try {
    publicFile = safeChild(siteRoot, 'src', 'data', 'public', 'observatorio.json');
    backupDirectory = safeChild(backupsDir, 'sincronizacion-observatorio');
    if (!fs.existsSync(path.join(siteRoot, 'package.json')) || !fs.existsSync(publicFile)) {
      throw new Error('No se encontró una copia local válida del sitio.');
    }
  } catch (error) {
    return {
      status: 'blocked',
      blocks: [issue('invalid-public-target', 'No se pudo resolver la proyección pública local', error.message)],
    };
  }

  let exporter = buildPublicPackage;
  try {
    exporter ||= await loadExporter(siteRoot);
  } catch (error) {
    return {
      status: 'blocked',
      blocks: [issue(error.code || 'public-exporter-error', 'No se pudo cargar la exportación canónica', error.message)],
    };
  }

  let previous;
  let current;
  let generated;
  try {
    previous = fs.readFileSync(publicFile);
    current = JSON.parse(previous.toString('utf8'));
    generated = exporter(clone(data), clone(taxonomy || {}), {
      includeUnpublished: true,
      includeInternal: false,
      generatedAt,
    });
  } catch (error) {
    return {
      status: 'blocked',
      blocks: [issue('public-sync-input-invalid', 'No se pudo preparar la proyección pública', error.message)],
    };
  }

  const currentIds = (current.procesos || []).map((item) => clean(item?.macroevento_id));
  const generatedIds = (generated.procesos || []).map((item) => clean(item?.macroevento_id));
  const duplicateCurrent = currentIds.find((id, index) => id && currentIds.indexOf(id) !== index);
  const duplicateGenerated = generatedIds.find((id, index) => id && generatedIds.indexOf(id) !== index);
  if (duplicateCurrent || duplicateGenerated) {
    const id = duplicateCurrent || duplicateGenerated;
    return {
      status: 'blocked',
      blocks: [issue('duplicate-public-process', 'La sincronización detectó un macroevento repetido', id)],
    };
  }

  const generatedById = new Map(
    (generated.procesos || []).map((item) => [clean(item?.macroevento_id), item]),
  );
  const removed = (current.procesos || []).filter(
    (item) => !generatedById.has(clean(item?.macroevento_id)),
  );
  if (removed.length) {
    return {
      status: 'blocked',
      blocks: [issue(
        'public-process-removal-blocked',
        'La sincronización no elimina procesos automáticamente',
        removed.map((item) => item.titulo || item.macroevento_id).join(' · '),
      )],
    };
  }

  const currentById = new Map(
    (current.procesos || []).map((item) => [clean(item?.macroevento_id), item]),
  );
  const mergedProcesses = [];
  const used = new Set();
  for (const previousProcess of current.procesos || []) {
    const id = clean(previousProcess?.macroevento_id);
    const fresh = generatedById.get(id);
    mergedProcesses.push(mergePublicProcess(previousProcess, fresh));
    used.add(id);
  }
  for (const fresh of generated.procesos || []) {
    const id = clean(fresh?.macroevento_id);
    if (used.has(id)) continue;
    mergedProcesses.push(clone(fresh));
    used.add(id);
  }

  const candidateData = {
    ...clone(generated),
    procesos: mergedProcesses,
    fuentes: mergeByIdentity(current.fuentes || [], generated.fuentes || [], 'fuente_id'),
    recursos_visuales: mergeByIdentity(
      current.recursos_visuales || [],
      generated.recursos_visuales || [],
      'recurso_visual_id',
    ),
    catalogos: mergeCatalogs(current.catalogos || {}, generated.catalogos || {}),
  };

  const beforeWithoutDate = { ...clone(current), generado_el: '' };
  const afterWithoutDate = { ...clone(candidateData), generado_el: '' };
  const hasChanges = !equal(beforeWithoutDate, afterWithoutDate);
  candidateData.generado_el = hasChanges ? generatedAt : current.generado_el;

  let validation;
  try {
    validation = assertProjection(candidateData, { allowDevelopment: true });
  } catch (error) {
    return {
      status: 'blocked',
      blocks: [issue(
        error.code === 'PUBLIC_PROJECTION_INVALID' ? 'public-projection-invalid' : 'public-sync-validation-failed',
        'La proyección sincronizada no supera la validación canónica',
        error.message,
      )],
      validation: error.validation,
    };
  }

  const candidate = Buffer.from(jsonText(candidateData), 'utf8');
  const created = mergedProcesses.filter((item) => !currentById.has(item.macroevento_id));
  const updated = mergedProcesses.filter((item) => {
    const before = currentById.get(item.macroevento_id);
    return before && !equal(before, item);
  });
  const unchanged = mergedProcesses.length - created.length - updated.length;
  const planId = planFingerprint(previous, candidate);

  return {
    status: 'ready',
    plan_id: planId,
    operation: hasChanges ? 'sincronizar' : 'sin_cambios',
    generated_at: generatedAt,
    counts: {
      before: current.procesos.length,
      after: mergedProcesses.length,
      created: created.length,
      updated: updated.length,
      unchanged,
      sources_before: (current.fuentes || []).length,
      sources_after: candidateData.fuentes.length,
    },
    created: created.map(serializeItem),
    updated: updated.map(serializeItem),
    target: {
      file: publicFile,
      relative: path.relative(siteRoot, publicFile).replaceAll('/', '\\'),
      previous_sha256: sha256(previous),
      candidate_sha256: sha256(candidate),
    },
    backup: {
      directory: backupDirectory,
      relative: path.relative(centerRoot, backupDirectory).replaceAll('/', '\\'),
    },
    validation,
    safety: {
      atomic_write: true,
      rollback_on_failure: true,
      publication_states_preserved: true,
      automatic_removals: false,
      git_executed: false,
      deploy_executed: false,
    },
    _previous: previous,
    _candidate: candidate,
  };
}

export async function applyPublicSync(options = {}) {
  const plan = await planPublicSync(options);
  if (plan.status !== 'ready') return plan;
  if (clean(options.expectedPlanId) !== plan.plan_id) {
    return {
      status: 'blocked',
      blocks: [issue('public-sync-plan-stale', 'El plan cambió antes de sincronizar', 'Volvé a pulsar Sincronizar sitio.')],
    };
  }
  if (options.confirmed !== true) {
    return {
      status: 'blocked',
      blocks: [issue('public-sync-confirmation-required', 'Falta confirmar la sincronización local')],
    };
  }
  if (plan.operation === 'sin_cambios') {
    return { status: 'ready', reused: true, plan: serializePublicSyncPlan(plan), backup: null };
  }

  const appliedAt = options.appliedAt || new Date().toISOString();
  const stamp = appliedAt.replace(/[:.]/g, '-');
  const backupFile = path.join(plan.backup.directory, `observatorio-antes-${stamp}.json`);
  const manifestFile = path.join(plan.backup.directory, `sincronizacion-${stamp}.json`);
  const record = {
    schema_version: 1,
    tipo: 'sincronizacion-proyeccion-publica',
    plan_id: plan.plan_id,
    aplicado_el: appliedAt,
    estado: 'aplicada',
    counts: plan.counts,
    created: plan.created,
    updated: plan.updated,
    target: {
      relative: plan.target.relative,
      previous_sha256: plan.target.previous_sha256,
      candidate_sha256: plan.target.candidate_sha256,
      previous_backup_file: backupFile,
    },
    validation: plan.validation,
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
      throw new Error('La verificación posterior no coincide con la proyección aprobada.');
    }
    const writtenData = JSON.parse(written.toString('utf8'));
    (options.assertProjection || assertValidPublicProjection)(writtenData, { allowDevelopment: true });
  } catch (error) {
    if (targetWritten) writeAtomic(plan.target.file, plan._previous);
    return {
      status: 'blocked',
      blocks: [issue('public-sync-write-failed', 'No se pudo completar la sincronización', error.message)],
      rollback: { restored: targetWritten },
    };
  }

  return {
    status: 'ready',
    reused: false,
    applied_at: appliedAt,
    plan: serializePublicSyncPlan(plan),
    backup: {
      file: backupFile,
      relative: path.relative(options.centerRoot, backupFile).replaceAll('/', '\\'),
      manifest_file: manifestFile,
    },
  };
}
