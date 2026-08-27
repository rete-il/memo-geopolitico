import fs from 'node:fs';
import path from 'node:path';

const STATE_PRIORITY = {
  borrador: 0,
  en_revision: 1,
  listo: 2,
  publicado: 3,
};

function scalar(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed || trimmed === 'null') return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function frontmatter(markdown) {
  return String(markdown).match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
}

function topLevelValue(yaml, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return scalar(yaml.match(new RegExp(`^${escaped}:\\s*(.*?)\\s*$`, 'm'))?.[1]);
}

function nestedValue(yaml, section, key) {
  const lines = yaml.split(/\r?\n/);
  const sectionIndex = lines.findIndex((line) => line.trim() === `${section}:` && !/^\s/.test(line));
  if (sectionIndex < 0) return '';
  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !/^\s/.test(line)) break;
    const match = line.match(new RegExp(`^\\s{2}${key}:\\s*(.*?)\\s*$`));
    if (match) return scalar(match[1]);
  }
  return '';
}

function topLevelList(yaml, key) {
  const lines = yaml.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index < 0) return [];
  const inline = lines[index].slice(key.length + 1).trim();
  if (inline === '[]') return [];
  if (inline.startsWith('[') && inline.endsWith(']')) {
    return inline.slice(1, -1).split(',').map(scalar).filter(Boolean);
  }
  const values = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line && !/^\s/.test(line)) break;
    const match = line.match(/^\s+-\s+(.*?)\s*$/);
    if (match) values.push(scalar(match[1]));
  }
  return values.filter(Boolean);
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(item);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [item] : [];
  });
}

function parsePublication(file) {
  const yaml = frontmatter(fs.readFileSync(file, 'utf8'));
  if (!yaml) return null;
  const state = nestedValue(yaml, 'publicacion', 'estado');
  const postId = topLevelValue(yaml, 'post_id');
  const slug = topLevelValue(yaml, 'slug');
  const principalId = topLevelValue(yaml, 'macroevento_principal_id');
  if (!postId || !principalId || !(state in STATE_PRIORITY)) return null;
  return {
    post_id: postId,
    slug,
    estado: state,
    actualizado_el: nestedValue(yaml, 'publicacion', 'actualizado_el'),
    macroevento_ids: [principalId, ...topLevelList(yaml, 'macroevento_secundario_ids')],
  };
}

function preferred(current, candidate) {
  if (!current) return candidate;
  const priority = STATE_PRIORITY[candidate.estado] - STATE_PRIORITY[current.estado];
  if (priority !== 0) return priority > 0 ? candidate : current;
  return candidate.actualizado_el > current.actualizado_el ? candidate : current;
}

function readPublicData(projectRoot) {
  const file = path.join(projectRoot, 'src', 'data', 'public', 'observatorio.json');
  if (!fs.existsSync(file)) return [];
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(payload.procesos) ? payload.procesos : [];
}

export function loadPublicExpedientStates(projectRoot) {
  const byEvent = {};
  const processByEvent = {};
  const warnings = [];
  let publicDataAvailable = false;
  let publicationsAvailable = false;

  try {
    const processes = readPublicData(projectRoot);
    publicDataAvailable = processes.length > 0;
    for (const process of processes) {
      if (process.macroevento_id) processByEvent[process.macroevento_id] = process;
      if (!process.macroevento_id || !(process.publicacion?.estado in STATE_PRIORITY)) continue;
      byEvent[process.macroevento_id] = {
        estado: process.publicacion.estado,
        actualizado_el: process.publicacion.actualizado_el || '',
        origen: 'datos_publicos',
      };
    }
  } catch (error) {
    warnings.push(`No se pudieron leer los datos públicos: ${error.message}`);
  }

  try {
    const contentRoot = path.join(projectRoot, 'src', 'content', 'publicaciones');
    const byPost = new Map();
    for (const file of markdownFiles(contentRoot)) {
      const candidate = parsePublication(file);
      if (!candidate) continue;
      byPost.set(candidate.post_id, preferred(byPost.get(candidate.post_id), candidate));
    }
    publicationsAvailable = byPost.size > 0;
    const byRelatedEvent = new Map();
    for (const publication of byPost.values()) {
      for (const eventId of publication.macroevento_ids) {
        byRelatedEvent.set(eventId, preferred(byRelatedEvent.get(eventId), publication));
      }
    }
    for (const [eventId, publication] of byRelatedEvent) {
      byEvent[eventId] = {
        estado: publication.estado,
        slug: publication.slug || byEvent[eventId]?.slug || '',
        actualizado_el: byEvent[eventId]?.actualizado_el || publication.actualizado_el,
        origen: 'publicacion_relacionada',
      };
    }
  } catch (error) {
    warnings.push(`No se pudieron leer las publicaciones: ${error.message}`);
  }

  return {
    available: publicDataAvailable || publicationsAvailable,
    by_event: byEvent,
    process_by_event: processByEvent,
    warnings,
  };
}
