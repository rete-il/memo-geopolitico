import assert from 'node:assert/strict';

// Independent expectations from public data: do not reuse the selector under test.
export function processCardExpectations(processes, publications) {
  const byPostId = new Map();
  for (const publication of publications) {
    if (publication.publicacion?.estado !== 'publicado') continue;
    const previous = byPostId.get(publication.post_id);
    if (!previous || publication.publicacion.actualizado_el > previous.publicacion.actualizado_el) {
      byPostId.set(publication.post_id, publication);
    }
  }
  const published = [...byPostId.values()].sort((a, b) =>
    b.publicacion.actualizado_el.localeCompare(a.publicacion.actualizado_el) ||
    a.titulo.localeCompare(b.titulo, 'es'),
  );
  const expectations = new Map();
  for (const process of processes) {
    const route = `/observatorio/${process.slug}/`;
    assert.ok(!expectations.has(route), `Expediente duplicado: ${route}`);
    const primary = published.find(item => item.macroevento_principal_id === process.macroevento_id);
    const related = primary ? undefined : published.find(item =>
      (item.macroevento_secundario_ids || []).includes(process.macroevento_id),
    );
    expectations.set(route, {
      title: process.titulo,
      primaryHref: primary ? `/publicaciones/${primary.slug}/` : '',
      relatedHref: related ? `/publicaciones/${related.slug}/` : '',
      relatedTitle: related?.titulo || '',
    });
  }
  return expectations;
}

function decode(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, name) => {
    if (name[0] === '#') {
      const hex = name[1].toLowerCase() === 'x';
      const point = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
      return point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }[name.toLowerCase()];
  });
}
const normalize = text => text.replace(/\s+/g, ' ').trim();
const textContent = html => normalize(decode(html.replace(/<[^>]*>/g, '')));
const href = attributes => {
  const match = attributes.match(/(?:^|\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match ? decode(match[1] ?? match[2] ?? match[3]) : null;
};
const anchors = html => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)]
  .map(match => ({ href: href(match[1]), text: textContent(match[2]) }));

// This checks the controlled static ProcessCard template, not arbitrary HTML.
// Unexpected/missing card, heading or footer structure fails closed.
export function validateProcessCards(html, expectations, { source = 'HTML', requireAll = false } = {}) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const marker = /(?:^|\s)data-process-card(?:\s|=|$)/i;
  const openings = [...clean.matchAll(/<article\b([^>]*)>/gi)]
    .filter(match => marker.test(match[1]));
  const cards = [...clean.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article\s*>/gi)]
    .filter(match => marker.test(match[1]));
  assert.equal(cards.length, openings.length, `${source}: estructura de tarjeta incompleta`);
  const seen = new Set();
  let principalTitleLinks = 0;
  let relatedLinks = 0;
  for (const [, , body] of cards) {
    const footers = [...body.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer\s*>/gi)];
    assert.equal(footers.length, 1, `${source}: cada tarjeta debe tener un pie`);
    const dossierLinks = anchors(footers[0][1]).filter(link => /^Abrir expediente(?:\s|$)/.test(link.text));
    assert.equal(dossierLinks.length, 1, `${source}: debe conservarse un acceso a Abrir expediente`);
    const route = dossierLinks[0].href;
    const expected = expectations.get(route);
    assert.ok(expected, `${source}: expediente desconocido o destino incorrecto: ${route}`);
    assert.ok(!seen.has(route), `${source}: tarjeta duplicada: ${route}`);
    seen.add(route);
    const context = `${source} [${route}]`;
    const headings = [...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2\s*>/gi)];
    assert.equal(headings.length, 1, `${context}: se esperaba un único título h2`);
    assert.equal(textContent(headings[0][1]), normalize(expected.title), `${context}: título y expediente no coinciden`);
    const titleLinks = anchors(headings[0][1]).map(link => link.href);
    assert.deepEqual(titleLinks, expected.primaryHref ? [expected.primaryHref] : [],
      `${context}: el título debe enlazar solo a su principal publicada`);
    const relatedParagraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)]
      .filter(match => /^Análisis relacionado:/.test(textContent(match[1])));
    assert.equal(relatedParagraphs.length, expected.relatedHref ? 1 : 0,
      `${context}: enlace relacionado ausente o inesperado`);
    if (expected.relatedHref) {
      assert.deepEqual(anchors(relatedParagraphs[0][1]), [{
        href: expected.relatedHref, text: normalize(expected.relatedTitle),
      }], `${context}: destino o título incorrecto del análisis relacionado`);
    }
    const publicationLinks = anchors(body).filter(link => link.href?.includes('/publicaciones/'))
      .map(link => link.href);
    const allowed = [expected.primaryHref || expected.relatedHref].filter(Boolean);
    assert.deepEqual(publicationLinks, allowed,
      `${context}: enlace extra, duplicado o a una publicación no autorizada`);
    if (expected.primaryHref) principalTitleLinks++;
    if (expected.relatedHref) relatedLinks++;
  }
  if (requireAll) {
    assert.deepEqual([...seen].sort(), [...expectations.keys()].sort(),
      `${source}: el archivo debe contener exactamente los expedientes públicos`);
  }
  return { cards: cards.length, principalTitleLinks, relatedLinks,
    withoutPublication: cards.length - principalTitleLinks - relatedLinks };
}
