// @ts-check
import { defineConfig } from 'astro/config';
import { canonicalRedirectsIntegration } from './tools/lib/seo-redirects.mjs';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { editorialPresentationIntegration } from './tools/lib/editorial-presentation.mjs';
import { satteri } from '@astrojs/markdown-satteri';
import { readingNavigationPlugin } from './tools/lib/remark-reading-navigation.mjs';
import { publicationHeadingsPlugin } from './tools/lib/publication-headings.mjs';
import { createPublicationBibliographyPlugin } from './tools/lib/publication-bibliography.mjs';

const bibliographyDatasets = new Map();
/** @param {{ publicacion?: { estado?: string } }} publication */
function bibliographySources(publication) {
  const files = ['src/data/public/observatorio.json'];
  if (publication.publicacion?.estado !== 'publicado') {
    // Public CI does not require the private editorial-preview package.
    if (!fs.existsSync(new URL('local-preview/observatorio.json', import.meta.url))) return null;
    files.push('local-preview/observatorio.json');
  }
  return files.flatMap(file => {
    const location = new URL(file, import.meta.url);
    const modified = fs.statSync(location).mtimeMs;
    const cached = bibliographyDatasets.get(file);
    if (cached?.modified !== modified) bibliographyDatasets.set(file, { modified, sources: JSON.parse(fs.readFileSync(location, 'utf8')).fuentes });
    return bibliographyDatasets.get(file).sources;
  });
}

export default defineConfig({
  site: 'https://memogeopolitico.com',
  output: 'static',
  trailingSlash: 'always',
  markdown: { processor: satteri({ mdastPlugins: [publicationHeadingsPlugin, readingNavigationPlugin, createPublicationBibliographyPlugin(bibliographySources)] }) },
  integrations: [editorialPresentationIntegration(fileURLToPath(new URL('.', import.meta.url))), canonicalRedirectsIntegration()],
  vite: {
    plugins: [tailwindcss()],
  },
});
