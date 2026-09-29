function headingText(node) {
  if (typeof node.value === 'string') return node.value;
  return (node.children || []).map(headingText).join('');
}

function normalizedText(value) {
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

// Publication templates own the page title. A repeated Markdown title is
// redundant; other first-level headings remain as sections with their content.
export const publicationHeadingsPlugin = {
  name: 'publication-heading-hierarchy',
  heading(node, context) {
    const title = context.data.astro?.frontmatter?.titulo;
    if (node.depth !== 1 || typeof title !== 'string' || !title.trim()) return;
    if (normalizedText(headingText(node)) === normalizedText(title)) {
      context.removeNode(node);
    } else {
      context.setProperty(node, 'depth', 2);
    }
  },
};
