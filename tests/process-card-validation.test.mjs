import assert from 'node:assert/strict';
import test from 'node:test';
import { processCardExpectations, validateProcessCards } from '../tools/lib/process-card-validation.mjs';

const process = { macroevento_id: 'id-chips', slug: 'chips', titulo: 'Chips & autonomía' };
const other = { macroevento_id: 'id-other', slug: 'other', titulo: 'Otro proceso' };
const article = (slug, options = {}) => ({
  post_id: slug, slug, titulo: slug,
  macroevento_principal_id: process.macroevento_id, macroevento_secundario_ids: [],
  publicacion: { estado: 'publicado', actualizado_el: '2026-09-01' }, ...options,
});
const main = article('chips-principal');
const secondary = article('analisis-regional', {
  titulo: 'Región & tecnología', macroevento_principal_id: other.macroevento_id,
  macroevento_secundario_ids: [process.macroevento_id],
  publicacion: { estado: 'publicado', actualizado_el: '2026-10-01' },
});
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function card({ item = process, primary = '', related = null, extra = '' } = {}) {
  const title = escape(item.titulo);
  return `<article class="process-card" data-process-card><div>
    <h2>${primary ? `<a href="/publicaciones/${primary}/">${title}</a>` : `<span>${title}</span>`}</h2>
    <p>Síntesis</p>${related ? `<p>Análisis relacionado: <a href="/publicaciones/${related.slug}/">${escape(related.titulo)}</a></p>` : ''}
    ${extra}<footer><span>Actualizado</span><a href="/observatorio/${item.slug}/">Abrir expediente <span>→</span></a></footer>
    </div><div><a href="/metodologia/relevancia-atencion-mediatica/${item.slug}/">Método</a></div></article>`;
}
const check = (html, items = [main, secondary], processes = [process], requireAll = true) =>
  validateProcessCards(html, processCardExpectations(processes, items), { source: 'fixture', requireAll });

test('valida principal publicada y no confunde el ID del proceso con su slug', () => {
  assert.deepEqual(check(card({ primary: main.slug })), {
    cards: 1, principalTitleLinks: 1, relatedLinks: 0, withoutPublication: 0,
  });
});
test('un enlace secundario más reciente no satisface el contrato del título', () => {
  assert.throws(() => check(card({ primary: secondary.slug })), /principal publicada/);
});
test('elige la principal publicada más reciente y desempata por título', () => {
  const newer = article('nueva', { titulo: 'Zeta', publicacion: { estado: 'publicado', actualizado_el: '2026-09-30' } });
  const tied = { ...newer, post_id: 'alfa', slug: 'alfa', titulo: 'Alfa' };
  assert.throws(() => check(card({ primary: main.slug }), [main, newer]), /principal publicada/);
  assert.doesNotThrow(() => check(card({ primary: tied.slug }), [newer, main, tied]));
});
test('deduplica post_id sin mutar datos ni permitir que un borrador desplace al publicado', () => {
  const draft = { ...main, slug: 'borrador', publicacion: { estado: 'borrador', actualizado_el: '2026-10-02' } };
  const data = [main, draft, secondary];
  const snapshot = structuredClone(data);
  assert.doesNotThrow(() => check(card({ primary: main.slug }), data));
  assert.deepEqual(data, snapshot);
});
test('sin principal publicada comprueba el enlace secundario separado y su título real', () => {
  assert.deepEqual(check(card({ related: secondary }), [secondary]), {
    cards: 1, principalTitleLinks: 0, relatedLinks: 1, withoutPublication: 0,
  });
});
test('rechaza un secundario bajo el título y la omisión de su enlace separado', () => {
  assert.throws(() => check(card({ primary: secondary.slug }), [secondary]), /principal publicada/);
  assert.throws(() => check(card(), [secondary]), /relacionado ausente/);
});
test('rechaza destino o texto incorrecto del análisis relacionado', () => {
  assert.throws(() => check(card({ related: { ...secondary, slug: 'otro' } }), [secondary]), /destino o título incorrecto/);
  assert.throws(() => check(card({ related: { ...secondary, titulo: 'Texto engañoso' } }), [secondary]), /destino o título incorrecto/);
});
test('borradores, listos y en revisión nunca son destinos públicos', () => {
  for (const state of ['borrador', 'en_revision', 'listo']) {
    const draft = { ...main, publicacion: { estado: state, actualizado_el: '2026-10-02' } };
    assert.doesNotThrow(() => check(card(), [draft]));
    assert.throws(() => check(card({ primary: draft.slug }), [draft]), /principal publicada/);
    assert.doesNotThrow(() => check(card({ related: secondary }), [draft, secondary]));
  }
});
test('proceso sin publicaciones mantiene solo el acceso al expediente', () => {
  assert.equal(check(card(), []).withoutPublication, 1);
});
test('enlaces ocultos o duplicados a publicaciones también fallan', () => {
  for (const slug of ['borrador-no-autorizado', main.slug]) {
    const html = card({ primary: main.slug, extra: `<a hidden href="/publicaciones/${slug}/">Extra</a>` });
    assert.throws(() => check(html), /enlace extra/);
  }
});
test('rechaza la ausencia o alteración del acceso Abrir expediente', () => {
  const valid = card({ primary: main.slug });
  assert.throws(() => check(valid.replace('Abrir expediente', 'Otro acceso')), /Abrir expediente/);
  assert.throws(() => check(valid.replace('/observatorio/chips/', '/observatorio/desconocido/')), /expediente desconocido/);
  assert.throws(() => check(valid.replace('/observatorio/chips/', '/observatorio/other/'), [main], [process, other]), /título y expediente/);
});
test('rechaza tarjetas repetidas, incompletas y expedientes que faltan', () => {
  const valid = card({ primary: main.slug });
  assert.throws(() => check(valid + valid), /tarjeta duplicada/);
  assert.throws(() => check(valid.replace('</article>', '')), /estructura/);
  assert.throws(() => check(''), /exactamente los expedientes/);
  assert.throws(() => check(valid.replace('<h2>', '<h3>').replace('</h2>', '</h3>')), /título h2/);
});
test('detecta dos destinos intercambiados aunque el total de enlaces siga siendo correcto', () => {
  const otherArticle = article('other-main', { macroevento_principal_id: other.macroevento_id });
  const html = card({ primary: otherArticle.slug }) + card({ item: other, primary: main.slug });
  assert.throws(() => check(html, [main, otherArticle], [process, other]), /principal publicada/);
});
test('los subconjuntos de categorías son válidos sin debilitar el control del archivo completo', () => {
  const html = card({ primary: main.slug });
  assert.doesNotThrow(() => check(html, [main], [process, other], false));
  assert.throws(() => check(html, [main], [process, other]), /exactamente los expedientes/);
});
test('acepta entidades HTML y comillas simples e ignora ejemplos en comentarios y scripts', () => {
  const html = card({ primary: main.slug }).replaceAll('&amp;', '&#x26;').replaceAll('"', "'");
  assert.doesNotThrow(() => check(`<!--${card()}--><script>${card()}</script>${html}`));
});
test('no confunde atributos parecidos con data-process-card ni acepta un relacionado adicional', () => {
  assert.throws(() => check(card({ primary: main.slug }).replace('data-process-card', 'data-process-card-other')), /exactamente los expedientes/);
  assert.throws(() => check(card({ primary: main.slug, related: secondary })), /relacionado ausente o inesperado/);
});
