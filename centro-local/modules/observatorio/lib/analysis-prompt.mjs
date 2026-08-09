import fs from 'node:fs';
import path from 'node:path';

export const ANALYSIS_PROMPT_TEMPLATE_ID = 'memo-analisis-completo';
export const ANALYSIS_PROMPT_TEMPLATE_VERSION = '1.0';

const clean = (value) => String(value ?? '').trim();
const unique = (values) => [...new Set((values || []).map(clean).filter(Boolean))];

function validEventId(value) {
  return /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/.test(clean(value));
}

function yamlScalar(value) {
  return JSON.stringify(clean(value));
}

function yamlList(values, indent = '  ') {
  const entries = unique(values);
  return entries.length ? entries.map((value) => `${indent}- ${yamlScalar(value)}`).join('\n') : `${indent}[]`;
}

function classificationYaml(classification = {}) {
  const geography = classification.geografia || {};
  return [
    `  tema_principal_id: ${yamlScalar(classification.tema_principal_id || '')}`,
    '  tema_secundario_ids:',
    yamlList(classification.tema_secundario_ids, '    '),
    '  subtema_ids:',
    yamlList(classification.subtema_ids, '    '),
    '  geografia:',
    `    alcance: ${yamlScalar(geography.alcance || 'transfronterizo')}`,
    '    region_ids:',
    yamlList(geography.region_ids, '      '),
    '    subregion_ids:',
    yamlList(geography.subregion_ids, '      '),
    '    pais_ids:',
    yamlList(geography.pais_ids, '      '),
    '    espacio_ids:',
    yamlList(geography.espacio_ids, '      '),
    '  actor_ids:',
    yamlList(classification.actor_ids, '    '),
    '  etiqueta_ids:',
    yamlList(classification.etiqueta_ids, '    '),
  ].join('\n');
}

function linkedAssignment(data, eventId) {
  return (data?.expedientes_editoriales || [])
    .filter((item) => item?.macroevento_ids?.includes(eventId))
    .sort((left, right) => clean(right.actualizado).localeCompare(clean(left.actualizado)))[0] || null;
}

function catalogMetadata(source, catalog) {
  const record = (catalog?.records || []).find((item) => item.media_id === source.media_id);
  if (!record) return 'Medio no catalogado; conservar la cautela indicada en las observaciones.';
  return [
    record.familia ? `familia ${record.familia}` : '',
    record.region ? `región mediática ${record.region}` : '',
    record.perspectiva ? `perspectiva ${record.perspectiva}` : '',
    record.confianza ? `confianza ${record.confianza}` : '',
    record.corroboracion ? `corroboración ${record.corroboracion}` : '',
  ].filter(Boolean).join('; ');
}

function sourceBlocks(sources, catalog) {
  if (!sources.length) {
    return 'No hay fuentes verificadas. No redactes afirmaciones factuales: devolvé un borrador de estructura con marcadores [VERIFICAR].';
  }
  return sources.map((source, index) => [
    `${index + 1}. ${source.medio || 'Fuente sin nombre'}: “${source.titulo || 'Sin título'}”`,
    `   - fuente_id: ${source.id}`,
    `   - Fecha: ${source.fecha || 'sin fecha'}`,
    `   - URL: ${source.url || 'sin URL'}`,
    `   - Tipo e idioma: ${source.tipo || 'sin clasificar'} · ${source.idioma || 'sin consignar'}`,
    `   - Contexto del medio: ${catalogMetadata(source, catalog)}`,
    `   - Observaciones editoriales: ${clean(source.observaciones) || 'ninguna'}`,
  ].join('\n')).join('\n\n');
}

function signalBlocks(signals, verifiedSourceIds) {
  if (!signals.length) return '- No hay señales revisadas respaldadas por fuentes verificadas.';
  return signals.map((signal) => {
    const evidence = (signal.fuente_ids || []).filter((id) => verifiedSourceIds.has(id));
    return `- ${signal.fecha || 'sin fecha'} — ${signal.titulo || 'Señal sin título'}: ${signal.descripcion || 'sin descripción'} [senal_id: ${signal.id}; fuentes: ${evidence.join(', ')}]`;
  }).join('\n');
}

function excludedBlocks(pendingSources, pendingSignals) {
  const lines = [];
  for (const source of pendingSources) {
    lines.push(`- Fuente reservada: ${source.id} · ${source.medio || 'sin medio'} · ${source.titulo || 'sin título'}`);
  }
  for (const signal of pendingSignals) {
    lines.push(`- Señal reservada: ${signal.id} · ${signal.titulo || 'sin título'}`);
  }
  return lines.length ? lines.join('\n') : '- No hay elementos pendientes reservados.';
}

