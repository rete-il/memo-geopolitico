import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { sessionFileFor } from './analysis-prompt.mjs';

const clean = (value) => String(value ?? '').trim();
const VALID_ID = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;
const REQUIRED_SCALARS = [
  ['post_id', 'post_id'],
  ['slug', 'slug'],
  ['tipo_publicacion', 'tipo_publicacion'],
  ['titulo', 'título'],
  ['subtitulo', 'subtítulo'],
  ['resumen', 'resumen'],
  ['macroevento_principal_id', 'macroevento_principal_id'],
];

function unique(values) {
  return [...new Set((values || []).map(clean).filter(Boolean))];
}

function issue(code, title, detail = '') {
  return { code, title, detail };
}

function scalar(value) {
  const text = clean(value);
  if (!text || text === 'null' || text === '~') return '';
  if (text.startsWith('"') && text.endsWith('"')) {
    try { return JSON.parse(text); } catch { return text.slice(1, -1); }
  }
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'");
  return text;
}

function lineIndent(line) {
  return line.match(/^\s*/)?.[0].length || 0;
}

function topLevelValue(lines, key) {
  const match = lines.find((line) => lineIndent(line) === 0 && line.startsWith(`${key}:`));
  return match ? scalar(match.slice(key.length + 1)) : '';
}

function nestedValue(lines, section, key) {
  const sectionIndex = lines.findIndex((line) => lineIndent(line) === 0 && clean(line) === `${section}:`);
  if (sectionIndex < 0) return '';
  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (clean(line) && lineIndent(line) === 0) break;
    const match = line.match(new RegExp(`^\\s{2}${key}:\\s*(.*?)\\s*$`));
    if (match) return scalar(match[1]);
  }
  return '';
}

function topLevelList(lines, key) {
  const index = lines.findIndex((line) => lineIndent(line) === 0 && line.startsWith(`${key}:`));
  if (index < 0) return [];
  const inline = clean(lines[index].slice(key.length + 1));
  if (inline === '[]') return [];
  if (inline.startsWith('[') && inline.endsWith(']')) {
    return unique(inline.slice(1, -1).split(',').map(scalar));
  }
  const values = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (clean(line) && lineIndent(line) === 0) break;
    const match = line.match(/^\s{2}-\s+(.*?)\s*$/);
    if (match) values.push(scalar(match[1]));
  }
  return unique(values);
}

function unwrapOuterFence(value) {
  const normalized = String(value ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  const match = normalized.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  return match ? { markdown: match[1].trim(), wrapped: true } : { markdown: normalized, wrapped: false };
}

function splitMarkdown(value) {
  const normalized = unwrapOuterFence(value);
  const match = normalized.markdown.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)([\s\S]*)$/);
  return {
    ...normalized,
    frontmatter: match?.[1] || '',
    body: match?.[2]?.trim() || '',
  };
}

function parseFrontmatter(yaml) {
  const lines = String(yaml).split('\n');
  return {
    schema_version: Number(topLevelValue(lines, 'schema_version')),
    post_id: topLevelValue(lines, 'post_id'),
    slug: topLevelValue(lines, 'slug'),
    tipo_publicacion: topLevelValue(lines, 'tipo_publicacion'),
    titulo: topLevelValue(lines, 'titulo'),
    subtitulo: topLevelValue(lines, 'subtitulo'),
    resumen: topLevelValue(lines, 'resumen'),
    autor_ids: topLevelList(lines, 'autor_ids'),
    publicacion: {
      estado: nestedValue(lines, 'publicacion', 'estado'),
      publicado_el: nestedValue(lines, 'publicacion', 'publicado_el'),
      actualizado_el: nestedValue(lines, 'publicacion', 'actualizado_el'),
    },
    macroevento_principal_id: topLevelValue(lines, 'macroevento_principal_id'),
    macroevento_secundario_ids: topLevelList(lines, 'macroevento_secundario_ids'),
    fuente_ids: topLevelList(lines, 'fuente_ids'),
    recurso_visual_ids: topLevelList(lines, 'recurso_visual_ids'),
    post_relacionado_ids: topLevelList(lines, 'post_relacionado_ids'),
  };
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(item);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [item] : [];
  });
}

