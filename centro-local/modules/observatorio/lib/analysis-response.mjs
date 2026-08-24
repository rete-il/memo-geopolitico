import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { sessionFileFor } from './analysis-prompt.mjs';
import {
  WARNING_PRIORITIES,
  WARNING_TREATMENTS,
  validateEventWarnings,
} from './warnings-contract.mjs';

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
const WARNING_ID = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const WARNING_ENVELOPE = /<!--\s*MEMO_ADVERTENCIAS_V1\s*\n([\s\S]*?)\n-->\s*$/i;

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
    const match = line.match(/^\s{2}[-*+]\s+(.*?)\s*$/);
    if (match) values.push(scalar(match[1]));
  }
  return unique(values);
}

function unwrapOuterFence(value) {
  const normalized = String(value ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  const match = normalized.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  return match ? { markdown: match[1].trim(), wrapped: true } : { markdown: normalized, wrapped: false };
}

function normalizeWarningCandidate(value = {}) {
  return {
    advertencia_id: clean(value.advertencia_id),
    descripcion: clean(value.descripcion),
    tipo: clean(value.tipo),
    signal_ids: unique(value.signal_ids),
    fuente_ids: unique(value.fuente_ids),
    tratamiento_sugerido: clean(value.tratamiento_sugerido),
    prioridad_sugerida: clean(value.prioridad_sugerida),
  };
}

function warningFingerprint(value = {}) {
  return JSON.stringify({
    descripcion: clean(value.descripcion).toLocaleLowerCase('es'),
    tipo: clean(value.tipo),
    signal_ids: unique(value.signal_ids).sort(),
    fuente_ids: unique(value.fuente_ids).sort(),
  });
}

function extractWarningEnvelope(value) {
  const match = String(value ?? '').match(WARNING_ENVELOPE);
  if (!match) return { markdown: String(value ?? '').trim(), found: false, value: null, error: '' };
  try {
    return {
      markdown: String(value).slice(0, match.index).trim(),
      found: true,
      value: JSON.parse(match[1]),
      error: '',
    };
  } catch (error) {
    return {
      markdown: String(value).slice(0, match.index).trim(),
      found: true,
      value: null,
      error: error.message,
    };
  }
}

function splitMarkdown(value) {
  const normalized = unwrapOuterFence(value);
  const envelope = extractWarningEnvelope(normalized.markdown);
  const match = envelope.markdown.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)([\s\S]*)$/);
  return {
    ...normalized,
    response_content: normalized.markdown,
    markdown: envelope.markdown,
    warning_envelope: envelope,
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
  if (parsed.wrapped) information.push(issue('outer-code-fence', 'Envoltura Markdown retirada', 'El bloque exterior se retiró de forma segura. El original permanece guardado.'));
  if (!parsed.frontmatter) blocks.push(issue('missing-frontmatter', 'Falta el frontmatter YAML', 'El archivo debe comenzar y cerrar su encabezado con --- antes del cuerpo Markdown.'));
  const requiresWarningEnvelope = session?.prompt_analisis?.template?.version === '1.1';
  if (!parsed.warning_envelope.found && requiresWarningEnvelope) {
    blocks.push(issue('missing-warning-envelope', 'Falta el bloque estructurado de advertencias', 'La respuesta debe terminar con el comentario MEMO_ADVERTENCIAS_V1, aunque la lista advertencias_nuevas esté vacía.'));
  } else if (parsed.warning_envelope.found && parsed.warning_envelope.error) {
    blocks.push(issue('invalid-warning-envelope-json', 'El bloque de advertencias no contiene JSON válido', parsed.warning_envelope.error));
  } else if (parsed.warning_envelope.found && (parsed.warning_envelope.value?.schema_version !== 1 || !Array.isArray(parsed.warning_envelope.value?.advertencias_nuevas))) {
    blocks.push(issue('invalid-warning-envelope-contract', 'El bloque de advertencias no cumple el contrato', 'Debe tener schema_version: 1 y una lista advertencias_nuevas.'));
  }

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
  const warningCandidates = [];
  const existingWarnings = Array.isArray(event?.advertencias) ? event.advertencias : [];
  const existingById = new Map(existingWarnings.map((item) => [clean(item?.advertencia_id), item]));
  const existingByFingerprint = new Map(existingWarnings.map((item) => [warningFingerprint(item), item]));
  const candidateIds = new Set();
  const candidateFingerprints = new Set();
  const knownSignalIds = new Set((event?.senales || []).map((item) => clean(item?.id)).filter(Boolean));
  const knownSourceIds = new Set((event?.fuentes || []).map((item) => clean(item?.id)).filter(Boolean));
  for (const [index, rawCandidate] of (parsed.warning_envelope.value?.advertencias_nuevas || []).entries()) {
    const candidate = normalizeWarningCandidate(rawCandidate);
    const label = `advertencias_nuevas[${index}]`;
    if (!WARNING_ID.test(candidate.advertencia_id)) blocks.push(issue('invalid-warning-id', `${label}: advertencia_id inválido`, 'Usá minúsculas, números, guiones o guiones bajos.'));
    if (!candidate.descripcion) blocks.push(issue('missing-warning-description', `${label}: falta descripción`));
    if (!WARNING_ID.test(candidate.tipo)) blocks.push(issue('invalid-warning-type', `${label}: tipo inválido`));
    if (!WARNING_TREATMENTS.includes(candidate.tratamiento_sugerido)) blocks.push(issue('invalid-warning-treatment', `${label}: tratamiento sugerido inválido`, WARNING_TREATMENTS.join(', ')));
    if (!WARNING_PRIORITIES.includes(candidate.prioridad_sugerida)) blocks.push(issue('invalid-warning-priority', `${label}: prioridad sugerida inválida`, WARNING_PRIORITIES.join(', ')));
    const unknownSignals = candidate.signal_ids.filter((signalId) => !knownSignalIds.has(signalId));
    const unknownSources = candidate.fuente_ids.filter((sourceId) => !knownSourceIds.has(sourceId));
    if (unknownSignals.length) blocks.push(issue('warning-unknown-signals', `${label}: señales inexistentes`, unknownSignals.join(', ')));
    if (unknownSources.length) blocks.push(issue('warning-unknown-sources', `${label}: fuentes inexistentes`, unknownSources.join(', ')));
    const fingerprint = warningFingerprint(candidate);
    if (candidateIds.has(candidate.advertencia_id)) blocks.push(issue('duplicate-warning-id', `${label}: advertencia_id repetido`, candidate.advertencia_id));
    if (candidateFingerprints.has(fingerprint)) blocks.push(issue('duplicate-warning-content', `${label}: advertencia repetida`, candidate.descripcion));
    candidateIds.add(candidate.advertencia_id);
    candidateFingerprints.add(fingerprint);
    const sameId = existingById.get(candidate.advertencia_id);
    const sameContent = existingByFingerprint.get(fingerprint);
    if (sameId && warningFingerprint(sameId) !== fingerprint) {
      blocks.push(issue('warning-id-conflict', `${label}: el ID ya pertenece a otra advertencia`, candidate.advertencia_id));
    }
    const existing = sameId || sameContent || null;
    warningCandidates.push({
      ...candidate,
      fingerprint_sha256: crypto.createHash('sha256').update(fingerprint).digest('hex'),
      estado_importacion: existing ? 'ya_existente' : 'pendiente_decision',
      advertencia_existente_id: existing?.advertencia_id || null,
    });
  }
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
  const editorialMarkers = [
    ...(parsed.body.match(/\[VERIFICAR(?::[^\]]+)?\]/gi) || []),
    ...(parsed.body.match(/\[(?:COMPLETAR|PENDIENTE)(?::[^\]]+)?\]/gi) || []),
    ...(parsed.body.match(/(?:^|\s)TODO\s*:/gim) || []),
  ];
  if (editorialMarkers.length) blocks.push(issue('editorial-markers-in-markdown', 'El Markdown contiene marcadores editoriales internos', 'Convertí cada problema en una advertencia estructurada y mantené limpio el texto publicable.'));
  if (/<\/?[a-z][^>]*>/i.test(parsed.body)) warnings.push(issue('raw-html', 'El cuerpo contiene HTML', 'La vista previa lo muestra como texto por seguridad; revisalo antes de aprobar.'));

  const words = parsed.body ? (parsed.body.replace(/https?:\/\/\S+/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) || []).length : 0;
  const hash = crypto.createHash('sha256').update(parsed.response_content, 'utf8').digest('hex');
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
      verification_markers: editorialMarkers.length,
      warning_candidates: warningCandidates.length,
      warning_candidates_pending: warningCandidates.filter((item) => item.estado_importacion === 'pendiente_decision').length,
    },
    warning_candidates: warningCandidates,
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
  const priorDecisions = new Map((session.respuesta_chatgpt?.advertencias_propuestas || [])
    .filter((item) => item?.decision?.hash_sha256 === validation.hash_sha256)
    .map((item) => [item.fingerprint_sha256, item.decision]));
  const warningProposals = validation.warning_candidates.map((candidate) => ({
    ...candidate,
    decision: candidate.estado_importacion === 'ya_existente'
      ? { estado: 'ya_existente', advertencia_id: candidate.advertencia_existente_id }
      : (priorDecisions.get(candidate.fingerprint_sha256) || null),
  }));
  session.estado = validated ? 'respuesta_validada' : 'respuesta_recibida';
  session.actualizado_el = receivedAt;
  session.respuesta_chatgpt = {
    recibida_el: receivedAt,
    contenido_original: String(markdown ?? ''),
    contenido_normalizado: validation.normalized_markdown,
    hash_sha256: validation.hash_sha256,
    markdown_sha256: crypto.createHash('sha256').update(validation.normalized_markdown, 'utf8').digest('hex'),
    validacion: {
      estado: validation.status,
      bloqueos: validation.blocks,
      advertencias: validation.warnings,
      informacion: validation.information,
      metadata: validation.metadata,
      metricas: validation.metrics,
      preview_html: validation.preview_html,
    },
    advertencias_propuestas: warningProposals,
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
  const pendingWarningDecisions = (response.advertencias_propuestas || [])
    .filter((item) => !['guardada', 'descartada', 'ya_existente'].includes(item?.decision?.estado));
  if (pendingWarningDecisions.length) {
    return { status: 'blocked', blocks: [issue('warning-decisions-required', 'Faltan decisiones sobre advertencias', `Gestioná ${pendingWarningDecisions.length} advertencia(s) una por una antes de aprobar el análisis.`)] };
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
      warning_candidates: response.advertencias_propuestas || [],
      normalized_markdown: response.contenido_normalizado || '',
      preview_html: response.validacion.preview_html || '',
    },
    file: { name: path.basename(file), relative_path: path.join('data', 'sesiones', path.basename(file)), operation: 'actualizado' },
    safety: session.seguridad,
  };
}

