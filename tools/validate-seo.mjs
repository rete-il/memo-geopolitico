import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir = path.resolve(process.argv[2] || 'dist');
const noindex = process.argv.includes('--noindex');
const sitemap = fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.ok(urls.length > 0);
assert.equal(new Set(urls).size, urls.length);
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
