import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  effectiveEditorialState,
  relatedPublicationForProcess,
  relatedPublicationsForProcess,
} from '../src/lib/editorial.ts';

const process = { macroevento_id: 'semiconductores', publicacion: { estado: 'borrador' } };
const entry = (slug, {
  primary = process.macroevento_id,
  secondary = [],
  state = 'publicado',
  date = '2026-09-01',
} = {}) => ({
  data: {
    post_id: slug, slug, titulo: slug,
    macroevento_principal_id: primary,
    macroevento_secundario_ids: secondary,
    publicacion: { estado: state, actualizado_el: date },
  },
});
const main = entry('semiconductores');
const secondary = entry('analisis-regional', {
  primary: 'otro-proceso', secondary: [process.macroevento_id], date: '2026-10-01',
});
const unrelated = entry('no-relacionado', { primary: 'otro', date: '2026-10-02' });

// Exercise the actual dependency-free selection block used by the Astro component.
// Full Astro rendering remains part of qa:production, not this unit-test harness.
const component = readFileSync(new URL('../src/components/ProcessCard.astro', import.meta.url), 'utf8');
const frontmatter = component.split('\n---')[0];
const newStart = frontmatter.indexOf('const suppliedPublishedPrimary');
const start = newStart >= 0 ? newStart : frontmatter.indexOf('const publicationEntries');
assert.ok(start >= 0, 'ProcessCard must contain its publication-selection block');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const selectInCard = new AsyncFunction(
  'process', 'suppliedRelatedPublication', 'suppliedEditorialState',
  'getPublicationEntries', 'relatedPublicationForProcess', 'effectiveEditorialState',
  `${frontmatter.slice(start)}\nreturn {
    publicationHref, editorialState,
    relatedPublicationHref: typeof relatedPublicationHref === 'undefined' ? '' : relatedPublicationHref,
  };`,
);
async function card(entries, supplied, state) {
  const calls = [];
  const result = await selectInCard(
    process, supplied, state,
    async options => { calls.push(options); return entries; },
    relatedPublicationForProcess, effectiveEditorialState,
  );
  return { ...result, calls };
}

test('published principal wins over a newer secondary publication, regardless of input order', () => {
  for (const entries of [[secondary, main], [main, secondary]]) {
    assert.equal(relatedPublicationForProcess(process, entries), main);
  }
});
test('latest published principal wins among multiple principal articles', () => {
  const newer = entry('principal-nuevo', { date: '2026-09-30' });
  assert.equal(relatedPublicationForProcess(process, [main, secondary, newer]), newer);
});
test('a newer draft never displaces an authorized principal article', () => {
  const draft = entry('borrador', { state: 'borrador', date: '2026-10-02' });
  assert.equal(relatedPublicationForProcess(process, [draft, secondary, main]), main);
});
test('a published secondary remains available when there is no published principal', () => {
  for (const state of ['borrador', 'en_revision', 'listo']) {
    const draft = entry(state, { state, date: '2026-10-02' });
    assert.equal(relatedPublicationForProcess(process, [draft, secondary]), secondary);
  }
});
test('unrelated publications and empty collections never invent an association', () => {
  assert.equal(relatedPublicationForProcess(process, [unrelated]), undefined);
  assert.equal(relatedPublicationForProcess(process, []), undefined);
});
test('selection does not mutate the collection or change related-list date ordering', () => {
  const entries = [main, secondary, unrelated];
  const snapshot = structuredClone(entries);
  relatedPublicationForProcess(process, entries);
  assert.deepEqual(entries, snapshot);
  assert.deepEqual(relatedPublicationsForProcess(process, entries), [secondary, main]);
});
test('secondary publication does not promote the editorial state of a principal draft', () => {
  const draft = entry('en-revision', { state: 'en_revision' });
  assert.equal(effectiveEditorialState(process, [draft, secondary]), 'en_revision');
});
test('card title points to the published principal, never the newer regional analysis', async () => {
  const result = await card([secondary, main]);
  assert.equal(result.publicationHref, '/publicaciones/semiconductores/');
  assert.equal(result.relatedPublicationHref, '');
  assert.equal(result.editorialState, 'publicado');
});
test('preselected secondary and precomputed state cannot bypass principal selection', async () => {
  const result = await card([main, secondary], secondary, 'publicado');
  assert.equal(result.publicationHref, '/publicaciones/semiconductores/');
  assert.equal(result.calls.length, 1);
});
test('a preselected published principal retains the existing no-reload optimization', async () => {
  const result = await card([], main, 'publicado');
  assert.equal(result.publicationHref, '/publicaciones/semiconductores/');
  assert.equal(result.calls.length, 0);
});
test('preselected draft is re-evaluated and cannot hide an authorized principal', async () => {
  const draft = entry('borrador', { state: 'borrador', date: '2026-10-02' });
  const result = await card([main, secondary, draft], draft);
  assert.equal(result.publicationHref, '/publicaciones/semiconductores/');
  assert.equal(result.calls.length, 1);
});
test('an unrelated preselected article is not linked under the process title', async () => {
  const result = await card([main, secondary], unrelated, 'publicado');
  assert.equal(result.publicationHref, '/publicaciones/semiconductores/');
});
test('published secondary receives a separate related link, not the process-title link', async () => {
  const draft = entry('principal-pendiente', { state: 'en_revision' });
  const result = await card([draft, secondary], secondary, 'en_revision');
  assert.equal(result.publicationHref, '');
  assert.equal(result.relatedPublicationHref, '/publicaciones/analisis-regional/');
  assert.equal(result.editorialState, 'en_revision');
});
test('unpublished principal and secondary articles generate no public article links', async () => {
  for (const state of ['borrador', 'en_revision', 'listo']) {
    const principal = entry('principal-pendiente', { state });
    const related = entry('relacionado-pendiente', {
      primary: 'otro-proceso', secondary: [process.macroevento_id], state,
    });
    const result = await card([principal, related]);
    assert.equal(result.publicationHref, '');
    assert.equal(result.relatedPublicationHref, '');
  }
});
test('a process without a publication keeps both article URLs empty', async () => {
  const result = await card([]);
  assert.equal(result.publicationHref, '');
  assert.equal(result.relatedPublicationHref, '');
  assert.equal(result.editorialState, 'borrador');
});
test('template distinguishes the secondary link and preserves the dossier link', () => {
  const heading = component.match(/<h2>([\s\S]*?)<\/h2>/)?.[1] || '';
  assert.match(heading, /href=\{publicationHref\}/);
  assert.doesNotMatch(heading, /relatedPublicationHref/);
  assert.match(component, /Análisis relacionado:/);
  assert.match(component, /href=\{relatedPublicationHref\}/);
  assert.ok(component.includes('href={`/observatorio/${process.slug}/`}'));
  assert.match(component, /publicationTitle=\{primaryPublication\?\.data\.titulo \|\| process\.titulo\}/);
});