function analysisFrontmatter({ eventId, sourceIds, classification, generatedAt }) {
  return `---
schema_version: 2
post_id: "[PROPONER-ID-NUEVO-Y-UNICO]"
slug: "[PROPONER-SLUG-NUEVO-Y-UNICO]"
tipo_publicacion: "analisis"
titulo: "[PROPONER]"
subtitulo: "[PROPONER]"
resumen: "[PROPONER-UNA-SINTESIS-AUTONOMA]"
autor_ids:
  - "rete"
publicacion:
  estado: "borrador"
  publicado_el: null
  actualizado_el: "${generatedAt}"
macroevento_principal_id: "${eventId}"
macroevento_secundario_ids: []
clasificacion:
${classificationYaml(classification)}
fuente_ids:
${yamlList(sourceIds)}
recurso_visual_ids: []
post_relacionado_ids: []
---`;
}

export function buildAnalysisPrompt({
  data,
  catalog = {},
  eventId,
  followupProposal,
  publicExpedients = {},
  editorialFocus = '',
  warningJustification = '',
  generatedAt = new Date().toISOString().slice(0, 10),
} = {}) {
  const id = clean(eventId);
  const matches = Array.isArray(data?.macroeventos)
    ? data.macroeventos.filter((event) => event?.id === id)
    : [];
  if (!validEventId(id) || matches.length !== 1) {
    return {
      status: 'blocked',
      macroevento_id: id,
      blocks: [{
        code: !id ? 'missing-event-id' : matches.length > 1 ? 'duplicate-event' : 'missing-event',
        title: !id ? 'Falta macroevento_id' : matches.length > 1 ? 'macroevento_id duplicado' : 'Macroevento no encontrado',
      }],
    };
  }
  if (followupProposal?.status !== 'ready' || followupProposal.macroevento_id !== id) {
    return {
      status: 'blocked',
      macroevento_id: id,
      blocks: [{
        code: 'followup-proposal-required',
        title: 'Falta una propuesta de seguimiento válida',
        detail: 'Generá primero la propuesta del mismo macroevento para conservar la identidad y la clasificación pública.',
      }],
    };
  }

  const event = matches[0];
  const assignment = linkedAssignment(data, id);
  const verifiedSources = (event.fuentes || []).filter((source) => source.estado_verificacion === 'verificada');
  const verifiedSourceIds = new Set(verifiedSources.map((source) => source.id));
  const eligibleSignals = (event.senales || []).filter((signal) => (
    signal.estado_revision !== 'pendiente'
    && (signal.fuente_ids || []).some((sourceId) => verifiedSourceIds.has(sourceId))
  ));
  const pendingSources = (event.fuentes || []).filter((source) => source.estado_verificacion !== 'verificada');
  const eligibleSignalIds = new Set(eligibleSignals.map((signal) => signal.id));
  const pendingSignals = (event.senales || []).filter((signal) => !eligibleSignalIds.has(signal.id));
  const priorAnalysis = publicExpedients?.by_event?.[id] || null;
  const focus = clean(editorialFocus) || clean(assignment?.pregunta_editorial)
    || `Explicar por qué ${event.titulo} importa, qué evidencia confirma su evolución y qué conviene observar.`;
  const workingTitle = clean(assignment?.titulo_trabajo) || event.titulo;
  const thesis = clean(assignment?.tesis_central) || clean(event.descripcion);
  const extension = Number(assignment?.extension_objetivo || 1800);
  const uncertainties = unique(assignment?.incertidumbres || []);
  const classification = followupProposal.proposed_process?.clasificacion || {};
  const priorText = priorAnalysis
    ? `Existe al menos un análisis vinculado en estado ${priorAnalysis.estado || 'no determinado'}. El nuevo borrador debe recibir post_id y slug propios; no sobrescribas ni presentes como duplicado el análisis anterior.`
    : 'No se detectó un análisis previo vinculado. De todos modos, el nuevo borrador debe recibir identidad propia distinta del macroevento_id.';
  const uncertaintyText = uncertainties.length
    ? uncertainties.map((item) => `- ${item}`).join('\n')
    : '- Conservá explícitamente las incertidumbres indicadas por las fuentes y evitá cerrar conclusiones no demostradas.';
  const justification = clean(warningJustification)
    ? `La preparación continúa con advertencias por decisión humana. Justificación: ${clean(warningJustification)}`
    : 'El preflight no requirió una justificación adicional.';
  const frontmatter = analysisFrontmatter({
    eventId: id,
    sourceIds: verifiedSources.map((source) => source.id),
    classification,
    generatedAt,
  });

  const content = `# Encargo de análisis completo para ChatGPT

Plantilla: ${ANALYSIS_PROMPT_TEMPLATE_ID}
Versión: ${ANALYSIS_PROMPT_TEMPLATE_VERSION}
Fecha de preparación: ${generatedAt}

Actuá como analista geopolítico senior y redactor de Memo Geopolítico. Producí un **borrador Markdown autónomo sujeto a revisión humana**. No investigues nuevas fuentes para completar vacíos: utilizá exclusivamente la evidencia autorizada incluida abajo y marcá [VERIFICAR: detalle concreto] cuando no alcance.

## Identidad y relación obligatorias
- macroevento_principal_id: ${id}
- El proceso en evolución conserva ese macroevento_id y no se convierte en Markdown.
- Este análisis debe tener post_id y slug nuevos y propios.
- ${priorText}

## Enfoque editorial
${focus}

## Título de trabajo
${workingTitle}

## Tesis provisional
${thesis || 'No se definió una tesis previa. Proponé una hipótesis analítica y distinguíla claramente de los hechos comprobados.'}

La tesis es provisional. Contrastala con la evidencia autorizada y no la presentes como conclusión demostrada si las fuentes no alcanzan.

## Extensión objetivo
Aproximadamente ${extension} palabras.

## Evidencia autorizada y verificada
Usá estas fuentes para respaldar afirmaciones factuales. No inventes hechos, cifras, citas, fuentes ni enlaces.

${sourceBlocks(verifiedSources, catalog)}

## Señales revisadas respaldadas por evidencia verificada
Las señales orientan la estructura, pero no reemplazan la lectura de las fuentes vinculadas.

${signalBlocks(eligibleSignals, verifiedSourceIds)}

## Elementos reservados: no usar como hechos
Estos elementos permanecen fuera del borrador porque todavía no están verificados o no cuentan con evidencia verificada suficiente.

${excludedBlocks(pendingSources, pendingSignals)}

## Contexto analítico provisional del Observatorio
- Descripción: ${event.descripcion || 'no consignada'}
- Regiones: ${(event.regiones || []).join(', ') || 'no consignadas'}
- Actores: ${(event.actores || []).join(', ') || 'no consignados'}
- Intereses: ${(event.intereses || []).join('; ') || 'no consignados'}
- Indicadores de seguimiento: ${(event.indicadores || []).join('; ') || 'no consignados'}
- Escenario base: ${event.escenarios?.base || 'no consignado'}
- Escenario adverso: ${event.escenarios?.adverso || 'no consignado'}
- Escenario transformador: ${event.escenarios?.transformador || 'no consignado'}

Estos datos son insumos analíticos, no evidencia independiente. Toda afirmación factual derivada de ellos debe apoyarse en una fuente autorizada o quedar marcada [VERIFICAR].

## Incertidumbres que deben conservarse
${uncertaintyText}

## Decisión de continuidad
${justification}

## Reglas obligatorias
1. Entregá un análisis completo, autónomo y comprensible sin leer el expediente del Observatorio.
2. Distinguí hechos respaldados, interpretación e incertidumbre.
3. No uses como hechos las fuentes o señales reservadas.
4. Integrá los enlaces autorizados en el cuerpo cuando respalden una afirmación.
5. No inventes cifras, citas, enlaces ni referencias.
6. No publiques puntuaciones internas del Observatorio.
7. No trates una fuente oficial o estatal como verificación independiente.
8. Señalá de forma sobria los vacíos regionales o de perspectiva que afecten el análisis.
9. Mantené tono analítico, preciso y no alarmista.
10. No afirmes que el texto está listo para publicar.
11. No incluyas comentarios fuera del Markdown solicitado.
12. Conservá exactamente macroevento_principal_id: ${id}.

## Formato de salida
Devolvé exclusivamente un archivo Markdown completo. Usá este frontmatter como contrato y reemplazá únicamente los marcadores entre corchetes:

\`\`\`yaml
${frontmatter}
\`\`\`

Después del frontmatter, redactá el análisis con subtítulos claros, enlaces integrados y una sección final “Fuentes” que liste únicamente la evidencia autorizada efectivamente utilizada.
`;

  return {
    status: 'ready',
    macroevento_id: id,
    template: {
      id: ANALYSIS_PROMPT_TEMPLATE_ID,
      version: ANALYSIS_PROMPT_TEMPLATE_VERSION,
    },
    generated_at: generatedAt,
    variables: {
      macroevento_id: id,
      titulo_trabajo: workingTitle,
      enfoque_editorial: focus,
      extension_objetivo: extension,
      fuentes_verificadas: verifiedSources.map((source) => source.id),
      senales_incorporables: eligibleSignals.map((signal) => signal.id),
      fuentes_reservadas: pendingSources.map((source) => source.id),
      senales_reservadas: pendingSignals.map((signal) => signal.id),
      expediente_editorial_id: assignment?.id || null,
      analisis_previo_vinculado: Boolean(priorAnalysis),
    },
    content,
  };
}

