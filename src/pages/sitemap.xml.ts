import type { APIRoute } from 'astro';
import {
  catalog,
  processes,
  processesForActor,
  processesForRegion,
  processesForTheme,
  publicProcessesForLabel,
} from '../lib/data';
import { editorialStateDefinitions } from '../lib/editorial';
import {
  getPublicationEntries,
  publicationEntriesForLabel,
  publicationEntriesForTheme,
} from '../lib/publications';

const staticPaths = [
  '/',
  '/observatorio/',
  '/observatorio/dashboard/',
  '/observatorio/senales/',
  '/publicaciones/',
  '/recursos-visuales/',
  '/medios/',
  '/regiones/',
  '/espacios-geopoliticos/',
  '/temas/',
  '/actores/',
  '/etiquetas/',
  '/metodologia/relevancia-atencion-mediatica/',
  '/acerca-de/',
];

export const GET: APIRoute = async ({ site }) => {
  const base = site || new URL('https://memogeopolitico.com');
  const publications = await getPublicationEntries({
    includePreview: false,
    publishedOnly: true,
  });
  const geographicItems = [
    ...catalog('regiones'),
    ...catalog('subregiones'),
    ...catalog('paises_territorios'),
  ].filter((item) => processesForRegion(item.id).length > 0);
  const spaceItems = catalog('espacios_geopoliticos').filter(
    (item) => processesForRegion(item.id).length > 0,
  );
  const topicItems = [...catalog('temas'), ...catalog('subtemas')].filter(
    (item) =>
      processesForTheme(item.id).length > 0 ||
      publicationEntriesForTheme(publications, item.id).length > 0,
  );
  const actorItems = catalog('actores').filter(
    (item) => processesForActor(item.id).length > 0,
  );
  const labelItems = catalog('etiquetas').filter(
    (item) =>
      publicProcessesForLabel(item.id).length > 0 ||
      publicationEntriesForLabel(publications, item.id).length > 0,
  );
  const paths = [
    ...staticPaths,
    ...processes.map((item) => `/observatorio/${item.slug}/`),
    ...processes.map(
      (item) =>
        `/metodologia/relevancia-atencion-mediatica/${item.slug}/`,
    ),
    ...publications.map((item) => `/publicaciones/${item.data.slug}/`),
    ...editorialStateDefinitions.map(
      (item) => `/observatorio/estado/${item.slug}/`,
    ),
    ...geographicItems.map((item) => `/regiones/${item.slug}/`),
    ...spaceItems.map(
      (item) => `/espacios-geopoliticos/${item.slug}/`,
    ),
    ...topicItems.map((item) => `/temas/${item.slug}/`),
    ...actorItems.map((item) => `/actores/${item.slug}/`),
    ...labelItems.map((item) => `/etiquetas/${item.slug}/`),
  ];
  const urls = [...new Set(paths)].map(
    (path) => `<url><loc>${new URL(path, base).href}</loc></url>`,
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
