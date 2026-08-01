import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { candidateFormatInstructions } from '../public/candidate-import.js';
import {
  buildSearchPrompt,
  signalsForProfile,
  suggestSources,
  topicsForProfile,
} from '../public/search-generator.js';

const readJson = (relative) => JSON.parse(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'));
const taxonomy = readJson('../data/taxonomia-temas.json');
const catalog = readJson('../data/catalogo-medios.json');
const searchConfig = readJson('../data/configuracion-busqueda.json');
const data = readJson('../data/macroeventos.json');

test('la configuración enlaza 19 ejes seleccionables y un criterio transversal', () => {
  assert.equal(searchConfig.ejes_editoriales.length, 19);
  assert.equal(searchConfig.criterios_transversales.length, 1);
  const validTopicIds = new Set(taxonomy.categorias.flatMap((category) => category.temas.map((topic) => Number(topic.id))));
  for (const profile of searchConfig.ejes_editoriales) {
    assert.ok(profile.id);
    assert.ok(profile.nombre);
    assert.ok(profile.tema_ids.length);
    assert.ok(profile.tema_ids.every((id) => validTopicIds.has(Number(id))), `${profile.id}: tema inexistente`);
    assert.ok(profile.senal_ids.every((id) => Number(id) >= 295 && Number(id) <= 314), `${profile.id}: señal fuera de la categoría`);
  }
});

test('propone 20 fuentes diversas y conserva las cuatro prioritarias', () => {
  const profile = searchConfig.ejes_editoriales.find((item) => item.id === 'corredores-logisticos');
  const sources = suggestSources({
    catalog,
    priorities: searchConfig.fuentes_prioritarias,
    profile,
    region: 'Global',
    languages: searchConfig.valores_iniciales.idiomas,
    limit: 20,
  });
  assert.equal(sources.length, 20);
  assert.deepEqual(sources.filter((item) => item.prioritaria).map((item) => item.nombre), [
    'Geopolitical Futures',
    'Chatham House',
    'Le Grand Continent',
    'The Guardian',
  ]);
  assert.equal(sources.filter((item) => item.catalogada).length, 19);
  assert.equal(sources.filter((item) => !item.catalogada).length, 1);
  assert.ok(new Set(sources.map((item) => item.region)).size >= 4);
  assert.ok(new Set(sources.map((item) => item.funcion || item.familia)).size >= 8);
});

test('una búsqueda africana incorpora fuentes con cobertura regional africana', () => {
  const profile = searchConfig.ejes_editoriales.find((item) => item.id === 'africa-competencia');
  const sources = suggestSources({
    catalog,
    priorities: searchConfig.fuentes_prioritarias,
    profile,
    region: 'África',
    languages: ['Inglés', 'Francés', 'Árabe'],
    limit: 20,
  });
  assert.ok(sources.filter((item) => /áfrica/i.test(`${item.region} ${item.perspectiva}`)).length >= 5);
});

test('genera un prompt JSON con taxonomía, fuentes e índice de los 17 macroeventos', () => {
  const profile = searchConfig.ejes_editoriales.find((item) => item.id === 'corredores-logisticos');
  const sources = suggestSources({
    catalog,
    priorities: searchConfig.fuentes_prioritarias,
    profile,
    region: 'Global',
    languages: searchConfig.valores_iniciales.idiomas,
    limit: 20,
  });
  const prompt = buildSearchPrompt({
    profile,
    region: 'Global',
    languages: searchConfig.valores_iniciales.idiomas,
    periodDays: 90,
    horizonMin: 3,
    horizonMax: 10,
    maxEvents: 15,
    topics: topicsForProfile(profile, taxonomy),
    actors: profile.actores,
    signals: signalsForProfile(profile, taxonomy),
    sources,
    existingEvents: data.macroeventos,
    transversalCriteria: searchConfig.criterios_transversales,
    outputMode: 'json',
    candidateInstructions: candidateFormatInstructions(),
  });
  assert.match(prompt, /Corredores logísticos e infraestructura estratégica/);
  assert.match(prompt, /Geopolitical Futures/);
  assert.match(prompt, /"schema_version": 2/);
  assert.match(prompt, /"accion_sugerida"/);
  assert.match(prompt, /actualizacion/);
  for (const event of data.macroeventos) assert.match(prompt, new RegExp(event.id));
});

test('el modo analítico conserva la matriz y las secciones A–E', () => {
  const profile = searchConfig.ejes_editoriales[0];
  const prompt = buildSearchPrompt({
    profile,
    region: 'Global',
    topics: topicsForProfile(profile, taxonomy),
    signals: signalsForProfile(profile, taxonomy),
    sources: [],
    existingEvents: [],
    transversalCriteria: searchConfig.criterios_transversales,
    outputMode: 'analysis',
  });
  assert.match(prompt, /Presenta una matriz/);
  assert.match(prompt, /A\. Los cinco macroeventos prioritarios/);
  assert.match(prompt, /E\. Un plan de monitoreo/);
});
