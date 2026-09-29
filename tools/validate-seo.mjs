import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { geographicCatalogEntries } from './lib/seo-policy.mjs';
import { collectCanonicalRedirects } from './lib/seo-redirects.mjs';
const dir = path.resolve(process.argv[2] || 'dist');
const noindex = process.argv.includes('--noindex') || process.env.PUBLIC_NOINDEX === 'true';
const sitemap = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const opinionCatalog = JSON.parse(fs.readFileSync(new URL('../src/data/opinion/lecturas.json', import.meta.url), 'utf8'));
const publishedOpinions = opinionCatalog.filter(reading => reading.estado === 'publicado');
assert.equal(urls.includes('https://memogeopolitico.com/opinion/'), publishedOpinions.length > 0);
for (const reading of opinionCatalog) {
  const opinionPath = `/opinion/${reading.slug}/`;
  const opinionFile = path.join(dir, opinionPath, 'index.html');
  assert.equal(urls.includes(`https://memogeopolitico.com${opinionPath}`), reading.estado === 'publicado', opinionPath);
  assert.equal(fs.existsSync(opinionFile), reading.estado === 'publicado', opinionPath);
  if (reading.estado !== 'publicado') continue;
  const html = fs.readFileSync(opinionFile, 'utf8');
  assert.ok(html.includes(reading.autor.nombre), opinionPath);
  assert.ok(html.includes(`href="${reading.origen.url}"`), opinionPath);
  assert.ok(!html.includes('Pendiente de publicación'), opinionPath);
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    assert.ok(!JSON.parse(match[1])['@graph'].some(item => item['@type'] === 'Article'), `Una recomendación externa no es un Article de Memo: ${opinionPath}`);
  }
}
assert.ok(urls.length > 0);
assert.equal(new Set(urls).size, urls.length);
assert.ok(urls.includes('https://memogeopolitico.com/observatorio/rectores/'));
const redirects = collectCanonicalRedirects(dir);
const redirectMap = new Map(redirects.map(({ from, to }) => [from, to]));
const publicCatalog = JSON.parse(fs.readFileSync(new URL('../src/data/public/observatorio.json', import.meta.url), 'utf8'));
const usedGeographyIds = new Set(publicCatalog.procesos.flatMap(process =>
  Object.values(process.clasificacion.geografia).filter(Array.isArray).flat(),
));
const geographyIndex = fs.readFileSync(path.join(dir, 'regiones', 'index.html'), 'utf8');
for (const entry of geographicCatalogEntries(publicCatalog.catalogos).filter(({ item }) => usedGeographyIds.has(item.id))) {
  assert.ok(urls.includes(`https://memogeopolitico.com${entry.path}`), `Geografía canónica ausente: ${entry.path}`);
  assert.ok(geographyIndex.includes(`href="${entry.path}"`), `Índice sin destino canónico: ${entry.path}`);
  for (const alias of entry.aliases) {
    assert.equal(redirectMap.get(alias), entry.path, `Alias geográfico sin redirect: ${alias}`);
    assert.ok(!urls.includes(`https://memogeopolitico.com${alias}`), `Alias geográfico en sitemap: ${alias}`);
    assert.ok(!geographyIndex.includes(`href="${alias}"`), `Índice enlaza a alias: ${alias}`);
  }
}
for (const { from, to } of redirects) {
  const html = fs.readFileSync(path.join(dir, from, 'index.html'), 'utf8');
  assert.ok(html.includes(`rel="canonical" href="https://memogeopolitico.com${to}"`), `Canonical del alias: ${from}`);
  assert.match(html, /name="robots" content="noindex,follow"/, `Indexación del alias: ${from}`);
  assert.ok(html.includes(`http-equiv="refresh" content="0;url=${to}"`), `Fallback local del alias: ${from}`);
  assert.ok(html.includes(`href="${to}"`), `Enlace accesible del alias: ${from}`);
}
const methodologyRoot = '/metodologia/relevancia-atencion-mediatica/';
assert.ok(urls.includes(`https://memogeopolitico.com${methodologyRoot}`));
assert.ok(!urls.some(url => new URL(url).pathname.startsWith(methodologyRoot) && new URL(url).pathname !== methodologyRoot));
const methodologyDir = path.join(dir, methodologyRoot);
for (const entry of fs.readdirSync(methodologyDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const html = fs.readFileSync(path.join(methodologyDir, entry.name, 'index.html'), 'utf8');
  assert.match(html, /name="robots" content="noindex,follow"/, entry.name);
}
const netlifyRedirects = fs.readFileSync(path.join(dir, '_redirects'), 'utf8');
for (const line of netlifyRedirects.split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const [from, to, status] = line.trim().split(/\s+/);
  assert.ok(status === '301' || status === '301!', `Estado de redirect: ${from}`);
  assert.notEqual(to, '/', from);
  assert.ok(urls.includes(`https://memogeopolitico.com${to}`), `Redirect destination: ${from}`);
  assert.ok(fs.existsSync(path.join(dir, to, 'index.html')), from);
}
for (const { from, to } of redirects) {
  for (const alias of [from, from.slice(0, -1)]) {
    assert.ok(netlifyRedirects.split(/\r?\n/).some(line => line.trim() === `${alias} ${to} 301!`), `Falta redirect HTTP permanente: ${alias}`);
  }
}
let articles = 0;
const metaTitles = new Map();
for (const url of urls) {
  const address = new URL(url);
  assert.equal(address.origin, 'https://memogeopolitico.com');
  const html = fs.readFileSync(path.join(dir, decodeURIComponent(address.pathname), 'index.html'), 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${url}"`), `Canonical: ${url}`);
  assert.match(html, /<title>[^<]+<\/title>/);
  const metaTitle = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(!metaTitles.has(metaTitle), `Metatítulo duplicado: ${url} y ${metaTitles.get(metaTitle)}`);
  metaTitles.set(metaTitle, url);
  assert.match(html, /name="description" content="[^"]+"/);
  const robots = html.match(/name="robots" content="([^"]+)"/)?.[1];
  assert.equal(robots?.includes('noindex'), noindex, `Robots: ${url}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    const graph = JSON.parse(match[1])['@graph'];
    assert.ok(graph.some(item => item['@type'] === 'WebSite'));
    if (address.pathname.startsWith('/publicaciones/') && address.pathname !== '/publicaciones/') {
      const article = graph.find(item => item['@type'] === 'Article');
      assert.ok(article?.headline && article.datePublished && article.dateModified && article.author.length, url);
      assert.equal(article.url, url);
      articles++;
    }
  }
}
assert.ok(articles >= 75, 'Deben estar publicados los análisis autorizados');
assert.match(fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/memogeopolitico.com\/sitemap.xml/);
assert.match(fs.readFileSync(path.join(dir, '404.html'), 'utf8'), /noindex/);
console.log(`SEO: ${urls.length} URLs con títulos únicos; ${articles} artículos con datos estructurados; ${redirects.length} alias con redirección; noindex=${noindex}.`);
