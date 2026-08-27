import { runPreflight } from './preflight.js';

const $ = (selector) => document.querySelector(selector);
const LOCAL_SITE_ORIGIN = 'http://localhost:4321';

function localSiteUrl(pathname = '/') {
  const localPath = `/${String(pathname || '/').replace(/^\/+/, '')}`;
  return `${LOCAL_SITE_ORIGIN}${localPath}`;
}

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const TRACE_STATUS = {
  done: { label: 'Completado', className: 'good' },
  current: { label: 'En curso', className: 'info' },
  attention: { label: 'En curso', className: 'warn' },
  pending: { label: 'No iniciado', className: 'neutral' },
  blocked: { label: 'Bloqueado', className: 'bad' },
};

const FOLLOWUP_FIELD_LABELS = {
  titulo: 'Título',
  sintesis: 'Síntesis',
  que_esta_ocurriendo: 'Qué está ocurriendo',
  clasificacion: 'Clasificación pública',
  valoraciones: 'Valoraciones',
  senales: 'Señales verificadas',
  fuente_ids: 'Fuentes verificadas',
  indicadores_seguimiento: 'Indicadores de seguimiento',
  escenarios: 'Escenarios',
  macroevento_relacionado_ids: 'Procesos relacionados',
};

let currentEventId = '';
let currentPreflightResult = null;
let currentWarningJustification = '';
let currentFollowupProposal = null;
let currentAnalysisSession = null;
let currentResponseHash = '';
let currentReviewPackage = null;
let currentLocalApplicationPlan = null;
let currentLocalApplication = null;
let currentLocalIntegrationPlan = null;
let currentLocalIntegration = null;
let currentLocalPublicationPlan = null;
let currentLocalPublication = null;
let currentProcessUpdatePlan = null;

function approvedState(value) {
  return ['respuesta_aprobada', 'paquete_preparado', 'aplicacion_local_completada', 'integracion_local_completada', 'publicacion_local_completada'].includes(value);
}

function validatedState(value) {
  return ['respuesta_validada', 'respuesta_aprobada', 'paquete_preparado', 'aplicacion_local_completada', 'integracion_local_completada', 'publicacion_local_completada'].includes(value);
}

function refreshGlobalStatus(session = currentAnalysisSession) {
  const proposal = currentFollowupProposal;
  const approved = Boolean(session?.respuesta_chatgpt?.aprobada_el && session?.respuesta_chatgpt?.validacion?.estado === 'ready');
  const application = session?.aplicacion_local?.estado === 'aplicada';
  const integration = session?.integracion_local?.estado === 'aplicada';
  const publication = session?.publicacion_local?.estado === 'aplicada';
  const processUpdate = session?.actualizacion_proceso?.estado === 'aplicada';
  const dataQa = session?.actualizacion_proceso?.qa_datos === 'valido'
    || session?.publicacion_local?.qa_datos === 'valido'
    || session?.integracion_local?.qa_datos === 'valido';
  const siteQa = session?.actualizacion_proceso?.qa_sitio === 'valido'
    || session?.publicacion_local?.qa_estado === 'valido';
  const gitState = session?.actualizacion_proceso?.git_estado
    || session?.publicacion_local?.git_estado
    || 'no_iniciado';
  const signalsVerified = proposal?.metrics?.signals_verified ?? 0;
  const signalsExportable = proposal?.metrics?.signals_exportable ?? proposal?.metrics?.signals ?? 0;
  const statuses = [
    ['Análisis', approved ? 'Aprobado' : 'Pendiente', approved ? 'good' : 'neutral', approved ? 'Revisión editorial vigente.' : 'Falta validación y aprobación humana.'],
    ['Proceso', proposal ? `${signalsExportable}/${signalsVerified}` : 'Sin propuesta', proposal && signalsExportable === signalsVerified ? 'good' : proposal ? 'warn' : 'neutral', 'Señales exportables / verificadas.'],
    ['Borrador canónico', application ? 'Aplicado' : 'Pendiente', application ? 'good' : 'neutral', 'Estado de Fase 7.'],
    ['Preview', integration ? 'Integrado' : 'Pendiente', integration ? 'good' : 'neutral', 'Estado de Fase 8.'],
    ['Fuente pública', publication || processUpdate ? 'Local actualizada' : 'Pendiente', publication || processUpdate ? 'good' : 'neutral', 'Publicación o ruta corta aplicada.'],
    ['QA de datos', dataQa ? 'Válido' : 'Pendiente', dataQa ? 'good' : 'warn', 'Validación canónica del paquete completo.'],
    ['QA del sitio', siteQa ? 'Válido' : 'Pendiente', siteQa ? 'good' : 'warn', 'Test, build y revisión visual.'],
    ['Git', gitState === 'sin_cambios' ? 'Sin cambios' : gitState === 'listo_para_sincronizar' ? 'Listo' : 'Pendiente', gitState === 'listo_para_sincronizar' || gitState === 'sin_cambios' ? 'good' : 'neutral', 'Git continúa siendo una acción manual.'],
  ];
  $('#global-status-items').innerHTML = statuses.map(([label, value, state, note]) => `
    <span class="global-status-item"><b>${esc(label)}</b><span class="badge ${state}">${esc(value)}</span><small>${esc(note)}</small></span>
  `).join('');
  const ready = Boolean((publication || processUpdate) && dataQa && siteQa
    && ['listo_para_sincronizar', 'sin_cambios'].includes(gitState));
  $('#sync-readiness').className = ready ? 'badge good' : 'badge neutral';
  $('#sync-readiness').textContent = ready ? 'Listo para sincronizar' : 'No listo para sincronizar';
  $('#global-status-help').textContent = ready
    ? 'Datos y sitio superaron QA. La eventual operación Git sigue requiriendo autorización separada.'
    : 'Faltan controles: el Centro no considera completa ni sincronizable una salida inválida o sin QA del sitio.';
  const qaButton = $('#run-final-qa');
  const manualConfirmed = $('#confirm-responsive-qa').checked;
  qaButton.disabled = siteQa || !((publication || processUpdate) && dataQa && manualConfirmed);
  qaButton.textContent = siteQa ? 'QA final superado' : 'Ejecutar QA técnico final';
}

