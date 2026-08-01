const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const unique = (values) => [...new Set(values.filter(Boolean))];

function words(value) {
  const ignored = new Set(['a', 'al', 'como', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'y']);
  return normalizeText(value).split(/[^a-z0-9]+/).filter((item) => item.length > 2 && !ignored.has(item));
}

function sourceDomain(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function catalogSelection(record, priority = false) {
  return {
    selection_id: record.media_id,
    media_id: record.media_id,
    catalogada: true,
    prioritaria: priority,
    nombre: record.nombre,
    url: record.url,
    region: record.region,
    idioma: record.idioma,
    familia: record.familia,
    funcion: record.funcion,
    perspectiva: record.perspectiva,
    puntuacion: Number(record.puntuacion || 0),
    estado: record.estado,
    razon: priority ? 'Fuente prioritaria de base y registrada en el catálogo.' : '',
  };
}

function externalSelection(priority) {
  return {
    selection_id: `externa:${priority.id}`,
    media_id: '',
    catalogada: false,
    prioritaria: true,
    nombre: priority.nombre,
    url: priority.url,
    region: 'Global',
    idioma: '',
    familia: 'Fuente prioritaria externa',
    funcion: '',
    perspectiva: '',
    puntuacion: 0,
    estado: 'No catalogada',
    razon: 'Fuente prioritaria de base; todavía no figura en el catálogo.',
  };
}

function sourceScore(record, context) {
  let score = Number(record.puntuacion || 0) * 10;
  const reasons = [];
  const state = normalizeText(record.estado);
  if (state === 'activo') {
    score += 10;
    reasons.push('activa');
  } else if (state.includes('nuevo recomendado')) {
    score += 8;
    reasons.push('recomendada');
  } else if (state.includes('uso condicionado')) {
    score -= 5;
  } else if (state.includes('secundario')) {
    score -= 10;
  }

  const haystack = normalizeText([
    record.nombre,
    record.sede,
    record.region,
    record.idioma,
    record.familia,
    record.funcion,
    record.perspectiva,
    record.uso,
    record.observaciones,
  ].join(' '));

  if (normalizeText(context.region) !== 'global') {
    const regionWords = words(context.region);
    const matches = regionWords.filter((term) => haystack.includes(term));
    if (matches.length) {
      score += 22 + matches.length * 3;
      reasons.push(`cobertura ${context.region}`);
    }
  } else if (haystack.includes('global')) {
    score += 5;
    reasons.push('alcance global');
  }

  const languageMatches = context.languages.filter((language) => {
    const tokens = words(language);
    return tokens.some((token) => haystack.includes(token));
  });
  if (languageMatches.length) {
    score += 8 + Math.min(6, languageMatches.length * 2);
    reasons.push(`idioma ${languageMatches[0]}`);
  }

  const termMatches = (context.profile?.terminos_fuentes || [])
    .filter((term) => words(term).some((token) => haystack.includes(token)));
  if (termMatches.length) {
    score += Math.min(16, termMatches.length * 4);
    reasons.push(`afinidad: ${termMatches.slice(0, 2).join(', ')}`);
  }

  return { score, reasons };
}

function diversityBonus(record, selected) {
  const dimensions = ['region', 'familia', 'funcion', 'perspectiva'];
  return dimensions.reduce((bonus, field) => {
    const value = normalizeText(record[field]);
    if (!value) return bonus;
    const alreadyPresent = selected.some((item) => normalizeText(item[field]) === value);
    return bonus + (alreadyPresent ? 0 : field === 'perspectiva' ? 3 : 5);
  }, 0);
}

export function suggestSources({
  catalog = { records: [] },
  priorities = [],
  profile = {},
  region = 'Global',
  languages = [],
  limit = 20,
} = {}) {
  const boundedLimit = Math.max(1, Math.min(100, Number(limit || 20)));
  const records = Array.isArray(catalog.records) ? catalog.records : [];
  const byId = new Map(records.map((item) => [item.media_id, item]));
  const byDomain = new Map(records.map((item) => [sourceDomain(item.url), item]).filter(([domain]) => domain));
  const selected = [];
  const selectedIds = new Set();

  for (const priority of priorities) {
    const matched = (priority.media_id && byId.get(priority.media_id)) || byDomain.get(sourceDomain(priority.url));
    const item = matched ? catalogSelection(matched, true) : externalSelection(priority);
    if (!item.url || selectedIds.has(item.selection_id)) continue;
    selected.push(item);
    selectedIds.add(item.selection_id);
  }

  const context = { profile, region, languages };
  const pool = records
    .filter((record) => record.url && !selectedIds.has(record.media_id) && normalizeText(record.estado) !== 'excluir')
    .map((record) => {
      const assessment = sourceScore(record, context);
      return { record, ...assessment };
    });

  while (selected.length < boundedLimit && pool.length) {
    pool.sort((left, right) => {
      const leftTotal = left.score + diversityBonus(left.record, selected);
      const rightTotal = right.score + diversityBonus(right.record, selected);
      return rightTotal - leftTotal || String(left.record.nombre).localeCompare(String(right.record.nombre), 'es');
    });
    const chosen = pool.shift();
    const item = catalogSelection(chosen.record, false);
    item.razon = chosen.reasons.length
      ? `Seleccionada por ${chosen.reasons.join(', ')} y diversidad del conjunto.`
      : 'Seleccionada por calidad y diversidad del conjunto.';
    selected.push(item);
    selectedIds.add(item.selection_id);
  }

  return selected.slice(0, boundedLimit);
}

export function topicIndex(taxonomy = { categorias: [] }) {
  return new Map((taxonomy.categorias || []).flatMap((category) => (category.temas || []).map((topic) => [
    Number(topic.id),
    { ...topic, categoria_nombre: category.nombre },
  ])));
}

export function topicsForProfile(profile = {}, taxonomy = { categorias: [] }) {
  const index = topicIndex(taxonomy);
  return unique((profile.tema_ids || []).map(Number))
    .map((id) => index.get(id))
    .filter(Boolean);
}

export function signalsForProfile(profile = {}, taxonomy = { categorias: [] }) {
  const index = topicIndex(taxonomy);
  return unique((profile.senal_ids || []).map(Number))
    .map((id) => index.get(id))
    .filter(Boolean);
}

function existingEventsIndex(events = []) {
  return events.map((event) => {
    const aliases = unique([...(event.palabras_clave || []), ...(event.actores || [])]).slice(0, 8);
    return `- ${event.id} | ${event.titulo} | ${(event.regiones || []).join(', ') || 'sin región'}${aliases.length ? ` | alias: ${aliases.join(', ')}` : ''}`;
  }).join('\n');
}

function analysisOutputInstructions() {
  return `## Formato de salida

Presenta una matriz ordenada por relevancia estratégica con estas columnas:
1. Macroevento.
2. Tratamiento sugerido: nuevo, actualización, sin novedad, relacionado o compuesto.
3. ID del macroevento existente cuando corresponda.
4. Tipo de evolución: continuidad, avance, aceleración, bloqueo, reversión, cambio de alcance, cambio de actores, contradicción o sin novedad.
5. Región.
6. Categoría geopolítica.
7. Descripción del proceso estructural.
8. Acontecimientos recientes que actúan como señales.
9. Actores principales.
10. Intereses en juego.
11. Horizonte temporal.
12. Escenarios de evolución.
13. Indicadores que deben monitorearse.
14. Impacto potencial, probabilidad de continuidad y gap mediático, de 1 a 5.
15. Nivel de confianza.
16. Fuentes, fechas y enlaces directos.

Después de la matriz incluye:
A. Los cinco macroeventos prioritarios y su posible efecto sobre el equilibrio geopolítico.
B. Los eventos subcubiertos.
C. Las señales débiles.
D. Las conexiones sistémicas.
E. Un plan de monitoreo con palabras clave, actores, países, organismos, fuentes, frecuencia y umbrales de alerta.`;
}

export function buildSearchPrompt({
  profile = {},
  region = 'Global',
  languages = [],
  periodDays = 90,
  horizonMin = 3,
  horizonMax = 10,
  maxEvents = 15,
  topics = [],
  actors = [],
  signals = [],
  sources = [],
  existingEvents = [],
  transversalCriteria = [],
  outputMode = 'analysis',
  candidateInstructions = '',
} = {}) {
  const topicLines = topics.map((topic) => `- [${topic.id}] ${topic.nombre}`).join('\n') || '- Sin subtemas preseleccionados.';
  const actorLines = unique(actors).map((actor) => `- ${actor}`).join('\n') || '- Sin actores preseleccionados.';
  const signalLines = signals.map((signal) => `- ${signal.nombre}`).join('\n') || '- Sin señales preseleccionadas.';
  const sourceLines = sources.map((source) => {
    const origin = source.catalogada ? `catalogada: ${source.media_id}` : 'no catalogada';
    return `- ${source.nombre} — ${source.url} — ${origin}${source.region ? ` — ${source.region}` : ''}`;
  }).join('\n') || '- No se seleccionaron fuentes.';
  const criteriaLines = transversalCriteria.map((criterion) => `- ${criterion.nombre}: ${criterion.descripcion}`).join('\n');
  const outputInstructions = outputMode === 'json'
    ? `${candidateInstructions}

CAMPOS ADICIONALES PARA TRATAR COINCIDENCIAS
En cada candidato incluye además:
- "accion_sugerida": "nuevo", "actualizacion", "sin_novedad", "relacionado" o "compuesto".
- "macroevento_existente_id": ID exacto del índice anterior o cadena vacía.
- "tipo_evolucion": "continuidad", "avance", "aceleracion", "bloqueo", "reversion", "cambio_alcance", "cambio_actores", "contradiccion" o "sin_novedad".
- "justificacion_tratamiento": explicación breve basada en las señales y fuentes.
- "cambios_propuestos": objeto que contenga únicamente los campos principales cuya modificación sea material.

No descartes una actualización solo porque coincida con un proceso existente. Conserva las nuevas señales y publicaciones dentro de ese candidato.`
    : analysisOutputInstructions();

  return `Actúa como analista senior de prospectiva geopolítica, inteligencia estratégica y detección temprana de riesgos.

Tu tarea es identificar macroeventos geopolíticos emergentes, recurrentes o en maduración que puedan producir impactos significativos en el mediano y largo plazo, aunque actualmente reciban poca cobertura mediática.

## Parámetros de búsqueda

- Eje editorial principal: ${profile.nombre || 'Sin eje seleccionado'}.
- Tipo de eje: ${profile.clase || 'eje_tematico'}.
- Región o ámbito geográfico: ${region}.
- Horizonte temporal de impacto: ${horizonMin}–${horizonMax} años.
- Período de publicaciones a revisar: últimos ${periodDays} días.
- Idiomas: ${languages.join(' / ') || 'sin restricción'}.
- Número máximo de macroeventos: ${maxEvents}.

## Subtemas prioritarios

${topicLines}

## Actores prioritarios

${actorLines}

## Señales tempranas orientativas

${signalLines}

## Fuentes seleccionadas

Revisa prioritariamente las siguientes fuentes, sin limitar la investigación a ellas. Contrasta perspectivas y utiliza fuentes primarias cuando existan. Las fuentes nuevas son admisibles, pero deben identificarse como no catalogadas.

${sourceLines}

## Criterios editoriales transversales

${criteriaLines || '- Distingue relevancia estratégica de volumen de cobertura.'}

## Definición de macroevento geopolítico

Considera macroevento un proceso, tendencia, decisión, conflicto o cambio estructural que cumpla varias de estas condiciones:
1. Modifica relaciones de poder entre Estados, bloques, empresas estratégicas o actores no estatales.
2. Afecta recursos críticos, rutas comerciales, energía, infraestructura, tecnología, seguridad, finanzas o gobernanza.
3. Puede propagarse entre países, sectores o regiones.
4. Produce efectos persistentes, acumulativos o difíciles de revertir.
5. Puede reaparecer mediante crisis, negociaciones, sanciones, protestas, elecciones, incidentes militares o cambios regulatorios.
6. Presenta señales tempranas que todavía no constituyen una crisis abierta.
7. Está subrepresentado en los medios generalistas respecto de su importancia potencial.
8. Puede crear ganadores y perdedores geopolíticos identificables.
9. Altera alianzas, dependencias, cadenas de suministro o autonomía estratégica.
10. Mantiene relevancia durante al menos ${horizonMin} años.

## Metodología

1. Revisa simultáneamente el conjunto de fuentes seleccionado.
2. No te limites a noticias sobre crisis abiertas: usa informes, análisis, documentos públicos, editoriales, estudios, discursos y publicaciones institucionales.
3. Agrupa manifestaciones distintas del mismo proceso estructural.
4. Distingue evento puntual, tendencia recurrente y macroproceso estructural.
5. Descarta noticias anecdóticas, declaraciones sin consecuencias verificables, especulación sin evidencia, hechos puramente domésticos sin proyección, duplicados y procesos cuyo impacto probable termine antes de doce meses.
6. Señala las inferencias y no las presentes como hechos confirmados.
7. Incluye el título identificable, fecha y URL HTTPS directa de cada publicación.
8. Vincula cada señal con una o más publicaciones que la sustenten.
9. Ordena por relevancia estratégica, no por cantidad de noticias.

## Comparación con el Observatorio

Compara cada resultado con este índice de macroeventos existentes:

${existingEventsIndex(existingEvents) || '- El Observatorio no contiene macroeventos.'}

Clasifica cada resultado como:
- nuevo: proceso autónomo no registrado;
- actualizacion: mismo proceso con nuevas señales, fuentes o un cambio material;
- sin_novedad: no aporta evidencia o modificación material;
- relacionado: comparte elementos, pero tiene dinámica propia;
- compuesto: mezcla dos o más procesos y debe separarse.

No crees otro macroevento cuando el resultado solo actualiza uno existente. Si la coincidencia es dudosa, decláralo y no inventes un ID.

## Evaluación

Asigna de 1 a 5: impacto, probabilidad, alcance, persistencia, propagación, subcobertura, incertidumbre y urgencia. Calcula de forma comparativa:
- relevancia estratégica = impacto × persistencia × alcance × probabilidad;
- gap mediático = relevancia estratégica estimada ÷ cobertura observada.

Estos índices son criterios editoriales, no mediciones científicas.

${outputInstructions}`.trim();
}
