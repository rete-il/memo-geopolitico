import { destinationKey } from './navigation-policy.mjs';

function transformBlock(node, context) {
    if (!context.data.astro?.frontmatter?.macroevento_principal_id) return;
    const tree = { type: 'root', children: [JSON.parse(JSON.stringify(node))] };
    remarkReadingNavigation()(tree, { data: context.data });
    if (!tree.children.length) context.removeNode(node);
    else context.setProperty(node, 'children', tree.children[0].children);
}
export const readingNavigationPlugin = {
  name: 'editorial-reading-navigation',
  paragraph: transformBlock,
  heading: transformBlock,
  tableCell: transformBlock,
};

// Editorial prose remains intact. Repeated internal links become plain text;
// navigation-only paragraphs are removed when their destinations are already owned.
// External citations and distinct anchors are deliberately preserved.
export default function remarkReadingNavigation() {
  return (tree, file) => {
    const data = file.data?.astro?.frontmatter;
    if (!data?.slug || !data.macroevento_principal_id) return;
    const owned = new Set([
      destinationKey(`/publicaciones/${data.slug}/`),
      destinationKey(`/observatorio/${data.macroevento_principal_id}/`),
    ]);
    const seen = file.data.readingNavigationSeen ??= new Set(owned);
    const internal = node => node.type === 'link' && (node.url.startsWith('/') || node.url.startsWith('https://memogeopolitico.com/'));
    function visit(parent) {
      if (!parent.children) return;
      parent.children = parent.children.flatMap(node => {
        if (node.type === 'paragraph' && node.children?.some(internal) && node.children.every(child =>
          (internal(child) && seen.has(destinationKey(child.url))) ||
          (child.type === 'text' && /^[\s·|—–-]*$/.test(child.value)))) return [];
        if (internal(node)) {
          const key = destinationKey(node.url);
          if (seen.has(key)) return node.children;
          seen.add(key);
        }
        visit(node);
        return [node];
      });
    }
    visit(tree);
  };
}
