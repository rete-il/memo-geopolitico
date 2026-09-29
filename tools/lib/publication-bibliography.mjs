function textContent(node) {
  return typeof node.value === 'string' ? node.value : (node.children || []).map(textContent).join('');
}

export function sourceUrlKey(value) {
  try { return new URL(value).href; } catch { return String(value || '').trim(); }
}

export function publicationSourceErrors(publication, sources) {
  const byId = new Map(sources.map(source => [source.fuente_id, source]));
  const errors = [];
  for (const id of publication.fuente_ids || []) {
    const source = byId.get(id);
    if (!source) errors.push(`fuente inexistente (${id})`);
    else if (publication.publicacion?.estado === 'publicado' && source.estado_verificacion !== 'verificada') {
      errors.push(`fuente sin verificación pública (${id})`);
    }
  }
  return errors;
}

export function resolvePublicationSources(publication, sources) {
  const errors = publicationSourceErrors(publication, sources);
  if (errors.length) throw new Error(`${publication.slug || publication.post_id}: ${errors.join('; ')}`);
  const byId = new Map(sources.map(source => [source.fuente_id, source]));
  return (publication.fuente_ids || []).map(id => byId.get(id));
}

function sourceListItem(source) {
  const metadata = [source.medio, source.fecha].filter(Boolean).join(' · ');
  return {
    type: 'listItem', spread: false, children: [{
      type: 'paragraph', children: [
        { type: 'link', url: source.url, children: [{ type: 'text', value: source.titulo || source.medio }] },
        ...(metadata ? [{ type: 'text', value: ` — ${metadata}` }] : []),
      ],
    }],
  };
}

// Keep the article's notes and citations. Only bibliography sections are moved;
// the reading text and its links are never treated as redundant bibliography.
export function unifyPublicationBibliography(tree, sources) {
  const body = [];
  const sections = [];
  let section;
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth <= 2) {
      section = undefined;
      if (/^Fuentes(?:\s|$)/iu.test(textContent(node).trim())) {
        section = { heading: node, children: [] };
        sections.push(section);
        continue;
      }
    }
    (section ? section.children : body).push(node);
  }

  const bibliography = [];
  const seen = new Set();
  const definitions = new Map(tree.children.filter(node => node.type === 'definition')
    .map(node => [node.identifier.toLowerCase(), node.url]));
  function deduplicateLinks(node) {
    if (!node.children) return;
    node.children = node.children.flatMap(child => {
      const url = child.type === 'link' ? child.url : child.type === 'linkReference'
        ? definitions.get(child.identifier.toLowerCase()) : undefined;
      if (url && /^https?:\/\//i.test(url)) {
        const key = sourceUrlKey(url);
        if (seen.has(key)) return child.children || [{ type: 'text', value: child.label || child.identifier }];
        seen.add(key);
      }
      deduplicateLinks(child);
      return [child];
    });
  }
  for (const item of sections) {
    // Named subsections carry editorial scope (for example, an enlargement's
    // sources). Preserve their labels and anchors beneath the one final heading.
    if (!/^Fuentes$/iu.test(textContent(item.heading).trim())) {
      bibliography.push({ ...item.heading, depth: 3 });
    }
    for (const node of item.children) {
      deduplicateLinks(node);
      bibliography.push(node);
    }
  }
  const additions = [];
  for (const source of sources) {
    const key = sourceUrlKey(source.url);
    if (seen.has(key)) continue;
    seen.add(key);
    additions.push(sourceListItem(source));
  }
  if (additions.length) bibliography.push({ type: 'list', ordered: false, spread: false, children: additions });
  if (bibliography.length) {
    body.push({ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Fuentes' }], data: { hProperties: { id: 'fuentes' } } }, ...bibliography);
  }
  tree.children = body;
  return tree;
}

// Satteri exposes node visitors rather than a root visitor. The first block
// obtains its document root and applies the transformation once per compile.
export function createPublicationBibliographyPlugin(loadSources) {
  function transform(node, context) {
    const publication = context.data.astro?.frontmatter;
    if (!publication?.macroevento_principal_id || context.data.publicationBibliographyApplied) return;
    const catalog = loadSources(publication);
    if (!catalog) {
      if (publication.publicacion?.estado === 'publicado') throw new Error(`${publication.slug}: falta el catálogo público de fuentes`);
      return;
    }
    let root = node;
    while (context.parent(root)) root = context.parent(root);
    if (root.type !== 'root') return;
    context.data.publicationBibliographyApplied = true;
    const sources = resolvePublicationSources(publication, catalog);
    const tree = unifyPublicationBibliography(JSON.parse(JSON.stringify(root)), sources);
    context.setProperty(root, 'children', tree.children);
  }
  return { name: 'publication-bibliography', paragraph: transform, heading: transform, list: transform, html: transform };
}