function configureProcessUpdateAvailability(session = currentAnalysisSession) {
  const button = $('#prepare-process-update');
  const status = $('#process-update-action-status');
  currentProcessUpdatePlan = null;
  const approved = Boolean(session?.respuesta_chatgpt?.aprobada_el);
  const hasProposal = currentFollowupProposal?.status === 'ready';
  const hasChanges = Boolean(currentFollowupProposal?.diff?.length);
  button.disabled = !(approved && hasProposal && hasChanges);
  if (!hasProposal) status.textContent = 'Generá primero la propuesta actual del proceso.';
  else if (!approved) status.textContent = 'La ruta corta se habilita cuando existe una sesión con análisis aprobado.';
  else if (!hasChanges) status.textContent = 'La proyección pública local ya coincide; no hay cambios que aplicar.';
  else status.textContent = 'El análisis aprobado se conservará. El plan validará el paquete público completo antes de escribir.';
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function refreshTraceSummary() {
  const steps = [...($('#trace-steps')?.children || [])];
  const done = steps.filter((item) => item.classList.contains('done')).length;
  const attention = steps.filter((item) => item.classList.contains('attention') || item.classList.contains('blocked')).length;
  $('#trace-summary').textContent = `${done}/13 completados${attention ? ` · ${attention} requieren atención` : ''}`;
}

function showFailure(message) {
  $('#preparation-title').textContent = 'No se puede abrir la preparación';
  $('#preparation-status').className = 'badge bad';
  $('#preparation-status').textContent = 'Bloqueada';
  $('#preparation-event-id').textContent = '';
  $('#preparation-content').hidden = true;
  $('#preparation-message').className = 'panel preparation-phase-note issue error';
  $('#preparation-message').textContent = message;
}

function renderIssues(sectionSelector, countSelector, listSelector, entries) {
  const section = $(sectionSelector);
  section.hidden = entries.length === 0;
  $(countSelector).textContent = String(entries.length);
  $(listSelector).innerHTML = entries.map((entry) => `
    <article class="preflight-item">
      <h4>${esc(entry.title)}</h4>
      ${entry.detail ? `<p>${esc(entry.detail)}</p>` : ''}
    </article>
  `).join('');
}

function renderMetrics(metrics, result) {
  const values = [
    ['Bloqueos', result.blocks.length, result.blocks.length ? 'bad' : 'good'],
    ['Advertencias', result.warnings.length, result.warnings.length ? 'warn' : 'good'],
    ['Señales', metrics.signals, metrics.pendingSignals ? 'warn' : 'info'],
    ['Fuentes verificadas', `${metrics.verifiedSources}/${metrics.sources}`, metrics.pendingSources ? 'warn' : 'good'],
    ['Medios únicos', metrics.uniqueMedia, 'info'],
    ['Perspectivas', metrics.perspectives, metrics.perspectives > 1 ? 'info' : 'warn'],
  ];
  $('#preflight-overview').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
}

function renderTrace(trace) {
  const completed = trace.filter((step) => step.status === 'done').length;
  const attention = trace.filter((step) => ['attention', 'blocked'].includes(step.status)).length;
  $('#trace-summary').textContent = `${completed}/13 completados${attention ? ` · ${attention} requieren atención` : ''}`;
  $('#trace-steps').innerHTML = trace.map((step) => {
    const state = TRACE_STATUS[step.status] || TRACE_STATUS.pending;
    return `<li class="trace-step ${esc(step.status)}">
      <span class="trace-number">${step.number}</span>
      <div><b>${esc(step.title)}</b><p>${esc(step.note)}</p></div>
      <span class="badge ${state.className}">${state.label}</span>
    </li>`;
  }).join('');
}

function configureDecision(result) {
  const panel = $('#warning-decision');
  const title = $('#warning-decision-heading');
  const help = $('#warning-decision-help');
  const justification = $('#warning-justification');
  const button = $('#confirm-warnings');
  const status = $('#warning-decision-status');

  justification.value = '';
  currentWarningJustification = '';
  button.disabled = true;
  button.textContent = 'Continuar con advertencias';
  justification.disabled = false;
  panel.classList.remove('confirmed');

  if (result.blocks.length) {
    panel.hidden = false;
    title.textContent = 'Corregir bloqueos antes de continuar';
    help.textContent = 'Los bloqueos estructurales no admiten una excepción editorial. Volvé al Observatorio, corregilos y ejecutá nuevamente el preflight.';
    justification.disabled = true;
    button.disabled = true;
    status.textContent = 'La preparación está bloqueada; no se creó ni modificó ningún archivo.';
    configureFollowupAvailability(result, false);
    return;
  }

  if (!result.warnings.length) {
    panel.hidden = true;
    configureFollowupAvailability(result, true);
    return;
  }

  panel.hidden = false;
  title.textContent = 'Continuar con advertencias';
  help.textContent = 'Explicá brevemente por qué el alcance puede continuar sin ocultar los pendientes.';
  status.textContent = 'La justificación se conserva solo durante esta vista; todavía no se crea una sesión.';
  configureFollowupAvailability(result, false);

  justification.oninput = () => {
    button.disabled = justification.value.trim().length < 12;
    if (!button.disabled) status.textContent = 'La justificación es suficiente para confirmar la decisión en esta vista.';
  };
  button.onclick = () => {
    const reason = justification.value.trim();
    if (reason.length < 12) return;
    currentWarningJustification = reason;
    justification.disabled = true;
    button.disabled = true;
    button.textContent = 'Continuidad confirmada';
    status.textContent = 'Decisión confirmada en esta vista. Todavía no se crea una sesión ni se escribe ningún archivo.';
    panel.classList.add('confirmed');
    configureFollowupAvailability(result, true);
  };
}

function restoreWarningDecision(result, reason) {
  const justification = cleanText(reason);
  if (!result.warnings.length || justification.length < 12) return;
  currentWarningJustification = justification;
  $('#warning-justification').value = justification;
  $('#warning-justification').disabled = true;
  $('#confirm-warnings').disabled = true;
  $('#confirm-warnings').textContent = 'Continuidad confirmada';
  $('#warning-decision-status').textContent = 'Decisión recuperada de la sesión local pendiente.';
  $('#warning-decision').classList.add('confirmed');
  configureFollowupAvailability(result, true);
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function configureFollowupAvailability(result, confirmed) {
  const button = $('#generate-followup-proposal');
  const status = $('#followup-action-status');
  $('#followup-workspace').hidden = true;
  currentFollowupProposal = null;
  configureAnalysisPromptAvailability(false);
  if (result.blocks.length) {
    button.disabled = true;
    status.textContent = 'Corregí los bloqueos del preflight antes de generar una propuesta.';
    return;
  }
  if (result.warnings.length && !confirmed) {
    button.disabled = true;
    status.textContent = 'Confirmá la continuidad con advertencias para habilitar la propuesta.';
    return;
  }
  button.disabled = false;
  button.textContent = 'Generar propuesta de seguimiento';
  status.textContent = 'La propuesta se generará en memoria y no modificará archivos.';
}

function configureAnalysisPromptAvailability(ready) {
  const button = $('#generate-analysis-prompt');
  const status = $('#analysis-prompt-action-status');
  $('#analysis-prompt-workspace').hidden = true;
  button.disabled = !ready;
  status.textContent = ready
    ? 'La propuesta está lista. Podés generar el prompt y guardar la sesión local.'
    : 'Generá primero la propuesta de seguimiento.';
  if (!currentAnalysisSession) configureAnalysisResponseAvailability(null);
}

function compactValue(value) {
  if (value === undefined) return 'No existía';
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'elemento' : 'elementos'}`;
  if (value && typeof value === 'object') return 'Datos estructurados';
  const text = String(value ?? '').trim();
  return text.length > 220 ? `${text.slice(0, 217)}…` : text || 'Vacío';
}

function changeSummary(change) {
  const summary = change.summary;
  if (!summary) return '';
  const parts = [];
  if (summary.added?.length) parts.push(`${summary.added.length} incorporados`);
  if (summary.removed?.length) parts.push(`${summary.removed.length} retirados`);
  if (summary.modified?.length) parts.push(`${summary.modified.length} modificados`);
  return parts.join(' · ');
}

function renderFollowupDiff(changes) {
  $('#followup-diff-summary').textContent = changes.length
    ? `${changes.length} ${changes.length === 1 ? 'campo diferente' : 'campos diferentes'}`
    : 'Sin diferencias respecto de la versión pública local';
  if (!changes.length) {
    $('#followup-diff-list').innerHTML = '<p class="followup-empty">La propuesta coincide con la versión pública local. Podés revisar el JSON, pero no hay cambios para aplicar.</p>';
    return;
  }
  $('#followup-diff-list').innerHTML = changes.map((change) => `
    <article class="followup-diff-item">
      <header>
        <b>${esc(FOLLOWUP_FIELD_LABELS[change.field] || change.field)}</b>
        <span class="badge info">${esc(change.action)}</span>
      </header>
      ${changeSummary(change) ? `<p class="followup-diff-counts">${esc(changeSummary(change))}</p>` : ''}
      <dl>
        <div><dt>Actual</dt><dd>${esc(compactValue(change.before))}</dd></div>
        <div><dt>Propuesto</dt><dd>${esc(compactValue(change.after))}</dd></div>
      </dl>
    </article>
  `).join('');
}

function markFollowupPrepared() {
  const step = $('#trace-steps')?.children?.[7];
  if (!step) return;
  step.className = 'trace-step done';
  const note = step.querySelector('p');
  const badge = step.querySelector('.badge');
  if (note) note.textContent = 'La propuesta del proceso en evolución fue generada en memoria y conserva el macroevento_id.';
  if (badge) {
    badge.className = 'badge good';
    badge.textContent = 'Completado';
  }
  refreshTraceSummary();
}

function renderFollowupProposal(proposal, { scroll = true, announce = true } = {}) {
  currentFollowupProposal = proposal;
  const metrics = [
    ['Diferencias', proposal.metrics.changes, proposal.metrics.changes ? 'info' : 'good'],
    ['Señales verificadas', proposal.metrics.signals_verified ?? proposal.metrics.signals, 'good'],
    ['Señales exportables', proposal.metrics.signals_exportable ?? proposal.metrics.signals, proposal.metrics.verified_signals_not_exportable ? 'warn' : 'good'],
    ['Fuentes verificadas', proposal.metrics.sources_verified ?? proposal.metrics.sources, 'good'],
    ['Fuentes exportables', proposal.metrics.sources_exportable ?? proposal.metrics.sources, 'good'],
    ['Señales reservadas', proposal.metrics.signals_without_verified_source_excluded, proposal.metrics.signals_without_verified_source_excluded ? 'warn' : 'good'],
    ['Fuentes reservadas', proposal.metrics.pending_sources_excluded, proposal.metrics.pending_sources_excluded ? 'warn' : 'good'],
  ];
  $('#followup-metrics').innerHTML = metrics.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#followup-operation').className = 'badge info';
  $('#followup-operation').textContent = proposal.operation === 'crear' ? 'Nuevo proceso público' : 'Actualización propuesta';
  const verifiedNotExportable = proposal.metrics.verified_signals_not_exportable || 0;
  $('#followup-safety-note').textContent = verifiedNotExportable
    ? `${verifiedNotExportable} señal(es) verificadas no son exportables porque no enlazan una fuente pública verificada. Corregí ese vínculo antes de publicar.`
    : `Identidad conservada: ${proposal.macroevento_id}. Propuesta generada en memoria; 0 archivos creados, 0 modificados y ningún Markdown generado.`;
  renderFollowupDiff(proposal.diff || []);
  $('#followup-proposal-json').textContent = JSON.stringify({
    schema_version: proposal.schema_version,
    tipo: proposal.tipo,
    generado_el: proposal.generado_el,
    macroevento_id: proposal.macroevento_id,
    operation: proposal.operation,
    proposed_process: proposal.proposed_process,
    proposed_sources: proposal.proposed_sources,
    safety: proposal.safety,
  }, null, 2);
  if (announce) {
    $('#preparation-message').className = 'panel preparation-phase-note issue success';
    $('#preparation-message').textContent = `Fase 3 completada: propuesta de seguimiento generada con ${proposal.metrics.changes} ${proposal.metrics.changes === 1 ? 'diferencia' : 'diferencias'}. Ningún archivo canónico fue creado o modificado.`;
  }
  $('#followup-workspace').hidden = false;
  markFollowupPrepared();
  configureAnalysisPromptAvailability(true);
  configureProcessUpdateAvailability();
  refreshGlobalStatus();
  if (scroll) $('#followup-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function generateFollowupProposal() {
  const button = $('#generate-followup-proposal');
  const status = $('#followup-action-status');
  button.disabled = true;
  button.textContent = 'Generando propuesta…';
  status.textContent = 'Leyendo la transformación canónica y comparando la versión pública local…';
  try {
    const response = await fetch(`/api/followup-proposal?macroevento_id=${encodeURIComponent(currentEventId)}`, { cache: 'no-store' });
    const proposal = await response.json();
    if (!response.ok || proposal.status !== 'ready') {
      throw new Error(proposal.blocks?.[0]?.detail || proposal.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderFollowupProposal(proposal);
    status.textContent = 'Propuesta preparada para revisión. No se modificó ningún archivo.';
    button.textContent = 'Volver a generar propuesta';
  } catch (error) {
    $('#followup-workspace').hidden = true;
    status.textContent = `No se pudo generar la propuesta: ${error.message}`;
    button.textContent = 'Intentar nuevamente';
  } finally {
    button.disabled = false;
  }
}

function renderProcessUpdatePlan(plan, { scroll = true } = {}) {
  currentProcessUpdatePlan = plan;
  const values = [
    ['Diferencias', plan.metrics.differences, plan.metrics.differences ? 'info' : 'good'],
    ['Señales verificadas', plan.metrics.signals_verified, 'good'],
    ['Señales exportables', plan.metrics.signals_exportable, plan.metrics.signals_verified === plan.metrics.signals_exportable ? 'good' : 'warn'],
    ['Fuentes exportables', plan.metrics.sources_exportable, 'good'],
    ['Markdown', 0, 'good'],
  ];
  $('#process-update-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#process-update-validation').textContent = `Validador canónico: ${plan.validation.validator}. ${plan.validation.errors.length} errores; ${plan.validation.warnings.length} advertencias. Backup: ${plan.backup.relative}.`;
  $('#process-update-state').className = plan.operation === 'sin_cambios' ? 'badge good' : 'badge warn';
  $('#process-update-state').textContent = plan.operation === 'sin_cambios' ? 'Sin cambios' : 'Pendiente de confirmación';
  $('#process-update-workspace').classList.remove('applied');
  $('#process-update-workspace').hidden = false;
  $('#process-update-confirmation').hidden = plan.operation === 'sin_cambios';
  $('#confirm-process-update').checked = false;
  $('#apply-process-update').disabled = true;
  $('#process-update-apply-status').textContent = plan.operation === 'sin_cambios'
    ? 'La proyección actual ya coincide; no se escribirá ningún archivo.'
    : 'El plan está validado. Marcá la confirmación para actualizar solo el proceso público.';
  if (scroll) $('#process-update-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function prepareProcessUpdate() {
  const button = $('#prepare-process-update');
  const status = $('#process-update-action-status');
  button.disabled = true;
  button.textContent = 'Validando proyección…';
  status.textContent = 'Reconstruyendo y validando el paquete público completo en memoria…';
  try {
    const response = await fetch('/api/local-process-update/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderProcessUpdatePlan(result);
    status.textContent = 'Proyección completa válida. Todavía no se escribió ningún archivo.';
    button.textContent = 'Volver a comprobar actualización';
  } catch (error) {
    $('#process-update-workspace').hidden = true;
    status.textContent = `Actualización bloqueada: ${error.message}`;
    button.textContent = 'Intentar nuevamente';
  } finally {
    button.disabled = false;
  }
}

async function applyProcessUpdate() {
  if (!currentProcessUpdatePlan || !$('#confirm-process-update').checked) return;
  const button = $('#apply-process-update');
  const status = $('#process-update-apply-status');
  button.disabled = true;
  button.textContent = 'Actualizando proceso…';
  status.textContent = 'Creando backup, escribiendo de forma atómica y revalidando el resultado…';
  try {
    const response = await fetch('/api/local-process-update/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        plan_id: currentProcessUpdatePlan.plan_id,
        confirmado: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    currentAnalysisSession = result.session;
    currentProcessUpdatePlan = result.plan;
    $('#process-update-workspace').classList.add('applied');
    $('#process-update-state').className = 'badge good';
    $('#process-update-state').textContent = 'Proceso actualizado';
    $('#process-update-confirmation').hidden = true;
    $('#process-update-validation').textContent = 'Actualización aplicada y revalidada. El análisis aprobado no cambió. Falta QA del sitio; Git no fue ejecutado.';
    status.textContent = 'Proceso público actualizado con backup y validación posterior.';
    button.textContent = 'Proceso actualizado';
    $('#preparation-status').className = 'badge good';
    $('#preparation-status').textContent = 'Datos válidos · QA pendiente';
    $('#preparation-message').className = 'panel preparation-phase-note issue success';
    $('#preparation-message').textContent = 'La ruta corta actualizó únicamente el proceso en evolución. El Markdown y su aprobación se conservaron; falta QA del sitio antes de sincronizar.';
    configureProcessUpdateAvailability(result.session);
    refreshGlobalStatus(result.session);
  } catch (error) {
    status.textContent = `No se pudo actualizar: ${error.message}`;
    $('#confirm-process-update').checked = false;
    button.disabled = true;
    button.textContent = 'Actualizar proceso local';
  }
}

async function runFinalQa() {
  const button = $('#run-final-qa');
  const status = $('#final-qa-status');
  if (!$('#confirm-responsive-qa').checked) return;
  button.disabled = true;
  button.textContent = 'Ejecutando QA…';
  status.textContent = 'Ejecutando pruebas, validación de datos, checks, builds y diff --check. Puede tardar varios minutos…';
  try {
    const response = await fetch('/api/final-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        revision_responsive_confirmada: true,
      }),
    });
    const result = await response.json();
    if (result.session) {
      currentAnalysisSession = result.session;
      refreshGlobalStatus(result.session);
    }
    if (!response.ok || result.status !== 'ready') {
      const failed = result.qa?.results?.find((item) => !item.ok);
      throw new Error(result.blocks?.[0]?.detail || failed?.label || `El servidor respondió con error ${response.status}.`);
    }
    const labels = result.qa.results.map((item) => item.label).join(', ');
    status.textContent = `QA final superado: ${labels}. La copia local está lista para revisión y sincronización Git manual.`;
    button.textContent = 'QA final superado';
    $('#preparation-status').className = 'badge good';
    $('#preparation-status').textContent = 'Listo para sincronizar';
  } catch (error) {
    status.textContent = `QA final bloqueado: ${error.message}. Revisá el registro de la sesión, corregí y ejecutá nuevamente.`;
    button.textContent = 'Reintentar QA técnico final';
    refreshGlobalStatus(currentAnalysisSession);
  }
}

function markPromptReady() {
  const steps = $('#trace-steps')?.children;
  if (!steps) return;
  const updates = [
    [8, 'Las variables editoriales fueron recuperadas del expediente previo o de la ficha del macroevento.'],
    [9, 'El prompt completo fue generado con la plantilla controlada y guardado en la sesión local.'],
  ];
  for (const [index, noteText] of updates) {
    const step = steps[index];
    if (!step) continue;
    step.className = 'trace-step done';
    const note = step.querySelector('p');
    const badge = step.querySelector('.badge');
    if (note) note.textContent = noteText;
    if (badge) {
      badge.className = 'badge good';
      badge.textContent = 'Completado';
    }
  }
  const waitingStep = steps[10];
  if (waitingStep) {
    waitingStep.className = 'trace-step current';
    const note = waitingStep.querySelector('p');
    const badge = waitingStep.querySelector('.badge');
    if (note) note.textContent = 'El prompt está listo; falta ejecutarlo en ChatGPT y pegar la respuesta en la Fase 5.';
    if (badge) {
      badge.className = 'badge info';
      badge.textContent = 'Pendiente ChatGPT';
    }
  }
  refreshTraceSummary();
}

function renderAnalysisPromptSession(result, { restored = false, scroll = true } = {}) {
  const session = result.session;
  const prompt = session.prompt_analisis;
  const variables = prompt.variables || {};
  const hasResponse = Boolean(session.respuesta_chatgpt);
  const obsoletePrompt = hasResponse && prompt.template?.version !== '1.1';
  const approved = approvedState(session.estado);
  const validated = validatedState(session.estado);
  const metadata = [
    ['Plantilla', prompt.template?.id || 'sin identificar'],
    ['Versión', prompt.template?.version || 'sin versión'],
    ['Fuentes verificadas', variables.fuentes_verificadas?.length || 0],
    ['Señales incorporables', variables.senales_incorporables?.length || 0],
    ['Generado', prompt.generated_at || session.actualizado_el?.slice(0, 10) || 'sin fecha'],
  ];
  $('#analysis-prompt-metadata').innerHTML = metadata.map(([label, value]) => `
    <span class="preflight-kpi info"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#analysis-prompt-content').value = prompt.content || '';
  $('#analysis-editorial-focus').value = variables.enfoque_editorial || '';
  $('#analysis-prompt-state').className = approved ? 'badge good' : validated ? 'badge info' : hasResponse ? 'badge warn' : 'badge warn';
  $('#analysis-prompt-state').textContent = approved ? 'Respuesta aprobada' : validated ? 'Respuesta validada' : hasResponse ? 'Respuesta recibida' : 'Esperando respuesta';
  $('#analysis-session-file').textContent = `Sesión local: ${result.file?.relative_path || 'data/sesiones'}. Es el único archivo creado o actualizado en esta fase; la Fase 5 continuará utilizando la misma sesión.`;
  $('#analysis-copy-status').textContent = hasResponse
    ? 'El prompt utilizado quedó conservado para la trazabilidad de la respuesta.'
    : restored
      ? 'Preparación pendiente recuperada. Podés volver a copiar el prompt.'
      : 'El prompt está listo para copiar. La sesión ya quedó guardada.';
  $('#analysis-prompt-workspace').hidden = false;
  $('#generate-analysis-prompt').disabled = hasResponse && !obsoletePrompt;
  $('#generate-analysis-prompt').textContent = obsoletePrompt ? 'Generar prompt corregido v1.1' : hasResponse ? 'Prompt conservado' : 'Regenerar prompt y actualizar sesión';
  $('#analysis-prompt-action-status').textContent = obsoletePrompt
    ? 'La respuesta pertenece al contrato anterior. Al generar el prompt v1.1 se conservará una copia de la sesión anterior.'
    : hasResponse
    ? 'La sesión ya contiene una respuesta; el prompt no puede regenerarse sin perder trazabilidad.'
    : restored
      ? 'Sesión pendiente recuperada desde el archivo local.'
      : 'Prompt generado y sesión guardada en estado Esperando respuesta.';
  $('#preparation-status').className = approved ? 'badge good' : 'badge warn';
  $('#preparation-status').textContent = approved ? 'Respuesta aprobada' : validated ? 'Pendiente de aprobación' : 'Preparación pendiente';
  $('#preparation-message').className = 'panel preparation-phase-note issue success';
  $('#preparation-message').textContent = hasResponse
    ? 'Fase 5 recuperada: la respuesta y su validación están guardadas en la sesión local. No se modificaron archivos canónicos.'
    : restored
      ? 'Fase 4 recuperada: el prompt sigue esperando una respuesta de ChatGPT. No se modificaron archivos canónicos.'
      : `Fase 4 completada: el prompt está listo y la sesión local fue ${result.file?.operation || 'guardada'}. Se escribió 1 archivo de sesión y 0 archivos canónicos.`;
  markPromptReady();
  configureAnalysisResponseAvailability(session, result.file);
  configureProcessUpdateAvailability(session);
  refreshGlobalStatus(session);
  if (scroll) $('#analysis-prompt-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function generateAnalysisPrompt() {
  if (!currentFollowupProposal || !currentPreflightResult) return;
  const button = $('#generate-analysis-prompt');
  const status = $('#analysis-prompt-action-status');
  button.disabled = true;
  button.textContent = 'Generando y guardando…';
  status.textContent = 'Preparando la plantilla con evidencia verificada y guardando la sesión local…';
  try {
    const response = await fetch('/api/analysis-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        enfoque_editorial: $('#analysis-editorial-focus').value.trim(),
        justificacion_advertencias: currentWarningJustification,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderAnalysisPromptSession(result);
  } catch (error) {
    status.textContent = `No se pudo generar el prompt: ${error.message}`;
    button.textContent = 'Intentar nuevamente';
  } finally {
    button.disabled = false;
  }
}

async function copyAnalysisPrompt() {
  const content = $('#analysis-prompt-content').value;
  const status = $('#analysis-copy-status');
  if (!content) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else {
      const temporary = document.createElement('textarea');
      temporary.value = content;
      temporary.setAttribute('readonly', '');
      temporary.style.position = 'fixed';
      temporary.style.opacity = '0';
      document.body.appendChild(temporary);
      temporary.select();
      document.execCommand('copy');
      temporary.remove();
    }
    status.textContent = 'Prompt copiado. Abrí un chat nuevo en ChatGPT y pegalo allí.';
  } catch (error) {
    status.textContent = `No se pudo copiar automáticamente: ${error.message}. Seleccioná el texto y copialo manualmente.`;
    $('#analysis-prompt-content').focus();
    $('#analysis-prompt-content').select();
  }
}

function configureAnalysisResponseAvailability(session, file = null) {
  currentAnalysisSession = session || null;
  if (!session) configureReviewPackageAvailability(null);
  const button = $('#open-analysis-response');
  const status = $('#analysis-response-action-status');
  const hasPrompt = Boolean(session?.prompt_analisis);
  const hasResponse = Boolean(session?.respuesta_chatgpt);
  button.disabled = !hasPrompt;
  button.textContent = hasResponse ? 'Revisar respuesta de ChatGPT' : 'Pegar respuesta de ChatGPT';
  status.textContent = hasResponse
    ? 'La sesión contiene una respuesta guardada. Podés revisar su validación y vista previa.'
    : hasPrompt
      ? 'El prompt está listo. Cargá o pegá ahora el Markdown recibido.'
      : 'Generá o recuperá primero el prompt.';
  $('#analysis-response-session-file').innerHTML = hasPrompt
    ? `La validación actualiza únicamente <code>${esc(file?.relative_path || `data\\sesiones\\preparacion-${currentEventId}.json`)}</code>. No escribe en <code>src\\content</code>.`
    : 'La validación actualiza únicamente el archivo de esta sesión. No escribe en <code>src\\content</code>.';
  if (!hasPrompt) {
    $('#analysis-response-workspace').hidden = true;
    return;
  }
  if (hasResponse) renderStoredAnalysisResponse(session, { restored: true });
}

function markAnalysisResponseState(session) {
  const steps = $('#trace-steps')?.children;
  if (!steps || !session?.respuesta_chatgpt) return;
  const validated = validatedState(session.estado);
  const approved = approvedState(session.estado);
  const packaged = session.paquete_revision?.estado === 'archivos_preparados';
  const receivedStep = steps[10];
  if (receivedStep) {
    receivedStep.className = 'trace-step done';
    const note = receivedStep.querySelector('p');
    const badge = receivedStep.querySelector('.badge');
    if (note) note.textContent = 'La respuesta original de ChatGPT quedó conservada dentro de la sesión local.';
    if (badge) { badge.className = 'badge good'; badge.textContent = 'Completado'; }
  }
  const reviewStep = steps[11];
  if (reviewStep) {
    reviewStep.className = approved ? 'trace-step done' : validated ? 'trace-step current' : 'trace-step attention';
    const note = reviewStep.querySelector('p');
    const badge = reviewStep.querySelector('.badge');
    if (note) note.textContent = approved
      ? 'La respuesta validada fue revisada y aprobada explícitamente para preparar el paquete.'
      : validated
        ? 'La estructura es válida; falta la aprobación humana después de revisar la vista previa.'
        : 'La respuesta fue recibida, pero conserva bloqueos que deben corregirse y volver a validarse.';
    if (badge) {
      badge.className = approved ? 'badge good' : validated ? 'badge info' : 'badge warn';
      badge.textContent = approved ? 'Completado' : validated ? 'Revisión humana' : 'Requiere corrección';
    }
  }
  const packageStep = steps[12];
  if (packageStep) {
    packageStep.className = packaged ? 'trace-step done' : approved ? 'trace-step current' : 'trace-step pending';
    const note = packageStep.querySelector('p');
    const badge = packageStep.querySelector('.badge');
    if (note) note.textContent = packaged
      ? 'El paquete para VS Code fue generado y quedó disponible sin aplicar archivos canónicos.'
      : approved
        ? 'La respuesta está aprobada; ya puede generarse el paquete para VS Code.'
      : 'Requiere una respuesta validada y aprobada.';
    if (badge) {
      badge.className = packaged ? 'badge good' : approved ? 'badge info' : 'badge neutral';
      badge.textContent = packaged ? 'Completado' : approved ? 'Listo para generar' : 'No iniciado';
    }
  }
  refreshTraceSummary();
}

function responseValidationFromSession(session) {
  const response = session?.respuesta_chatgpt;
  const stored = response?.validacion;
  if (!response || !stored) return null;
  return {
    status: stored.estado,
    hash_sha256: response.hash_sha256,
    blocks: stored.bloqueos || [],
    warnings: stored.advertencias || [],
    information: stored.informacion || [],
    metadata: stored.metadata || {},
    metrics: stored.metricas || {},
    warning_candidates: response.advertencias_propuestas || [],
    normalized_markdown: response.contenido_normalizado || '',
    preview_html: stored.preview_html || '',
  };
}

function warningDecisionComplete(candidate) {
  return ['guardada', 'descartada', 'ya_existente'].includes(candidate?.decision?.estado);
}

function renderAnalysisWarningDecisions(candidates = [], approved = false) {
  const section = $('#analysis-warning-decisions');
  const list = $('#analysis-warning-decision-list');
  if (!candidates.length) {
    section.hidden = true;
    list.innerHTML = '';
    return { complete: true, decided: 0, total: 0 };
  }
  const decided = candidates.filter(warningDecisionComplete).length;
  section.hidden = false;
  $('#analysis-warning-decision-progress').className = decided === candidates.length ? 'badge good' : 'badge warn';
  $('#analysis-warning-decision-progress').textContent = `${decided}/${candidates.length} gestionadas`;
  const treatmentOptions = [
    ['bloqueante', 'Bloqueante'],
    ['relevante', 'Relevante'],
    ['observacion_posterior', 'Observación posterior'],
    ['irrelevante', 'Irrelevante'],
  ];
  const priorityOptions = [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']];
  list.innerHTML = candidates.map((candidate, index) => {
    const complete = warningDecisionComplete(candidate);
    const decision = candidate.decision || {};
    const savedLabel = decision.estado === 'ya_existente'
      ? `Ya existe como ${decision.advertencia_id || candidate.advertencia_existente_id}`
      : decision.estado === 'descartada' ? 'Descartada con trazabilidad' : decision.estado === 'guardada' ? 'Incorporada al expediente' : '';
    return `
      <article class="analysis-warning-decision-card ${complete ? 'decided' : ''}" data-analysis-warning-card="${esc(candidate.advertencia_id)}">
        <header>
          <div><span class="badge ${complete ? 'good' : 'warn'}">${complete ? 'Gestionada' : `Advertencia ${index + 1}`}</span><code>${esc(candidate.advertencia_id)}</code></div>
          <small>${esc(candidate.tipo)}</small>
        </header>
        <p>${esc(candidate.descripcion)}</p>
        <dl><div><dt>Señales</dt><dd>${esc(candidate.signal_ids?.join(', ') || 'Ninguna')}</dd></div><div><dt>Fuentes</dt><dd>${esc(candidate.fuente_ids?.join(', ') || 'Ninguna')}</dd></div></dl>
        ${complete ? `<p class="analysis-warning-decision-saved">${esc(savedLabel)}. La gestión posterior queda disponible en la pestaña Advertencias del macroevento.</p>` : `
          <div class="analysis-warning-decision-controls">
            <label><span>Decisión</span><select data-warning-action><option value="incorporar">Incorporar al expediente</option><option value="descartar">Descartar con registro</option></select></label>
            <label><span>Tratamiento</span><select data-warning-treatment>${treatmentOptions.map(([value, label]) => `<option value="${value}" ${value === candidate.tratamiento_sugerido ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
            <label><span>Prioridad</span><select data-warning-priority>${priorityOptions.map(([value, label]) => `<option value="${value}" ${value === candidate.prioridad_sugerida ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
            <label class="analysis-warning-notes"><span>Justificación de la decisión</span><textarea data-warning-notes rows="2" placeholder="Explicá brevemente por qué se incorpora o descarta."></textarea></label>
            <button class="btn preparation" type="button" data-save-analysis-warning="${esc(candidate.advertencia_id)}" ${approved ? 'disabled' : ''}>Guardar decisión</button>
            <p class="muted" data-warning-decision-status role="status" aria-live="polite">Todavía no se modificó el expediente.</p>
          </div>`}
      </article>`;
  }).join('');
  return { complete: decided === candidates.length, decided, total: candidates.length };
}

function renderAnalysisResponseValidation(validation, session, { restored = false, scroll = true } = {}) {
  if (!validation || !session) return;
  currentAnalysisSession = session;
  currentResponseHash = validation.hash_sha256 || '';
  const ready = validation.status === 'ready';
  const approved = approvedState(session.estado);
  const metrics = validation.metrics || {};
  const values = [
    ['Bloqueos', validation.blocks?.length || 0, validation.blocks?.length ? 'bad' : 'good'],
    ['Advertencias', validation.warnings?.length || 0, validation.warnings?.length ? 'warn' : 'good'],
    ['Palabras', metrics.words || 0, 'info'],
    ['Subtítulos', metrics.headings || 0, metrics.headings >= 2 ? 'good' : 'warn'],
    ['Enlaces', metrics.links || 0, 'info'],
    ['Fuentes', `${metrics.source_ids || 0}/${metrics.authorized_source_ids || 0}`, 'info'],
  ];
  $('#analysis-response-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  renderIssues('#analysis-response-blocks', '#analysis-response-block-count', '#analysis-response-block-list', validation.blocks || []);
  renderIssues('#analysis-response-warnings', '#analysis-response-warning-count', '#analysis-response-warning-list', validation.warnings || []);
  const warningDecisionState = renderAnalysisWarningDecisions(validation.warning_candidates || [], approved);

  const metadata = validation.metadata || {};
  const metadataValues = [
    ['Título', metadata.titulo || 'Sin título'],
    ['Subtítulo', metadata.subtitulo || 'Sin subtítulo'],
    ['post_id', metadata.post_id || 'Sin definir'],
    ['slug', metadata.slug || 'Sin definir'],
    ['Macroevento', metadata.macroevento_principal_id || 'Sin definir'],
    ['Estado', metadata.publicacion?.estado || 'Sin definir'],
  ];
  $('#analysis-response-metadata-list').innerHTML = metadataValues.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('');
  $('#analysis-response-preview-heading').textContent = metadata.titulo || 'Análisis propuesto';
  $('#analysis-response-preview-subtitle').textContent = metadata.subtitulo || '';
  $('#analysis-response-preview-body').innerHTML = validation.preview_html || '<p>No hay cuerpo Markdown disponible para previsualizar.</p>';

  $('#analysis-response-validation-state').className = approved ? 'badge good' : ready ? 'badge info' : 'badge bad';
  $('#analysis-response-validation-state').textContent = approved ? 'Aprobada' : ready ? 'Validada' : 'Con bloqueos';
  $('#analysis-response-state').className = approved ? 'badge good' : ready ? 'badge info' : 'badge bad';
  $('#analysis-response-state').textContent = approved ? 'Respuesta aprobada' : ready ? 'Respuesta validada' : 'Requiere corrección';
  $('#approve-analysis-response').disabled = !ready || approved || !warningDecisionState.complete;
  $('#approve-analysis-response').textContent = approved ? 'Respuesta aprobada' : 'Aprobar respuesta validada';
  $('#analysis-response-approval-status').textContent = approved
    ? 'Aprobación guardada. La Fase 6 podrá preparar el paquete sin modificar archivos públicos.'
    : ready && !warningDecisionState.complete
      ? `Gestioná las ${warningDecisionState.total - warningDecisionState.decided} advertencia(s) pendientes antes de aprobar.`
      : ready
      ? 'Revisá la vista previa; todas las advertencias ya tienen decisión.'
      : 'Corregí los bloqueos y validá nuevamente; las advertencias por sí solas no impiden aprobar.';
  $('#analysis-response-file-status').textContent = restored
    ? 'Respuesta y validación recuperadas desde la sesión local.'
    : ready
      ? 'Respuesta guardada y validada. Falta tu aprobación explícita.'
      : `Respuesta guardada con ${validation.blocks?.length || 0} bloqueos. Podés corregir el contenido y volver a validar.`;
  $('#analysis-response-results').hidden = false;
  $('#analysis-response-workspace').hidden = false;
  $('#preparation-status').className = approved ? 'badge good' : 'badge warn';
  $('#preparation-status').textContent = approved ? 'Respuesta aprobada' : ready ? 'Pendiente de aprobación' : 'Respuesta con bloqueos';
  $('#preparation-message').className = `panel preparation-phase-note issue ${ready ? 'success' : 'error'}`;
  $('#preparation-message').textContent = approved
    ? session.paquete_revision?.estado === 'archivos_preparados'
      ? 'Fase 6 recuperada: los archivos están preparados y el ZIP continúa disponible. No se aplicó ningún archivo canónico.'
      : 'Fase 5 completada: la respuesta fue validada y aprobada. Se actualizó 1 archivo de sesión y 0 archivos canónicos.'
    : ready
      ? `Respuesta validada con ${warningDecisionState.total} advertencia(s) estructurada(s); ${warningDecisionState.decided} ya fueron gestionadas. Se actualizó 1 archivo de sesión.`
      : `La respuesta se recibió, pero tiene ${validation.blocks?.length || 0} bloqueos. No puede aprobarse. Se actualizó 1 archivo de sesión y 0 archivos canónicos.`;
  markAnalysisResponseState(session);
  configureReviewPackageAvailability(session);
  if (scroll) $('#analysis-response-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveAnalysisWarningDecision(button) {
  const card = button.closest('[data-analysis-warning-card]');
  if (!card || !currentResponseHash) return;
  const status = card.querySelector('[data-warning-decision-status]');
  const action = card.querySelector('[data-warning-action]').value;
  const treatment = card.querySelector('[data-warning-treatment]').value;
  const priority = card.querySelector('[data-warning-priority]').value;
  const notes = card.querySelector('[data-warning-notes]').value.trim();
  button.disabled = true;
  button.textContent = 'Guardando…';
  status.textContent = 'Validando y registrando la decisión con backup…';
  try {
    const response = await fetch('/api/analysis-response/warning-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        advertencia_id: button.dataset.saveAnalysisWarning,
        hash_sha256: currentResponseHash,
        accion: action,
        tratamiento: treatment,
        prioridad: priority,
        notas: notes,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `Error ${response.status}`);
    const validation = responseValidationFromSession(result.session);
    renderAnalysisResponseValidation(validation, result.session, { scroll: false });
  } catch (error) {
    status.textContent = `No se guardó: ${error.message}`;
    button.disabled = false;
    button.textContent = 'Guardar decisión';
  }
}

function renderStoredAnalysisResponse(session, { restored = false } = {}) {
  const validation = responseValidationFromSession(session);
  if (!validation) return;
  $('#analysis-response-content').value = session.respuesta_chatgpt?.contenido_original || validation.normalized_markdown || '';
  $('#validate-analysis-response').disabled = !$('#analysis-response-content').value.trim();
  renderAnalysisResponseValidation(validation, session, { restored, scroll: false });
}

function openAnalysisResponse() {
  if (!currentAnalysisSession?.prompt_analisis) return;
  $('#analysis-response-workspace').hidden = false;
  if (!currentAnalysisSession.respuesta_chatgpt) {
    $('#analysis-response-state').className = 'badge warn';
    $('#analysis-response-state').textContent = 'Esperando respuesta';
    $('#analysis-response-results').hidden = true;
    $('#analysis-response-content').focus();
  }
  $('#analysis-response-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadAnalysisResponseFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = $('#analysis-response-file-status');
  if (file.size > 8 * 1024 * 1024) {
    status.textContent = 'El archivo supera 8 MB y no se cargó.';
    event.target.value = '';
    return;
  }
  try {
    const content = await file.text();
    $('#analysis-response-content').value = content;
    $('#validate-analysis-response').disabled = !content.trim();
    $('#analysis-response-results').hidden = true;
    status.textContent = `${file.name} cargado en la vista. Todavía no se guardó; pulsá Validar respuesta.`;
  } catch (error) {
    status.textContent = `No se pudo leer el archivo: ${error.message}`;
  } finally {
    event.target.value = '';
  }
}

async function validateAnalysisResponse() {
  const markdown = $('#analysis-response-content').value;
  if (!currentAnalysisSession || !markdown.trim()) return;
  const button = $('#validate-analysis-response');
  const status = $('#analysis-response-file-status');
  button.disabled = true;
  button.textContent = 'Validando…';
  status.textContent = 'Comprobando frontmatter, identidad, fuentes, enlaces y estructura…';
  try {
    const response = await fetch('/api/analysis-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId, markdown }),
    });
    const result = await response.json();
    if (!result.validation || !result.session) {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderAnalysisResponseValidation(result.validation, result.session);
  } catch (error) {
    status.textContent = `No se pudo validar la respuesta: ${error.message}`;
  } finally {
    button.disabled = !$('#analysis-response-content').value.trim();
    button.textContent = 'Validar respuesta';
  }
}

async function approveAnalysisResponse() {
  if (!currentAnalysisSession || !currentResponseHash) return;
  const button = $('#approve-analysis-response');
  const status = $('#analysis-response-approval-status');
  button.disabled = true;
  button.textContent = 'Guardando aprobación…';
  status.textContent = 'Confirmando la revisión humana dentro de la sesión local…';
  try {
    const response = await fetch('/api/analysis-response/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId, hash_sha256: currentResponseHash }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderAnalysisResponseValidation(result.validation, result.session, { scroll: false });
  } catch (error) {
    status.textContent = `No se pudo guardar la aprobación: ${error.message}`;
    button.disabled = false;
    button.textContent = 'Aprobar respuesta validada';
  }
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderReviewPackage(packageData, session, {
  file = null,
  downloadUrl = '',
  restored = false,
  reused = false,
  scroll = false,
} = {}) {
  if (!packageData || !session) return;
  currentAnalysisSession = session;
  currentReviewPackage = packageData;
  const artifacts = packageData.artifacts || [];
  const warnings = packageData.warnings || [];
  const values = [
    ['Artefactos', artifacts.length, 'good'],
    ['Tamaño ZIP', formatBytes(packageData.archive_bytes), 'info'],
    ['Advertencias', warnings.length, warnings.length ? 'warn' : 'good'],
    ['Diferencias', packageData.followup_changes || 0, packageData.followup_changes ? 'info' : 'good'],
    ['Escrituras canónicas', packageData.canonical_writes || 0, 'good'],
  ];
  $('#review-package-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#review-package-files').innerHTML = artifacts.map((artifact) => `
    <li>
      <div><b>${esc(artifact.path)}</b><small>${esc(artifact.role || 'Archivo de revisión')}</small></div>
      <span>${esc(formatBytes(artifact.bytes))}</span>
    </li>
  `).join('');
  const relativePath = file?.relative_path || `data\\paquetes\\${packageData.filename}`;
  $('#review-package-file-path').textContent = `ZIP local: ${relativePath}`;
  $('#review-package-safety').textContent = `Paquete ${packageData.package_id}: ${artifacts.length} artefactos preparados. Se creó 1 ZIP, se actualizó 1 sesión, se aplicaron 0 archivos canónicos y no se ejecutó Git.`;
  $('#review-package-manifest').textContent = JSON.stringify({
    package_id: packageData.package_id,
    estado: packageData.estado,
    macroevento_id: session.macroevento_id,
    post_id: session.respuesta_chatgpt?.validacion?.metadata?.post_id || '',
    slug: session.respuesta_chatgpt?.validacion?.metadata?.slug || '',
    response_hash: packageData.response_hash,
    archive_sha256: packageData.archive_sha256,
    canonical_writes: packageData.canonical_writes,
    git_executed: packageData.git_executed,
  }, null, 2);
  const link = $('#download-review-package');
  link.href = downloadUrl || `/api/review-package/download?macroevento_id=${encodeURIComponent(session.macroevento_id)}`;
  link.download = packageData.filename || '';
  $('#review-package-download-status').textContent = restored
    ? 'Paquete recuperado desde la sesión local. Podés descargar nuevamente el mismo ZIP.'
    : reused
      ? 'El paquete ya existía y fue verificado; no se creó una copia adicional.'
      : 'El ZIP quedó listo para descargar. Extraelo en una carpeta temporal antes de revisarlo.';
  $('#review-package-state').className = 'badge good';
  $('#review-package-state').textContent = 'Archivos preparados';
  $('#review-package-workspace').hidden = false;
  $('#generate-review-package').disabled = false;
  $('#generate-review-package').textContent = 'Comprobar paquete preparado';
  $('#review-package-action-status').textContent = 'La sesión ya contiene un paquete verificable y descargable.';
  $('#preparation-status').className = 'badge good';
  $('#preparation-status').textContent = 'Archivos preparados';
  $('#preparation-message').className = 'panel preparation-phase-note issue success';
  $('#preparation-message').textContent = 'Fase 6 completada: el paquete de revisión está preparado. Se escribió 1 ZIP y 1 archivo de sesión; 0 archivos canónicos fueron aplicados.';
  markAnalysisResponseState(session);
  configureLocalApplicationAvailability(session);
  if (scroll) $('#review-package-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function configureReviewPackageAvailability(session) {
  const button = $('#generate-review-package');
  const status = $('#review-package-action-status');
  currentReviewPackage = session?.paquete_revision || null;
  const approved = approvedState(session?.estado);
  button.disabled = !approved;
  const packaged = session?.paquete_revision?.estado === 'archivos_preparados';
  button.textContent = packaged
    ? 'Comprobar paquete preparado'
    : 'Generar paquete para VS Code';
  status.textContent = approved
    ? packaged
      ? 'El paquete guardado puede verificarse y descargarse nuevamente.'
      : 'La respuesta está aprobada. El paquete se generará sin aplicar archivos canónicos.'
    : 'Requiere una respuesta validada y aprobada.';
  if (packaged) {
    renderReviewPackage(session.paquete_revision, session, { restored: true });
  } else {
    $('#review-package-workspace').hidden = true;
    configureLocalApplicationAvailability(null);
  }
}

async function generateReviewPackage() {
  if (!currentAnalysisSession || !approvedState(currentAnalysisSession.estado)) return;
  const button = $('#generate-review-package');
  const status = $('#review-package-action-status');
  button.disabled = true;
  button.textContent = 'Preparando y verificando…';
  status.textContent = 'Revalidando identidades, propuesta, respuesta aprobada y checksums…';
  try {
    const response = await fetch('/api/review-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready' || !result.package || !result.session) {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderReviewPackage(result.package, result.session, {
      file: result.file,
      downloadUrl: result.download_url,
      reused: result.reused,
      scroll: true,
    });
  } catch (error) {
    status.textContent = `No se pudo generar el paquete: ${error.message}`;
    button.disabled = false;
    button.textContent = 'Intentar nuevamente';
  }
}

function localOperationLabel(value) {
  return {
    crear: 'Crear',
    modificar: 'Modificar',
    sin_cambios: 'Sin cambios',
  }[value] || value || 'Comprobar';
}

function configureLocalApplicationAvailability(session) {
  const button = $('#prepare-local-application');
  const status = $('#local-application-action-status');
  const packaged = session?.paquete_revision?.estado === 'archivos_preparados';
  currentLocalApplicationPlan = null;
  currentLocalApplication = session?.aplicacion_local || null;
  button.disabled = !packaged;
  button.textContent = currentLocalApplication?.estado === 'aplicada'
    ? 'Comprobar aplicación local'
    : 'Preparar aplicación local';
  status.textContent = packaged
    ? currentLocalApplication?.estado === 'aplicada'
      ? 'La sesión conserva una aplicación local completada y reversible.'
      : 'El paquete está listo. La comprobación todavía no escribirá archivos.'
    : 'Requiere un paquete de revisión preparado.';
  if (currentLocalApplication?.estado === 'aplicada') {
    renderRestoredLocalApplication(session);
  } else {
    $('#local-application-workspace').hidden = true;
    configureLocalIntegrationAvailability(null);
  }
}

function renderLocalApplicationPlan(plan, { scroll = true } = {}) {
  currentLocalApplicationPlan = plan;
  currentLocalApplication = null;
  const operation = plan.analysis.operation;
  const values = [
    ['Operación', localOperationLabel(operation), operation === 'sin_cambios' ? 'good' : 'info'],
    ['Crear', plan.writes.canonical_created, plan.writes.canonical_created ? 'info' : 'good'],
    ['Modificar', plan.writes.canonical_modified, plan.writes.canonical_modified ? 'info' : 'good'],
    ['Advertencias', plan.warnings?.length || 0, plan.warnings?.length ? 'warn' : 'good'],
    ['Git', plan.writes.git_operations, 'good'],
  ];
  $('#local-application-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#local-application-files').innerHTML = `
    <li><div><b>${esc(plan.analysis.target_relative)}</b><small>Borrador canónico validado · ${esc(plan.analysis.post_id)}</small></div><span>${esc(localOperationLabel(operation))}</span></li>
    <li><div><b>${esc(plan.application_record.relative)}</b><small>Registro de la transacción y datos de reversión</small></div><span>${operation === 'sin_cambios' ? 'No crear' : 'Crear'}</span></li>
    <li><div><b>data\\sesiones\\preparacion-${esc(plan.macroevento_id)}.json</b><small>Estado reanudable del circuito</small></div><span>${operation === 'sin_cambios' ? 'Sin cambios' : 'Actualizar'}</span></li>
  `;
  $('#local-application-backup-path').innerHTML = `<b>Destino:</b> <code>${esc(plan.backup.directory_relative)}</code>. ${plan.backup.previous_file_will_be_copied ? 'Se copiará allí el borrador anterior antes de reemplazarlo.' : 'El manifiesto registrará que el borrador no existía antes de esta aplicación.'}`;
  $('#local-application-followup-note').textContent = plan.followup.note;
  $('#local-application-safety').textContent = `Plan ${plan.application_id}: ZIP y respuesta revalidados. Se modificarán 0 archivos públicos y se ejecutarán 0 operaciones Git.`;
  $('#local-application-state').className = operation === 'sin_cambios' ? 'badge good' : 'badge warn';
  $('#local-application-state').textContent = operation === 'sin_cambios' ? 'El borrador ya coincide' : 'Pendiente de confirmación';
  $('#local-application-eyebrow').textContent = 'PLAN VERIFICADO · TODAVÍA SIN ESCRIBIR';
  $('#local-application-workspace-heading').textContent = 'Confirmación de aplicación local';
  $('#local-application-workspace').classList.remove('applied');
  $('#local-application-workspace').hidden = false;
  $('#local-application-result').hidden = true;
  $('#local-application-confirmation').hidden = operation === 'sin_cambios';
  $('#confirm-local-application').checked = false;
  $('#apply-local-application').disabled = true;
  $('#local-application-apply-status').textContent = operation === 'sin_cambios'
    ? 'El archivo local ya contiene exactamente el análisis aprobado; no es necesaria otra escritura.'
    : 'Revisá los destinos y marcá la confirmación para habilitar la aplicación.';
  $('#preparation-status').className = 'badge warn';
  $('#preparation-status').textContent = operation === 'sin_cambios' ? 'Sin cambios pendientes' : 'Aplicación pendiente';
  $('#preparation-message').className = 'panel preparation-phase-note issue warning';
  $('#preparation-message').textContent = operation === 'sin_cambios'
    ? 'Fase 7 comprobada: el borrador canónico ya coincide con el paquete aprobado. No se escribió ningún archivo.'
    : 'Plan de Fase 7 preparado: todavía no se escribió ningún archivo. La aplicación requiere tu confirmación explícita.';
  if (scroll) $('#local-application-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAppliedLocalApplication(session, application = null, plan = null, { restored = false } = {}) {
  const saved = session?.aplicacion_local || {};
  currentAnalysisSession = session;
  currentLocalApplication = saved;
  if (plan) currentLocalApplicationPlan = plan;
  const operation = plan?.analysis?.operation || saved.operation || application?.analysis?.operation || 'crear';
  const target = plan?.analysis?.target_relative || saved.target_relative || application?.analysis?.target_relative || 'data\\publicaciones\\borradores';
  const backup = plan?.backup?.directory_relative || saved.backup_relative || 'data\\backups\\aplicaciones';
  const record = plan?.application_record?.relative || saved.application_record_relative || 'data\\aplicaciones';
  const followupChanges = Number(plan?.followup?.differences ?? saved.followup_changes ?? 0);
  const values = [
    ['Estado', 'Aplicado', 'good'],
    ['Operación', localOperationLabel(operation), 'info'],
    ['Borradores', 1, 'good'],
    ['Archivos públicos', 0, 'good'],
    ['Git', 0, 'good'],
  ];
  $('#local-application-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#local-application-files').innerHTML = `
    <li><div><b>${esc(target)}</b><small>Borrador canónico aplicado</small></div><span>${esc(localOperationLabel(operation))}</span></li>
    <li><div><b>${esc(record)}</b><small>Registro de aplicación controlada</small></div><span>Creado</span></li>
  `;
  $('#local-application-backup-path').innerHTML = `<b>Backup:</b> <code>${esc(backup)}</code>`;
  $('#local-application-followup-note').textContent = followupChanges
    ? `${followupChanges} diferencia(s) de seguimiento permanecen preparadas para la integración pública local de la Fase 8.`
    : 'El seguimiento público local ya coincide; la Fase 8 comprobará ambos resultados en localhost.';
  $('#local-application-safety').textContent = `Aplicación ${esc(saved.application_id || application?.application_id || '')} completada. Se modificaron 0 archivos públicos y no se ejecutó Git.`;
  $('#local-application-state').className = 'badge good';
  $('#local-application-state').textContent = 'Aplicado localmente';
  $('#local-application-eyebrow').textContent = 'APLICACIÓN LOCAL · COMPLETADA';
  $('#local-application-workspace-heading').textContent = 'Aplicación local completada';
  $('#local-application-workspace').classList.add('applied');
  $('#local-application-workspace').hidden = false;
  $('#local-application-confirmation').hidden = true;
  $('#local-application-result').hidden = false;
  $('#local-application-result-message').textContent = restored
    ? 'La aplicación fue recuperada desde la sesión local. El borrador y su backup continúan registrados.'
    : 'El análisis aprobado quedó guardado como borrador canónico fuera de src. Todavía no fue integrado al preview ni publicado.';
  $('#local-application-result-files').innerHTML = `
    <li><div><b>${esc(target)}</b><small>Contenido aprobado</small></div><span>Guardado</span></li>
    <li><div><b>${esc(backup)}</b><small>Manifiesto y copia anterior cuando correspondía</small></div><span>Disponible</span></li>
  `;
  $('#confirm-local-rollback').checked = false;
  $('#rollback-local-application').disabled = saved.rollback_estado !== 'disponible';
  $('#local-application-rollback-status').textContent = saved.rollback_estado === 'disponible'
    ? 'Marcá la confirmación únicamente si necesitás deshacer esta aplicación.'
    : 'La restauración de esta aplicación ya fue completada o no está disponible.';
  $('#preparation-status').className = 'badge good';
  $('#preparation-status').textContent = 'Aplicado localmente';
  $('#preparation-message').className = 'panel preparation-phase-note issue success';
  $('#preparation-message').textContent = `Fase 7 completada: ${target} fue ${operation === 'modificar' ? 'actualizado' : 'creado'} con backup y escritura atómica. Se modificaron 0 archivos públicos y no se ejecutó Git.`;
  configureLocalIntegrationAvailability(session);
  configureProcessUpdateAvailability(session);
  refreshGlobalStatus(session);
}

function renderRestoredLocalApplication(session) {
  renderAppliedLocalApplication(session, null, null, { restored: true });
}

async function prepareLocalApplication() {
  const button = $('#prepare-local-application');
  const status = $('#local-application-action-status');
  button.disabled = true;
  button.textContent = 'Comprobando destinos…';
  status.textContent = 'Revalidando ZIP, respuesta, identidades, destino actual y backup…';
  try {
    const response = await fetch('/api/local-application/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderLocalApplicationPlan(result);
    status.textContent = result.analysis.operation === 'sin_cambios'
      ? 'El destino ya coincide exactamente con el análisis aprobado.'
      : 'Plan verificado. Revisá los destinos antes de confirmar la escritura.';
  } catch (error) {
    status.textContent = `No se pudo preparar la aplicación: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = 'Comprobar aplicación local';
  }
}

async function applyLocalApplication() {
  if (!currentLocalApplicationPlan || !$('#confirm-local-application').checked) return;
  const button = $('#apply-local-application');
  const status = $('#local-application-apply-status');
  button.disabled = true;
  button.textContent = 'Aplicando con backup…';
  status.textContent = 'Verificando nuevamente el plan y realizando la escritura atómica…';
  try {
    const response = await fetch('/api/local-application/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        plan_id: currentLocalApplicationPlan.plan_id,
        confirmado: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready' || !result.session) {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderAppliedLocalApplication(result.session, result.application, result.plan);
  } catch (error) {
    status.textContent = `No se pudo aplicar: ${error.message}`;
    $('#confirm-local-application').checked = false;
    button.disabled = true;
    button.textContent = 'Aplicar archivos validados';
  }
}

async function rollbackLocalApplication() {
  if (!currentLocalApplication?.application_id || !$('#confirm-local-rollback').checked) return;
  const button = $('#rollback-local-application');
  const status = $('#local-application-rollback-status');
  button.disabled = true;
  button.textContent = 'Restaurando…';
  status.textContent = 'Comprobando que el borrador no tenga ediciones posteriores…';
  try {
    const response = await fetch('/api/local-application/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        application_id: currentLocalApplication.application_id,
        confirmado: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    currentAnalysisSession = result.session;
    currentLocalApplication = result.session.aplicacion_local;
    $('#local-application-state').className = 'badge info';
    $('#local-application-state').textContent = 'Estado anterior restaurado';
    $('#local-application-eyebrow').textContent = 'APLICACIÓN LOCAL · REVERTIDA';
    $('#local-application-workspace-heading').textContent = 'Estado anterior restaurado';
    $('#local-application-result-heading').textContent = 'Aplicación revertida correctamente';
    $('#local-application-result-message').textContent = result.restored.action === 'archivo_creado_eliminado'
      ? 'El borrador creado por la aplicación fue eliminado porque no existía antes. El paquete y la respuesta aprobada se conservaron.'
      : 'La copia anterior del borrador fue restaurada. El paquete y la respuesta aprobada se conservaron.';
    $('#confirm-local-rollback').checked = false;
    button.disabled = true;
    button.textContent = 'Estado anterior restaurado';
    status.textContent = 'La reversión quedó registrada. Podés preparar nuevamente la aplicación cuando corresponda.';
    $('#prepare-local-application').disabled = false;
    $('#local-application-action-status').textContent = 'La aplicación fue revertida; el paquete sigue disponible para una nueva comprobación.';
    $('#preparation-status').className = 'badge info';
    $('#preparation-status').textContent = 'Aplicación revertida';
    $('#preparation-message').className = 'panel preparation-phase-note issue success';
    $('#preparation-message').textContent = 'El estado anterior fue restaurado sin modificar archivos públicos ni ejecutar Git.';
  } catch (error) {
    status.textContent = `No se pudo restaurar: ${error.message}`;
    $('#confirm-local-rollback').checked = false;
    button.disabled = true;
    button.textContent = 'Restaurar estado anterior';
  }
}

function configureLocalIntegrationAvailability(session) {
  const button = $('#prepare-local-integration');
  const status = $('#local-integration-action-status');
  const applied = session?.aplicacion_local?.estado === 'aplicada';
  currentLocalIntegrationPlan = null;
  currentLocalIntegration = session?.integracion_local || null;
  button.disabled = !applied;
  button.textContent = currentLocalIntegration?.estado === 'aplicada'
    ? 'Comprobar integración local'
    : 'Preparar integración local';
  status.textContent = applied
    ? currentLocalIntegration?.estado === 'aplicada'
      ? 'La sesión conserva una integración local completada y reversible.'
      : 'El borrador canónico está listo. El plan todavía no escribirá en src.'
    : 'Requiere la aplicación local completada.';
  if (currentLocalIntegration?.estado === 'aplicada') {
    renderAppliedLocalIntegration(session, null, null, { restored: true });
  } else {
    $('#local-integration-workspace').hidden = true;
    configureLocalPublicationAvailability(null);
  }
}

function renderLocalIntegrationPlan(plan, { scroll = true } = {}) {
  currentLocalIntegrationPlan = plan;
  currentLocalIntegration = null;
  const changed = plan.analysis.operation !== 'sin_cambios' || plan.followup.operation !== 'sin_cambios';
  const values = [
    ['Análisis', localOperationLabel(plan.analysis.operation), plan.analysis.operation === 'sin_cambios' ? 'good' : 'info'],
    ['Seguimiento', localOperationLabel(plan.followup.operation), plan.followup.operation === 'sin_cambios' ? 'good' : 'info'],
    ['Diferencias', plan.followup.differences, plan.followup.differences ? 'info' : 'good'],
    ['Producción', 0, 'good'],
    ['Git', plan.writes.git_operations, 'good'],
  ];
  $('#local-integration-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#local-integration-files').innerHTML = `
    <li><div><b>${esc(plan.analysis.target_relative)}</b><small>Contenido aprobado · ${esc(plan.analysis.post_id)}</small></div><span>${esc(localOperationLabel(plan.analysis.operation))}</span></li>
    <li><div><b>${esc(plan.followup.target_relative)}</b><small>Expediente público local · ${esc(plan.macroevento_id)}</small></div><span>${esc(localOperationLabel(plan.followup.operation))}</span></li>
    <li><div><b>${esc(plan.integration_record.relative)}</b><small>Registro transaccional y datos de reversión</small></div><span>${changed ? 'Crear' : 'No crear'}</span></li>
  `;
  $('#local-integration-backup-path').innerHTML = `<b>Backup:</b> <code>${esc(plan.backup.directory_relative)}</code>. Se conservarán únicamente los archivos anteriores que vayan a cambiar.`;
  $('#local-integration-safety').textContent = `Plan ${plan.integration_id}: borrador canónico e identidades verificados. No se ejecutarán check, build, Git ni despliegue.`;
  $('#local-integration-state').className = changed ? 'badge warn' : 'badge good';
  $('#local-integration-state').textContent = changed ? 'Pendiente de confirmación' : 'Los destinos ya coinciden';
  $('#local-integration-eyebrow').textContent = 'PLAN VERIFICADO · TODAVÍA SIN INTEGRAR';
  $('#local-integration-workspace-heading').textContent = 'Confirmación de integración local';
  $('#local-integration-workspace').classList.remove('applied');
  $('#local-integration-workspace').hidden = false;
  $('#local-integration-result').hidden = true;
  $('#local-integration-confirmation').hidden = !changed;
  $('#confirm-local-integration').checked = false;
  $('#apply-local-integration').disabled = true;
  $('#local-integration-apply-status').textContent = changed
    ? 'Revisá ambos destinos y marcá la confirmación para habilitar la integración.'
    : 'Los archivos del sitio ya contienen exactamente la integración propuesta; no es necesaria otra escritura.';
  $('#preparation-status').className = changed ? 'badge warn' : 'badge good';
  $('#preparation-status').textContent = changed ? 'Integración pendiente' : 'Sin cambios pendientes';
  $('#preparation-message').className = `panel preparation-phase-note issue ${changed ? 'warning' : 'success'}`;
  $('#preparation-message').textContent = changed
    ? 'Plan de Fase 8 preparado: todavía no se escribió en src. La integración requiere tu confirmación explícita.'
    : 'Fase 8 comprobada: los destinos ya coinciden y no se escribió ningún archivo.';
  if (scroll) $('#local-integration-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAppliedLocalIntegration(session, integration = null, plan = null, { restored = false } = {}) {
  const saved = session?.integracion_local || {};
  currentAnalysisSession = session;
  currentLocalIntegration = saved;
  if (plan) currentLocalIntegrationPlan = plan;
  const analysisTarget = plan?.analysis?.target_relative || saved.analysis_target_relative || integration?.analysis?.target_relative || 'src\\content\\publicaciones\\_preview';
  const followupTarget = plan?.followup?.target_relative || saved.followup_target_relative || integration?.followup?.target_relative || 'src\\data\\public\\observatorio.json';
  const analysisOperation = plan?.analysis?.operation || saved.analysis_operation || integration?.analysis?.operation || 'crear';
  const followupOperation = plan?.followup?.operation || saved.followup_operation || integration?.followup?.operation || 'sin_cambios';
  const analysisUrl = plan?.analysis?.preview_url || saved.analysis_preview_url || integration?.analysis?.preview_url || '/publicaciones/';
  const followupUrl = plan?.followup?.preview_url || saved.followup_preview_url || integration?.followup?.preview_url || `/observatorio/${currentEventId}/`;
  const backup = plan?.backup?.directory_relative || saved.backup_relative || 'data\\backups\\integraciones';
  const record = plan?.integration_record?.relative || saved.integration_record_relative || 'data\\integraciones';
  const values = [
    ['Estado', 'Integrado', 'good'],
    ['Análisis', localOperationLabel(analysisOperation), 'info'],
    ['Seguimiento', localOperationLabel(followupOperation), followupOperation === 'sin_cambios' ? 'good' : 'info'],
    ['Producción', 0, 'good'],
    ['Git', 0, 'good'],
  ];
  $('#local-integration-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#local-integration-files').innerHTML = `
    <li><div><b>${esc(analysisTarget)}</b><small>Análisis disponible solo en preview editorial</small></div><span>${esc(localOperationLabel(analysisOperation))}</span></li>
    <li><div><b>${esc(followupTarget)}</b><small>Seguimiento local comprobable</small></div><span>${esc(localOperationLabel(followupOperation))}</span></li>
    <li><div><b>${esc(record)}</b><small>Registro de integración controlada</small></div><span>Creado</span></li>
  `;
  $('#local-integration-backup-path').innerHTML = `<b>Backup:</b> <code>${esc(backup)}</code>`;
  $('#local-integration-safety').textContent = `Integración ${esc(saved.integration_id || integration?.integration_id || '')} completada. No se creó Markdown de producción y no se ejecutó Git.`;
  $('#local-integration-state').className = 'badge good';
  $('#local-integration-state').textContent = 'Integrado localmente';
  $('#local-integration-eyebrow').textContent = 'INTEGRACIÓN LOCAL · COMPLETADA';
  $('#local-integration-workspace-heading').textContent = 'Preview preparado para QA';
  $('#local-integration-workspace').classList.add('applied');
  $('#local-integration-workspace').hidden = false;
  $('#local-integration-confirmation').hidden = true;
  $('#local-integration-result').hidden = false;
  $('#local-integration-result-message').textContent = restored
    ? 'La integración fue recuperada desde la sesión. Los archivos, el backup y la reversión continúan registrados.'
    : 'El análisis y el expediente ya pueden comprobarse en localhost. Todavía no se ejecutaron los controles del sitio ni se publicó nada.';
  $('#local-integration-result-files').innerHTML = `
    <li><div><b>${esc(analysisTarget)}</b><small>Ruta editorial local</small></div><span>Integrado</span></li>
    <li><div><b>${esc(backup)}</b><small>Manifiesto y copias anteriores</small></div><span>Disponible</span></li>
  `;
  $('#local-integration-commands').textContent = 'npm run check\nnpm run build\nnpm run build:preview\nnpm run validate:build\nnpm run dev:editorial';
  $('#open-analysis-preview').href = localSiteUrl(analysisUrl);
  $('#open-followup-preview').href = localSiteUrl(followupUrl);
  $('#confirm-local-integration-rollback').checked = false;
  $('#rollback-local-integration').disabled = saved.rollback_estado !== 'disponible';
  $('#local-integration-rollback-status').textContent = saved.rollback_estado === 'disponible'
    ? 'Marcá la confirmación únicamente si necesitás deshacer esta integración.'
    : 'La restauración de esta integración ya fue completada o no está disponible.';
  $('#confirm-local-rollback').checked = false;
  $('#rollback-local-application').disabled = true;
  $('#local-application-rollback-status').textContent = 'Para deshacer la Fase 7, restaurá primero esta integración de Fase 8.';
  $('#preparation-status').className = 'badge good';
  $('#preparation-status').textContent = 'Integrado localmente';
  $('#preparation-message').className = 'panel preparation-phase-note issue success';
  $('#preparation-message').textContent = 'Fase 8 completada localmente: el preview quedó preparado con backup. Falta ejecutar check, build, build:preview y la revisión visual; Git no fue ejecutado.';
  configureLocalPublicationAvailability(session);
  configureProcessUpdateAvailability(session);
  refreshGlobalStatus(session);
}

async function prepareLocalIntegration() {
  const button = $('#prepare-local-integration');
  const status = $('#local-integration-action-status');
  button.disabled = true;
  button.textContent = 'Comprobando integración…';
  status.textContent = 'Verificando borrador canónico, identidades, src, seguimiento y backup…';
  try {
    const response = await fetch('/api/local-integration/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderLocalIntegrationPlan(result);
    status.textContent = 'Plan verificado. Revisá los destinos antes de confirmar.';
  } catch (error) {
    status.textContent = `No se pudo preparar la integración: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = 'Comprobar integración local';
  }
}

async function applyLocalIntegration() {
  if (!currentLocalIntegrationPlan || !$('#confirm-local-integration').checked) return;
  const button = $('#apply-local-integration');
  const status = $('#local-integration-apply-status');
  button.disabled = true;
  button.textContent = 'Integrando con backup…';
  status.textContent = 'Revalidando el plan y escribiendo únicamente los destinos confirmados…';
  try {
    const response = await fetch('/api/local-integration/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        plan_id: currentLocalIntegrationPlan.plan_id,
        confirmado: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready' || !result.session) {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderAppliedLocalIntegration(result.session, result.integration, result.plan);
  } catch (error) {
    status.textContent = `No se pudo integrar: ${error.message}`;
    $('#confirm-local-integration').checked = false;
    button.disabled = true;
    button.textContent = 'Integrar archivos en localhost';
  }
}

async function rollbackLocalIntegration() {
  if (!currentLocalIntegration?.integration_id || !$('#confirm-local-integration-rollback').checked) return;
  const button = $('#rollback-local-integration');
  const status = $('#local-integration-rollback-status');
  button.disabled = true;
  button.textContent = 'Restaurando…';
  status.textContent = 'Comprobando que los archivos integrados no tengan ediciones posteriores…';
  try {
    const response = await fetch('/api/local-integration/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        integration_id: currentLocalIntegration.integration_id,
        confirmado: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    currentAnalysisSession = result.session;
    currentLocalIntegration = result.session.integracion_local;
    $('#local-integration-state').className = 'badge info';
    $('#local-integration-state').textContent = 'Estado anterior restaurado';
    $('#local-integration-eyebrow').textContent = 'INTEGRACIÓN LOCAL · REVERTIDA';
    $('#local-integration-workspace-heading').textContent = 'Integración anterior restaurada';
    $('#local-integration-result-heading').textContent = 'Reversión completada';
    $('#local-integration-result-message').textContent = 'Los destinos del sitio volvieron al estado anterior. El borrador canónico de Fase 7 se conservó.';
    $('#confirm-local-integration-rollback').checked = false;
    button.disabled = true;
    button.textContent = 'Integración restaurada';
    status.textContent = 'La reversión quedó registrada. Podés preparar nuevamente la integración.';
    $('#prepare-local-integration').disabled = false;
    $('#local-integration-action-status').textContent = 'La integración fue revertida; el borrador canónico continúa disponible.';
    $('#confirm-local-rollback').checked = false;
    $('#rollback-local-application').disabled = true;
    $('#local-application-rollback-status').textContent = 'La Fase 7 vuelve a estar disponible; marcá su confirmación únicamente si también necesitás revertirla.';
    $('#preparation-status').className = 'badge info';
    $('#preparation-status').textContent = 'Integración revertida';
    $('#preparation-message').className = 'panel preparation-phase-note issue success';
    $('#preparation-message').textContent = 'El estado anterior del sitio fue restaurado sin ejecutar Git, build ni despliegue.';
    configureLocalPublicationAvailability(null);
  } catch (error) {
    status.textContent = `No se pudo restaurar: ${error.message}`;
    $('#confirm-local-integration-rollback').checked = false;
    button.disabled = true;
    button.textContent = 'Restaurar integración anterior';
  }
}

function configureLocalPublicationAvailability(session) {
  const button = $('#prepare-local-publication');
  const status = $('#local-publication-action-status');
  const integrated = session?.integracion_local?.estado === 'aplicada';
  currentLocalPublicationPlan = null;
  currentLocalPublication = session?.publicacion_local || null;
  if (!$('#local-publication-date').value) $('#local-publication-date').value = localDate();
  if (currentLocalPublication?.publicado_el) $('#local-publication-date').value = currentLocalPublication.publicado_el;
  $('#local-publication-date').disabled = currentLocalPublication?.estado === 'aplicada';
  button.disabled = !integrated;
  button.textContent = currentLocalPublication?.estado === 'aplicada'
    ? 'Comprobar publicación local'
    : 'Preparar publicación local';
  status.textContent = integrated
    ? currentLocalPublication?.estado === 'aplicada'
      ? 'La sesión conserva una publicación local preparada, reversible y todavía ajena a Git.'
      : 'El preview está integrado. El plan comprobará la puerta editorial sin escribir.'
    : 'Requiere la integración local y su revisión en preview.';
  if (currentLocalPublication?.estado === 'aplicada') {
    renderAppliedLocalPublication(session, null, null, { restored: true });
  } else {
    $('#local-publication-workspace').hidden = true;
  }
}

function renderLocalPublicationPlan(plan, { scroll = true } = {}) {
  currentLocalPublicationPlan = plan;
  currentLocalPublication = null;
  const changed = plan.analysis.operation !== 'sin_cambios' || plan.public_expedient?.operation !== 'sin_cambios';
  const values = [
    ['Operación', localOperationLabel(plan.analysis.operation), changed ? 'info' : 'good'],
    ['Fecha', plan.published_on, 'info'],
    ['Marcadores', plan.editorial_gate.unresolved_markers, 'good'],
    ['Fuentes', plan.editorial_gate.linked_sources, 'good'],
    ['Git', plan.writes.git_operations, 'good'],
  ];
  $('#local-publication-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#local-publication-files').innerHTML = `
    <li><div><b>${esc(plan.analysis.source_relative)}</b><small>Preview verificado · no se modificará</small></div><span>Origen</span></li>
    <li><div><b>${esc(plan.analysis.target_relative)}</b><small>Fuente del próximo build público local · ${esc(plan.analysis.post_id)}</small></div><span>${esc(localOperationLabel(plan.analysis.operation))}</span></li>
    <li><div><b>${esc(plan.public_expedient.relative)}</b><small>Expediente público · estado, fecha, próximo paso e hitos</small></div><span>${esc(localOperationLabel(plan.public_expedient.operation))}</span></li>
    <li><div><b>${esc(plan.publication_record.relative)}</b><small>Registro transaccional y reversión</small></div><span>${changed ? 'Crear' : 'No crear'}</span></li>
  `;
  $('#local-publication-backup-path').innerHTML = `<b>Backup:</b> <code>${esc(plan.backup.directory_relative)}</code>. ${plan.backup.previous_file_will_be_copied ? 'Se conservará la versión pública anterior. ' : ''}${plan.backup.previous_public_data_will_be_copied ? 'Se conservará también la proyección pública anterior del expediente.' : 'La proyección pública del expediente ya coincide.'}`;
  $('#local-publication-safety').textContent = `Plan ${plan.publication_id}: identidades, referencias, hash del preview y marcadores editoriales verificados. Se ejecutarán 0 operaciones Git y 0 despliegues.`;
  $('#local-publication-state').className = changed ? 'badge warn' : 'badge good';
  $('#local-publication-state').textContent = changed ? 'Pendiente de confirmación' : 'El destino ya coincide';
  $('#local-publication-eyebrow').textContent = 'PLAN VERIFICADO · TODAVÍA SIN PUBLICAR LOCALMENTE';
  $('#local-publication-workspace-heading').textContent = 'Confirmación de publicación local';
  $('#local-publication-workspace').classList.remove('applied');
  $('#local-publication-workspace').hidden = false;
  $('#local-publication-result').hidden = true;
  $('#local-publication-confirmation').hidden = !changed;
  $('#confirm-local-publication').checked = false;
  $('#apply-local-publication').disabled = true;
  $('#local-publication-apply-status').textContent = changed
    ? 'Leé la confirmación completa y marcala para habilitar la escritura local.'
    : 'La fuente pública local ya contiene exactamente esta versión; no se necesita otra escritura.';
  $('#preparation-status').className = changed ? 'badge warn' : 'badge good';
  $('#preparation-status').textContent = changed ? 'Publicación local pendiente' : 'Publicación local comprobada';
  $('#preparation-message').className = `panel preparation-phase-note issue ${changed ? 'warning' : 'success'}`;
  $('#preparation-message').textContent = changed
    ? 'Plan de Fase 9 preparado: todavía no se creó ni actualizó ningún Markdown ni expediente público. La operación exige tu confirmación explícita.'
    : 'Fase 9 comprobada: la fuente pública local ya coincide y no se escribió ningún archivo.';
  if (scroll) $('#local-publication-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAppliedLocalPublication(session, publication = null, plan = null, { restored = false } = {}) {
  const saved = session?.publicacion_local || {};
  currentAnalysisSession = session;
  currentLocalPublication = saved;
  if (plan) currentLocalPublicationPlan = plan;
  const target = plan?.analysis?.target_relative || saved.target_relative || publication?.analysis?.target_relative || 'src\\content\\publicaciones\\publicadas';
  const operation = plan?.analysis?.operation || saved.operation || publication?.analysis?.operation || 'crear';
  const publishedOn = plan?.published_on || saved.publicado_el || publication?.publicado_el || $('#local-publication-date').value;
  const backup = plan?.backup?.directory_relative || saved.backup_relative || 'data\\backups\\publicaciones';
  const record = plan?.publication_record?.relative || saved.publication_record_relative || 'data\\promociones';
  const publicUrl = plan?.analysis?.public_url || saved.public_url || publication?.analysis?.public_url || '/publicaciones/';
  const publicExpedient = plan?.public_expedient?.relative || saved.public_expedient_relative || publication?.public_expedient?.relative || 'src\\data\\public\\observatorio.json';
  const publicExpedientOperation = plan?.public_expedient?.operation || saved.public_expedient_operation || publication?.public_expedient?.operation || 'modificar';
  $('#local-publication-date').value = publishedOn;
  $('#local-publication-date').disabled = true;
  const values = [
    ['Estado', 'Local', 'good'],
    ['Operación', localOperationLabel(operation), 'info'],
    ['Fecha', publishedOn, 'info'],
    ['Internet', 0, 'good'],
    ['Git', 0, 'good'],
  ];
  $('#local-publication-metrics').innerHTML = values.map(([label, value, state]) => `
    <span class="preflight-kpi ${state}"><b>${esc(value)}</b><small>${esc(label)}</small></span>
  `).join('');
  $('#local-publication-files').innerHTML = `
    <li><div><b>${esc(target)}</b><small>Markdown incluido en el próximo build público local</small></div><span>${esc(localOperationLabel(operation))}</span></li>
    <li><div><b>${esc(publicExpedient)}</b><small>Expediente público promovido a publicado</small></div><span>${esc(localOperationLabel(publicExpedientOperation))}</span></li>
    <li><div><b>${esc(record)}</b><small>Registro de publicación controlada</small></div><span>Creado</span></li>
  `;
  $('#local-publication-backup-path').innerHTML = `<b>Backup:</b> <code>${esc(backup)}</code>`;
  $('#local-publication-safety').textContent = `Publicación ${esc(saved.publication_id || publication?.publication_id || '')} preparada localmente. No se ejecutaron Git, GitHub ni despliegue.`;
  $('#local-publication-state').className = 'badge good';
  $('#local-publication-state').textContent = 'Publicada solo localmente';
  $('#local-publication-eyebrow').textContent = 'PUBLICACIÓN LOCAL · COMPLETADA';
  $('#local-publication-workspace-heading').textContent = 'Fuente pública preparada para QA';
  $('#local-publication-workspace').classList.add('applied');
  $('#local-publication-workspace').hidden = false;
  $('#local-publication-confirmation').hidden = true;
  $('#local-publication-result').hidden = false;
  $('#local-publication-result-message').textContent = restored
    ? 'La publicación local fue recuperada desde la sesión. El Markdown, el registro y la reversión continúan disponibles.'
    : 'El Markdown público ya existe en tu copia local. Todavía falta el QA final y no se ejecutó ninguna operación Git.';
  $('#local-publication-result-files').innerHTML = `
    <li><div><b>${esc(target)}</b><small>Fuente pública local</small></div><span>Preparada</span></li>
    <li><div><b>${esc(publicExpedient)}</b><small>Estado público del expediente</small></div><span>Publicado</span></li>
    <li><div><b>${esc(backup)}</b><small>Manifiesto y versiones anteriores cuando correspondía</small></div><span>Disponible</span></li>
  `;
  $('#local-publication-commands').textContent = 'npm.cmd run test\nnpm.cmd run validate:data\nnpm.cmd run check\nnpm.cmd run build\nnpm.cmd run build:preview\nnpm.cmd run validate:build\ngit --no-pager diff --check\nnpm.cmd run dev';
  $('#open-local-publication').href = localSiteUrl(publicUrl);
  $('#confirm-local-publication-rollback').checked = false;
  $('#rollback-local-publication').disabled = saved.rollback_estado !== 'disponible';
  $('#local-publication-rollback-status').textContent = saved.rollback_estado === 'disponible'
    ? 'Marcá la confirmación únicamente si necesitás volver al estado público local anterior.'
    : 'La restauración ya fue completada o no está disponible.';
  $('#confirm-local-integration-rollback').checked = false;
  $('#rollback-local-integration').disabled = true;
  $('#prepare-local-integration').disabled = true;
  $('#local-integration-action-status').textContent = 'Fase 8 está protegida mientras esta publicación local de Fase 9 permanezca activa.';
  $('#local-integration-rollback-status').textContent = 'Para deshacer la Fase 8, restaurá primero esta publicación local de Fase 9.';
  $('#preparation-status').className = 'badge good';
  $('#preparation-status').textContent = 'Publicada solo localmente';
  $('#preparation-message').className = 'panel preparation-phase-note issue success';
  $('#preparation-message').textContent = 'Fase 9 completada en la copia local: falta ejecutar el QA final. Git, GitHub, beta, main y memogeopolitico.com no fueron modificados.';
  configureProcessUpdateAvailability(session);
  refreshGlobalStatus(session);
}

async function prepareLocalPublication() {
  const button = $('#prepare-local-publication');
  const status = $('#local-publication-action-status');
  const publishedOn = $('#local-publication-date').value;
  if (!publishedOn) {
    status.textContent = 'Elegí la fecha pública antes de preparar el plan.';
    return;
  }
  button.disabled = true;
  button.textContent = 'Comprobando publicación…';
  status.textContent = 'Verificando preview, identidades, fuentes, marcadores, destino y backup…';
  try {
    const response = await fetch('/api/local-publication/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macroevento_id: currentEventId, publicado_el: publishedOn }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderLocalPublicationPlan(result);
    const publicationMatches = result.analysis.operation === 'sin_cambios'
      && result.public_expedient?.operation === 'sin_cambios';
    status.textContent = publicationMatches
      ? 'La fuente pública local y el expediente ya coinciden exactamente.'
      : 'Plan verificado. Revisá origen, destinos, fecha y confirmación.';
  } catch (error) {
    status.textContent = `No se pudo preparar la publicación: ${error.message}`;
    $('#local-publication-workspace').hidden = true;
  } finally {
    button.disabled = false;
    button.textContent = currentLocalPublication?.estado === 'aplicada'
      ? 'Comprobar publicación local'
      : 'Preparar publicación local';
  }
}

async function applyLocalPublication() {
  if (!currentLocalPublicationPlan || !$('#confirm-local-publication').checked) return;
  const button = $('#apply-local-publication');
  const status = $('#local-publication-apply-status');
  button.disabled = true;
  button.textContent = 'Publicando localmente…';
  status.textContent = 'Revalidando el plan y escribiendo únicamente el destino confirmado…';
  try {
    const response = await fetch('/api/local-publication/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        publicado_el: currentLocalPublicationPlan.published_on,
        plan_id: currentLocalPublicationPlan.plan_id,
        confirmado: true,
        revision_confirmada: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready' || !result.session) {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    renderAppliedLocalPublication(result.session, result.publication, result.plan);
  } catch (error) {
    status.textContent = `No se pudo publicar localmente: ${error.message}`;
    $('#confirm-local-publication').checked = false;
    button.disabled = true;
    button.textContent = 'Publicar en la copia local';
  }
}

async function rollbackLocalPublication() {
  if (!currentLocalPublication?.publication_id || !$('#confirm-local-publication-rollback').checked) return;
  const button = $('#rollback-local-publication');
  const status = $('#local-publication-rollback-status');
  button.disabled = true;
  button.textContent = 'Restaurando…';
  status.textContent = 'Comprobando que el Markdown público no tenga ediciones posteriores…';
  try {
    const response = await fetch('/api/local-publication/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        macroevento_id: currentEventId,
        publication_id: currentLocalPublication.publication_id,
        confirmado: true,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ready') {
      throw new Error(result.blocks?.[0]?.detail || result.blocks?.[0]?.title || `El servidor respondió con error ${response.status}.`);
    }
    currentAnalysisSession = result.session;
    currentLocalPublication = result.session.publicacion_local;
    currentLocalIntegration = result.session.integracion_local;
    $('#local-publication-state').className = 'badge info';
    $('#local-publication-state').textContent = 'Estado anterior restaurado';
    $('#local-publication-eyebrow').textContent = 'PUBLICACIÓN LOCAL · REVERTIDA';
    $('#local-publication-workspace-heading').textContent = 'Publicación local anterior restaurada';
    $('#local-publication-result-heading').textContent = 'Reversión completada';
    $('#local-publication-result-message').textContent = result.restored.action === 'archivo_publico_creado_eliminado'
      ? 'El Markdown público creado por Fase 9 fue eliminado. El borrador canónico y el preview continúan intactos.'
      : 'La versión pública local anterior fue restaurada. El borrador canónico y el preview continúan intactos.';
    $('#confirm-local-publication-rollback').checked = false;
    button.disabled = true;
    button.textContent = 'Publicación local restaurada';
    status.textContent = 'La reversión quedó registrada. Podés preparar nuevamente la publicación.';
    $('#prepare-local-publication').disabled = false;
    $('#local-publication-date').disabled = false;
    $('#local-publication-action-status').textContent = 'La publicación fue revertida; el preview validado continúa disponible.';
    $('#confirm-local-integration-rollback').checked = false;
    $('#rollback-local-integration').disabled = currentLocalIntegration?.rollback_estado !== 'disponible';
    $('#prepare-local-integration').disabled = false;
    $('#local-integration-action-status').textContent = 'La publicación local fue revertida; la integración puede comprobarse o restaurarse nuevamente.';
    $('#local-integration-rollback-status').textContent = 'La publicación local ya fue restaurada; Fase 8 vuelve a ser reversible mientras el preview no haya cambiado.';
    $('#preparation-status').className = 'badge info';
    $('#preparation-status').textContent = 'Publicación local revertida';
    $('#preparation-message').className = 'panel preparation-phase-note issue success';
    $('#preparation-message').textContent = 'El estado público local anterior fue restaurado sin ejecutar Git, build ni despliegue.';
  } catch (error) {
    status.textContent = `No se pudo restaurar: ${error.message}`;
    $('#confirm-local-publication-rollback').checked = false;
    button.disabled = true;
    button.textContent = 'Restaurar publicación local anterior';
  }
}

async function restoreExistingSession(result) {
  let response;
  try {
    response = await fetch(`/api/preparation-session?macroevento_id=${encodeURIComponent(currentEventId)}`, { cache: 'no-store' });
  } catch {
    return;
  }
  const saved = await response.json().catch(() => null);
  if (!response.ok || saved?.status !== 'ready' || !saved.session) return;
  restoreWarningDecision(result, saved.session.decision_advertencias?.justificacion || '');
  if (saved.session.propuesta_seguimiento?.status === 'ready') {
    renderFollowupProposal(saved.session.propuesta_seguimiento, { scroll: false, announce: false });
  }
  renderAnalysisPromptSession(saved, { restored: true, scroll: false });
}

function renderPreflight(result) {
  currentPreflightResult = result;
  renderMetrics(result.metrics, result);
  renderIssues('#preflight-blocks', '#preflight-block-count', '#preflight-block-list', result.blocks);
  renderIssues('#preflight-warnings', '#preflight-warning-count', '#preflight-warning-list', result.warnings);
  renderIssues('#preflight-information', '#preflight-information-count', '#preflight-information-list', result.information);

  $('#preflight-passed-summary').textContent = `${result.passed.length} ${result.passed.length === 1 ? 'control superado' : 'controles superados'}`;
  $('#preflight-passed-list').innerHTML = result.passed.map((entry) => `<li>${esc(entry)}</li>`).join('');
  renderTrace(result.trace);
  configureDecision(result);
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('macroevento_id')?.trim() || '';
  if (!eventId) return showFailure('Falta el macroevento_id. Volvé al Observatorio y abrí la preparación desde una ficha guardada.');

  $('#preparation-status').className = 'badge info';
  $('#preparation-status').textContent = 'Comprobando datos';
  $('#preparation-message').className = 'panel preparation-phase-note';
  $('#preparation-message').textContent = 'Ejecutando el preflight sobre la ficha guardada…';

  let response;
  try {
    response = await fetch('/api/bootstrap', { cache: 'no-store' });
  } catch {
    return showFailure('No se pudo conectar con el servidor local del Observatorio.');
  }
  if (!response.ok) return showFailure(`El servidor local respondió con error ${response.status}.`);

  let payload;
  try {
    payload = await response.json();
  } catch {
    return showFailure('El servidor devolvió datos que no son JSON válido.');
  }
  if (payload.config?.features?.preparacion_analisis_seguimiento !== true) {
    return showFailure('El circuito acelerado está deshabilitado en data/config.json.');
  }

  const result = runPreflight({
    eventId,
    data: payload.data,
    catalog: payload.catalog,
    config: payload.config,
    validation: payload.validation,
    publicExpedients: payload.public_expedients,
  });
  if (!result.event) {
    const firstBlock = result.blocks[0];
    return showFailure(firstBlock?.detail || firstBlock?.title || 'No se pudo identificar el macroevento.');
  }

  const macroevent = result.event;
  currentEventId = macroevent.id;
  document.title = `Preparar · ${macroevent.titulo}`;
  $('#back-to-observatory').href = `/?view=events&macroevento_id=${encodeURIComponent(macroevent.id)}`;
  $('#preparation-title').textContent = macroevent.titulo;
  $('#preparation-event-id').textContent = `macroevento_id: ${macroevent.id}`;
  $('#preparation-content').hidden = false;
  renderPreflight(result);
  refreshGlobalStatus(null);

  if (result.status === 'blocked') {
    $('#preparation-status').className = 'badge bad';
    $('#preparation-status').textContent = 'Bloqueada';
    $('#preparation-message').className = 'panel preparation-phase-note issue error';
    $('#preparation-message').textContent = `Preflight bloqueado: corregí ${result.blocks.length} ${result.blocks.length === 1 ? 'problema estructural' : 'problemas estructurales'} antes de continuar. Ningún archivo fue creado o modificado.`;
  } else if (result.status === 'warnings') {
    $('#preparation-status').className = 'badge warn';
    $('#preparation-status').textContent = 'Guardado · Con advertencias';
    $('#preparation-message').className = 'panel preparation-phase-note issue warning';
    $('#preparation-message').textContent = `Preflight completado con ${result.warnings.length} ${result.warnings.length === 1 ? 'advertencia' : 'advertencias'}. Podés continuar con una justificación. Ningún archivo fue creado o modificado.`;
  } else {
    $('#preparation-status').className = 'badge good';
    $('#preparation-status').textContent = 'Guardado · Listo';
    $('#preparation-message').className = 'panel preparation-phase-note issue success';
    $('#preparation-message').textContent = 'Preflight completado sin bloqueos ni advertencias. Ningún archivo fue creado o modificado.';
  }
  if (result.status !== 'blocked') await restoreExistingSession(result);
}

$('#rerun-preflight').onclick = async () => {
  const button = $('#rerun-preflight');
  button.disabled = true;
  button.textContent = 'Revisando…';
  try {
    await bootstrap();
  } finally {
    button.disabled = false;
    button.textContent = 'Revisar de nuevo';
  }
};

$('#generate-followup-proposal').onclick = generateFollowupProposal;
$('#prepare-process-update').onclick = prepareProcessUpdate;
$('#confirm-process-update').onchange = () => {
  $('#apply-process-update').disabled = !$('#confirm-process-update').checked;
  $('#process-update-apply-status').textContent = $('#confirm-process-update').checked
    ? 'Confirmación registrada. Se actualizará únicamente la proyección pública del proceso.'
    : 'Marcá la confirmación para habilitar la actualización corta.';
};
$('#apply-process-update').onclick = applyProcessUpdate;
$('#confirm-responsive-qa').onchange = () => {
  refreshGlobalStatus(currentAnalysisSession);
  $('#final-qa-status').textContent = $('#confirm-responsive-qa').checked
    ? 'Revisión manual confirmada. El QA técnico se habilitará cuando exista una salida local con datos válidos.'
    : 'Requiere una salida local con QA de datos válido y la confirmación manual anterior.';
};
$('#run-final-qa').onclick = runFinalQa;
$('#generate-analysis-prompt').onclick = generateAnalysisPrompt;
$('#copy-analysis-prompt').onclick = copyAnalysisPrompt;
$('#open-analysis-response').onclick = openAnalysisResponse;
$('#analysis-response-file').onchange = loadAnalysisResponseFile;
$('#analysis-response-content').oninput = () => {
  const hasContent = Boolean($('#analysis-response-content').value.trim());
  $('#validate-analysis-response').disabled = !hasContent;
  if (currentResponseHash) {
    currentResponseHash = '';
    $('#approve-analysis-response').disabled = true;
    $('#analysis-response-approval-status').textContent = 'El contenido visible cambió. Volvé a validarlo antes de aprobar.';
    $('#analysis-response-validation-state').className = 'badge warn';
    $('#analysis-response-validation-state').textContent = 'Cambios sin validar';
  }
};
$('#validate-analysis-response').onclick = validateAnalysisResponse;
$('#approve-analysis-response').onclick = approveAnalysisResponse;
$('#analysis-warning-decision-list').onclick = (event) => {
  const button = event.target.closest('[data-save-analysis-warning]');
  if (button) saveAnalysisWarningDecision(button);
};
$('#generate-review-package').onclick = generateReviewPackage;
$('#download-review-package').onclick = () => {
  $('#review-package-download-status').textContent = 'Descarga solicitada. Conservá el ZIP sin mezclarlo todavía con las carpetas canónicas.';
};
$('#prepare-local-application').onclick = prepareLocalApplication;
$('#confirm-local-application').onchange = () => {
  $('#apply-local-application').disabled = !$('#confirm-local-application').checked;
  $('#local-application-apply-status').textContent = $('#confirm-local-application').checked
    ? 'Confirmación registrada en esta vista. El botón aplicará únicamente el plan verificado.'
    : 'Revisá los destinos y marcá la confirmación para habilitar la aplicación.';
};
$('#apply-local-application').onclick = applyLocalApplication;
$('#confirm-local-rollback').onchange = () => {
  const enabled = $('#confirm-local-rollback').checked && currentLocalApplication?.rollback_estado === 'disponible';
  $('#rollback-local-application').disabled = !enabled;
  $('#local-application-rollback-status').textContent = enabled
    ? 'La restauración está habilitada. Se verificará que no existan ediciones posteriores.'
    : 'Marcá la confirmación únicamente si necesitás deshacer esta aplicación.';
};
$('#rollback-local-application').onclick = rollbackLocalApplication;
$('#prepare-local-integration').onclick = prepareLocalIntegration;
$('#confirm-local-integration').onchange = () => {
  $('#apply-local-integration').disabled = !$('#confirm-local-integration').checked;
  $('#local-integration-apply-status').textContent = $('#confirm-local-integration').checked
    ? 'Confirmación registrada en esta vista. El botón aplicará únicamente el plan verificado.'
    : 'Revisá ambos destinos y marcá la confirmación para habilitar la integración.';
};
$('#apply-local-integration').onclick = applyLocalIntegration;
$('#confirm-local-integration-rollback').onchange = () => {
  const enabled = $('#confirm-local-integration-rollback').checked && currentLocalIntegration?.rollback_estado === 'disponible';
  $('#rollback-local-integration').disabled = !enabled;
  $('#local-integration-rollback-status').textContent = enabled
    ? 'La restauración está habilitada. Se verificarán los hashes antes de modificar los destinos.'
    : 'Marcá la confirmación únicamente si necesitás deshacer esta integración.';
};
$('#rollback-local-integration').onclick = rollbackLocalIntegration;
$('#prepare-local-publication').onclick = prepareLocalPublication;
$('#local-publication-date').onchange = () => {
  currentLocalPublicationPlan = null;
  $('#local-publication-workspace').hidden = true;
  $('#local-publication-action-status').textContent = 'Fecha actualizada. Prepará nuevamente el plan antes de confirmar.';
};
$('#confirm-local-publication').onchange = () => {
  $('#apply-local-publication').disabled = !$('#confirm-local-publication').checked;
  $('#local-publication-apply-status').textContent = $('#confirm-local-publication').checked
    ? 'Confirmación registrada en esta vista. El botón aplicará únicamente el plan verificado.'
    : 'La revisión y la autorización deben confirmarse para habilitar la publicación local.';
};
$('#apply-local-publication').onclick = applyLocalPublication;
$('#confirm-local-publication-rollback').onchange = () => {
  const enabled = $('#confirm-local-publication-rollback').checked && currentLocalPublication?.rollback_estado === 'disponible';
  $('#rollback-local-publication').disabled = !enabled;
  $('#local-publication-rollback-status').textContent = enabled
    ? 'La restauración está habilitada. Se verificará el hash antes de modificar el destino público local.'
    : 'Marcá la confirmación únicamente si necesitás deshacer esta publicación local.';
};
$('#rollback-local-publication').onclick = rollbackLocalPublication;

$('#local-publication-date').value = localDate();

bootstrap().catch((error) => showFailure(error.message || 'No se pudo iniciar la vista de preparación.'));
