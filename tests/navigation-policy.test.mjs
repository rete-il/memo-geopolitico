import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationKey, uniqueDestinations, signalHref, sameText } from '../tools/lib/navigation-policy.mjs';
import remarkReadingNavigation, { readingNavigationPlugin } from '../tools/lib/remark-reading-navigation.mjs';
import { markdownToHtml } from 'satteri';

test('el procesador real aplica la política sin perder énfasis ni citas', async () => {
  const { html } = await markdownToHtml('[Consultar expediente](/observatorio/proceso/)\n\nUna **prueba** [externa](https://example.org).', {
    mdastPlugins: [readingNavigationPlugin],
    data: { astro: { frontmatter: { slug: 'articulo', macroevento_principal_id: 'proceso' } } },
  });
  assert.ok(!html.includes('Consultar expediente'));
  assert.ok(html.includes('<strong>prueba</strong>'));
  assert.ok(html.includes('https://example.org'));
});

test('destinos: variantes del sitio se agrupan, anclas y consultas distintas se conservan', () => {
  assert.equal(destinationKey('/observatorio/a/'), destinationKey('https://memogeopolitico.com/observatorio/a'));
  const items = ['/actual/', '/observatorio/a/', 'https://memogeopolitico.com/observatorio/a', '/observatorio/a/#fuentes', '/observatorio/a/#cronologia', '/buscar/?q=uno', '/buscar/?q=dos'].map(href => ({ href }));
  assert.equal(uniqueDestinations(items, '/actual/').length, 5);
  assert.equal(signalHref('a','senal-1'),'/observatorio/a/#senal-1');
  assert.ok(sameText('Resumen\n claro', 'Resumen claro'));
  assert.ok(!sameText('Resumen','Otra evidencia'));
});

test('Markdown: navegación redundante se elimina sin perder prosa, citas ni destinos precisos', () => {
  const link = (url, value) => ({ type:'link', url, children:[{type:'text',value}] });
  const p = (...children) => ({type:'paragraph', children});
  const tree = {type:'root', children:[
    p(link('/observatorio/proceso/','Consultar expediente')),
    p({type:'text',value:'Contexto: '},link('/publicaciones/otro/','análisis general')),
    p(link('/publicaciones/otro/','Volver al rector')),
    p(link('/observatorio/proceso/#senal','señal concreta')),
    p(link('https://example.org/paper','cita')),
    p(link('https://example.org/paper','bibliografía')),
  ]};
  remarkReadingNavigation()(tree,{data:{astro:{frontmatter:{slug:'articulo',macroevento_principal_id:'proceso'}}}});
  assert.equal(tree.children.length,4);
  assert.equal(tree.children[0].children[0].value,'Contexto: ');
  assert.equal(tree.children[1].children[0].url,'/observatorio/proceso/#senal');
  assert.equal(tree.children[2].children[0].url,tree.children[3].children[0].url);
});
