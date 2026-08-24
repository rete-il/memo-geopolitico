import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { validateAnalysisResponse } from './analysis-response.mjs';
import { sessionFileFor } from './analysis-prompt.mjs';
import {
  analysisRevision,
  equalRevision,
  processRevision,
  proposalComparable,
} from './revisions.mjs';

const clean = (value) => String(value ?? '').trim();
const VALID_ID = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;
const TRACE_TITLES = [
  'Propuesta de macroevento',
  'Registro del macroevento',
  'Clasificación analítica',
  'Señales estructuradas',
  'Fuentes y catálogo de medios',
  'Diversidad y cobertura',
  'Puerta de verificación',
  'Candidatura editorial',
  'Expediente editorial',
  'Prompt controlado',
  'Borrador Markdown',
  'Revisión editorial y factual',
  'Paquete para VS Code',
];

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

function fileRecord(filePath, content, role) {
  const body = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
  return {
    path: filePath.replaceAll('\\', '/'),
    role,
    bytes: body.length,
    sha256: sha256(body),
    content: body,
  };
}

function warningsMarkdown(warnings = []) {
  if (!warnings.length) return '- No se conservaron advertencias de validación.\n';
  return warnings.map((warning) => {
    const detail = clean(warning.detail) ? ` — ${clean(warning.detail)}` : '';
    return `- **${clean(warning.title) || clean(warning.code)}**${detail}`;
  }).join('\n') + '\n';
}

function traceReport({ session, generatedAt, packageId }) {
  const completed = new Set([...(session.trazabilidad?.pasos_completados || []), 13]);
  const warnings = session.respuesta_chatgpt?.validacion?.advertencias || [];
  const proposal = session.propuesta_seguimiento || {};
  const pendingSources = proposal.metrics?.pending_sources_excluded || 0;
  const pendingSignals = proposal.metrics?.signals_without_verified_source_excluded || 0;
  const trace = TRACE_TITLES.map((title, index) => {
    const number = index + 1;
    let status = completed.has(number) ? 'completado' : 'atención conservada';
    let note = completed.has(number)
      ? 'Control completado y registrado en la sesión local.'
      : 'El paso conserva pendientes editoriales; no fue ocultado ni marcado como completado.';
    if (number === 4) note = `${proposal.metrics?.signals || 0} señales verificadas incorporables; ${pendingSignals} reservadas.`;
    if (number === 5) note = `${proposal.metrics?.sources || 0} fuentes verificadas incorporables; ${pendingSources} reservadas.`;
    if (number === 6) note = warnings.length ? `${warnings.length} advertencia(s) de validación o cobertura conservada(s).` : 'No hay advertencias de cobertura conservadas.';
    if (number === 7) note = session.decision_advertencias?.justificacion
      ? `Continuidad autorizada con justificación: ${session.decision_advertencias.justificacion}`
      : 'No fue necesaria una excepción editorial.';
    if (number === 13) {
      status = 'completado';
      note = `Paquete ${packageId} preparado sin aplicar archivos canónicos.`;
    }
    return { number, title, status, note };
  });

  const rows = trace.map((step) => `| ${step.number} | ${step.title} | ${step.status} | ${step.note.replaceAll('|', '\\|')} |`).join('\n');
  return `# Informe de trazabilidad editorial

- Paquete: \`${packageId}\`
- Sesión: \`${session.session_id}\`
- Macroevento: \`${session.macroevento_id}\`
- Generado: ${generatedAt}
- Estado técnico: **archivos preparados; no publicados**

## Trece pasos internos

| Paso | Control | Estado | Registro |
|---:|---|---|---|
${rows}

## Advertencias conservadas

${warningsMarkdown(warnings)}
## Seguridad

- Archivos canónicos creados: 0.
- Archivos canónicos modificados: 0.
- Operaciones Git ejecutadas: ninguna.
- La aprobación humana de la respuesta no equivale a publicación.
`;
}