export function sessionFileFor(sessionsDir, eventId) {
  const id = clean(eventId);
  if (!validEventId(id)) throw new Error('macroevento_id inválido para una sesión local.');
  return path.join(sessionsDir, `preparacion-${id}.json`);
}

export function loadAnalysisPromptSession({ sessionsDir, eventId } = {}) {
  let file;
  try {
    file = sessionFileFor(sessionsDir, eventId);
  } catch {
    return { status: 'none', session: null };
  }
  if (!fs.existsSync(file)) return { status: 'none', session: null };
  try {
    const session = JSON.parse(fs.readFileSync(file, 'utf8'));
    const resumableStates = new Set([
      'esperando_respuesta',
      'respuesta_recibida',
      'respuesta_validada',
      'respuesta_aprobada',
      'paquete_preparado',
      'aplicacion_local_completada',
      'integracion_local_completada',
      'publicacion_local_completada',
    ]);
    if (session?.macroevento_id !== clean(eventId) || !resumableStates.has(session?.estado)) {
      return { status: 'none', session: null };
    }
    return {
      status: 'ready',
      session,
      file: { name: path.basename(file), relative_path: path.join('data', 'sesiones', path.basename(file)) },
    };
  } catch (error) {
    return {
      status: 'blocked',
      session: null,
      blocks: [{ code: 'invalid-session', title: 'La sesión guardada no es válida', detail: error.message }],
    };
  }
}