function publicationIdentities(projectRoot) {
  const result = { postIds: new Set(), slugs: new Set() };
  const directory = path.join(projectRoot, 'src', 'content', 'publicaciones');
  for (const file of markdownFiles(directory)) {
    const parsed = splitMarkdown(fs.readFileSync(file, 'utf8'));
    if (!parsed.frontmatter) continue;
    const metadata = parseFrontmatter(parsed.frontmatter);
    if (metadata.post_id) result.postIds.add(metadata.post_id);
    if (metadata.slug) result.slugs.add(metadata.slug);
  }
  return result;
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return clean(value).replace(/[.,;:!?]+$/, '').replace(/\/$/, '');
  }
}

function markdownUrls(body) {
  return unique((String(body).match(/https?:\/\/[^\s<>)\]}"']+/g) || [])
    .map((url) => url.replace(/[.,;:!?]+$/, '')));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inlineMarkdown(value) {
  const source = String(value ?? '');
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g;
  let html = '';
  let cursor = 0;
  for (const match of source.matchAll(linkPattern)) {
    html += escapeHtml(source.slice(cursor, match.index));
    html += `<a href="${escapeHtml(match[2])}" target="_blank" rel="noreferrer">${escapeHtml(match[1])}</a>`;
    cursor = match.index + match[0].length;
  }
  html += escapeHtml(source.slice(cursor));
  return html
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
}

function tableCells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => clean(cell));
}

export function renderMarkdownPreview(body) {
  const lines = String(body ?? '').replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let index = 0;
  const isSpecial = (line, next = '') => (
    !clean(line)
    || /^#{1,4}\s+/.test(line)
    || /^>\s?/.test(line)
    || /^[-*+]\s+/.test(line)
    || /^\d+\.\s+/.test(line)
    || /^```/.test(line)
    || (/^\|.*\|\s*$/.test(line) && /^\|?\s*:?-{3,}/.test(next))
    || /^-{3,}\s*$/.test(line)
  );

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = clean(line);
    if (!trimmed) { index += 1; continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(4, heading[1].length + 1);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }
    if (/^```/.test(line)) {
      const language = clean(line.replace(/^```/, ''));
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      html.push(`<pre${language ? ` data-language="${escapeHtml(language)}"` : ''}><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
      html.push(`<blockquote>${inlineMarkdown(quote.join(' '))}</blockquote>`);
      continue;
    }
    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) items.push(lines[index++].replace(/^[-*+]\s+/, ''));
      html.push(`<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\d+\.\s+/, ''));
      html.push(`<ol>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`);
      continue;
    }
    if (/^\|.*\|\s*$/.test(line) && /^\|?\s*:?-{3,}/.test(lines[index + 1] || '')) {
      const headers = tableCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && /^\|.*\|\s*$/.test(lines[index])) rows.push(tableCells(lines[index++]));
      html.push(`<div class="markdown-table-wrap"><table><thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) {
      html.push('<hr>');
      index += 1;
      continue;
    }
    const paragraph = [trimmed];
    index += 1;
    while (index < lines.length && !isSpecial(lines[index], lines[index + 1] || '')) paragraph.push(clean(lines[index++]));
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
  }
  return html.join('\n');
}