function instructionsMarkdown({ session, packageId, analysisPath }) {
  const proposal = session.propuesta_seguimiento || {};
  const changes = proposal.diff?.length || 0;
  const warnings = session.respuesta_chatgpt?.validacion?.advertencias || [];
  const processInstruction = changes
    ? `La propuesta contiene ${changes} diferencia(s). Revisalas antes de cualquier traducción al dato canónico.`
    : 'La propuesta no contiene diferencias respecto de la versión pública local; no requiere actualizar el proceso en esta revisión.';
  return `# Instrucciones para VS Code

## Alcance

Este paquete es **solo de revisión**. Fue generado desde una respuesta validada y aprobada, pero no aplica archivos, no publica y no ejecuta Git.

- Paquete: \`${packageId}\`
- Macroevento estable: \`${session.macroevento_id}\`
- Análisis propuesto: \`${analysisPath}\`
- Estado del análisis: \`borrador\`

## Orden de revisión

1. Abrí \`MANIFIESTO.json\` y comprobá las identidades.
2. Verificá los hashes de \`SHA256SUMS.txt\`.
3. Revisá \`seguimiento/propuesta-seguimiento.json\` y \`seguimiento/diferencias-seguimiento.json\`.
4. ${processInstruction}
5. Revisá el Markdown completo en \`${analysisPath}\` y resolvé las advertencias editoriales que correspondan.
6. Consultá \`INFORME-TRAZABILIDAD.md\` antes de autorizar la aplicación local.

## Destinos de aplicación controlada

- No copies el análisis a \`src/content/publicaciones/_preview/\`: esa carpeta es derivada y regenerable.
- No copies un borrador a \`src/content/publicaciones/publicadas/\`: esa carpeta contiene piezas ya incorporadas al sitio.
- La Fase 7 aplica el análisis en \`centro-local/data/publicaciones/borradores/\`, fuera del build público.
- La propuesta de seguimiento es una proyección pública para comparar; no reemplaza directamente \`modules/observatorio/data/macroeventos.json\`.
- No edites directamente \`src/data/public/observatorio.json\`: es una salida derivada.

## Advertencias que viajan con el paquete

${warningsMarkdown(warnings)}
## Controles posteriores a una futura aplicación

Después de la aplicación local y durante la integración de la Fase 8, ejecutar desde la raíz del sitio:

\`\`\`cmd
npm run check
npm run build
git --no-pager diff --check
\`\`\`

Después corresponde QA visual en escritorio, tablet y teléfono. Cualquier \`git add\`, commit o push seguirá siendo manual y requerirá autorización separada.
`;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(value) {
  const date = Number.isNaN(new Date(value).getTime()) ? new Date() : new Date(value);
  const year = Math.min(2107, Math.max(1980, date.getUTCFullYear()));
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

export function createStoredZip(entries, generatedAt = new Date().toISOString()) {
  const localParts = [];
  const centralParts = [];
  const stamp = dosDateTime(generatedAt);
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.path.replaceAll('\\', '/'), 'utf8');
    const content = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(String(entry.content), 'utf8');
    const checksum = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, content);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(content.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + content.length;
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, central, end]);
}

function writeAtomic(file, content) {
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, file);
}

