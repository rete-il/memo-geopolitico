import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Every published article owns its presentation; no per-article opt-in is needed.
// Only presentation fields are synchronized; research, sources and signals remain independent.
export function synchronizeEditorialPresentation(root) {
  const directory = path.join(root, 'src/content/publicaciones/publicadas');
  if (!fs.existsSync(directory)) return [];
  const articles = fs.readdirSync(directory).filter(name => name.endsWith('.md'))
    .map(name => ({ name, ...matter.read(path.join(directory, name)) }))
    .filter(article => article.data.publicacion?.estado === 'publicado');
  // A process can have several articles. Its presentation follows the latest
  // publication, while each article retains its own title, summary and body.
  const byProcess = new Map();
  for (const article of [...articles].sort((a, b) =>
    String(a.data.publicacion.publicado_el || '').localeCompare(String(b.data.publicacion.publicado_el || '')) ||
    String(a.data.publicacion.actualizado_el || '').localeCompare(String(b.data.publicacion.actualizado_el || '')) ||
    a.name.localeCompare(b.name))) {
    byProcess.set(article.data.macroevento_principal_id, article);
  }
  const changed = [];
  function write(file, content) {
    if (fs.readFileSync(file, 'utf8') === content) return;
    fs.writeFileSync(file, content);
    changed.push(file);
  }
  for (const relative of ['centro-local/modules/observatorio/data/macroeventos.json', 'src/data/public/observatorio.json', 'local-preview/observatorio.json']) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const { data: article } of byProcess.values()) {
      const id = article.macroevento_principal_id;
      const event = data.macroeventos?.find(item => item.id === id);
      if (event) {
        event.descripcion = article.resumen;
        event.pregunta_seguimiento = article.subtitulo;
      }
      const process = data.procesos?.find(item => item.macroevento_id === id);
      if (process) {
        process.sintesis = article.resumen;
        process.pregunta_seguimiento = article.subtitulo;
      }
      for (const dossier of data.expedientes_editoriales || []) {
        if (dossier.estado === 'publicado' && dossier.macroevento_ids?.[0] === id) {
          dossier.pregunta_editorial = article.subtitulo;
        }
      }
    }
    write(file, JSON.stringify(data, null, 2) + '\n');
  }
  for (const { name, data: article } of articles) {
    for (const relative of ['centro-local/data/publicaciones/borradores', 'src/content/publicaciones/_preview']) {
      const file = path.join(root, relative, name);
      if (!fs.existsSync(file)) continue;
      // A published copy is derived in full; unpublished drafts are not overwritten.
      if (matter.read(file).data.publicacion?.estado !== 'publicado') continue;
      const copy = matter.read(file).data;
      if (article.post_id && copy.post_id !== article.post_id) continue;
      write(file, fs.readFileSync(path.join(directory, name), 'utf8'));
    }
  }
  return changed;
}

export function editorialPresentationIntegration(root) {
  return {
    name: 'memo-editorial-presentation',
    hooks: {
      'astro:config:setup': () => { synchronizeEditorialPresentation(root); },
      'astro:server:setup': ({ server }) => {
        const update = file => {
          if (file.replaceAll('\\', '/').includes('/src/content/publicaciones/publicadas/')) {
            synchronizeEditorialPresentation(root);
          }
        };
        server.watcher.on('change', update);
        server.watcher.on('add', update);
        server.httpServer?.once('close', () => {
          server.watcher.off('change', update);
          server.watcher.off('add', update);
        });
      },
    },
  };
}