function compactTimestamp(value) {
  return String(value).replace(/[^0-9]/g, '').slice(0, 14) || Date.now().toString();
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

export function saveAnalysisWarningDecision({
  sessionsDir,
  dataPath,
  backupsDir,
  data,
  eventId,
  warningId,
  expectedHash,
  action,
  treatment,
  priority,
  notes = '',
  actor = 'usuario-local',
  decidedAt = new Date().toISOString(),
} = {}) {
  const id = clean(eventId);
  let sessionFile;
  try { sessionFile = sessionFileFor(sessionsDir, id); } catch (error) {
    return { status: 'blocked', blocks: [issue('invalid-event-id', 'macroevento_id inválido', error.message)] };
  }
  if (!fs.existsSync(sessionFile)) return { status: 'blocked', blocks: [issue('missing-session', 'No existe una sesión para gestionar advertencias')] };
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  const response = session.respuesta_chatgpt;
  if (response?.validacion?.estado !== 'ready' || response.hash_sha256 !== clean(expectedHash)) {
    return { status: 'blocked', blocks: [issue('response-changed', 'La respuesta no coincide con la validación vigente')] };
  }
  const proposals = response.advertencias_propuestas || [];
  const proposal = proposals.find((item) => item.advertencia_id === clean(warningId));
  if (!proposal) return { status: 'blocked', blocks: [issue('warning-proposal-missing', 'No existe la advertencia propuesta')] };
  if (proposal.estado_importacion === 'ya_existente') {
    proposal.decision = { estado: 'ya_existente', advertencia_id: proposal.advertencia_existente_id };
    writeSessionAtomic(sessionFile, session);
    return { status: 'ready', session, warning: null, decision: proposal.decision, backup: null };
  }
  if (!['incorporar', 'descartar'].includes(action)) return { status: 'blocked', blocks: [issue('invalid-warning-action', 'Elegí incorporar o descartar la advertencia')] };
  const selectedTreatment = action === 'descartar' ? 'irrelevante' : clean(treatment);
  if (!WARNING_TREATMENTS.includes(selectedTreatment)) return { status: 'blocked', blocks: [issue('invalid-warning-treatment', 'Elegí un tratamiento válido')] };
  if (!WARNING_PRIORITIES.includes(clean(priority))) return { status: 'blocked', blocks: [issue('invalid-warning-priority', 'Elegí una prioridad válida')] };
  if (clean(notes).length < 8) return { status: 'blocked', blocks: [issue('warning-notes-required', 'Registrá una justificación breve', 'La decisión debe dejar al menos 8 caracteres de trazabilidad editorial.')] };

  const nextData = structuredClone(data);
  const event = (nextData.macroeventos || []).find((item) => item.id === id);
  if (!event) return { status: 'blocked', blocks: [issue('missing-event', 'El macroevento ya no existe')] };
  if (!Array.isArray(event.advertencias)) event.advertencias = [];
  if (!Array.isArray(event.excepciones_advertencias)) event.excepciones_advertencias = [];
  const existing = (event.advertencias || []).find((item) => item.advertencia_id === proposal.advertencia_id);
  if (existing && warningFingerprint(existing) !== warningFingerprint(proposal)) {
    return { status: 'blocked', blocks: [issue('warning-id-conflict', 'El ID ya pertenece a otra advertencia')] };
  }
  const discarded = action === 'descartar';
  const warning = existing || {
    advertencia_id: proposal.advertencia_id,
    descripcion: proposal.descripcion,
    tipo: proposal.tipo,
    signal_ids: proposal.signal_ids,
    fuente_ids: proposal.fuente_ids,
    estado: discarded ? 'descartada' : 'pendiente',
    tratamiento: selectedTreatment,
    prioridad: clean(priority),
    creada_el: decidedAt,
    actualizada_el: decidedAt,
    resuelta_el: null,
    resuelta_con_fuente_ids: [],
    notas_editoriales: clean(notes),
    resolucion: discarded ? {
      tipo: 'decision_editorial',
      motivo: clean(notes),
      decidida_por: clean(actor),
      decidida_el: decidedAt,
      fuente_ids: [],
    } : null,
    historial: [{
      cambio_id: `hist-${proposal.advertencia_id}-${compactTimestamp(decidedAt)}`,
      accion: discarded ? 'descartada_desde_analisis' : 'incorporada_desde_analisis',
      detalle: clean(notes),
      realizada_el: decidedAt,
      realizada_por: clean(actor),
    }],
  };
  if (!existing) event.advertencias.push(warning);
  const warningValidation = validateEventWarnings(event, { path: `macroevento(${id})` });
  if (!warningValidation.valid) return { status: 'blocked', blocks: [issue('invalid-warning-result', 'La advertencia no supera el contrato interno', warningValidation.errors.join(' · '))] };
  nextData.actualizado = decidedAt.slice(0, 10);
  proposal.decision = {
    estado: discarded ? 'descartada' : 'guardada',
    accion: action,
    tratamiento: selectedTreatment,
    prioridad: clean(priority),
    notas: clean(notes),
    decidida_por: clean(actor),
    decidida_el: decidedAt,
    hash_sha256: response.hash_sha256,
  };
  session.actualizado_el = decidedAt;
  session.trazabilidad = {
    ...(session.trazabilidad || {}),
    estado: proposals.every((item) => ['guardada', 'descartada', 'ya_existente'].includes(item?.decision?.estado))
      ? 'advertencias_decididas_pendiente_aprobacion'
      : 'advertencias_pendientes_decision',
  };
  const previousData = fs.readFileSync(dataPath);
  let backup = null;
  try {
    fs.mkdirSync(backupsDir, { recursive: true });
    backup = `macroeventos-${compactTimestamp(decidedAt)}-decision-advertencia.json`;
    fs.copyFileSync(dataPath, path.join(backupsDir, backup));
    writeJsonAtomic(dataPath, nextData);
    writeSessionAtomic(sessionFile, session);
  } catch (error) {
    fs.writeFileSync(dataPath, previousData);
    return { status: 'blocked', blocks: [issue('warning-decision-write-failed', 'No se pudo guardar la decisión', error.message)] };
  }
  return { status: 'ready', session, data: nextData, warning, decision: proposal.decision, backup };
}
