import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { slugify } from './public-export.mjs';

function walk(directory) {
  const result = [];
  if (!directory || !fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) result.push(fullPath);
  }
  return result;
}

function priority(file) {
  const normalized = file.replaceAll('\\', '/');
  if (normalized.includes('/03-para-aprobar/')) return 30;
  if (normalized.includes('/02-en-proceso/') && normalized.includes('/posts/')) return 20;
  if (normalized.includes('/01-borradores/') && normalized.includes('/posts/')) return 10;
  return 0;
}

export function choosePublicationFiles(directory) {
  const chosen = new Map();
  for (const file of walk(directory)) {
    if (file.includes('revision-observatorio')) continue;
    const parsed = matter.read(file);
    if (!parsed.data.macroevento_id || !parsed.data.titulo) continue;
    const id = slugify(parsed.data.slug || path.basename(file, '.md'));
    const current = chosen.get(id);
    if (!current || priority(file) > priority(current)) chosen.set(id, file);
  }
  return [...chosen.values()].sort();
}

function extractSection(body, heading) {
  const lines = body.split(/\r?\n/);
  const expected = heading.trim().toLowerCase();
  const start = lines.findIndex(
    (line) => line.replace(/^##\s+/, '').trim().toLowerCase() === expected,
  );
  if (start < 0) return '';
  const end = lines.findIndex(
    (line, index) => index > start && /^##\s+/.test(line),
  );
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join('\n')
    .trim()
    .replace(/\n{3,}/g, '\n\n');
}

function firstParagraph(body) {
  return body
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith('#') && !item.startsWith('>') && !item.startsWith('|')) || '';
}

function cleanBody(body, title, subtitle) {
  let result = body.trim();
  const lines = result.split(/\r?\n/);
  if (lines[0]?.replace(/^#\s+/, '').trim() === title.trim()) lines.shift();
  while (!lines[0]?.trim()) lines.shift();
  if (subtitle && lines[0]?.replace(/^##\s+/, '').trim() === subtitle.trim()) lines.shift();
  result = lines.join('\n').replace(
    /^>\s+\*\*Estado editorial:\*\*.*(?:\r?\n)?/im,
    '',
  );
  return `${result.trim()}\n`;
}

function sourceIdsFromBody(body, sourceByUrl) {
  const ids = [];
  for (const match of body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g)) {
    const normalized = match[1].replace(/\/$/, '');
    const id = sourceByUrl.get(normalized);
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}

function stateFromLegacy(value, file) {
  if (value === 'publicado') return 'publicado';
  if (value === 'aprobado' || value === 'listo') return 'listo';
  if (value === 'para_aprobacion' || file.replaceAll('\\', '/').includes('/03-para-aprobar/')) {
    return 'en_revision';
  }
  return 'borrador';
}

export function migratePublication(file, process, sources) {
  const parsed = matter.read(file);
  const legacy = parsed.data;
  const slug = slugify(legacy.slug || path.basename(file, '.md'));
  const sourceByUrl = new Map(
    sources
      .filter((source) => source.url)
      .map((source) => [source.url.replace(/\/$/, ''), source.fuente_id]),
  );
  const whyItMatters = extractSection(parsed.content, 'Por qué importa');
  const summary = firstParagraph(whyItMatters) || firstParagraph(parsed.content);
  const updated = String(legacy.actualizado || legacy.fecha_corte || process?.publicacion.actualizado_el || '');

  const data = {
    schema_version: 2,
    post_id: slug,
    slug,
    tipo_publicacion: 'analisis',
    titulo: String(legacy.titulo || ''),
    subtitulo: String(legacy.subtitulo || ''),
    resumen: summary.replace(/\n+/g, ' ').slice(0, 450),
    autor_ids: ['rete'],
    publicacion: {
      estado: stateFromLegacy(legacy.estado, file),
      publicado_el: null,
      actualizado_el: updated,
    },
    macroevento_principal_id: slugify(legacy.macroevento_id),
    macroevento_secundario_ids: [],
    clasificacion: process?.clasificacion || {
      tema_principal_id: null,
      tema_secundario_ids: [],
      subtema_ids: [],
      geografia: {
        alcance: 'regional',
        region_ids: [],
        subregion_ids: [],
        pais_ids: [],
        espacio_ids: [],
      },
      actor_ids: [],
      etiqueta_ids: [],
    },
    fuente_ids: sourceIdsFromBody(parsed.content, sourceByUrl),
    recurso_visual_ids: [],
    post_relacionado_ids: [],
  };

  const yaml = YAML.stringify(data, {
    lineWidth: 0,
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  }).trim();
  return {
    data,
    content: `---\n${yaml}\n---\n\n${cleanBody(
      parsed.content,
      data.titulo,
      data.subtitulo,
    )}`,
    whyItMatters,
  };
}
