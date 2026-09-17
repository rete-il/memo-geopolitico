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
  '/observatorio/rectores/',
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
  const modified = new Map(publications.map((item) => [
    `/publicaciones/${item.data.slug}/`, item.data.publicacion.actualizado_el,
  ]));
  for (const item of processes) modified.set(`/observatorio/${item.slug}/`, item.publicacion.actualizado_el);
  const escapeXML = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const urls = [...new Set(paths)].map((path) => {
    const date = modified.get(path);
    const lastmod = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `<lastmod>${date}</lastmod>` : '';
    return `<url><loc>${escapeXML(new URL(path, base).href)}</loc>${lastmod}</url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