export function createAnalysisPromptSession({
  sessionsDir,
  data,
  catalog,
  eventId,
  followupProposal,
  publicExpedients,
  editorialFocus,
  warningJustification,
  generatedAt = new Date().toISOString().slice(0, 10),
  generatedTimestamp = new Date().toISOString(),
} = {}) {
  const prompt = buildAnalysisPrompt({
    data,
    catalog,
    eventId,
    followupProposal,
    publicExpedients,
    editorialFocus,
    warningJustification,
    generatedAt,
  });
  if (prompt.status !== 'ready') return prompt;

  const file = sessionFileFor(sessionsDir, prompt.macroevento_id);
  fs.mkdirSync(sessionsDir, { recursive: true });
  let previous = null;
  if (fs.existsSync(file)) {
    try { previous = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { previous = null; }
  }
  if (previous?.respuesta_chatgpt || ['respuesta_recibida', 'respuesta_validada', 'respuesta_aprobada'].includes(previous?.estado)) {
    return {
      status: 'blocked',
      macroevento_id: prompt.macroevento_id,
      blocks: [{
        code: 'response-already-received',
        title: 'La sesión ya contiene una respuesta de ChatGPT',
        detail: 'No regeneres el prompt: revisá o validá la respuesta guardada para no perder trazabilidad.',
      }],
    };
  }
  const compactTimestamp = generatedTimestamp.replace(/[^0-9]/g, '').slice(0, 14) || Date.now().toString();
  const session = {
    schema_version: 1,
    tipo: 'preparacion-analisis-seguimiento',
    session_id: previous?.session_id || `prep-${prompt.macroevento_id}-${compactTimestamp}`,
    macroevento_id: prompt.macroevento_id,
    estado: 'esperando_respuesta',
    creado_el: previous?.creado_el || generatedTimestamp,
    actualizado_el: generatedTimestamp,
    resultados_seleccionados: ['proceso_en_evolucion', 'analisis_completo'],
    decision_advertencias: {
      justificacion: clean(warningJustification),
    },
    propuesta_seguimiento: followupProposal,
    prompt_analisis: prompt,
    respuesta_chatgpt: null,
    trazabilidad: {
      pasos_completados: [1, 2, 3, 8, 9, 10],
      siguiente_paso: 11,
      estado: 'esperando_respuesta_chatgpt',
    },
    seguridad: {
      archivos_canonicos_creados: 0,
      archivos_canonicos_modificados: 0,
      archivos_sesion_escritos: 1,
      git_ejecutado: false,
    },
  };
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
  return {
    status: 'ready',
    session,
    file: {
      name: path.basename(file),
      relative_path: path.join('data', 'sesiones', path.basename(file)),
      operation: previous ? 'actualizado' : 'creado',
    },
    safety: session.seguridad,
  };
}
