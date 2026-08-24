export const WARNING_EDITOR_ACTOR = 'rete';

export const WARNING_STATE_LABELS = Object.freeze({
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  descartada: 'Descartada',
});

export const WARNING_TREATMENT_LABELS = Object.freeze({
  bloqueante: 'Bloqueante',
  relevante: 'Relevante',
  observacion_posterior: 'Observación posterior',
  irrelevante: 'Irrelevante',
});

export const WARNING_PRIORITY_LABELS = Object.freeze({
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
});

const PRIORITY_ORDER = Object.freeze({ alta: 0, media: 1, baja: 2 });

const clean = (value) => String(value ?? '').trim();

export function warningPromptDecision(warning) {
  const included = warning?.estado === 'pendiente'
    && ['bloqueante', 'relevante'].includes(warning?.tratamiento);
  if (warning?.estado !== 'pendiente') {
    return {
      included: false,
      label: 'Excluida del prompt',
      help: 'Solo las advertencias pendientes pueden incorporarse al prompt.',
    };
  }
  if (warning?.tratamiento === 'bloqueante') {
    return {
      included: true,
      label: 'Incluida y bloqueante',
      help: 'Se incorpora al prompt y bloquea la preparación salvo una excepción válida de esa sesión.',
    };
  }
  if (warning?.tratamiento === 'relevante') {
    return {
      included: true,
      label: 'Incluida en el prompt',
      help: 'Se incorpora al prompt como limitación relevante.',
    };
  }
  return {
    included,
    label: 'Excluida del prompt',
    help: warning?.tratamiento === 'observacion_posterior'
      ? 'Queda en el radar para revisión posterior, sin incorporarse al prompt actual.'
      : 'Se conserva en el expediente, sin incorporarse al prompt.',
  };
}

export function warningSummary(warnings = []) {
  const items = Array.isArray(warnings) ? warnings : [];
  return {
    total: items.length,
    pendingBlocking: items.filter((item) => item.estado === 'pendiente' && item.tratamiento === 'bloqueante').length,
    pendingRelevant: items.filter((item) => item.estado === 'pendiente' && item.tratamiento === 'relevante').length,
    resolved: items.filter((item) => item.estado === 'resuelta').length,
    discarded: items.filter((item) => item.estado === 'descartada').length,
    radar: items.filter((item) => item.estado === 'pendiente' && item.tratamiento === 'observacion_posterior').length,
  };
}

export function filterAndSortWarnings(warnings = [], filters = {}) {
  const items = (Array.isArray(warnings) ? warnings : []).filter((warning) => {
    if (filters.radar && !(warning.estado === 'pendiente' && warning.tratamiento === 'observacion_posterior')) return false;
    if (!filters.radar && filters.estado && warning.estado !== filters.estado) return false;
    if (!filters.radar && filters.tratamiento && warning.tratamiento !== filters.tratamiento) return false;
    if (filters.prioridad && warning.prioridad !== filters.prioridad) return false;
    if (filters.signal === 'con' && !(warning.signal_ids || []).length) return false;
    if (filters.signal === 'sin' && (warning.signal_ids || []).length) return false;
    if (filters.source === 'con' && !(warning.fuente_ids || []).length) return false;
    if (filters.source === 'sin' && (warning.fuente_ids || []).length) return false;
    if (filters.prompt === 'incluida' && !warningPromptDecision(warning).included) return false;
    if (filters.prompt === 'excluida' && warningPromptDecision(warning).included) return false;
    return true;
  });

  return items.sort((left, right) => {
    const priority = (PRIORITY_ORDER[left.prioridad] ?? 9) - (PRIORITY_ORDER[right.prioridad] ?? 9);
    if (priority) return priority;
    if (filters.radar) return Date.parse(left.creada_el || 0) - Date.parse(right.creada_el || 0);
    return Date.parse(right.actualizada_el || 0) - Date.parse(left.actualizada_el || 0);
  });
}

export function warningChangeSummary(before, after) {
  if (!before) return { action: 'creada', detail: 'Advertencia creada en el expediente.' };
  const changes = [];
  for (const [field, label, labels] of [
    ['estado', 'estado', WARNING_STATE_LABELS],
    ['tratamiento', 'tratamiento', WARNING_TREATMENT_LABELS],
    ['prioridad', 'prioridad', WARNING_PRIORITY_LABELS],
  ]) {
    if (before[field] !== after[field]) changes.push(`${label}: ${labels[before[field]] || before[field]} → ${labels[after[field]] || after[field]}`);
  }
  if (clean(before.descripcion) !== clean(after.descripcion)) changes.push('descripción actualizada');
  if (clean(before.notas_editoriales) !== clean(after.notas_editoriales)) changes.push('notas editoriales actualizadas');
  if (JSON.stringify(before.signal_ids || []) !== JSON.stringify(after.signal_ids || [])) changes.push('vínculos con señales actualizados');
  if (JSON.stringify(before.fuente_ids || []) !== JSON.stringify(after.fuente_ids || [])) changes.push('vínculos con fuentes actualizados');
  if (before.estado !== 'resuelta' && after.estado === 'resuelta') return { action: 'resuelta', detail: changes.join('; ') || 'Advertencia resuelta.' };
  if (before.estado !== 'descartada' && after.estado === 'descartada') return { action: 'descartada', detail: changes.join('; ') || 'Advertencia descartada.' };
  if (before.estado !== 'pendiente' && after.estado === 'pendiente') return { action: 'reabierta', detail: changes.join('; ') || 'Advertencia reabierta.' };
  if (before.tratamiento !== after.tratamiento) return { action: 'reclasificada', detail: changes.join('; ') };
  return { action: 'actualizada', detail: changes.join('; ') || 'Detalle revisado sin cambios de clasificación.' };
}