export function validateAnalysisResponse({
  markdown,
  data,
  eventId,
  session,
  projectRoot,
  receivedAt = new Date().toISOString(),
} = {}) {
  const blocks = [];
  const warnings = [];
  const information = [];
  const id = clean(eventId);
  const raw = String(markdown ?? '');
  const parsed = splitMarkdown(raw);

  if (!clean(raw)) blocks.push(issue('empty-response', 'La respuesta está vacía', 'Pegá o cargá el archivo Markdown recibido de ChatGPT.'));
  if (!session || session.macroevento_id !== id || !session.prompt_analisis) {
    blocks.push(issue('missing-session', 'No existe una sesión de prompt compatible', 'Generá o recuperá primero el prompt del mismo macroevento.'));
  }
  if (parsed.wrapped) warnings.push(issue('outer-code-fence', 'La respuesta llegó dentro de un bloque de código', 'El bloque exterior se retiró para validar y previsualizar el Markdown. El original permanece guardado.'));
  if (!parsed.frontmatter) blocks.push(issue('missing-frontmatter', 'Falta el frontmatter YAML', 'El archivo debe comenzar y cerrar su encabezado con --- antes del cuerpo Markdown.'));

  const metadata = parsed.frontmatter ? parseFrontmatter(parsed.frontmatter) : {};
  if (parsed.frontmatter && metadata.schema_version !== 2) {
    blocks.push(issue('invalid-schema-version', 'schema_version incompatible', `Se esperaba 2 y se recibió ${Number.isFinite(metadata.schema_version) ? metadata.schema_version : 'un valor inválido'}.`));
  }
  for (const [field, label] of REQUIRED_SCALARS) {
    if (!clean(metadata[field])) blocks.push(issue(`missing-${field}`, `Falta ${label}`, `Completá ${field} en el frontmatter.`));
  }
  const placeholderFields = REQUIRED_SCALARS
    .filter(([field]) => /\[(?:PROPONER|COMPLETAR|VERIFICAR)[^\]]*\]/i.test(clean(metadata[field])))
    .map(([field]) => field);
  if (placeholderFields.length) blocks.push(issue('unresolved-frontmatter-placeholders', 'Quedaron marcadores sin reemplazar', placeholderFields.join(', ')));

  for (const field of ['post_id', 'slug']) {
    const value = clean(metadata[field]);
    if (value && !VALID_ID.test(value)) blocks.push(issue(`invalid-${field}`, `${field} no es válido`, 'Usá minúsculas, números y guiones, sin espacios ni signos especiales.'));
  }
  if (metadata.tipo_publicacion && metadata.tipo_publicacion !== 'analisis') {
    blocks.push(issue('invalid-publication-type', 'tipo_publicacion debe ser “analisis”', `Se recibió “${metadata.tipo_publicacion}”.`));
  }
  if (metadata.macroevento_principal_id && metadata.macroevento_principal_id !== id) {
    blocks.push(issue('event-identity-mismatch', 'El análisis está vinculado a otro macroevento', `Debe conservar exactamente macroevento_principal_id: ${id}.`));
  }
  if (metadata.post_id && metadata.post_id === id) blocks.push(issue('post-id-reuses-event-id', 'El análisis necesita identidad propia', 'post_id no puede reutilizar el macroevento_id.'));
  if (metadata.slug && metadata.slug === id) blocks.push(issue('slug-reuses-event-id', 'El análisis necesita un slug propio', 'El slug no puede reutilizar el macroevento_id.'));
  if (metadata.publicacion?.estado && metadata.publicacion.estado !== 'borrador') {
    blocks.push(issue('invalid-publication-state', 'La publicación debe quedar en borrador', `Se recibió el estado “${metadata.publicacion.estado}”.`));
  }
  if (metadata.publicacion && metadata.publicacion.publicado_el) {
    blocks.push(issue('unexpected-publication-date', 'Un borrador no puede tener fecha de publicación', 'publicacion.publicado_el debe ser null.'));
  }
  if (!metadata.autor_ids?.includes('rete')) blocks.push(issue('missing-author', 'Falta el autor requerido', 'autor_ids debe incluir “rete”.'));

  const identities = projectRoot ? publicationIdentities(projectRoot) : { postIds: new Set(), slugs: new Set() };
  if (metadata.post_id && identities.postIds.has(metadata.post_id)) blocks.push(issue('duplicate-post-id', 'post_id ya existente', `“${metadata.post_id}” ya identifica otra publicación local.`));
  if (metadata.slug && identities.slugs.has(metadata.slug)) blocks.push(issue('duplicate-slug', 'slug ya existente', `“${metadata.slug}” ya pertenece a otra publicación local.`));

  const event = (data?.macroeventos || []).find((item) => item?.id === id);
  if (!event) blocks.push(issue('missing-event', 'El macroevento ya no está disponible', `No se encontró “${id}” en los datos actuales.`));
  const verifiedSources = (event?.fuentes || []).filter((source) => source.estado_verificacion === 'verificada');
  const reservedSources = (event?.fuentes || []).filter((source) => source.estado_verificacion !== 'verificada');
  const promptVerified = unique(session?.prompt_analisis?.variables?.fuentes_verificadas || []);
  const allowedSourceIds = new Set(promptVerified);
  const submittedSourceIds = unique(metadata.fuente_ids || []);
  const unknownSourceIds = submittedSourceIds.filter((sourceId) => !allowedSourceIds.has(sourceId));
  if (unknownSourceIds.length) blocks.push(issue('unauthorized-source-ids', 'El frontmatter incluye fuentes no autorizadas', unknownSourceIds.join(', ')));
  const omittedSourceIds = promptVerified.filter((sourceId) => !submittedSourceIds.includes(sourceId));
  if (omittedSourceIds.length) warnings.push(issue('omitted-authorized-sources', 'No todas las fuentes autorizadas figuran en fuente_ids', omittedSourceIds.join(', ')));

  const bodyUrls = markdownUrls(parsed.body);
  const allowedUrls = new Set(verifiedSources.map((source) => canonicalUrl(source.url)).filter(Boolean));
  const reservedUrls = new Set(reservedSources.map((source) => canonicalUrl(source.url)).filter(Boolean));
  const unauthorizedUrls = bodyUrls.filter((url) => !allowedUrls.has(canonicalUrl(url)));
  const usedReservedUrls = unauthorizedUrls.filter((url) => reservedUrls.has(canonicalUrl(url)));
  const otherUnauthorizedUrls = unauthorizedUrls.filter((url) => !reservedUrls.has(canonicalUrl(url)));
  if (usedReservedUrls.length) blocks.push(issue('reserved-source-used', 'El análisis usa una fuente reservada', usedReservedUrls.join(' · ')));
  if (otherUnauthorizedUrls.length) blocks.push(issue('unauthorized-links', 'El análisis incorpora enlaces no autorizados', otherUnauthorizedUrls.join(' · ')));

  if (!parsed.body) blocks.push(issue('empty-markdown-body', 'Falta el cuerpo del análisis', 'El frontmatter debe estar seguido por un análisis Markdown completo.'));
  const headings = parsed.body.match(/^#{2,4}\s+.+$/gm) || [];
  if (parsed.body && headings.length < 2) warnings.push(issue('few-sections', 'El análisis tiene poca estructura', 'Se esperan al menos dos subtítulos Markdown claros.'));
  if (parsed.body && !/^##\s+Fuentes\s*$/im.test(parsed.body)) warnings.push(issue('missing-sources-section', 'Falta la sección final “Fuentes”', 'Agregá una sección ## Fuentes que liste únicamente la evidencia utilizada.'));
  const verifyMarkers = parsed.body.match(/\[VERIFICAR(?::[^\]]+)?\]/gi) || [];
  if (verifyMarkers.length) warnings.push(issue('verification-markers', `${verifyMarkers.length} ${verifyMarkers.length === 1 ? 'marcador requiere' : 'marcadores requieren'} revisión humana`, unique(verifyMarkers).join(' · ')));
  if (/<\/?[a-z][^>]*>/i.test(parsed.body)) warnings.push(issue('raw-html', 'El cuerpo contiene HTML', 'La vista previa lo muestra como texto por seguridad; revisalo antes de aprobar.'));

  const words = parsed.body ? (parsed.body.replace(/https?:\/\/\S+/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) || []).length : 0;
  const hash = crypto.createHash('sha256').update(parsed.markdown, 'utf8').digest('hex');
  const status = blocks.length ? 'blocked' : 'ready';
  if (status === 'ready') information.push(issue('structure-valid', 'Estructura Markdown válida', 'La identidad, el vínculo y las fuentes superaron los controles automáticos.'));
  information.push(issue('human-review-required', 'La aprobación sigue siendo humana', 'La validación estructural no confirma por sí sola la exactitud factual ni autoriza publicación.'));

  return {
    status,
    macroevento_id: id,
    received_at: receivedAt,
    hash_sha256: hash,
    blocks,
    warnings,
    information,
    metadata,
    metrics: {
      words,
      headings: headings.length,
      links: bodyUrls.length,
      source_ids: submittedSourceIds.length,
      authorized_source_ids: promptVerified.length,
      verification_markers: verifyMarkers.length,
    },
    normalized_markdown: parsed.markdown,
    preview_html: renderMarkdownPreview(parsed.body),
  };
}

