// Publicación autorizada por el usuario el 15 de septiembre de 2026.
import fs from 'node:fs';
import matter from 'gray-matter';
import YAML from 'yaml';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const canonicalPath = 'centro-local/modules/observatorio/data/macroeventos.json';
const canonical = read(canonicalPath);
const dir = 'centro-local/data/publicaciones/borradores';
const posts = fs.readdirSync(dir).filter(n => n.endsWith('.md')).map(n => ({ n, ...matter.read(`${dir}/${n}`) }))
  .filter(p => p.data.schema_version === 2 && p.data.publicacion?.actualizado_el === '2026-09-15' && ['listo', 'publicado'].includes(p.data.publicacion.estado));
if (posts.length !== 50) throw new Error(`Se esperaban 50 textos revisados, encontrados: ${posts.length}`);
const ids = new Set(posts.map(p => p.data.macroevento_principal_id));
for (const p of posts) {
  p.data.publicacion.estado = 'publicado';
  p.data.publicacion.publicado_el = '2026-09-15';
  const text = '---\n' + YAML.stringify(p.data, { lineWidth: 0, defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN' }) + '---\n' + p.content;
  fs.writeFileSync(`${dir}/${p.n}`, text);
  fs.writeFileSync(`src/content/publicaciones/publicadas/${p.n}`, text);
  if (fs.existsSync(`src/content/publicaciones/_preview/${p.n}`)) fs.writeFileSync(`src/content/publicaciones/_preview/${p.n}`, text);
  const event = canonical.macroeventos.find(m => m.id === p.data.macroevento_principal_id);
  if (!event) throw new Error(p.n);
  event.estado_editorial = 'publicado';
  event.publicacion = { ...event.publicacion, ...p.data.publicacion };
}
for (const exp of canonical.expedientes_editoriales) {
  if (exp.estado === 'listo' && exp.macroevento_ids?.some(id => ids.has(id))) exp.estado = 'publicado';
}
write(canonicalPath, canonical);
for (const path of ['src/data/public/observatorio.json', 'local-preview/observatorio.json']) {
  if (!fs.existsSync(path)) continue;
  const pkg = read(path);
  for (const p of pkg.procesos.filter(p => ids.has(p.macroevento_id))) {
    p.publicacion = { ...p.publicacion, estado: 'publicado', publicado_el: '2026-09-15' };
    p.progreso_publico.etapa = 'publicado';
    p.progreso_publico.proximo_paso = 'Mantener el seguimiento e incorporar nuevas señales verificadas.';
    p.progreso_publico.hitos_completados = [...new Set([...p.progreso_publico.hitos_completados, 'Publicación autorizada'])];
  }
  write(path, pkg);
}
console.log(`Publicados ${posts.length} análisis autorizados.`);
