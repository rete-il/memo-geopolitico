import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'centro-local', 'modules', 'observatorio', 'data', 'macroeventos.json');
const outputDir = path.join(root, 'notion-export', 'expedientes');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const clean = (value) => String(value ?? '').trim();
const list = (values = []) => values.length ? values.map((value) => `- ${clean(value)}`).join('\n') : '_Sin datos._';
const score = (value) => value === null || value === undefined || value === '' ? '—' : value;

function render(event) {
  const rectors = event.macroevento_rector_ids?.length
    ? event.macroevento_rector_ids
    : event.macroevento_rector_id ? [event.macroevento_rector_id] : [];
  const signals = (event.senales || []).map((item) => [
    `### ${clean(item.titulo) || clean(item.id)}`,
    `- **Fecha:** ${clean(item.fecha) || '—'}`,
    `- **Tipo:** ${clean(item.tipo) || '—'}`,
    `- **Estado:** ${clean(item.estado_revision) || '—'}`,
    `- **Propietario canónico:** \`${clean(item.propietario_macroevento_id) || clean(event.id)}\``,
    clean(item.descripcion),
  ].filter(Boolean).join('\n')).join('\n\n') || '_Sin señales._';
  const sources = (event.fuentes || []).map((item) => {
    const title = clean(item.titulo) || clean(item.id);
    const link = clean(item.url) ? `[${title}](${clean(item.url)})` : title;
    return `- ${link} — ${clean(item.medio) || 'Medio no indicado'} (${clean(item.fecha) || 'sin fecha'}; ${clean(item.estado_verificacion) || 'sin estado'})`;
  }).join('\n') || '_Sin fuentes._';
  const typedRelations = (source.relaciones_macroeventos || [])
    .filter((item) => item.origen_id === event.id || item.destino_id === event.id)
    .map((item) => `- **${clean(item.tipo)}** · \`${clean(item.origen_id)}\` → \`${clean(item.destino_id)}\`: ${clean(item.mecanismo)} (estado: ${clean(item.estado_revision)}; evidencia: ${(item.evidencia_senal_ids || []).map((id) => `\`${id}\``).join(', ') || 'sin señal causal asignada'})`)
    .join('\n') || '_Sin relaciones tipadas._';

  return `---
macroevento_id: "${clean(event.id)}"
titulo: "${clean(event.titulo).replaceAll('"', '\\"')}"
es_macroevento_rector: ${Boolean(event.es_macroevento_rector)}
macroevento_rector_ids: [${rectors.map((id) => `"${clean(id)}"`).join(', ')}]
estado_editorial: "${clean(event.estado_editorial)}"
estado_verificacion: "${clean(event.estado_verificacion)}"
fecha_corte: "${clean(event.fecha_corte)}"
fuente_original: "centro-local/modules/observatorio/data/macroeventos.json"
---

# ${clean(event.titulo)}

> Copia derivada para lectura y sincronización con Notion. El expediente original no fue modificado.

## Identificación

- **ID:** \`${clean(event.id)}\`
- **Tipo:** ${clean(event.tipo_proceso) || '—'}
- **Estado editorial:** ${clean(event.estado_editorial) || '—'}
- **Estado de verificación:** ${clean(event.estado_verificacion) || '—'}
- **Fecha de corte:** ${clean(event.fecha_corte) || '—'}
- **Macroevento rector:** ${event.es_macroevento_rector ? 'Sí' : 'No'}
- **Rectores asociados:** ${rectors.length ? rectors.map((id) => `\`${clean(id)}\``).join(', ') : 'Ninguno'}

## Descripción

${clean(event.descripcion) || '_Sin descripción._'}

## Por qué importa

${clean(event.por_que_importa) || '_Sin contenido._'}

## Clasificación

### Regiones
${list(event.regiones)}

### Actores
${list(event.actores)}

### Intereses
${list(event.intereses)}

### Palabras clave
${list(event.palabras_clave)}

## Horizonte

- **Mínimo:** ${score(event.horizonte?.min_anios)} años
- **Máximo:** ${score(event.horizonte?.max_anios)} años

## Escenarios

### Base
${clean(event.escenarios?.base) || '_Sin contenido._'}

### Adverso
${clean(event.escenarios?.adverso) || '_Sin contenido._'}

### Transformador
${clean(event.escenarios?.transformador) || '_Sin contenido._'}

## Indicadores de seguimiento

${list(event.indicadores)}

## Evaluación

- **Impacto:** ${score(event.evaluacion?.impacto)}
- **Probabilidad:** ${score(event.evaluacion?.probabilidad)}
- **Alcance:** ${score(event.evaluacion?.alcance)}
- **Persistencia:** ${score(event.evaluacion?.persistencia)}
- **Propagación:** ${score(event.evaluacion?.propagacion)}
- **Urgencia:** ${score(event.evaluacion?.urgencia)}
- **Incertidumbre:** ${score(event.evaluacion?.incertidumbre)}
- **Confianza:** ${clean(event.evaluacion?.confianza) || '—'}

## Señales

${signals}

## Fuentes

${sources}

## Expedientes relacionados

${list(event.macroevento_relacionado_ids?.map((id) => `\`${clean(id)}\``))}

## Relaciones tipadas

${typedRelations}
`;
}

fs.mkdirSync(outputDir, { recursive: true });
const events = [...(source.macroeventos || [])].sort((a, b) => clean(a.id).localeCompare(clean(b.id), 'es'));
for (const event of events) fs.writeFileSync(path.join(outputDir, `${event.id}.md`), render(event), 'utf8');

const rectors = events.filter((event) => event.es_macroevento_rector);
const index = `# Expedientes geopolíticos\n\nExportación derivada de \`centro-local/modules/observatorio/data/macroeventos.json\`. Los archivos originales no fueron modificados.\n\n- **Total:** ${events.length}\n- **Macroeventos rectores:** ${rectors.length}\n- **Generado:** 2026-09-01\n\n## Macroeventos rectores\n\n${rectors.map((event) => `- [${event.titulo}](./${event.id}.md)`).join('\n')}\n\n## Todos los expedientes\n\n${events.map((event) => `- [${event.titulo}](./${event.id}.md)`).join('\n')}\n`;
fs.writeFileSync(path.join(outputDir, 'README.md'), index, 'utf8');
console.log(JSON.stringify({ outputDir, expedientes: events.length, rectores: rectors.length }));
