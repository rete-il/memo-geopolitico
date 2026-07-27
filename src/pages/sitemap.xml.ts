import type { APIRoute } from 'astro';
import {
  catalog,
  processes,
} from '../lib/data';
import { getPublicationEntries } from '../lib/publications';

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
  const paths = [
    ...staticPaths,
    ...processes.map((item) => `/observatorio/${item.slug}/`),
    ...processes.map(
      (item) =>
        `/metodologia/relevancia-atencion-mediatica/${item.slug}/`,
    ),
    ...publications.map((item) => `/publicaciones/${item.data.slug}/`),
    ...catalog('regiones').map((item) => `/regiones/${item.slug}/`),
    ...catalog('subregiones').map((item) => `/regiones/${item.slug}/`),
    ...catalog('paises_territorios').map((item) => `/regiones/${item.slug}/`),
    ...catalog('espacios_geopoliticos').map(
      (item) => `/espacios-geopoliticos/${item.slug}/`,
    ),
    ...catalog('temas').map((item) => `/temas/${item.slug}/`),
    ...catalog('subtemas').map((item) => `/temas/${item.slug}/`),
    ...catalog('actores').map((item) => `/actores/${item.slug}/`),
    ...catalog('etiquetas').map((item) => `/etiquetas/${item.slug}/`),
  ];
  const urls = [...new Set(paths)].map(
    (path) => `<url><loc>${new URL(path, base).href}</loc></url>`,
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
