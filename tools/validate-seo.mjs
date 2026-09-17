import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir = path.resolve(process.argv[2] || 'dist');
const noindex = process.argv.includes('--noindex');
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
const methodologyRoot = '/metodologia/relevancia-atencion-mediatica/';
assert.ok(urls.includes(`https://memogeopolitico.com${methodologyRoot}`));
assert.ok(!urls.some(url => new URL(url).pathname.startsWith(methodologyRoot) && new URL(url).pathname !== methodologyRoot));
const methodologyDir = path.join(dir, methodologyRoot);
for (const entry of fs.readdirSync(methodologyDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const html = fs.readFileSync(path.join(methodologyDir, entry.name, 'index.html'), 'utf8');
  assert.match(html, /name="robots" content="noindex,follow"/, entry.name);
}
for (const line of fs.readFileSync(path.join(dir, '_redirects'), 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const [from, to, status] = line.trim().split(/\s+/);
  assert.equal(status, '301', from);
  assert.notEqual(to, '/', from);
  assert.ok(urls.includes(`https://memogeopolitico.com${to}`), `Redirect destination: ${from}`);
  assert.ok(fs.existsSync(path.join(dir, to, 'index.html')), from);
}
let articles = 0;
for (const url of urls) {
  const address = new URL(url);
  assert.equal(address.origin, 'https://memogeopolitico.com');
  const html = fs.readFileSync(path.join(dir, decodeURIComponent(address.pathname), 'index.html'), 'utf8');
  assert.ok(html.includes(`rel="canonical" href="${url}"`), `Canonical: ${url}`);
  assert.match(html, /<title>[^<]+<\/title>/);
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
console.log(`SEO: ${urls.length} URLs válidas; ${articles} artículos con datos estructurados; noindex=${noindex}.`);