function writeSessionAtomic(file, session) {
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

export function saveAnalysisResponse({ sessionsDir, data, projectRoot, eventId, markdown, receivedAt = new Date().toISOString() } = {}) {
  let file;
  try { file = sessionFileFor(sessionsDir, eventId); } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-event-id', 'macroevento_id inválido', error.message)] };
  }
  if (!fs.existsSync(file)) return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión pendiente', 'Generá primero el prompt de análisis.')] };

  let session;
  try { session = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
  const validation = validateAnalysisResponse({ markdown, data, eventId, session, projectRoot, receivedAt });
  const validated = validation.status === 'ready';
  session.estado = validated ? 'respuesta_validada' : 'respuesta_recibida';
  session.actualizado_el = receivedAt;
  session.respuesta_chatgpt = {
    recibida_el: receivedAt,
    contenido_original: String(markdown ?? ''),
    contenido_normalizado: validation.normalized_markdown,
    hash_sha256: validation.hash_sha256,
    validacion: {
      estado: validation.status,
      bloqueos: validation.blocks,
      advertencias: validation.warnings,
      informacion: validation.information,
      metadata: validation.metadata,
      metricas: validation.metrics,
      preview_html: validation.preview_html,
    },
    aprobada_el: null,
  };
  session.paquete_revision = null;
  session.trazabilidad = {
    pasos_completados: [1, 2, 3, 8, 9, 10, 11],
    siguiente_paso: 12,
    estado: validated ? 'respuesta_validada_pendiente_aprobacion' : 'respuesta_recibida_con_bloqueos',
  };
  session.seguridad = {
    ...(session.seguridad || {}),
    archivos_canonicos_creados: 0,
    archivos_canonicos_modificados: 0,
    archivos_sesion_escritos: 1,
    git_ejecutado: false,
  };
  writeSessionAtomic(file, session);
  return {
    status: validation.status,
    session,
    validation,
    file: { name: path.basename(file), relative_path: path.join('data', 'sesiones', path.basename(file)), operation: 'actualizado' },
    safety: session.seguridad,
  };
}

export function approveAnalysisResponse({ sessionsDir, eventId, expectedHash, approvedAt = new Date().toISOString() } = {}) {
  let file;
  try { file = sessionFileFor(sessionsDir, eventId); } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-event-id', 'macroevento_id inválido', error.message)] };
  }
  if (!fs.existsSync(file)) return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para aprobar')] };
  let session;
  try { session = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-session', 'La sesión guardada no es válida', error.message)] };
  }
  const response = session.respuesta_chatgpt;
  if (session.estado !== 'respuesta_validada' || response?.validacion?.estado !== 'ready') {
    return { status: 'blocked', blocks: [issue('response-not-valid', 'La respuesta todavía no puede aprobarse', 'Validá un Markdown sin bloqueos antes de aprobarlo.')] };
  }
  if (!expectedHash || response.hash_sha256 !== clean(expectedHash)) {
    return { status: 'blocked', blocks: [issue('response-changed', 'La respuesta cambió desde la validación', 'Volvé a validarla antes de aprobar.')] };
  }
  session.estado = 'respuesta_aprobada';
  session.actualizado_el = approvedAt;
  session.respuesta_chatgpt.aprobada_el = approvedAt;
  session.paquete_revision = null;
  session.trazabilidad = {
    pasos_completados: [1, 2, 3, 8, 9, 10, 11, 12],
    siguiente_paso: 13,
    estado: 'respuesta_aprobada_pendiente_paquete',
  };
  session.seguridad = {
    ...(session.seguridad || {}),
    archivos_canonicos_creados: 0,
    archivos_canonicos_modificados: 0,
    archivos_sesion_escritos: 1,
    git_ejecutado: false,
  };
  writeSessionAtomic(file, session);
  return {
    status: 'ready',
    session,
    validation: {
      status: 'ready',
      hash_sha256: response.hash_sha256,
      blocks: response.validacion.bloqueos || [],
      warnings: response.validacion.advertencias || [],
      information: response.validacion.informacion || [],
      metadata: response.validacion.metadata || {},
      metrics: response.validacion.metricas || {},
      normalized_markdown: response.contenido_normalizado || '',
      preview_html: response.validacion.preview_html || '',
    },
    file: { name: path.basename(file), relative_path: path.join('data', 'sesiones', path.basename(file)), operation: 'actualizado' },
    safety: session.seguridad,
  };
}