function sessionFromFile(sessionsDir, eventId) {
  let file;
  try { file = sessionFileFor(sessionsDir, eventId); } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-event-id', 'macroevento_id inválido', error.message)] };
  }
  if (!fs.existsSync(file)) return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para empaquetar')] };
  try {
    return { status: 'ready', file, session: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
}

export function generateReviewPackage({
  sessionsDir,
  packagesDir,
  data,
  projectRoot,
  eventId,
  currentFollowupProposal,
  generatedAt = new Date().toISOString(),
} = {}) {
  const id = clean(eventId);
  const loaded = sessionFromFile(sessionsDir, id);
  if (loaded.status !== 'ready') return loaded;
  const { file: sessionFile, session } = loaded;
  if (!session.respuesta_chatgpt?.aprobada_el
      || session.respuesta_chatgpt?.validacion?.estado !== 'ready') {
    return { status: 'blocked', blocks: [issue('response-not-approved', 'La respuesta todavía no está aprobada', 'Validá y aprobá el Markdown antes de generar el paquete.')] };
  }
  if (session.macroevento_id !== id) {
    return { status: 'blocked', blocks: [issue('session-identity-mismatch', 'La sesión pertenece a otro macroevento')] };
  }
  if (session.propuesta_seguimiento?.status !== 'ready'
      || session.propuesta_seguimiento?.macroevento_id !== id
      || session.propuesta_seguimiento?.identity_preserved !== true) {
    return { status: 'blocked', blocks: [issue('invalid-followup-proposal', 'La propuesta de seguimiento no es compatible', 'Regenerá la preparación desde el mismo macroevento.')] };
  }
  if (currentFollowupProposal?.status !== 'ready') {
    return { status: 'blocked', blocks: [issue('invalid-current-followup-proposal', 'No se pudo reconstruir la propuesta actual del proceso', 'Corregí los datos del proceso; el análisis aprobado se conserva.')] };
  }

  const validation = validateAnalysisResponse({
    markdown: session.respuesta_chatgpt.contenido_original,
    data,
    eventId: id,
    session,
    projectRoot,
    receivedAt: generatedAt,
  });
  if (validation.status !== 'ready') {
    return {
      status: 'blocked',
      blocks: validation.blocks.length ? validation.blocks : [issue('analysis-validation-failed', 'El análisis aprobado dejó de ser válido', 'Corregí, validá y aprobá nuevamente el Markdown.')],
    };
  }
  if (validation.hash_sha256 !== session.respuesta_chatgpt.hash_sha256) {
    return {
      status: 'blocked',
      blocks: [issue('analysis-revision-changed', 'Cambió el contenido del análisis aprobado', 'Validá y aprobá nuevamente el Markdown. El estado del proceso no causó esta invalidación.')],
    };
  }
  const metadata = validation.metadata || {};
  if (!VALID_ID.test(clean(metadata.slug)) || metadata.macroevento_principal_id !== id) {
    return { status: 'blocked', blocks: [issue('invalid-analysis-identity', 'La identidad del análisis no puede empaquetarse')] };
  }

  const nextAnalysisRevision = analysisRevision({ markdown: validation.normalized_markdown, metadata });
  const previousProcessRevision = processRevision(session.propuesta_seguimiento);
  const nextProcessRevision = processRevision(currentFollowupProposal);
  const processChanged = !equalRevision(
    proposalComparable(currentFollowupProposal),
    proposalComparable(session.propuesta_seguimiento),
  );
  if (processChanged && (session.integracion_local?.estado === 'aplicada' || session.publicacion_local?.estado === 'aplicada')) {
    return {
      status: 'blocked',
      analysis_approval_preserved: true,
      analysis_revision: nextAnalysisRevision,
      process_revision: nextProcessRevision,
      blocks: [issue(
        'process-revision-changed',
        'Cambió únicamente la revisión del proceso',
        'El análisis aprobado continúa válido. Usá “Actualizar proceso en evolución”; no hace falta volver a aprobar el Markdown.',
      )],
    };
  }
  if (processChanged) {
    if (session.paquete_revision) {
      session.paquete_revision = {
        ...session.paquete_revision,
        estado: 'obsoleto_por_revision_proceso',
        process_revision_anterior: previousProcessRevision,
        process_revision_actual: nextProcessRevision,
      };
    }
    session.propuesta_seguimiento = structuredClone(currentFollowupProposal);
  }
  session.revisiones = {
    analysis_revision: nextAnalysisRevision,
    process_revision: nextProcessRevision,
  };

  fs.mkdirSync(packagesDir, { recursive: true });
  const previous = session.paquete_revision;
  if (previous?.estado === 'archivos_preparados'
      && previous?.response_hash === validation.hash_sha256
      && previous?.analysis_revision === nextAnalysisRevision
      && previous?.process_revision === nextProcessRevision
      && previous?.filename
      && fs.existsSync(path.join(packagesDir, path.basename(previous.filename)))) {
    return {
      status: 'ready',
      reused: true,
      session,
      package: previous,
      file: { name: previous.filename, relative_path: path.join('data', 'paquetes', previous.filename), operation: 'conservado' },
      safety: session.seguridad,
    };
  }

  const compact = generatedAt.replace(/[^0-9]/g, '').slice(0, 14) || Date.now().toString();
  let packageId = `revision-${id}-${compact}`;
  let filename = `${packageId}.zip`;
  if (fs.existsSync(path.join(packagesDir, filename))) {
    packageId += `-${crypto.randomBytes(2).toString('hex')}`;
    filename = `${packageId}.zip`;
  }
  const rootFolder = packageId;
  const analysisPath = `analisis/${metadata.slug}.md`;
  const proposal = session.propuesta_seguimiento;
  const baseArtifacts = [
    fileRecord('seguimiento/propuesta-seguimiento.json', jsonText({
      schema_version: proposal.schema_version,
      tipo: proposal.tipo,
      generado_el: proposal.generado_el,
      macroevento_id: proposal.macroevento_id,
      operation: proposal.operation,
      base: proposal.base,
      identity_preserved: proposal.identity_preserved,
      proposed_process: proposal.proposed_process,
      proposed_sources: proposal.proposed_sources,
      metrics: proposal.metrics,
      safety: proposal.safety,
    }), 'Propuesta estructurada del proceso en evolución'),
    fileRecord('seguimiento/diferencias-seguimiento.json', jsonText({
      schema_version: 1,
      tipo: 'diferencias-seguimiento',
      macroevento_id: id,
      operation: proposal.operation,
      identity_preserved: proposal.identity_preserved,
      changes: proposal.diff || [],
      metrics: proposal.metrics,
    }), 'Diferencias respecto de la versión pública local'),
    fileRecord(analysisPath, finalNewline(validation.normalized_markdown), 'Análisis Markdown validado y aprobado'),
    fileRecord('ADVERTENCIAS-DECISIONES.json', jsonText({
      schema_version: 1,
      macroevento_id: id,
      propuestas: session.respuesta_chatgpt.advertencias_propuestas || [],
    }), 'Advertencias estructuradas y decisiones humanas vinculadas al análisis'),
    fileRecord('PROMPT-ANALISIS.txt', finalNewline(session.prompt_analisis?.content), 'Prompt exacto utilizado en ChatGPT'),
    fileRecord('INFORME-TRAZABILIDAD.md', traceReport({ session, generatedAt, packageId }), 'Informe de los trece pasos internos'),
    fileRecord('INSTRUCCIONES-VSCODE.md', instructionsMarkdown({ session, packageId, analysisPath }), 'Orden y límites para la revisión en VS Code'),
  ];
  const manifest = {
    schema_version: 1,
    tipo: 'paquete-revision-vscode',
    package_id: packageId,
    session_id: session.session_id,
    generado_el: generatedAt,
    estado: 'archivos_preparados',
    macroevento_id: id,
    resultados_seleccionados: session.resultados_seleccionados || ['proceso_en_evolucion', 'analisis_completo'],
    identidades: {
      proceso: { macroevento_id: id, conservado: true },
      analisis: {
        post_id: metadata.post_id,
        slug: metadata.slug,
        macroevento_principal_id: metadata.macroevento_principal_id,
        identidad_propia: metadata.post_id !== id && metadata.slug !== id,
      },
    },
    aprobacion: {
      respuesta_aprobada_el: session.respuesta_chatgpt.aprobada_el,
      hash_sha256: validation.hash_sha256,
      advertencias_conservadas: validation.warnings.length,
      advertencias_estructuradas: (session.respuesta_chatgpt.advertencias_propuestas || []).length,
      analysis_revision: nextAnalysisRevision,
      process_revision: nextProcessRevision,
    },
    destinos: {
      seguimiento: {
        fuente_canonica: 'centro-local/modules/observatorio/data/macroeventos.json',
        estado: proposal.diff?.length ? 'requiere_adaptador_fase_7' : 'sin_cambios_publicos',
        editar_derivado_directamente: false,
      },
      analisis: {
        destino_canonico: 'centro-local/data/publicaciones/borradores',
        estado: 'pendiente_aplicacion_fase_7',
        destinos_prohibidos_para_borrador: [
          'src/content/publicaciones/_preview',
          'src/content/publicaciones/publicadas',
        ],
      },
    },
    artefactos: baseArtifacts.map(({ content, ...artifact }) => artifact),
    seguridad: {
      archivos_canonicos_creados: 0,
      archivos_canonicos_modificados: 0,
      git_ejecutado: false,
      aplicacion_habilitada: false,
      publicado: false,
    },
  };
  const manifestArtifact = fileRecord('MANIFIESTO.json', jsonText(manifest), 'Identidad, contenido y seguridad del paquete');
  const checksumLines = [manifestArtifact, ...baseArtifacts]
    .map((artifact) => `${artifact.sha256}  ${artifact.path}`)
    .join('\n') + '\n';
  const checksumArtifact = fileRecord('SHA256SUMS.txt', checksumLines, 'Checksums de los artefactos de revisión');
  const artifacts = [manifestArtifact, ...baseArtifacts, checksumArtifact];
  const zip = createStoredZip(artifacts.map((artifact) => ({
    path: `${rootFolder}/${artifact.path}`,
    content: artifact.content,
  })), generatedAt);
  const packageFile = path.join(packagesDir, filename);
  writeAtomic(packageFile, zip);

  session.estado = 'respuesta_aprobada';
  session.actualizado_el = generatedAt;
  session.trazabilidad = {
    pasos_completados: [...new Set([...(session.trazabilidad?.pasos_completados || []), 13])].sort((a, b) => a - b),
    siguiente_paso: null,
    estado: 'archivos_preparados_pendientes_aplicacion',
  };
  session.paquete_revision = {
    package_id: packageId,
    filename,
    generated_at: generatedAt,
    estado: 'archivos_preparados',
    response_hash: validation.hash_sha256,
    analysis_revision: nextAnalysisRevision,
    process_revision: nextProcessRevision,
    archive_sha256: sha256(zip),
    archive_bytes: zip.length,
    root_folder: rootFolder,
    artifacts: artifacts.map(({ content, ...artifact }) => artifact),
    warnings: validation.warnings,
    followup_changes: proposal.diff?.length || 0,
    canonical_writes: 0,
    git_executed: false,
  };
  session.seguridad = {
    ...(session.seguridad || {}),
    archivos_canonicos_creados: 0,
    archivos_canonicos_modificados: 0,
    archivos_sesion_escritos: 1,
    archivos_paquete_creados: 1,
    git_ejecutado: false,
  };
  writeAtomic(sessionFile, Buffer.from(jsonText(session), 'utf8'));
  return {
    status: 'ready',
    reused: false,
    session,
    package: session.paquete_revision,
    file: { name: filename, relative_path: path.join('data', 'paquetes', filename), operation: 'creado' },
    safety: session.seguridad,
  };
}

export function resolvePreparedReviewPackage({ sessionsDir, packagesDir, eventId } = {}) {
  const loaded = sessionFromFile(sessionsDir, eventId);
  if (loaded.status !== 'ready') return loaded;
  const metadata = loaded.session.paquete_revision;
  if (!loaded.session.respuesta_chatgpt?.aprobada_el
      || loaded.session.respuesta_chatgpt?.validacion?.estado !== 'ready'
      || metadata?.estado !== 'archivos_preparados'
      || !metadata?.filename) {
    return { status: 'blocked', blocks: [issue('package-not-prepared', 'Todavía no existe un paquete preparado')] };
  }
  const filename = path.basename(metadata.filename);
  if (filename !== metadata.filename || !filename.endsWith('.zip')) {
    return { status: 'blocked', blocks: [issue('invalid-package-path', 'La ruta del paquete no es válida')] };
  }
  const file = path.join(packagesDir, filename);
  if (!fs.existsSync(file)) return { status: 'blocked', blocks: [issue('package-file-missing', 'El archivo ZIP ya no está disponible')] };
  const content = fs.readFileSync(file);
  if (sha256(content) !== metadata.archive_sha256) {
    return { status: 'blocked', blocks: [issue('package-hash-mismatch', 'El ZIP no coincide con la sesión', 'Volvé a generar el paquete antes de descargarlo.')] };
  }
  return { status: 'ready', file, filename, metadata, content };
}
