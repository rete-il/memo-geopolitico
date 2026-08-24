const normalizeLookup = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ');

export const LANGUAGE_OPTIONS = [
  ['ar', 'Árabe'],
  ['de', 'Alemán'],
  ['en', 'Inglés'],
  ['es', 'Español'],
  ['fa', 'Persa / farsi'],
  ['fr', 'Francés'],
  ['he', 'Hebreo'],
  ['it', 'Italiano'],
  ['pt', 'Portugués'],
  ['ru', 'Ruso'],
  ['tr', 'Turco'],
  ['zh', 'Chino'],
];

const LANGUAGE_ALIASES = new Map([
  ['ara', 'ar'], ['arabic', 'ar'], ['arabe', 'ar'],
  ['deu', 'de'], ['ger', 'de'], ['german', 'de'], ['aleman', 'de'],
  ['eng', 'en'], ['english', 'en'], ['ingles', 'en'],
  ['spa', 'es'], ['spanish', 'es'], ['espanol', 'es'], ['castellano', 'es'],
  ['fas', 'fa'], ['per', 'fa'], ['farsi', 'fa'], ['persian', 'fa'], ['persa', 'fa'],
  ['fra', 'fr'], ['fre', 'fr'], ['french', 'fr'], ['frances', 'fr'],
  ['heb', 'he'], ['hebrew', 'he'], ['hebreo', 'he'],
  ['ita', 'it'], ['italian', 'it'], ['italiano', 'it'],
  ['por', 'pt'], ['portuguese', 'pt'], ['portugues', 'pt'],
  ['rus', 'ru'], ['russian', 'ru'], ['ruso', 'ru'],
  ['tur', 'tr'], ['turkish', 'tr'], ['turco', 'tr'],
  ['zho', 'zh'], ['chi', 'zh'], ['chinese', 'zh'], ['chino', 'zh'],
]);

for (const [code, label] of LANGUAGE_OPTIONS) {
  LANGUAGE_ALIASES.set(code, code);
  LANGUAGE_ALIASES.set(normalizeLookup(label), code);
}

export function normalizeLanguageCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const key = normalizeLookup(raw);
  if (LANGUAGE_ALIASES.has(key)) return LANGUAGE_ALIASES.get(key);
  if (/^[a-z]{2}$/i.test(raw)) return raw.toLowerCase();
  return raw;
}

export function languageLabel(value) {
  const code = normalizeLanguageCode(value);
  const option = LANGUAGE_OPTIONS.find(([candidate]) => candidate === code);
  return option ? `${option[1]} (${code})` : code;
}

export function normalizeCharacterization(value) {
  return normalizeLookup(value).replace(/\s+/g, '_');
}
