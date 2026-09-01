import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'public', 'observatorio.json'), 'utf8'));
const out = path.join(root, 'notion-export', 'produccion');
const clean = (value) => String(value ?? '').trim();
const lines = (values = []) => values.length ? values.map((value) => `- ${clean(value)}`).join('\n') : '_Sin datos publicados._';

function render(process) {
  const signals = (process.senales || []).map((item) => `### ${clean(item.titulo)}\n\n- **Fecha:** ${clean(item.fecha) || '—'}\n- **Verificación:** ${clean(item.estado_verificacion) || '—'}\n- **Propietario canónico:** \`${clean(item.propietario_macroevento_id)}\`\n\n${clean(item.resumen)}`).join('\n\n') || '_Sin señales publicadas._';
  const relations = (process.relaciones_tipadas || []).map((item) => `- **${clean(item.tipo)}** · \`${clean(item.origen_id)}\` → \`${clean(item.destino_id)}\`: ${clean(item.mecanismo)}`).join('\n') || '_Sin relaciones tipadas publicadas._';
  const scenarios = process.escenarios || {};
  return `# ${clean(process.titulo)}\n\n> Expediente público exportado desde la misma proyección utilizada por el sitio en producción.\n\n## Síntesis\n\n${clean(process.sintesis) || clean(process.que_esta_ocurriendo) || '_Sin síntesis publicada._'}\n\n## Por qué importa\n\n${clean(process.por_que_importa) || '_Sin contenido publicado._'}\n\n## Estado\n\n- **ID:** \`${clean(process.macroevento_id)}\`\n- **Seguimiento:** ${clean(process.estado_seguimiento) || '—'}\n- **Publicación:** ${clean(process.publicacion?.estado) || '—'}\n- **Actualizado:** ${clean(process.publicacion?.actualizado_el) || '—'}\n- **Macroevento rector:** ${process.es_macroevento_rector ? 'Sí' : 'No'}\n- **Rector asociado:** ${clean(process.macroevento_rector_id) || 'Ninguno'}\n\n## Indicadores de seguimiento\n\n${lines(process.indicadores_seguimiento)}\n\n## Escenarios\n\n### Base\n${clean(scenarios.base) || '_Sin contenido publicado._'}\n\n### Adverso\n${clean(scenarios.adverso) || '_Sin contenido publicado._'}\n\n### Transformador\n${clean(scenarios.transformador) || '_Sin contenido publicado._'}\n\n## Señales verificadas\n\n${signals}\n\n## Relaciones tipadas\n\n${relations}\n\n## Expedientes relacionados\n\n${lines(process.macroevento_relacionado_ids?.map((id) => `\`${id}\``))}\n`;
}

for (const process of source.procesos || []) {
  const folder = process.es_macroevento_rector ? 'macroeventos-rectores' : 'expedientes';
  const target = path.join(out, folder);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, `${process.macroevento_id}.md`), render(process), 'utf8');
}

console.log(JSON.stringify({
  rectores: source.procesos.filter((item) => item.es_macroevento_rector).length,
  expedientes: source.procesos.filter((item) => !item.es_macroevento_rector).length,
  output: out,
}));
