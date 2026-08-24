import assert from 'node:assert/strict';
import test from 'node:test';

import {
  languageLabel,
  normalizeCharacterization,
  normalizeLanguageCode,
} from '../public/controlled-values.js';

test('unifica variantes frecuentes de idioma como códigos ISO', () => {
  assert.equal(normalizeLanguageCode('Inglés'), 'en');
  assert.equal(normalizeLanguageCode('english'), 'en');
  assert.equal(normalizeLanguageCode('EN'), 'en');
  assert.equal(normalizeLanguageCode('Turco'), 'tr');
  assert.equal(normalizeLanguageCode('francés'), 'fr');
  assert.equal(languageLabel('en'), 'Inglés (en)');
});

test('normaliza caracterizaciones sin impedir valores nuevos', () => {
  assert.equal(normalizeCharacterization('Análisis'), 'analisis');
  assert.equal(normalizeCharacterization('Fuente institucional primaria'), 'fuente_institucional_primaria');
  assert.equal(normalizeCharacterization('Acuerdo de defensa regional'), 'acuerdo_de_defensa_regional');
});
