import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectHomeContent } from '../src/lib/home.ts';

const options = { featuredPostId: 'preferido', latestLimit: 2, themeIds: ['tema-b', 'tema-a'] };
const theme = (id, name, state = 'activo') => ({ id, nombre: name, slug: id, estado: state, orden: 1 });
const entry = (id, date, { title = id, state = 'publicado', updated = date } = {}) => ({
  id, data: {
    post_id: id, slug: id, titulo: title, subtitulo: 'Subtítulo canónico.', resumen: 'Resumen completo.',
    publicacion: { estado: state, publicado_el: date, actualizado_el: updated },
    clasificacion: { tema_principal_id: 'tema-a' }, macroevento_principal_id: 'proceso-a',
  },
});
const corpus = (publications, extra = {}) => ({
  publications, processes: [], themes: [], sourceById: new Map(), ...extra,
});
const ids = (views) => views.map((view) => view.publication.data.post_id);

test('el destacado manual publicado conserva el contenido canónico y no se repite en últimas', () => {
  const preferred = entry('preferido', '2026-01-01');
  const input = corpus([entry('nuevo', '2026-02-01'), preferred]);
  const result = selectHomeContent(input, options);
  assert.strictEqual(result.featured.publication, preferred);
  assert.equal(result.featured.publication.data.resumen, 'Resumen completo.');
  assert.deepEqual(ids(result.latest), ['nuevo']);
});

test('un destacado ausente o no publicado utiliza el publicado más reciente', () => {
  for (const manual of [undefined, entry('preferido', '2026-03-01', { state: 'borrador' })]) {
    const result = selectHomeContent(corpus([
      entry('antiguo', '2026-01-01'), entry('nuevo', '2026-02-01'), ...(manual ? [manual] : []),
    ]), options);
    assert.equal(result.featured.publication.data.post_id, 'nuevo');
    assert.deepEqual(ids(result.latest), ['antiguo']);
    assert.equal(result.counts.publications, 2);
  }
});

test('últimas usa publicación, mantiene los empates estables y respeta el límite', () => {
  const input = corpus([
    entry('z', '2026-02-01', { title: 'Zeta', updated: '2026-04-01' }),
    entry('sin-fecha', null, { updated: '2026-05-01' }),
    entry('antiguo', '2026-01-01', { updated: '2026-06-01' }),
    entry('a', '2026-02-01', { title: 'Alfa' }),
    entry('preferido', '2025-12-01'),
  ]);
  const originalOrder = input.publications.map((item) => item.data.post_id);
  const result = selectHomeContent(input, options);
  assert.deepEqual(ids(result.latest), ['a', 'z']);
  assert.deepEqual(input.publications.map((item) => item.data.post_id), originalOrder);
  const complete = selectHomeContent(input, { ...options, latestLimit: 10 });
  assert.deepEqual(ids(complete.latest), ['a', 'z', 'antiguo', 'sin-fecha']);
});

test('el catálogo de portada excluye borradores, revisiones y textos listos sin publicar', () => {
  const result = selectHomeContent(corpus([
    entry('publico', '2026-01-01'),
    ...['borrador', 'en_revision', 'listo'].map((state) => entry(state, '2026-03-01', { state })),
  ]), options);
  assert.equal(result.featured.publication.data.post_id, 'publico');
  assert.deepEqual(result.latest, []);
  assert.equal(result.counts.publications, 1);
});

test('las familias conservan nombres canónicos y orden configurado sin duplicados ni destinos inactivos', () => {
  const a = theme('tema-a', 'Nombre del catálogo A');
  const b = theme('tema-b', 'Nombre del catálogo B');
  const result = selectHomeContent(corpus([], { themes: [a, b, theme('inactivo', 'Antiguo', 'inactivo')] }), {
    ...options, themeIds: ['tema-b', 'tema-a', 'tema-b', 'inactivo', 'ausente'],
  });
  assert.deepEqual(result.themes, [b, a]);
  assert.strictEqual(result.themes[0], b);
});

test('un corpus vacío no genera destacados, evaluaciones ni destinos temáticos', () => {
  const result = selectHomeContent(corpus([]), options);
  assert.equal(result.featured, undefined);
  assert.equal(result.evaluation, undefined);
  assert.deepEqual(result.latest, []);
  assert.deepEqual(result.themes, []);
  assert.deepEqual(result.counts, { publications: 0, observatory: 0, rectors: 0 });
});

test('los expedientes pausados y archivados permanecen disponibles y los rectores forman un subconjunto', () => {
  const processes = [
    { macroevento_id: 'rector-pausado', estado_seguimiento: 'pausado', es_macroevento_rector: true },
    { macroevento_id: 'proceso-en-seguimiento', estado_seguimiento: 'en_seguimiento', es_macroevento_rector: false },
    { macroevento_id: 'proceso-archivado', estado_seguimiento: 'archivado', es_macroevento_rector: false },
  ];
  const result = selectHomeContent(corpus([], { processes }), options);
  assert.deepEqual(result.counts, { publications: 0, observatory: 3, rectors: 1 });
  assert.ok(result.counts.rectors <= result.counts.observatory);
});

test('solo un fundamento público verificable del destacado habilita la valoración', () => {
  const data = JSON.parse(fs.readFileSync(new URL('../src/data/public/observatorio.json', import.meta.url), 'utf8'));
  const process = data.procesos.find((item) => item.fundamento_evaluacion);
  assert.ok(process, 'El corpus conserva el ejemplo documentado de evaluación.');
  const publication = entry('preferido', '2026-01-01');
  publication.data.macroevento_principal_id = process.macroevento_id;
  const sourceById = new Map(data.fuentes.map((source) => [source.fuente_id, source]));
  const select = (candidate, sources = sourceById) =>
    selectHomeContent(corpus([publication], { processes: [candidate], sourceById: sources }), options);
  const valid = select(process);
  assert.strictEqual(valid.evaluation.basis, process.fundamento_evaluacion);
  assert.equal(valid.evaluation.origins.length, new Set(process.fundamento_evaluacion.atencion.muestra.map((piece) => piece.origen_editorial)).size);
  const changed = structuredClone(process);
  changed.valoraciones.relevancia_geopolitica += .1;
  assert.equal(select(changed).evaluation, undefined);
  const sourceId = process.fundamento_evaluacion.atencion.muestra[0].fuente_id;
  const pendingSources = new Map(sourceById);
  pendingSources.set(sourceId, { ...sourceById.get(sourceId), estado_verificacion: 'pendiente' });
  assert.equal(select(process, pendingSources).evaluation, undefined);
  assert.equal(select({ ...process, fundamento_evaluacion: undefined }).evaluation, undefined);
});
