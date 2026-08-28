import { initContextHelp, closeContextHelp } from './context-help.js';
import {
  languageLabel,
  normalizeCharacterization,
  normalizeLanguageCode,
} from './controlled-values.js';
import {
  internalCategoryById,
  normalizeInternalCategories,
} from './internal-categories.js';
import {
  EDITORIAL_VOCABULARY_DEFINITIONS,
  editorialVocabularyRecord,
  normalizeEditorialVocabularies,
  normalizeEditorialVocabularyId,
} from './editorial-vocabularies.js';
import {
  candidateExample,
  candidateFormatInstructions,
  applyCandidateDecisions,
  configureCandidateAction,
  configureCandidateWarning,
  parseCandidateText,
  prepareCandidateBatch,
  warningDecisionReady,
} from './candidate-import.js';
import {
  buildSearchPrompt,
  signalsForProfile,
  suggestSources,
  topicsForProfile,
} from './search-generator.js';
import {
  WARNING_EDITOR_ACTOR,
  WARNING_PRIORITY_LABELS,
  WARNING_STATE_LABELS,
  WARNING_TREATMENT_LABELS,
  filterAndSortWarnings,
  warningChangeSummary,
  warningPromptDecision,
  warningSummary,
} from './warnings-ui.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const deep = (value) => JSON.parse(JSON.stringify(value));
const today = () => new Date().toISOString().slice(0, 10);
const lines = (value) => String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const commas = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const slug = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const HUMAN_LABELS = { listo_para_prompt: 'Listo para encargo de redacción', prompt_exportado: 'Encargo exportado' };
const PUBLIC_STATE_LABELS = { borrador: 'En documentación', en_revision: 'En revisión editorial', listo: 'Listo para publicación', publicado: 'Publicado' };
const PUBLICATION_MANAGEMENT_LABELS = { borrador: 'Sin análisis', en_revision: 'En preparación', listo: 'Listo para publicar', publicado: 'Publicado' };
const EVENT_ROLE_LABELS = { rector: 'Rector', complementario: 'Complementario', independiente: 'Independiente' };
const LOCAL_SITE_ORIGIN = 'http://localhost:4321';
const human = (value) => HUMAN_LABELS[value] || String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const unique = (values) => [...new Set(values.filter(Boolean))];
const eventRectorIds = (event) => unique([
  ...(event?.macroevento_rector_id ? [event.macroevento_rector_id] : []),
  ...(Array.isArray(event?.macroevento_rector_ids) ? event.macroevento_rector_ids : []),
]);
const setEventRectorIds = (event, values) => {
  const ids = unique(values).filter((id) => id && id !== event?.id);
  event.macroevento_rector_ids = ids;
  event.macroevento_rector_id = ids[0] || null;
};
const byId = (id) => S.data.macroeventos.find((item) => item.id === id);
const expById = (id) => S.data.expedientes_editoriales.find((item) => item.id === id);
const mediaById = (id) => S.catalog.records.find((item) => item.media_id === id);
const rel = (event) => ['impacto', 'persistencia', 'alcance', 'probabilidad'].reduce((total, key) => total * Number(event.evaluacion?.[key] || 1), 1);
const gapRaw = (event) => rel(event) / Math.max(1, Number(event.evaluacion?.cobertura_observada || 1));
const gapLevel = (event) => Number(event.evaluacion?.subcobertura || 1);
const eventRole = (event) => event?.es_macroevento_rector ? 'rector' : eventRectorIds(event).length ? 'complementario' : 'independiente';

function eventPublicRecord(event) {
  return S.publicExpedients.by_event?.[event.id] || null;
}

function eventPublicState(event) {
  return eventPublicRecord(event)?.estado || ({ revision: 'en_revision', validado: 'listo' }[event.estado_editorial] || 'borrador');
}

function publicationBadgeClass(state) {
  return state === 'publicado' ? 'good' : state === 'listo' || state === 'en_revision' ? 'info' : 'neutral';
}

function analysisUrl(event) {
  const publicationSlug = eventPublicRecord(event)?.slug;
  return publicationSlug ? `${LOCAL_SITE_ORIGIN}/publicaciones/${encodeURIComponent(publicationSlug)}/` : '';
}

const S = {
  data: { categorias_internas: [], vocabularios_editoriales: {}, macroeventos: [], expedientes_editoriales: [] },
  taxonomy: { categorias: [] },
  catalog: { records: [], metadata: {} },
  searchConfig: { ejes_editoriales: [], fuentes_prioritarias: [], criterios_transversales: [] },
  config: {},
  validation: { valid: true, errors: [], warnings: [] },
  catalogValidation: { valid: true, errors: [], warnings: [] },
  publicExpedients: { available: false, by_event: {}, warnings: [] },
  backups: [],
  catalogBackups: [],
  publicSyncPlan: null,
  changed: false,
  eventDraft: null,
  eventDraftChanged: false,
  eventEditorMode: '',
  lastEditedEventId: '',
  categoryEditorReturnToEvent: false,
  warningSelectedId: '',
  warningRadar: false,
  expDraft: null,
  currentPrompt: '',
  currentPromptMode: '',
  currentPromptFilename: '',
  catalogResearchEvidence: [],
  candidateImport: null,
  searchGenerator: {
    selectedTopicIds: [],
    actors: [],
    selectedSignalIds: [],
    sources: [],
    prompt: '',
  },
  serverOnline: null,
  appVersion: '',
};

const mobileNavigation = window.matchMedia('(max-width: 850px)');

function navigationIsOpen() {
  return $('#sidebar').classList.contains('open');
}

function closeNavigation(returnFocus = true) {
  if (!navigationIsOpen()) return;
  $('#sidebar').classList.remove('open');
  $('#sidebar').removeAttribute('role');
  $('#sidebar').removeAttribute('aria-modal');
  $('#menu').setAttribute('aria-expanded', 'false');
  $('#menu').setAttribute('aria-label', 'Abrir menú');
  $('#menu span').textContent = '☰';
  $('#nav-overlay').hidden = true;
  $('#main').inert = false;
  document.body.classList.remove('nav-open');
  if (returnFocus) $('#menu').focus();
}

function openNavigation() {
  if (!mobileNavigation.matches) return;
  $('#sidebar').classList.add('open');
  $('#sidebar').setAttribute('role', 'dialog');
  $('#sidebar').setAttribute('aria-modal', 'true');
  $('#menu').setAttribute('aria-expanded', 'true');
  $('#menu').setAttribute('aria-label', 'Cerrar menú');
  $('#menu span').textContent = '×';
  $('#nav-overlay').hidden = false;
  $('#main').inert = true;
  document.body.classList.add('nav-open');
  $('.nav-item', $('#sidebar'))?.focus();
}

function toggleNavigation() {
  if (navigationIsOpen()) closeNavigation();
  else openNavigation();
}

function syncNavigationMode() {
  if (!mobileNavigation.matches) closeNavigation(false);
  $('#sidebar').removeAttribute('aria-hidden');
}

function dismissDialog(dialog) {
  if (!dialog?.open) return;
  closeContextHelp(false);
  dialog.close('dismiss');
}

function setupDialogDismissal() {
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('cancel', () => closeContextHelp(false));
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dismissDialog(dialog);
    });
  });
}

function setServerStatus(online, detail = '') {
  S.serverOnline = online;
  const node = $('#server-status');
  if (!node) return;
  node.className = `server-status ${online ? 'online' : 'offline'}`;
  node.textContent = online ? 'Servidor conectado' : 'Servidor desconectado';
  node.title = detail || (online ? 'El servidor local responde.' : 'El dashboard sigue abierto, pero no puede guardar hasta reiniciar el servidor.');
  renderHelp();
}

async function api(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    setServerStatus(true);
  } catch (cause) {
    setServerStatus(false, cause.message);
    const error = new Error('No se pudo conectar con el servidor local. Mantené esta pestaña abierta, reiniciá “npm run start” y volvé a guardar.');
    error.code = 'SERVER_OFFLINE';
    error.cause = cause;
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.errors?.[0] || `Error ${response.status}`);
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    S.appVersion = payload.version || S.appVersion;
    setServerStatus(true);
    renderHelp();
    return true;
  } catch (error) {
    setServerStatus(false, error.message);
    return false;
  }
}

const notificationTimers = new WeakMap();

function notificationNode() {
  const openDialogs = $$('dialog[open]');
  const dialog = openDialogs.at(-1);
  if (!dialog) return $('#message');
  let node = dialog.querySelector(':scope > .dialog-message');
  if (!node) {
    node = document.createElement('div');
    node.className = 'dialog-message message';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.hidden = true;
    dialog.append(node);
  }
  return node;
}

function message(text, type = 'success', persistent = false, action = null) {
  const node = notificationNode();
  node.replaceChildren(document.createTextNode(text));
  if (action?.href && action?.label) {
    const link = document.createElement('a');
    link.className = 'message-action';
    link.href = action.href;
    link.textContent = action.label;
    node.append(link);
  }
  node.className = `${node.classList.contains('dialog-message') ? 'dialog-message ' : ''}message ${type}${persistent ? ' persistent' : ''}`;
  node.hidden = false;
  const prior = notificationTimers.get(node);
  if (prior) clearTimeout(prior);
  if (!persistent) {
    const timer = setTimeout(() => { node.hidden = true; }, 5000);
    notificationTimers.set(node, timer);
  }
}

function dirty(value = true) {
  S.changed = value;
  $('#save-state').textContent = value ? 'Cambios sin guardar' : 'Sin cambios';
  $('#save-state').classList.toggle('dirty', value);
  renderPublicSyncReadiness();
  refreshPreparationAction();
}

function preparationEnabled() {
  return S.config?.features?.preparacion_analisis_seguimiento === true;
}

function preparationUrl(eventId) {
  return `/preparacion.html?macroevento_id=${encodeURIComponent(eventId)}`;
}

function preparationBlockReason(eventId) {
  if (!preparationEnabled()) return 'La función está deshabilitada en la configuración local.';
  if (!eventId || !byId(eventId)) return 'La preparación requiere un macroevento existente y guardado.';
  if (S.changed) return 'Guardá primero los cambios pendientes del Observatorio.';
  if (S.eventDraftChanged) return 'Aplicá o cancelá los cambios de esta ficha antes de preparar.';
  return '';
}

function refreshPreparationAction() {
  const entry = $('#event-preparation-action');
  const button = $('#prepare-analysis-followup');
  const help = $('#prepare-analysis-help');
  if (!entry || !button || !help) return;
  const eventId = $('#event-original-id')?.value || '';
  const visible = preparationEnabled() && S.eventEditorMode === 'edit' && Boolean(eventId);
  entry.hidden = !visible;
  if (!visible) return;
  const reason = preparationBlockReason(eventId);
  button.disabled = Boolean(reason);
  button.title = reason;
  help.textContent = reason || 'Genera los prompts, propuestas de archivos e informe de trazabilidad para este macroevento.';
}

function markEventDraftChanged(event) {
  if (event?.target?.closest('.warning-toolbar, .event-record-tabs')) return;
  if (!S.eventDraft || S.eventEditorMode !== 'edit') return;
  S.eventDraftChanged = true;
  refreshPreparationAction();
}

function openPreparation(eventId) {
  const reason = preparationBlockReason(eventId);
  if (reason) return message(reason, 'warning');
  window.location.assign(preparationUrl(eventId));
}

window.addEventListener('beforeunload', (event) => {
  if (!S.changed) return;
  event.preventDefault();
  event.returnValue = '';
});

async function bootstrap() {
  const payload = await api('/api/bootstrap');
  S.appVersion = payload.app_version || S.appVersion;
  S.data = payload.data;
  S.taxonomy = payload.taxonomy;
  S.searchConfig = payload.search_config || S.searchConfig;
  S.catalog = payload.catalog;
  S.config = payload.config;
  S.validation = payload.validation;
  S.catalogValidation = payload.catalog_validation;
  S.publicExpedients = payload.public_expedients || S.publicExpedients;
  S.backups = payload.backups || [];
  S.catalogBackups = payload.catalog_backups || [];
  S.publicSyncPlan = null;
  dirty(false);
  fillFilters();
  renderAll();
  renderHelp();
  openRequestedLocation();
  await refreshPublicSyncReadiness();
}

function openRequestedLocation() {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get('view');
  const allowedViews = new Set(['overview', 'events', 'matrix', 'taxonomy', 'search', 'public-expedients', 'expedients', 'data']);
  if (allowedViews.has(requestedView)) view(requestedView);
  const eventId = params.get('macroevento_id')?.trim() || '';
  if (eventId && byId(eventId)) openEvent(eventId);
}

function view(id) {
  $$('.view').forEach((node) => node.classList.toggle('active', node.id === id));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === id));
  const titles = {
    overview: 'Resumen del Observatorio',
    events: 'Gestión de macroeventos',
    matrix: 'Matriz de gap mediático',
    taxonomy: 'Taxonomía de detección',
    search: 'Generador de búsqueda',
    'public-expedients': 'Expedientes públicos',
    expedients: 'Encargos editoriales',
    data: 'Datos, catálogo y backups',
  };
  $('#page-title').textContent = titles[id] || 'Observatorio';
  closeNavigation();
  if (id === 'matrix') renderMatrix();
  if (id === 'taxonomy') renderTaxonomy();
  if (id === 'search') renderSearchGenerator();
  if (id === 'public-expedients') renderPublicExpedients();
  if (id === 'expedients') renderExpedients();
  if (id === 'data') renderData();
}

function setOptions(select, values, placeholder) {
  const current = select.value;
  select.innerHTML = `<option value="">${esc(placeholder)}</option>${values.map((value) => `<option value="${esc(value)}">${esc(human(value))}</option>`).join('')}`;
  if (values.includes(current)) select.value = current;
}

function internalCategories() {
  S.data.categorias_internas = normalizeInternalCategories(S.data.categorias_internas, S.data.macroeventos);
  return S.data.categorias_internas;
}

function internalCategoryLabel(id) {
  return internalCategoryById(internalCategories(), id)?.nombre || human(id);
}

function setInternalCategoryFilterOptions(select, placeholder = 'Todas') {
  const current = select.value;
  const used = new Set((S.data.macroeventos || []).map((event) => event.categoria));
  const categories = internalCategories().filter((category) => category.estado === 'activa' || used.has(category.id));
  select.innerHTML = `<option value="">${esc(placeholder)}</option>${categories.map((category) => `<option value="${esc(category.id)}">${esc(category.nombre)}${category.estado === 'archivada' ? ' (archivada)' : ''}</option>`).join('')}`;
  if (categories.some((category) => category.id === current)) select.value = current;
}

function renderEventCategoryOptions(selectedId = '') {
  const select = $('#e-category');
  if (!select) return;
  const current = normalizeCharacterization(selectedId || select.value);
  const categories = internalCategories().filter((category) => category.estado === 'activa' || category.id === current);
  select.innerHTML = `<option value="">Seleccioná una categoría</option>${categories.map((category) => `<option value="${esc(category.id)}">${esc(category.nombre)}${category.estado === 'archivada' ? ' (archivada)' : ''}</option>`).join('')}`;
  select.value = categories.some((category) => category.id === current) ? current : '';
}

function fillFilters() {
  const events = S.data.macroeventos || [];
  setOptions($('#f-region'), unique(events.flatMap((event) => event.regiones || [])).sort(), 'Todas');
  setInternalCategoryFilterOptions($('#f-category'));
  setOptions($('#f-type'), unique(events.map((event) => event.tipo_proceso)).sort(), 'Todos');
  setOptions($('#f-status'), unique(events.map((event) => event.estado_editorial)).sort(), 'Todos');
  setOptions($('#o-type'), unique(events.map((event) => event.tipo_proceso)).sort(), 'Todos');
  setOptions($('#o-status'), unique(events.map((event) => event.estado_editorial)).sort(), 'Todos');
  setOptions($('#x-status'), unique((S.data.expedientes_editoriales || []).map((item) => item.estado)).sort(), 'Todos');
  const eventSelect = $('#x-event');
  const current = eventSelect.value;
  eventSelect.innerHTML = `<option value="">Todos</option>${events.map((event) => `<option value="${esc(event.id)}">${esc(event.titulo)}</option>`).join('')}`;
  if (events.some((event) => event.id === current)) eventSelect.value = current;
  const taxonomySelect = $('#t-category');
  taxonomySelect.innerHTML = `<option value="">Todas</option>${(S.taxonomy.categorias || []).map((category) => `<option value="${esc(category.id)}">${esc(category.nombre)}</option>`).join('')}`;
  renderControlledValueLists();
}

function renderDatalist(selector, values, label = (value) => human(value)) {
  const datalist = $(selector);
  if (!datalist) return;
  datalist.innerHTML = unique(values).sort((left, right) => left.localeCompare(right, 'es'))
    .map((value) => `<option value="${esc(value)}">${esc(label(value))}</option>`)
    .join('');
}

function renderControlledValueLists() {
  const vocabularies = editorialVocabularies();
  const active = (kind) => (vocabularies[kind] || []).filter((item) => item.estado === 'activa');
  renderDatalist('#signal-type-options', active('tipos_senal').map((item) => item.id), (id) => editorialVocabularyRecord(vocabularies, 'tipos_senal', id)?.nombre || human(id));
  renderDatalist('#source-type-options', active('tipos_fuente').map((item) => item.id), (id) => editorialVocabularyRecord(vocabularies, 'tipos_fuente', id)?.nombre || human(id));
  renderDatalist('#warning-type-options', active('tipos_advertencia').map((item) => item.id), (id) => editorialVocabularyRecord(vocabularies, 'tipos_advertencia', id)?.nombre || human(id));
  renderDatalist('#language-options', active('idiomas').map((item) => item.id), (id) => editorialVocabularyRecord(vocabularies, 'idiomas', id)?.nombre || languageLabel(id));
}

function renderAll() {
  renderOverview();
  renderEvents();
  renderMatrix();
  renderTaxonomy();
  renderSearchGenerator();
  renderPublicExpedients();
  renderExpedients();
  renderData();
  renderHelp();
}

function renderHelp() {
  const versionLabel = $('#app-version-label');
  if (versionLabel) versionLabel.textContent = `Observatorio v${S.appVersion || '—'}`;
  const version = $('#help-version');
  if (version) version.textContent = `v${S.appVersion || '—'}`;
  const server = $('#help-server-state');
  if (server) server.textContent = S.serverOnline === true ? 'Conectado' : S.serverOnline === false ? 'Desconectado' : 'Comprobando…';
  const schema = $('#help-schema-version');
  if (schema) schema.textContent = S.data?.schema_version ? `v${S.data.schema_version}` : '—';
  const taxonomy = $('#help-taxonomy-version');
  if (taxonomy) taxonomy.textContent = S.taxonomy?.schema_version ? `v${S.taxonomy.schema_version}` : '—';
  const counts = $('#help-counts');
  if (counts) {
    const events = S.data?.macroeventos || [];
    const editorialAssignments = S.data?.expedientes_editoriales || [];
    const signals = events.reduce((sum, event) => sum + (event.senales?.length || 0), 0);
    const sources = events.reduce((sum, event) => sum + (event.fuentes?.length || 0), 0);
    counts.innerHTML = `<span><b>${events.length}</b> macroeventos</span><span><b>${events.length}</b> expedientes públicos</span><span><b>${signals}</b> señales</span><span><b>${sources}</b> publicaciones</span><span><b>${editorialAssignments.length}</b> encargos editoriales</span><span><b>${S.catalog?.records?.length || 0}</b> fuentes catalogadas</span>`;
  }
}


function countBy(items, getter) {
  const map = new Map();
  for (const item of items) {
    const values = Array.isArray(getter(item)) ? getter(item) : [getter(item)];
    for (const value of values.filter(Boolean)) map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
}

function renderBars(target, entries, limit = 8) {
  const max = Math.max(1, ...entries.slice(0, limit).map(([, count]) => count));
  $(target).innerHTML = entries.slice(0, limit).map(([label, count]) => `<div class="bar"><span title="${esc(label)}">${esc(label)}</span><i><b style="width:${(count / max) * 100}%"></b></i><strong>${count}</strong></div>`).join('') || '<p class="muted">Sin datos.</p>';
}

function overviewEvents(events) {
  const q = normalize($('#o-search').value);
  const type = $('#o-type').value;
  const role = $('#o-role').value;
  const status = $('#o-status').value;
  const filtered = events.filter((event) => {
    const topics = (event.tema_ids || []).map(topicById).filter(Boolean).map((topic) => `${topic.id} ${topic.nombre} ${topic.categoria_nombre}`);
    const haystack = normalize([event.id, event.titulo, ...topics].join(' '));
    return (!q || haystack.includes(q)) && (!type || event.tipo_proceso === type) && (!role || eventRole(event) === role) && (!status || event.estado_editorial === status);
  }).sort((a, b) => rel(b) - rel(a) || a.titulo.localeCompare(b.titulo, 'es'));
  return { filtered, active: Boolean(q || type || role || status) };
}

function renderOverview() {
  const events = S.data.macroeventos || [];
  const editorialAssignments = S.data.expedientes_editoriales || [];
  const signals = events.reduce((sum, event) => sum + (event.senales?.length || 0), 0);
  const sources = events.reduce((sum, event) => sum + (event.fuentes?.length || 0), 0);
  const verified = events.reduce((sum, event) => sum + (event.fuentes || []).filter((source) => source.estado_verificacion === 'verificada').length, 0);
  const cards = [
    ['Macroeventos', events.length, 'Procesos analíticos'],
    ['Expedientes públicos', events.length, 'Uno por macroevento'],
    [editorialAssignments.length === 1 ? 'Encargo editorial' : 'Encargos editoriales', editorialAssignments.length, 'En preparación'],
    ['Señales', signals, 'Registros estructurados'],
    ['Fuentes', sources, `${verified} verificadas`],
    ['Catálogo', S.catalog.records.length, 'Fuentes clasificadas'],
  ];
  $('#cards').innerHTML = cards.map(([label, value, note]) => `<article class="card"><span>${esc(label)}</span><strong>${value}</strong><small>${esc(note)}</small></article>`).join('');
  const { filtered, active } = overviewEvents(events);
  const ranked = active ? filtered : filtered.slice(0, 8);
  $('#ranking-meta').textContent = active
    ? `${filtered.length} ${filtered.length === 1 ? 'macroevento encontrado' : 'macroeventos encontrados'}`
    : `Mostrando los ${Math.min(8, events.length)} de mayor relevancia`;
  $('#ranking').innerHTML = ranked.map((event, index) => {
    const publicState = eventPublicState(event);
    return `<button class="rank-row" data-edit-event="${esc(event.id)}"><b>${index + 1}</b><span><strong>${esc(event.titulo)}</strong><small>${esc(event.id)} · ${esc(EVENT_ROLE_LABELS[eventRole(event)])} · ${esc((event.regiones || []).join(' · '))}</small><small class="rank-publication ${publicState === 'publicado' ? 'is-published' : ''}">${esc(PUBLICATION_MANAGEMENT_LABELS[publicState] || human(publicState))}</small></span><em>${rel(event)}</em><i>gap ${gapLevel(event)}/5</i></button>`;
  }).join('') || '<p class="empty">No se encontraron macroeventos.</p>';
  renderBars('#regions', countBy(events, (event) => event.regiones || []));
  renderBars('#categories', countBy(events, (event) => internalCategoryLabel(event.categoria)));
  const errors = S.validation.errors || [];
  const warnings = S.validation.warnings || [];
  $('#quality').innerHTML = `<div class="quality-summary"><span class="badge ${errors.length ? 'bad' : 'good'}">${errors.length} errores</span><span class="badge ${warnings.length ? 'warn' : 'good'}">${warnings.length} advertencias</span><span class="badge info">${verified} fuentes verificadas</span><span class="badge info">${events.length} expedientes públicos</span><span class="badge info">${editorialAssignments.length} encargos editoriales</span></div>${errors.slice(0, 5).map((item) => `<p class="issue error">${esc(item)}</p>`).join('')}${warnings.slice(0, 5).map((item) => `<p class="issue warning">${esc(item)}</p>`).join('') || (!errors.length ? '<p class="muted">La estructura está lista para continuar con la revisión editorial.</p>' : '')}`;
}

function filteredEvents({ ignorePublication = false } = {}) {
  const q = normalize($('#f-search').value);
  const region = $('#f-region').value;
  const category = $('#f-category').value;
  const type = $('#f-type').value;
  const role = $('#f-role').value;
  const status = $('#f-status').value;
  const publication = $('#f-publication').value;
  const gap = Number($('#f-gap').value || 0);
  const sort = $('#f-sort').value;
  const events = (S.data.macroeventos || []).filter((event) => {
    const haystack = normalize([event.titulo, event.descripcion, event.categoria, ...(event.regiones || []), ...(event.actores || []), ...(event.palabras_clave || [])].join(' '));
    const publicState = eventPublicState(event);
    const publicationMatches = ignorePublication || !publication || (publication === 'pendiente' ? publicState !== 'publicado' : publicState === publication);
    return (!q || haystack.includes(q)) && (!region || event.regiones?.includes(region)) && (!category || event.categoria === category) && (!type || event.tipo_proceso === type) && (!role || eventRole(event) === role) && (!status || event.estado_editorial === status) && publicationMatches && (!gap || gapLevel(event) >= gap);
  });
  events.sort((a, b) => sort === 'publication' ? Number(eventPublicState(a) === 'publicado') - Number(eventPublicState(b) === 'publicado') || rel(b) - rel(a) : sort === 'gap' ? gapLevel(b) - gapLevel(a) : sort === 'title' ? a.titulo.localeCompare(b.titulo, 'es') : sort === 'date' ? String(b.fecha_corte).localeCompare(String(a.fecha_corte)) : rel(b) - rel(a));
  return events;
}

function renderPublicationSummary(events) {
  const selected = $('#f-publication').value;
  const published = events.filter((event) => eventPublicState(event) === 'publicado').length;
  const options = [
    ['', 'Todos', events.length],
    ['publicado', 'Publicados', published],
    ['pendiente', 'Pendientes', events.length - published],
  ];
  $('#event-publication-summary').innerHTML = options.map(([value, label, count]) => `<button type="button" class="publication-summary__item ${selected === value ? 'active' : ''}" data-publication-quick="${value}" aria-pressed="${selected === value}"><span>${esc(label)}</span><strong>${count}</strong></button>`).join('');
}

function sourceSummary(event) {
  const total = event.fuentes?.length || 0;
  const verified = (event.fuentes || []).filter((source) => source.estado_verificacion === 'verificada').length;
  return `${verified}/${total} verificadas`;
}

function pendingUpdateCount(event) {
  const sourceIds = new Set((event.actualizaciones || []).flatMap((item) => item.fuente_ids_agregadas || []));
  const signalIds = new Set((event.actualizaciones || []).flatMap((item) => item.senal_ids_agregadas || []));
  const pendingSources = (event.fuentes || []).filter((source) => sourceIds.has(source.id) && source.estado_verificacion === 'pendiente').length;
  const pendingSignals = (event.senales || []).filter((signal) => signalIds.has(signal.id) && signal.estado_revision === 'pendiente').length;
  return pendingSources + pendingSignals;
}

function renderEvents() {
  const events = filteredEvents();
  renderPublicationSummary(filteredEvents({ ignorePublication: true }));
  $('#event-count').textContent = `${events.length} ${events.length === 1 ? 'macroevento mostrado' : 'macroeventos mostrados'}`;
  $('#event-empty').hidden = events.length > 0;
  $('#event-rows').innerHTML = events.map((event) => {
    const publicState = eventPublicState(event);
    const publicLabel = PUBLICATION_MANAGEMENT_LABELS[publicState] || human(publicState);
    const publicUrl = analysisUrl(event);
    const publicationControl = publicState === 'publicado' && publicUrl
      ? `<a class="badge good publication-state-link" data-open-analysis="${esc(event.id)}" href="${esc(publicUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir análisis publicado: ${esc(event.titulo)}">${esc(publicLabel)} <span aria-hidden="true">↗</span></a>`
      : `<span class="badge ${publicationBadgeClass(publicState)}">${esc(publicLabel)}</span>`;
    const publicationAction = publicState !== 'publicado' && preparationEnabled()
      ? `<a class="btn small primary" data-continue-publication="${esc(event.id)}" href="${esc(preparationUrl(event.id))}">Continuar publicación</a>`
      : '';
    return `<tr class="${publicState === 'publicado' ? 'is-published' : ''}">
    <td>${eventRole(event) !== 'independiente' ? `<span class="badge info">${esc(EVENT_ROLE_LABELS[eventRole(event)])}</span>` : ''}<strong>${esc(event.titulo)}</strong><small>${esc(internalCategoryLabel(event.categoria))} · ${esc(human(event.tipo_proceso))}</small></td>
    <td>${esc((event.regiones || []).slice(0, 3).join(' · '))}</td>
    <td>${esc(sourceSummary(event))}</td>
    <td><span class="metric-pill">${rel(event)}</span></td>
    <td><span class="metric-pill">${gapLevel(event)}/5</span></td>
    <td class="publication-cell">${publicationControl}${eventPublicRecord(event)?.actualizado_el ? `<small>Actualizado ${esc(eventPublicRecord(event).actualizado_el)}</small>` : ''}</td>
    <td><span class="badge ${event.estado_editorial === 'validado' ? 'good' : event.estado_editorial === 'archivado' ? 'bad' : 'warn'}">${esc(human(event.estado_editorial))}</span><small>${esc(human(event.estado_verificacion))}</small>${pendingUpdateCount(event) ? `<small class="pending-update">${pendingUpdateCount(event)} elementos de actualización pendientes</small>` : ''}</td>
    <td><div class="row-actions"><button class="btn small ghost" data-edit-event="${esc(event.id)}">Editar</button>${publicationAction}<button class="btn small ghost" data-create-exp="${esc(event.id)}">Crear encargo</button></div></td>
  </tr>`;
  }).join('');
}

function renderPublicExpedients() {
  const events = [...(S.data.macroeventos || [])].sort((a, b) => String(b.fecha_corte).localeCompare(String(a.fecha_corte)) || a.titulo.localeCompare(b.titulo, 'es'));
  $('#public-expedient-count').textContent = `${events.length} ${events.length === 1 ? 'expediente' : 'expedientes'}`;
  $('#public-expedient-list').innerHTML = events.map((event) => {
    const publicState = S.publicExpedients.by_event?.[event.id]?.estado || ({ revision: 'en_revision', validado: 'listo' }[event.estado_editorial] || 'borrador');
    const badgeClass = publicState === 'publicado' ? 'good' : publicState === 'en_revision' || publicState === 'listo' ? 'info' : 'warn';
    return `<article class="public-expedient-card">
    <div class="public-expedient-card__body">
      <span class="badge ${badgeClass}">${esc(PUBLIC_STATE_LABELS[publicState] || human(publicState))}</span>${event.es_macroevento_rector ? '<span class="badge info">Macroevento rector</span>' : ''}
      <h3>${esc(event.titulo)}</h3>
      <p>${esc(event.descripcion || 'Sin descripción.')}</p>
    </div>
    <div class="public-expedient-card__meta">
      <dl><div><dt>Fecha de corte</dt><dd>${esc(event.fecha_corte)}</dd></div><div><dt>Señales</dt><dd>${event.senales?.length || 0}</dd></div></dl>
      <button class="btn small ghost" data-edit-event="${esc(event.id)}">Editar ficha</button>
    </div>
  </article>`;
  }).join('') || '<section class="panel empty">No hay expedientes.</section>';
}

function renderMatrix() {
  const events = (S.data.macroeventos || []).filter((event) => event.estado_editorial !== 'archivado');
  const maxRel = Math.max(1, ...events.map(rel));
  $('#matrix-chart').innerHTML = `<div class="matrix-label top-left">Alta relevancia · baja cobertura</div><div class="matrix-label top-right">Alta relevancia · alta cobertura</div><div class="matrix-label bottom-left">Baja relevancia · baja cobertura</div><div class="matrix-label bottom-right">Baja relevancia · alta cobertura</div>${events.map((event) => {
    const x = ((Number(event.evaluacion?.cobertura_observada || 1) - 1) / 4) * 92 + 4;
    const y = 96 - (rel(event) / maxRel) * 88;
    const size = 12 + Number(event.evaluacion?.alcance || 1) * 4;
    return `<button class="matrix-point" data-edit-event="${esc(event.id)}" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px" title="${esc(event.titulo)} · relevancia ${rel(event)} · cobertura ${event.evaluacion?.cobertura_observada}"><span>${esc(event.titulo)}</span></button>`;
  }).join('')}`;
  $('#matrix-table').innerHTML = `<details><summary>Tabla accesible de la matriz</summary><div class="table-wrap"><table><thead><tr><th>Macroevento</th><th>Relevancia</th><th>Cobertura</th><th>Gap bruto</th><th>Subcobertura</th></tr></thead><tbody>${events.sort((a, b) => rel(b) - rel(a)).map((event) => `<tr><td><button class="link" data-edit-event="${esc(event.id)}">${esc(event.titulo)}</button></td><td>${rel(event)}</td><td>${event.evaluacion?.cobertura_observada}/5</td><td>${gapRaw(event).toFixed(1)}</td><td>${gapLevel(event)}/5</td></tr>`).join('')}</tbody></table></div></details>`;
}

function renderTaxonomy() {
  const q = normalize($('#t-search').value);
  const categoryId = $('#t-category').value;
  const categories = (S.taxonomy.categorias || []).filter((category) => !categoryId || String(category.id) === categoryId).map((category) => ({ ...category, temas: (category.temas || []).filter((topic) => !q || normalize(`${topic.id} ${topic.nombre}`).includes(q)) })).filter((category) => category.temas.length);
  $('#taxonomy-grid').innerHTML = categories.map((category) => `<section class="panel taxonomy-card"><header><div><small>Área ${esc(category.id)}</small><h3>${esc(category.nombre)}</h3></div><span>${category.temas.length}</span></header><div>${category.temas.map((topic) => `<p><b>${esc(topic.id)}</b> ${esc(topic.nombre)}</p>`).join('')}</div></section>`).join('') || '<section class="panel empty">No hay temas que coincidan.</section>';
  renderInternalCategories();
  renderEditorialVocabularies();
}

function renderInternalCategories() {
  const categories = internalCategories();
  const usage = countBy(S.data.macroeventos || [], (event) => event.categoria);
  const usageById = new Map(usage);
  $('#internal-category-count').textContent = `${categories.length} ${categories.length === 1 ? 'categoría' : 'categorías'}`;
  $('#internal-category-list').innerHTML = categories.map((category) => {
    const count = usageById.get(category.id) || 0;
    return `<article class="internal-category-row">
      <div><strong>${esc(category.nombre)}</strong><small>${esc(category.id)} · ${count} ${count === 1 ? 'macroevento' : 'macroeventos'}</small>${category.descripcion ? `<p>${esc(category.descripcion)}</p>` : ''}</div>
      <div class="item-actions"><span class="badge ${category.estado === 'activa' ? 'good' : 'neutral'}">${category.estado === 'activa' ? 'Activa' : 'Archivada'}</span><button type="button" class="btn small ghost" data-edit-internal-category="${esc(category.id)}">Editar</button></div>
    </article>`;
  }).join('') || '<p class="empty">Todavía no hay categorías internas.</p>';
}

function editorialVocabularies() {
  S.data.vocabularios_editoriales = normalizeEditorialVocabularies(
    S.data.vocabularios_editoriales,
    S.data.macroeventos,
  );
  return S.data.vocabularios_editoriales;
}

function editorialVocabularyUsage(kind, id) {
  const normalizedId = normalizeEditorialVocabularyId(kind, id);
  const events = S.data.macroeventos || [];
  if (kind === 'tipos_senal') return events.flatMap((event) => event.senales || []).filter((item) => normalizeCharacterization(item.tipo) === normalizedId).length;
  if (kind === 'tipos_fuente') return events.flatMap((event) => event.fuentes || []).filter((item) => normalizeCharacterization(item.tipo) === normalizedId).length;
  if (kind === 'tipos_advertencia') return events.flatMap((event) => event.advertencias || []).filter((item) => normalizeCharacterization(item.tipo) === normalizedId).length;
  return events.flatMap((event) => event.fuentes || []).filter((item) => normalizeLanguageCode(item.idioma) === normalizedId).length;
}

function renderEditorialVocabularies() {
  const target = $('#editorial-vocabulary-groups');
  if (!target) return;
  const vocabularies = editorialVocabularies();
  target.innerHTML = Object.entries(EDITORIAL_VOCABULARY_DEFINITIONS).map(([kind, definition]) => {
    const records = vocabularies[kind] || [];
    return `<details class="editorial-vocabulary-group" ${kind === 'tipos_advertencia' ? 'open' : ''}>
      <summary><span><strong>${esc(definition.nombre)}</strong><small>${records.length} valores</small></span><button type="button" class="btn ghost small" data-new-editorial-vocabulary="${esc(kind)}">Nuevo valor</button></summary>
      <div class="editorial-vocabulary-list">${records.map((record) => {
        const usage = editorialVocabularyUsage(kind, record.id);
        const defaults = kind === 'tipos_advertencia'
          ? `<small>Sugerencia: ${esc(human(record.tratamiento_sugerido))} · prioridad ${esc(human(record.prioridad_sugerida))}</small>`
          : '';
        return `<article class="editorial-vocabulary-row"><div><strong>${esc(record.nombre)}</strong><small>${esc(record.id)} · ${usage} usos</small>${defaults}${record.descripcion ? `<p>${esc(record.descripcion)}</p>` : ''}</div><div class="item-actions"><span class="badge ${record.estado === 'activa' ? 'good' : 'neutral'}">${record.estado === 'activa' ? 'Activo' : 'Archivado'}</span><button type="button" class="btn ghost small" data-edit-editorial-vocabulary="${esc(kind)}:${esc(record.id)}">Editar</button></div></article>`;
      }).join('') || '<p class="empty">Todavía no hay valores.</p>'}</div>
    </details>`;
  }).join('');
}

function updateEditorialVocabularyFields() {
  const kind = $('#editorial-vocabulary-kind').value;
  $('#warning-vocabulary-defaults').hidden = kind !== 'tipos_advertencia';
  $('#editorial-vocabulary-id').pattern = kind === 'idiomas'
    ? '[a-z]{2}'
    : '[a-z0-9]+(?:_[a-z0-9]+)*';
}

function openEditorialVocabularyEditor(kind = 'tipos_senal', id = '') {
  const vocabularies = editorialVocabularies();
  const item = id ? editorialVocabularyRecord(vocabularies, kind, id) : null;
  const definition = EDITORIAL_VOCABULARY_DEFINITIONS[kind] || EDITORIAL_VOCABULARY_DEFINITIONS.tipos_senal;
  $('#editorial-vocabulary-original-id').value = item?.id || '';
  $('#editorial-vocabulary-kind').value = kind;
  $('#editorial-vocabulary-kind').disabled = Boolean(item);
  $('#editorial-vocabulary-editor-title').textContent = item ? `Editar ${definition.singular}` : `Nuevo ${definition.singular}`;
  $('#editorial-vocabulary-name').value = item?.nombre || '';
  $('#editorial-vocabulary-id').value = item?.id || '';
  $('#editorial-vocabulary-id').readOnly = Boolean(item);
  $('#editorial-vocabulary-description').value = item?.descripcion || '';
  $('#editorial-vocabulary-aliases').value = (item?.aliases || []).join(', ');
  $('#editorial-vocabulary-status').value = item?.estado || 'activa';
  $('#editorial-vocabulary-treatment').value = item?.tratamiento_sugerido || 'relevante';
  $('#editorial-vocabulary-priority').value = item?.prioridad_sugerida || 'media';
  $('#editorial-vocabulary-editor-status').textContent = item
    ? 'El ID estable no se modifica al cambiar el nombre.'
    : 'El valor quedará en memoria hasta pulsar Guardar.';
  updateEditorialVocabularyFields();
  $('#editorial-vocabulary-editor').showModal();
  $('#editorial-vocabulary-name').focus();
}

function closeEditorialVocabularyEditor() {
  $('#editorial-vocabulary-editor').close();
}

function applyEditorialVocabulary(event) {
  event.preventDefault();
  const kind = $('#editorial-vocabulary-kind').value;
  const originalId = $('#editorial-vocabulary-original-id').value;
  const name = $('#editorial-vocabulary-name').value.trim();
  const id = originalId || normalizeEditorialVocabularyId(kind, $('#editorial-vocabulary-id').value || name);
  const vocabularies = editorialVocabularies();
  const records = vocabularies[kind] || [];
  const duplicate = records.find((item) => item.id === id && item.id !== originalId);
  if (!name || !id || duplicate) {
    $('#editorial-vocabulary-editor-status').textContent = duplicate
      ? `Ya existe el valor ${duplicate.nombre}.`
      : 'Completá un nombre y un ID válidos.';
    return;
  }
  const record = {
    id,
    nombre: name,
    descripcion: $('#editorial-vocabulary-description').value.trim(),
    aliases: commas($('#editorial-vocabulary-aliases').value),
    estado: $('#editorial-vocabulary-status').value === 'archivada' ? 'archivada' : 'activa',
    ...(kind === 'tipos_advertencia' ? {
      tratamiento_sugerido: $('#editorial-vocabulary-treatment').value,
      prioridad_sugerida: $('#editorial-vocabulary-priority').value,
    } : {}),
  };
  const index = records.findIndex((item) => item.id === originalId);
  if (index >= 0) records[index] = record;
  else records.push(record);
  S.data.vocabularios_editoriales = normalizeEditorialVocabularies(vocabularies, S.data.macroeventos);
  renderControlledValueLists();
  renderEditorialVocabularies();
  dirty(true);
  closeEditorialVocabularyEditor();
  message(`${originalId ? 'Valor actualizado' : 'Valor creado'} en memoria. Pulsá Guardar para persistir.`);
}

function openInternalCategoryEditor(categoryId = '', returnToEvent = false) {
  const category = categoryId ? internalCategoryById(internalCategories(), categoryId) : null;
  S.categoryEditorReturnToEvent = Boolean(returnToEvent);
  $('#internal-category-original-id').value = category?.id || '';
  $('#internal-category-editor-title').textContent = category ? 'Editar categoría interna' : 'Nueva categoría interna';
  $('#internal-category-name').value = category?.nombre || '';
  $('#internal-category-id').value = category?.id || '';
  $('#internal-category-id').readOnly = Boolean(category);
  $('#internal-category-description').value = category?.descripcion || '';
  $('#internal-category-status').value = category?.estado || 'activa';
  $('#internal-category-editor-status').textContent = category
    ? 'El ID estable no se modifica al cambiar el nombre.'
    : 'El ID se generará a partir del nombre y podrá ajustarse antes de crear la categoría.';
  $('#internal-category-editor').showModal();
  $('#internal-category-name').focus();
}

function closeInternalCategoryEditor() {
  $('#internal-category-editor').close();
  S.categoryEditorReturnToEvent = false;
}

function applyInternalCategory(event) {
  event.preventDefault();
  const originalId = $('#internal-category-original-id').value;
  const name = $('#internal-category-name').value.trim();
  const id = originalId || normalizeCharacterization($('#internal-category-id').value || name);
  const status = $('#internal-category-status').value === 'archivada' ? 'archivada' : 'activa';
  const categories = internalCategories();
  const duplicate = categories.find((category) => category.id === id && category.id !== originalId);
  if (!name) {
    $('#internal-category-editor-status').textContent = 'Ingresá un nombre visible.';
    $('#internal-category-name').focus();
    return;
  }
  if (!id || duplicate) {
    $('#internal-category-editor-status').textContent = duplicate ? `Ya existe la categoría ${duplicate.nombre}.` : 'Ingresá un ID estable válido.';
    $('#internal-category-id').focus();
    return;
  }

  const record = {
    id,
    nombre: name,
    descripcion: $('#internal-category-description').value.trim(),
    estado: status,
  };
  const existingIndex = categories.findIndex((category) => category.id === originalId);
  if (existingIndex >= 0) categories[existingIndex] = record;
  else categories.push(record);
  S.data.categorias_internas = normalizeInternalCategories(categories, S.data.macroeventos);
  const returnToEvent = S.categoryEditorReturnToEvent && $('#event-editor').open;
  fillFilters();
  renderTaxonomy();
  renderOverview();
  renderEvents();
  if (returnToEvent) {
    renderEventCategoryOptions(id);
    $('#e-category').value = id;
    markEventDraftChanged();
  }
  dirty(true);
  closeInternalCategoryEditor();
  message(`${originalId ? 'Categoría actualizada' : 'Categoría creada'} en memoria. Pulsá Guardar para persistir.`);
}

function searchProfile() {
  const id = $('#sg-axis').value;
  return (S.searchConfig.ejes_editoriales || []).find((item) => item.id === id) || S.searchConfig.ejes_editoriales?.[0] || {};
}

function initializeSearchGenerator() {
  if ($('#sg-axis').options.length) return;
  const defaults = S.searchConfig.valores_iniciales || {};
  $('#sg-axis').innerHTML = (S.searchConfig.ejes_editoriales || []).map((axis) => `<option value="${esc(axis.id)}">${axis.orden}. ${esc(axis.nombre)}</option>`).join('');
  $('#sg-axis').value = defaults.eje_editorial || $('#sg-axis').value;
  $('#sg-region').innerHTML = (S.searchConfig.regiones || ['Global']).map((region) => `<option value="${esc(region)}">${esc(region)}</option>`).join('');
  $('#sg-region').value = defaults.region || 'Global';
  $('#sg-period').value = defaults.periodo_dias || 90;
  $('#sg-hmin').value = defaults.horizonte_min_anios || 3;
  $('#sg-hmax').value = defaults.horizonte_max_anios || 10;
  $('#sg-max-events').value = defaults.max_eventos || 15;
  $('#sg-source-limit').value = S.searchConfig.limites_fuentes?.recomendado || 20;
  const selectedLanguages = new Set(defaults.idiomas || []);
  $('#sg-languages').innerHTML = (S.searchConfig.idiomas || []).map((language) => `<label><input type="checkbox" value="${esc(language)}" ${selectedLanguages.has(language) ? 'checked' : ''}><span>${esc(language)}</span></label>`).join('');
  applySearchProfile(true);
}

function selectedGeneratorLanguages() {
  return $$('input:checked', $('#sg-languages')).map((input) => input.value);
}

function profileClassLabel(value) {
  return {
    eje_tematico: 'Eje temático',
    preset_regional: 'Preset regional',
    preset_actores: 'Preset de actores',
    lente_transversal: 'Lente transversal',
  }[value] || human(value);
}

function invalidateSearchPrompt() {
  S.searchGenerator.prompt = '';
  $('#sg-prompt-preview').value = '';
  $('#sg-copy-prompt').disabled = true;
  $('#sg-download-prompt').disabled = true;
  $('#sg-prompt-status').textContent = 'La selección cambió. Pulsá “Generar prompt” para actualizar la salida.';
}

function recommendGeneratorSources() {
  const profile = searchProfile();
  S.searchGenerator.sources = suggestSources({
    catalog: S.catalog,
    priorities: S.searchConfig.fuentes_prioritarias,
    profile,
    region: $('#sg-region').value,
    languages: selectedGeneratorLanguages(),
    limit: Number($('#sg-source-limit').value || 20),
  });
  invalidateSearchPrompt();
  renderGeneratorSources();
}

function applySearchProfile(initial = false) {
  const profile = searchProfile();
  S.searchGenerator.selectedTopicIds = (profile.tema_ids || []).map(Number);
  S.searchGenerator.actors = [...(profile.actores || [])];
  S.searchGenerator.selectedSignalIds = (profile.senal_ids || []).map(Number);
  $('#sg-actors').value = S.searchGenerator.actors.join('\n');
  if (!initial && profile.regiones_sugeridas?.length) $('#sg-region').value = profile.regiones_sugeridas[0];
  recommendGeneratorSources();
  renderSearchGenerator();
}

function renderGeneratorTopics() {
  const query = normalize($('#sg-topic-search').value);
  const selected = new Set(S.searchGenerator.selectedTopicIds.map(Number));
  let topics = taxonomyTopics();
  if (query) {
    topics = topics.filter((topic) => normalize(`${topic.id} ${topic.nombre} ${topic.categoria_nombre}`).includes(query)).slice(0, 100);
  } else {
    topics = topics.filter((topic) => selected.has(Number(topic.id)));
  }
  $('#sg-topic-count').textContent = `${selected.size} seleccionados`;
  $('#sg-topic-options').innerHTML = topics.length
    ? topics.map((topic) => `<label class="generator-option"><input type="checkbox" data-sg-topic="${topic.id}" ${selected.has(Number(topic.id)) ? 'checked' : ''}><span><strong>${esc(topic.nombre)}</strong><small>${topic.id} · ${esc(topic.categoria_nombre)}</small></span></label>`).join('')
    : `<p class="muted">${query ? 'No hay temas coincidentes.' : 'No hay subtemas seleccionados. Usá la búsqueda para agregar.'}</p>`;
  $$('[data-sg-topic]', $('#sg-topic-options')).forEach((input) => {
    input.onchange = () => {
      const id = Number(input.dataset.sgTopic);
      const current = new Set(S.searchGenerator.selectedTopicIds.map(Number));
      if (input.checked) current.add(id); else current.delete(id);
      S.searchGenerator.selectedTopicIds = [...current].sort((a, b) => a - b);
      invalidateSearchPrompt();
      renderGeneratorTopics();
    };
  });
}

function renderGeneratorSignals() {
  const profileSignals = signalsForProfile(searchProfile(), S.taxonomy);
  const selected = new Set(S.searchGenerator.selectedSignalIds.map(Number));
  $('#sg-signal-options').innerHTML = profileSignals.length
    ? profileSignals.map((signal) => `<label class="generator-option"><input type="checkbox" data-sg-signal="${signal.id}" ${selected.has(Number(signal.id)) ? 'checked' : ''}><span><strong>${esc(signal.nombre)}</strong><small>Señal ${signal.id}</small></span></label>`).join('')
    : '<p class="muted">El eje no contiene señales preseleccionadas.</p>';
  $$('[data-sg-signal]', $('#sg-signal-options')).forEach((input) => {
    input.onchange = () => {
      const id = Number(input.dataset.sgSignal);
      const current = new Set(S.searchGenerator.selectedSignalIds.map(Number));
      if (input.checked) current.add(id); else current.delete(id);
      S.searchGenerator.selectedSignalIds = [...current].sort((a, b) => a - b);
      invalidateSearchPrompt();
    };
  });
}

function catalogSourceSelection(record) {
  return {
    selection_id: record.media_id,
    media_id: record.media_id,
    catalogada: true,
    prioritaria: false,
    nombre: record.nombre,
    url: record.url,
    region: record.region,
    idioma: record.idioma,
    familia: record.familia,
    funcion: record.funcion,
    perspectiva: record.perspectiva,
    puntuacion: Number(record.puntuacion || 0),
    estado: record.estado,
    razon: 'Agregada manualmente desde el catálogo.',
  };
}

function renderGeneratorSources() {
  const selected = new Map(S.searchGenerator.sources.map((source) => [source.selection_id, source]));
  const query = normalize($('#sg-source-search').value);
  let options;
  if (query) {
    const catalogMatches = (S.catalog.records || []).filter((record) => normalize([
      record.nombre,
      record.region,
      record.idioma,
      record.familia,
      record.funcion,
      record.perspectiva,
      record.uso,
    ].join(' ')).includes(query)).slice(0, 80).map(catalogSourceSelection);
    options = [...selected.values().filter((source) => normalize(`${source.nombre} ${source.region} ${source.idioma} ${source.funcion}`).includes(query)), ...catalogMatches];
  } else {
    options = [...selected.values()];
  }
  const deduped = [...new Map(options.map((source) => [source.selection_id, source])).values()]
    .sort((left, right) => Number(selected.has(right.selection_id)) - Number(selected.has(left.selection_id)) || left.nombre.localeCompare(right.nombre, 'es'));
  $('#sg-source-options').innerHTML = deduped.length
    ? deduped.map((source) => `<label class="source-selection-row">
      <input type="checkbox" data-sg-source="${esc(source.selection_id)}" ${selected.has(source.selection_id) ? 'checked' : ''}>
      <span><strong>${esc(source.nombre)}</strong><small>${esc(source.region || 'Sin región')} · ${esc(source.idioma || 'Sin idioma')} · ${esc(source.funcion || source.familia || '')}</small><small>${esc(source.razon || '')}</small></span>
      <span class="source-badges">${source.prioritaria ? '<b class="badge info">Prioritaria</b>' : ''}<b class="badge ${source.catalogada ? 'good' : 'warn'}">${source.catalogada ? 'Catalogada' : 'Externa'}</b></span>
    </label>`).join('')
    : `<p class="muted">${query ? 'No hay fuentes coincidentes.' : 'No hay fuentes seleccionadas.'}</p>`;
  $$('[data-sg-source]', $('#sg-source-options')).forEach((input) => {
    input.onchange = () => {
      const id = input.dataset.sgSource;
      const current = new Map(S.searchGenerator.sources.map((source) => [source.selection_id, source]));
      if (input.checked) {
        const record = S.catalog.records.find((item) => item.media_id === id);
        if (record) current.set(id, catalogSourceSelection(record));
      } else current.delete(id);
      S.searchGenerator.sources = [...current.values()];
      invalidateSearchPrompt();
      renderGeneratorSources();
    };
  });
  const cataloged = S.searchGenerator.sources.filter((source) => source.catalogada).length;
  const external = S.searchGenerator.sources.length - cataloged;
  const regions = unique(S.searchGenerator.sources.map((source) => source.region)).length;
  const functions = unique(S.searchGenerator.sources.map((source) => source.funcion || source.familia)).length;
  $('#sg-source-summary').innerHTML = `<span class="badge info">${S.searchGenerator.sources.length} seleccionadas</span><span class="badge good">${cataloged} catalogadas</span><span class="badge ${external ? 'warn' : 'good'}">${external} externas</span><span class="badge info">${regions} alcances regionales</span><span class="badge info">${functions} funciones</span>`;
}

function renderSearchGenerator() {
  initializeSearchGenerator();
  const profile = searchProfile();
  $('#sg-axis-class').textContent = profileClassLabel(profile.clase);
  renderGeneratorTopics();
  renderGeneratorSignals();
  renderGeneratorSources();
}

function generateSearchPrompt() {
  const hmin = Number($('#sg-hmin').value);
  const hmax = Number($('#sg-hmax').value);
  if (!Number.isFinite(hmin) || !Number.isFinite(hmax) || hmin > hmax) return message('El horizonte temporal es inválido.', 'error');
  const sourceLimits = S.searchConfig.limites_fuentes || { min: 15, max: 25 };
  if (S.searchGenerator.sources.length < sourceLimits.min || S.searchGenerator.sources.length > sourceLimits.max) {
    return message(`Seleccioná entre ${sourceLimits.min} y ${sourceLimits.max} fuentes.`, 'warning');
  }
  const topicMap = new Map(taxonomyTopics().map((topic) => [Number(topic.id), topic]));
  const prompt = buildSearchPrompt({
    profile: searchProfile(),
    region: $('#sg-region').value,
    languages: selectedGeneratorLanguages(),
    periodDays: Number($('#sg-period').value || 90),
    horizonMin: hmin,
    horizonMax: hmax,
    maxEvents: Number($('#sg-max-events').value || 15),
    topics: S.searchGenerator.selectedTopicIds.map((id) => topicMap.get(Number(id))).filter(Boolean),
    actors: lines($('#sg-actors').value),
    signals: S.searchGenerator.selectedSignalIds.map((id) => topicMap.get(Number(id))).filter(Boolean),
    sources: S.searchGenerator.sources,
    existingEvents: S.data.macroeventos,
    transversalCriteria: S.searchConfig.criterios_transversales || [],
    outputMode: $('#sg-output-mode').value,
    candidateInstructions: candidateFormatInstructions(),
  });
  S.searchGenerator.prompt = prompt;
  $('#sg-prompt-preview').value = prompt;
  $('#sg-copy-prompt').disabled = false;
  $('#sg-download-prompt').disabled = false;
  $('#sg-prompt-status').textContent = `${prompt.length.toLocaleString('es-AR')} caracteres · ${S.searchGenerator.sources.length} fuentes · ${S.searchGenerator.selectedTopicIds.length} subtemas.`;
  message('Prompt de búsqueda generado.');
}

function filteredExpedients() {
  const q = normalize($('#x-search').value);
  const type = $('#x-type').value;
  const status = $('#x-status').value;
  const eventId = $('#x-event').value;
  return (S.data.expedientes_editoriales || []).filter((item) => (!q || normalize(`${item.titulo_trabajo} ${item.pregunta_editorial} ${item.tesis_central}`).includes(q)) && (!type || item.tipo_documento === type) && (!status || item.estado === status) && (!eventId || item.macroevento_ids.includes(eventId))).sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)));
}

function renderExpedients() {
  const items = filteredExpedients();
  $('#expedient-count').textContent = `${items.length} ${items.length === 1 ? 'encargo editorial' : 'encargos editoriales'}`;
  $('#expedient-empty').hidden = items.length > 0;
  $('#expedient-rows').innerHTML = items.map((item) => {
    const sufficiency = assessSufficiency(item);
    return `<tr>
      <td><strong>${esc(item.titulo_trabajo || 'Sin título')}</strong><small>${esc(item.pregunta_editorial || 'Sin pregunta editorial')}</small></td>
      <td><span class="badge info">${esc(human(item.tipo_documento))}</span></td>
      <td>${item.macroevento_ids.length}</td><td>${item.source_ids.length}</td>
      <td><span class="badge ${['listo_para_prompt', 'prompt_exportado', 'aprobado'].includes(item.estado) ? 'good' : item.estado === 'fuentes_pendientes' ? 'warn' : 'info'}">${esc(human(item.estado))}</span><small>${sufficiency.sufficient ? 'Evidencia suficiente' : 'Requiere ampliación documental'}</small></td>
      <td>${esc(item.actualizado)}</td>
      <td><div class="row-actions"><button class="btn small ghost" data-edit-exp="${esc(item.id)}">Editar</button><button class="btn small primary" data-prompt-exp="${esc(item.id)}">Encargos</button></div></td>
    </tr>`;
  }).join('');
}

function validationHtml(result) {
  return `<div class="quality-summary"><span class="badge ${result.valid ? 'good' : 'bad'}">${result.valid ? 'Válido' : 'Con errores'}</span><span class="badge ${result.warnings?.length ? 'warn' : 'good'}">${result.warnings?.length || 0} advertencias</span></div>${(result.errors || []).map((item) => `<p class="issue error">${esc(item)}</p>`).join('')}${(result.warnings || []).map((item) => `<p class="issue warning">${esc(item)}</p>`).join('') || '<p class="muted">Sin advertencias.</p>'}`;
}

function renderBackups(target, items, type) {
  $(target).innerHTML = items.length ? items.map((item) => `<div class="backup-row"><span><strong>${esc(item.name)}</strong><small>${new Date(item.modified).toLocaleString('es')} · ${(item.size / 1024).toFixed(1)} KB</small></span><button class="btn small ghost" data-restore="${esc(item.name)}" data-backup-type="${type}">Restaurar</button></div>`).join('') : '<p class="muted">Todavía no hay backups.</p>';
}

function renderData() {
  const events = S.data.macroeventos || [];
  const sources = events.reduce((sum, event) => sum + (event.fuentes?.length || 0), 0);
  const verified = events.reduce((sum, event) => sum + (event.fuentes || []).filter((source) => source.estado_verificacion === 'verificada').length, 0);
  $('#data-summary').innerHTML = `<dt>Archivo</dt><dd>data/macroeventos.json</dd><dt>Esquema</dt><dd>v${S.data.schema_version}</dd><dt>Actualizado</dt><dd>${esc(S.data.actualizado)}</dd><dt>Macroeventos</dt><dd>${events.length}</dd><dt>Expedientes públicos</dt><dd>${events.length}</dd><dt>Encargos editoriales</dt><dd>${S.data.expedientes_editoriales.length}</dd><dt>Fuentes</dt><dd>${sources}</dd><dt>Verificadas</dt><dd>${verified}</dd>`;
  $('#catalog-summary').innerHTML = `<dt>Archivo</dt><dd>data/catalogo-medios.json</dd><dt>Fuentes catalogadas</dt><dd>${S.catalog.records.length}</dd><dt>Revisión</dt><dd>${esc(S.catalog.metadata?.ultima_revision || 'sin fecha')}</dd><dt>Importado</dt><dd>${esc(S.catalog.metadata?.importado || 'sin fecha')}</dd><dt>Fuente maestra</dt><dd>${esc(S.catalog.metadata?.archivo_fuente || 'medios.json')}</dd>`;
  $('#validation').innerHTML = validationHtml(S.validation);
  $('#catalog-validation').innerHTML = validationHtml(S.catalogValidation);
  renderBackups('#backups', S.backups, 'data');
  renderBackups('#catalog-backups', S.catalogBackups, 'catalog');
}

function blankEvent() {
  return { id: '', titulo: '', tipo_proceso: 'macroproceso_estructural', estado_editorial: 'borrador', estado_verificacion: 'pendiente', fecha_corte: today(), regiones: [], categoria: 'infraestructura_conectividad', tema_ids: [], clasificacion_tematica: { origen: 'humano', estado_revision: 'pendiente', taxonomy_version: Number(S.taxonomy.schema_version || 1), revisada_el: null }, descripcion: '', por_que_importa: '', es_macroevento_rector: false, macroevento_rector_id: null, macroevento_rector_ids: [], macroevento_relacionado_ids: [], senales: [], actores: [], intereses: [], horizonte: { min_anios: 3, max_anios: 10 }, escenarios: { base: '', adverso: '', transformador: '' }, indicadores: [], evaluacion: { impacto: 3, probabilidad: 3, alcance: 3, persistencia: 3, propagacion: 3, subcobertura: 3, incertidumbre: 3, urgencia: 3, cobertura_observada: 3, confianza: 'media' }, palabras_clave: [], fuentes: [], advertencias: [], excepciones_advertencias: [] };
}

function uniqueId(base, existing) {
  let candidate = slug(base);
  let index = 2;
  while (existing.has(candidate)) candidate = `${slug(base)}-${index++}`;
  return candidate;
}

function taxonomyTopics() {
  return (S.taxonomy.categorias || []).flatMap((category) => (category.temas || []).map((topic) => ({ ...topic, categoria_nombre: category.nombre })));
}

function topicById(id) {
  return taxonomyTopics().find((topic) => Number(topic.id) === Number(id));
}

function renderThemeEditor() {
  if (!S.eventDraft) return;
  const query = normalize($('#e-theme-search').value);
  const selected = new Set((S.eventDraft.tema_ids || []).map(Number));
  const selectedTopics = [...selected].map(topicById).filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  $('#e-theme-selected').innerHTML = selectedTopics.length
    ? selectedTopics.map((topic) => `<span class="topic-chip">${esc(topic.nombre)} <small>#${topic.id}</small><button type="button" data-remove-theme="${topic.id}" aria-label="Quitar ${esc(topic.nombre)}">×</button></span>`).join('')
    : '<span class="muted">Ningún tema seleccionado.</span>';
  const groups = (S.taxonomy.categorias || []).map((category) => {
    const topics = (category.temas || []).filter((topic) => !query || normalize(`${topic.id} ${topic.nombre} ${category.nombre}`).includes(query));
    if (!topics.length) return '';
    return `<section class="topic-category"><h4>${esc(category.nombre)}</h4><div class="topic-options">${topics.map((topic) => `<label class="topic-option"><input type="checkbox" value="${topic.id}" ${selected.has(Number(topic.id)) ? 'checked' : ''}><span>${esc(topic.nombre)} <small>#${topic.id}</small></span></label>`).join('')}</div></section>`;
  }).join('');
  $('#e-theme-options').innerHTML = groups || '<p class="muted">No hay temas que coincidan con la búsqueda.</p>';
  $$('input[type="checkbox"]', $('#e-theme-options')).forEach((input) => input.addEventListener('change', () => {
    const id = Number(input.value);
    const next = new Set((S.eventDraft.tema_ids || []).map(Number));
    if (input.checked) next.add(id); else next.delete(id);
    S.eventDraft.tema_ids = [...next].sort((a, b) => a - b);
    renderThemeEditor();
  }));
  $$('[data-remove-theme]', $('#e-theme-selected')).forEach((button) => button.addEventListener('click', () => {
    const id = Number(button.dataset.removeTheme);
    S.eventDraft.tema_ids = (S.eventDraft.tema_ids || []).filter((topicId) => Number(topicId) !== id);
    renderThemeEditor();
  }));
}

function renderEventRelations() {
  if (!S.eventDraft) return;
  const currentId = slug($('#e-id').value || S.eventDraft.id);
  const isRector = Boolean(S.eventDraft.es_macroevento_rector);
  const selectedRectorIds = new Set(isRector ? [] : eventRectorIds(S.eventDraft));
  const rectors = (S.data.macroeventos || [])
    .filter((event) => event.id !== currentId && event.es_macroevento_rector)
    .sort((left, right) => left.titulo.localeCompare(right.titulo, 'es'));

  $('#e-is-rector').checked = isRector;
  $('#e-rector-help').textContent = isRector
    ? 'Este macroevento organiza otros procesos y no puede depender de otro rector.'
    : rectors.length
      ? 'Podés seleccionar más de un rector cuando este proceso aporta evidencia a varias hipótesis.'
      : 'Todavía no hay otro macroevento marcado como rector.';
  const selectedRectorEvents = [...selectedRectorIds]
    .map(byId)
    .filter(Boolean)
    .sort((left, right) => left.titulo.localeCompare(right.titulo, 'es'));
  $('#e-rector-selected').innerHTML = selectedRectorEvents.length
    ? selectedRectorEvents.map((event) => `<span class="topic-chip">${esc(event.titulo)}<button type="button" data-remove-rector="${esc(event.id)}" aria-label="Quitar ${esc(event.titulo)}">×</button></span>`).join('')
    : `<span class="muted">${isRector ? 'Este macroevento es rector.' : 'No depende de un rector.'}</span>`;
  $('#e-rector-options').innerHTML = !isRector && rectors.length
    ? `<div class="topic-options">${rectors.map((event) => `<label class="topic-option"><input type="checkbox" value="${esc(event.id)}" ${selectedRectorIds.has(event.id) ? 'checked' : ''}><span>${esc(event.titulo)}<small>Macroevento rector</small></span></label>`).join('')}</div>`
    : '';
  $$('input[type="checkbox"]', $('#e-rector-options')).forEach((input) => input.addEventListener('change', () => {
    const next = new Set(eventRectorIds(S.eventDraft));
    if (input.checked) next.add(input.value); else next.delete(input.value);
    setEventRectorIds(S.eventDraft, [...next]);
    renderEventRelations();
    markEventDraftChanged();
  }));
  $$('[data-remove-rector]', $('#e-rector-selected')).forEach((button) => button.addEventListener('click', () => {
    setEventRectorIds(S.eventDraft, eventRectorIds(S.eventDraft).filter((id) => id !== button.dataset.removeRector));
    renderEventRelations();
    markEventDraftChanged();
  }));

  const selected = new Set((S.eventDraft.macroevento_relacionado_ids || []).filter((id) => id !== currentId));
  const selectedEvents = [...selected].map(byId).filter(Boolean).sort((left, right) => left.titulo.localeCompare(right.titulo, 'es'));
  $('#e-related-selected').innerHTML = selectedEvents.length
    ? selectedEvents.map((event) => `<span class="topic-chip">${esc(event.titulo)}<button type="button" data-remove-related="${esc(event.id)}" aria-label="Quitar ${esc(event.titulo)}">×</button></span>`).join('')
    : '<span class="muted">Ningún macroevento relacionado.</span>';

  const query = normalize($('#e-related-search').value);
  const available = (S.data.macroeventos || [])
    .filter((event) => event.id !== currentId)
    .filter((event) => !query || normalize(`${event.titulo} ${event.regiones?.join(' ')} ${event.categoria}`).includes(query))
    .sort((left, right) => left.titulo.localeCompare(right.titulo, 'es'));
  $('#e-related-options').innerHTML = available.length
    ? `<div class="topic-options">${available.map((event) => `<label class="topic-option"><input type="checkbox" value="${esc(event.id)}" ${selected.has(event.id) ? 'checked' : ''}><span>${esc(event.titulo)}<small>${event.es_macroevento_rector ? 'Macroevento rector · ' : ''}${esc(human(event.categoria))}</small></span></label>`).join('')}</div>`
    : '<p class="muted">No hay macroeventos que coincidan con la búsqueda.</p>';

  $$('input[type="checkbox"]', $('#e-related-options')).forEach((input) => input.addEventListener('change', () => {
    const next = new Set(S.eventDraft.macroevento_relacionado_ids || []);
    if (input.checked) next.add(input.value); else next.delete(input.value);
    S.eventDraft.macroevento_relacionado_ids = [...next].filter((id) => id !== currentId);
    renderEventRelations();
    markEventDraftChanged();
  }));
  $$('[data-remove-related]', $('#e-related-selected')).forEach((button) => button.addEventListener('click', () => {
    S.eventDraft.macroevento_relacionado_ids = (S.eventDraft.macroevento_relacionado_ids || []).filter((id) => id !== button.dataset.removeRelated);
    renderEventRelations();
    markEventDraftChanged();
  }));
}

function fillEventFields(event, mode) {
  $('#event-original-id').value = mode === 'edit' ? event.id : '';
  $('#event-editor-title').textContent = mode === 'new' ? 'Nuevo macroevento' : mode === 'duplicate' ? 'Duplicar macroevento' : 'Editar macroevento';
  $('#e-title').value = event.titulo;
  $('#e-id').value = mode === 'duplicate' ? uniqueId(`${event.id}-copia`, new Set(S.data.macroeventos.map((item) => item.id))) : event.id;
  $('#e-date').value = event.fecha_corte;
  $('#e-type').value = event.tipo_proceso;
  $('#e-status').value = mode === 'duplicate' ? 'borrador' : event.estado_editorial;
  $('#e-verification').value = mode === 'duplicate' ? 'pendiente' : event.estado_verificacion;
  renderEventCategoryOptions(event.categoria);
  $('#e-regions').value = event.regiones.join(', ');
  $('#e-theme-search').value = '';
  $('#e-theme-origin').value = event.clasificacion_tematica?.origen || 'ia';
  $('#e-theme-review').value = event.clasificacion_tematica?.estado_revision || 'pendiente';
  $('#e-theme-reviewed').value = event.clasificacion_tematica?.revisada_el || '';
  $('#e-theme-version').textContent = String(event.clasificacion_tematica?.taxonomy_version || S.taxonomy.schema_version || 1);
  renderThemeEditor();
  $('#e-description').value = event.descripcion;
  $('#e-why').value = event.por_que_importa || '';
  S.eventDraft.es_macroevento_rector = mode === 'duplicate' ? false : Boolean(event.es_macroevento_rector);
  setEventRectorIds(S.eventDraft, mode === 'duplicate' ? [] : eventRectorIds(event));
  S.eventDraft.macroevento_relacionado_ids = mode === 'duplicate' ? [] : [...(event.macroevento_relacionado_ids || [])];
  $('#e-related-search').value = '';
  renderEventRelations();
  $('#e-actors').value = event.actores.join('\n');
  $('#e-interests').value = event.intereses.join('\n');
  $('#e-indicators').value = event.indicadores.join('\n');
  $('#e-keywords').value = event.palabras_clave.join('\n');
  $('#e-hmin').value = event.horizonte.min_anios;
  $('#e-hmax').value = event.horizonte.max_anios;
  $('#e-base').value = event.escenarios.base;
  $('#e-adverse').value = event.escenarios.adverso;
  $('#e-transform').value = event.escenarios.transformador;
  const scoreMap = { '#s-impact': 'impacto', '#s-prob': 'probabilidad', '#s-reach': 'alcance', '#s-persistence': 'persistencia', '#s-spread': 'propagacion', '#s-gap': 'subcobertura', '#s-uncertainty': 'incertidumbre', '#s-urgency': 'urgencia', '#s-coverage': 'cobertura_observada' };
  Object.entries(scoreMap).forEach(([selector, key]) => { $(selector).value = event.evaluacion[key]; });
  $('#s-confidence').value = event.evaluacion.confianza;
  renderEventUpdateHistory(event);
  $('#delete-event').hidden = mode !== 'edit';
  $('#duplicate-event').hidden = mode !== 'edit';
  renderSignalCards();
  renderSourceCards();
  S.warningRadar = false;
  S.warningSelectedId = '';
  clearWarningFilters(false);
  renderWarningCards();
  activateEventRecordTab('signals');
  calcEvent();
}

function renderEventUpdateHistory(event) {
  const records = event.actualizaciones || [];
  $('#event-update-history-section').hidden = !records.length;
  $('#event-update-history').innerHTML = records.slice().reverse().map((record) => `<article class="update-history-item">
    <header><strong>${esc(record.actualizado_el || 'Sin fecha')} · ${esc(human(record.tipo_evolucion || 'continuidad'))}</strong><span class="badge info">${esc(record.lote_id || 'sin lote')}</span></header>
    <p>${esc(record.candidato_titulo || record.candidato_id || 'Actualización importada')}</p>
    <small>${(record.fuente_ids_agregadas || []).length} fuentes · ${(record.senal_ids_agregadas || []).length} señales · ${(record.campos_modificados || []).length} cambios de ficha</small>
    ${record.justificacion ? `<small>${esc(record.justificacion)}</small>` : ''}
  </article>`).join('');
}

function openEvent(id = '', mode = 'edit') {
  const original = id ? byId(id) : blankEvent();
  if (!original) return;
  S.eventDraft = deep(original);
  if (mode === 'duplicate') {
    const base = uniqueId(`${original.id}-copia`, new Set(S.data.macroeventos.map((item) => item.id)));
    const originalSignalIds = S.eventDraft.senales.map((signal) => signal.id);
    const originalSourceIds = S.eventDraft.fuentes.map((source) => source.id);
    S.eventDraft.id = base;
    S.eventDraft.titulo = `${original.titulo} (copia)`;
    S.eventDraft.estado_editorial = 'borrador';
    S.eventDraft.estado_verificacion = 'pendiente';
    S.eventDraft.clasificacion_tematica = { ...(S.eventDraft.clasificacion_tematica || {}), estado_revision: 'pendiente', revisada_el: null };
    S.eventDraft.senales = S.eventDraft.senales.map((signal, index) => ({ ...signal, id: `sig-${base}-${String(index + 1).padStart(3, '0')}` }));
    S.eventDraft.fuentes = S.eventDraft.fuentes.map((source, index) => ({ ...source, id: `src-${base}-${String(index + 1).padStart(3, '0')}`, estado_verificacion: 'pendiente' }));
    const signalIdMap = new Map(originalSignalIds.map((id, index) => [id, S.eventDraft.senales[index].id]));
    const sourceIdMap = new Map(originalSourceIds.map((id, index) => [id, S.eventDraft.fuentes[index].id]));
    S.eventDraft.senales.forEach((signal) => { signal.fuente_ids = []; });
    S.eventDraft.advertencias = (S.eventDraft.advertencias || []).map((warning, index) => ({
      ...warning,
      advertencia_id: `adv-${base}-${String(index + 1).padStart(3, '0')}`,
      signal_ids: (warning.signal_ids || []).map((id) => signalIdMap.get(id)).filter(Boolean),
      fuente_ids: (warning.fuente_ids || []).map((id) => sourceIdMap.get(id)).filter(Boolean),
      resuelta_con_fuente_ids: (warning.resuelta_con_fuente_ids || []).map((id) => sourceIdMap.get(id)).filter(Boolean),
      resolucion: warning.resolucion ? {
        ...warning.resolucion,
        fuente_ids: (warning.resolucion.fuente_ids || []).map((id) => sourceIdMap.get(id)).filter(Boolean),
      } : warning.resolucion,
    }));
    S.eventDraft.excepciones_advertencias = [];
  }
  S.eventEditorMode = mode;
  S.eventDraftChanged = false;
  fillEventFields(S.eventDraft, mode);
  refreshPreparationAction();
  $('#event-editor').showModal();
  $('#e-title').focus();
}

function gatherEvent() {
  const rectorIds = S.eventDraft.es_macroevento_rector ? [] : eventRectorIds(S.eventDraft);
  return {
    ...S.eventDraft,
    id: slug($('#e-id').value || $('#e-title').value),
    titulo: $('#e-title').value.trim(),
    tipo_proceso: $('#e-type').value,
    estado_editorial: $('#e-status').value,
    estado_verificacion: $('#e-verification').value,
    fecha_corte: $('#e-date').value,
    regiones: commas($('#e-regions').value),
    categoria: normalizeCharacterization($('#e-category').value),
    tema_ids: [...new Set((S.eventDraft.tema_ids || []).map(Number).filter(Number.isInteger))].sort((a, b) => a - b),
    clasificacion_tematica: { origen: $('#e-theme-origin').value, estado_revision: $('#e-theme-review').value, taxonomy_version: Number($('#e-theme-version').textContent || S.taxonomy.schema_version || 1), revisada_el: $('#e-theme-reviewed').value || null },
    descripcion: $('#e-description').value.trim(),
    por_que_importa: $('#e-why').value.trim(),
    es_macroevento_rector: Boolean(S.eventDraft.es_macroevento_rector),
    macroevento_rector_id: rectorIds[0] || null,
    macroevento_rector_ids: rectorIds,
    macroevento_relacionado_ids: [...new Set((S.eventDraft.macroevento_relacionado_ids || []).filter((id) => id && id !== slug($('#e-id').value || $('#e-title').value)))],
    actores: lines($('#e-actors').value),
    intereses: lines($('#e-interests').value),
    indicadores: lines($('#e-indicators').value),
    palabras_clave: lines($('#e-keywords').value),
    horizonte: { min_anios: Number($('#e-hmin').value), max_anios: Number($('#e-hmax').value) },
    escenarios: { base: $('#e-base').value.trim(), adverso: $('#e-adverse').value.trim(), transformador: $('#e-transform').value.trim() },
    evaluacion: { impacto: Number($('#s-impact').value), probabilidad: Number($('#s-prob').value), alcance: Number($('#s-reach').value), persistencia: Number($('#s-persistence').value), propagacion: Number($('#s-spread').value), subcobertura: Number($('#s-gap').value), incertidumbre: Number($('#s-uncertainty').value), urgencia: Number($('#s-urgency').value), cobertura_observada: Number($('#s-coverage').value), confianza: $('#s-confidence').value },
    senales: S.eventDraft.senales,
    fuentes: S.eventDraft.fuentes,
    advertencias: S.eventDraft.advertencias || [],
    excepciones_advertencias: S.eventDraft.excepciones_advertencias || [],
  };
}

function calcEvent() {
  const event = gatherEvent();
  $('#calc-rel').textContent = rel(event);
  $('#calc-gap').textContent = gapRaw(event).toFixed(1);
  $('#event-diversity').innerHTML = diversityHtml(analyzeDiversity(event.fuentes));
}

function renderSignalCards() {
  const items = S.eventDraft?.senales || [];
  $('#event-tab-signals-count').textContent = String(items.length);
  $('#signal-cards').innerHTML = items.length ? items.map((signal, index) => {
    const stateClass = signal.estado_revision === 'verificada' || signal.estado_revision === 'confirmada'
      ? 'verified'
      : signal.estado_revision === 'revisada'
        ? 'reviewed'
        : signal.estado_revision === 'descartada'
          ? 'discarded'
          : 'pending';
    const stateLabel = signal.estado_revision === 'confirmada' ? 'verificada' : signal.estado_revision;
    return `<article class="item-card"><div><span class="badge signal-review-state ${stateClass}">${esc(human(stateLabel))}</span><h3>${esc(signal.titulo)}</h3><p>${esc(signal.fecha || 'Sin fecha')} · ${esc(human(signal.tipo || 'Sin tipo'))} · origen ${esc(signal.origen)}</p><small>${esc(signal.descripcion || 'Sin descripción')}</small></div><div class="item-actions"><button type="button" class="btn small ghost" data-edit-signal="${index}">Editar</button><button type="button" class="btn small danger" data-delete-signal="${index}">Eliminar</button></div></article>`;
  }).join('') : '<p class="muted">Todavía no hay señales.</p>';
}

function sourceCatalogMeta(source) {
  return source.medio_catalogado ? mediaById(source.media_id) : null;
}

function renderSourceCards() {
  const items = S.eventDraft?.fuentes || [];
  $('#event-tab-sources-count').textContent = String(items.length);
  $('#source-cards').innerHTML = items.length ? items.map((source, index) => {
    const media = sourceCatalogMeta(source);
    return `<article class="item-card"><div><span class="badge ${source.estado_verificacion === 'verificada' ? 'good' : source.estado_verificacion === 'descartada' ? 'bad' : source.estado_verificacion === 'revisada' ? 'info' : 'warn'}">${esc(human(source.estado_verificacion))}</span><span class="badge ${media ? 'info' : 'warn'}">${media ? 'Catalogada' : 'No catalogada'}</span><h3>${esc(source.medio || 'Fuente sin identificar')}</h3><p>${esc(source.titulo || 'Sin título')}</p><small>${esc(source.fecha || 'Sin fecha')} · ${esc(media?.familia || human(source.tipo) || 'Sin clasificación')}${source.idioma ? ` · ${esc(languageLabel(source.idioma))}` : ''} · ${esc(media?.perspectiva || '')}</small>${source.url ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente ↗</a>` : ''}</div><div class="item-actions"><button type="button" class="btn small ghost" data-edit-source="${index}">Editar</button><button type="button" class="btn small danger" data-delete-source="${index}">Eliminar</button></div></article>`;
  }).join('') : '<p class="muted">Todavía no hay fuentes.</p>';
  calcEvent();
}

function warningNow() {
  return new Date().toISOString();
}

function displayWarningDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Sin fecha';
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function warningDateTimeLocal(value = warningNow()) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function warningHistoryEntry(warning, action, detail, actor, timestamp = warningNow()) {
  const existing = new Set((warning.historial || []).map((item) => item.cambio_id));
  const base = `hist-${slug(timestamp)}-${slug(action)}`;
  return {
    cambio_id: uniqueId(base, existing),
    accion: action,
    detalle: detail,
    realizada_el: timestamp,
    realizada_por: actor || WARNING_EDITOR_ACTOR,
  };
}

function warningOptions(labels, selected) {
  return Object.entries(labels).map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
}

function activateEventRecordTab(name, { focus = false } = {}) {
  const tabs = $$('[data-event-tab]', $('#event-record-tabs'));
  const available = tabs.map((tab) => tab.dataset.eventTab);
  const next = available.includes(name) ? name : available[0];
  tabs.forEach((tab) => {
    const active = tab.dataset.eventTab === next;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  $$('[data-event-panel]', $('.event-records')).forEach((panel) => { panel.hidden = panel.dataset.eventPanel !== next; });
}

function clearWarningFilters(render = true) {
  for (const id of ['#warning-filter-state', '#warning-filter-treatment', '#warning-filter-priority', '#warning-filter-signal', '#warning-filter-source', '#warning-filter-prompt']) {
    if ($(id)) $(id).value = '';
  }
  S.warningRadar = false;
  if (render) renderWarningCards();
}

function warningFilters() {
  return {
    estado: $('#warning-filter-state').value,
    tratamiento: $('#warning-filter-treatment').value,
    prioridad: $('#warning-filter-priority').value,
    signal: $('#warning-filter-signal').value,
    source: $('#warning-filter-source').value,
    prompt: $('#warning-filter-prompt').value,
    radar: S.warningRadar,
  };
}

function warningExceptions(warningId) {
  return (S.eventDraft?.excepciones_advertencias || []).filter((item) => item.advertencia_id === warningId);
}

function renderWarningSummary() {
  const summary = warningSummary(S.eventDraft?.advertencias || []);
  $('#warning-summary').innerHTML = [
    ['Pendientes bloqueantes', summary.pendingBlocking, 'bad'],
    ['Pendientes relevantes', summary.pendingRelevant, 'warn'],
    ['Resueltas', summary.resolved, 'good'],
    ['Descartadas', summary.discarded, 'neutral'],
    ['Radar', summary.radar, 'info'],
  ].map(([label, value, tone]) => `<article class="warning-metric ${tone}"><span>${label}</span><strong>${value}</strong></article>`).join('');
  $('#warning-radar-count').textContent = String(summary.radar);
  $('#event-tab-warnings-count').textContent = String(summary.total);
}

function renderWarningCards() {
  if (!S.eventDraft) return;
  const warnings = S.eventDraft.advertencias || [];
  renderWarningSummary();
  const items = filterAndSortWarnings(warnings, warningFilters());
  const radarButton = $('#warning-radar');
  radarButton.setAttribute('aria-pressed', String(S.warningRadar));
  radarButton.classList.toggle('active', S.warningRadar);
  for (const selector of ['#warning-filter-state', '#warning-filter-treatment']) $(selector).disabled = S.warningRadar;
  $('#warning-list-status').textContent = S.warningRadar
    ? `${items.length} advertencia${items.length === 1 ? '' : 's'} pendiente${items.length === 1 ? '' : 's'} en Observación posterior, ordenadas por prioridad y antigüedad.`
    : `${items.length} de ${warnings.length} advertencia${warnings.length === 1 ? '' : 's'}. La selección se conserva al cambiar filtros.`;
  $('#warning-cards').innerHTML = items.length ? items.map((warning) => {
    const index = warnings.indexOf(warning);
    const prompt = warningPromptDecision(warning);
    const history = warning.historial || [];
    const last = history.at(-1);
    const exceptions = warningExceptions(warning.advertencia_id);
    const selected = S.warningSelectedId === warning.advertencia_id;
    return `<article class="warning-card ${selected ? 'selected' : ''}" data-warning-card="${esc(warning.advertencia_id)}">
      <header><div><span class="badge ${warning.estado === 'resuelta' ? 'good' : warning.estado === 'descartada' ? 'neutral' : warning.tratamiento === 'bloqueante' ? 'bad' : 'warn'}">${esc(WARNING_STATE_LABELS[warning.estado] || warning.estado)}</span><span class="badge info">${esc(WARNING_TREATMENT_LABELS[warning.tratamiento] || warning.tratamiento)}</span><span class="badge ${warning.prioridad === 'alta' ? 'bad' : warning.prioridad === 'media' ? 'warn' : 'info'}">Prioridad ${esc(WARNING_PRIORITY_LABELS[warning.prioridad] || warning.prioridad)}</span></div><small>${esc(warning.advertencia_id)}</small></header>
      <p class="warning-description">${esc(warning.descripcion)}</p>
      <dl class="warning-card-meta"><div><dt>Señales</dt><dd>${(warning.signal_ids || []).length || 'Sin vínculo'}</dd></div><div><dt>Fuentes</dt><dd>${(warning.fuente_ids || []).length || 'Sin vínculo'}</dd></div><div><dt>Regla derivada</dt><dd><span class="prompt-rule ${prompt.included ? 'included' : 'excluded'}">${esc(prompt.label)}</span></dd></div><div><dt>Última decisión</dt><dd>${last ? `${esc(displayWarningDate(last.realizada_el))} · ${esc(last.realizada_por)}` : esc(displayWarningDate(warning.actualizada_el))}</dd></div></dl>
      ${exceptions.length ? `<p class="warning-exception-note">${exceptions.length} excepción${exceptions.length === 1 ? '' : 'es'} de sesión registrada${exceptions.length === 1 ? '' : 's'}.</p>` : ''}
      <div class="warning-quick-actions">
        <label class="field"><span>Tratamiento</span><select data-warning-field="tratamiento" data-warning-index="${index}" aria-label="Tratamiento de ${esc(warning.advertencia_id)}">${warningOptions(WARNING_TREATMENT_LABELS, warning.tratamiento)}</select></label>
        <label class="field"><span>Prioridad</span><select data-warning-field="prioridad" data-warning-index="${index}" aria-label="Prioridad de ${esc(warning.advertencia_id)}">${warningOptions(WARNING_PRIORITY_LABELS, warning.prioridad)}</select></label>
        <label class="field"><span>Estado</span><select data-warning-field="estado" data-warning-index="${index}" aria-label="Estado de ${esc(warning.advertencia_id)}">${warningOptions(WARNING_STATE_LABELS, warning.estado)}</select></label>
        <button type="button" class="btn small ghost" data-edit-warning="${index}">Abrir detalle</button>
        ${S.warningRadar ? `<button type="button" class="btn small primary" data-reactivate-warning="${index}">Reabrir para revisión</button>` : ''}
      </div>
    </article>`;
  }).join('') : `<div class="empty warning-empty"><strong>${warnings.length ? 'No hay coincidencias.' : 'Todavía no hay advertencias.'}</strong><p>${warnings.length ? 'Modificá o limpiá los filtros.' : 'Creá la primera advertencia para registrar un límite, faltante o contradicción.'}</p></div>`;
}

function blankWarning() {
  const eventId = slug($('#e-id').value || S.eventDraft.id || $('#e-title').value || 'evento');
  const existing = new Set((S.eventDraft.advertencias || []).map((item) => item.advertencia_id));
  const timestamp = warningNow();
  return {
    advertencia_id: uniqueId(`adv-${eventId}-${String((S.eventDraft.advertencias || []).length + 1).padStart(3, '0')}`, existing),
    descripcion: '',
    tipo: 'evidencia_insuficiente',
    signal_ids: [],
    fuente_ids: [],
    estado: 'pendiente',
    tratamiento: 'relevante',
    prioridad: 'media',
    creada_el: timestamp,
    actualizada_el: timestamp,
    resuelta_el: null,
    resuelta_con_fuente_ids: [],
    resolucion: null,
    notas_editoriales: '',
    historial: [],
  };
}

function renderWarningLinkOptions(warning) {
  $('#warning-signal-options').innerHTML = (S.eventDraft.senales || []).length
    ? S.eventDraft.senales.map((signal) => `<label class="check-card"><input type="checkbox" value="${esc(signal.id)}" ${warning.signal_ids?.includes(signal.id) ? 'checked' : ''}><span><strong>${esc(signal.titulo || signal.id)}</strong><small>${esc(signal.id)}</small></span></label>`).join('')
    : '<p class="muted">No hay señales en este expediente.</p>';
  $('#warning-source-options').innerHTML = (S.eventDraft.fuentes || []).length
    ? S.eventDraft.fuentes.map((source) => `<label class="check-card"><input type="checkbox" value="${esc(source.id)}" ${warning.fuente_ids?.includes(source.id) ? 'checked' : ''}><span><strong>${esc(source.medio || source.id)}</strong><small>${esc(source.titulo || source.id)}</small></span></label>`).join('')
    : '<p class="muted">No hay fuentes en este expediente.</p>';
  $('#warning-resolution-source-options').innerHTML = (S.eventDraft.fuentes || []).length
    ? S.eventDraft.fuentes.map((source) => `<label class="check-card"><input type="checkbox" value="${esc(source.id)}" ${warning.resolucion?.fuente_ids?.includes(source.id) ? 'checked' : ''}><span><strong>${esc(source.medio || source.id)}</strong><small>${esc(source.titulo || source.id)}</small></span></label>`).join('')
    : '<p class="muted">Agregá una fuente antes de resolver por evidencia.</p>';
}

function renderWarningTrace(warning) {
  const history = warning.historial || [];
  $('#warning-history').innerHTML = history.length ? [...history].reverse().map((item) => `<article><strong>${esc(human(item.accion))}</strong><p>${esc(item.detalle)}</p><small>${esc(displayWarningDate(item.realizada_el))} · ${esc(item.realizada_por)}</small></article>`).join('') : '<p class="muted">El primer registro se creará al aplicar la advertencia.</p>';
  const exceptions = warningExceptions(warning.advertencia_id);
  $('#warning-exceptions').innerHTML = exceptions.length ? [...exceptions].reverse().map((item) => `<article><strong>${esc(human(item.alcance))}</strong><p>${esc(item.motivo)}</p><small>${esc(displayWarningDate(item.decidida_el))} · ${esc(item.decidida_por)} · sesión ${esc(item.session_id)}</small></article>`).join('') : '<p class="muted">Sin excepciones de sesión.</p>';
  const sessions = unique(exceptions.map((item) => item.session_id));
  $('#warning-generations').innerHTML = sessions.length ? sessions.map((session) => `<article><strong>${esc(session)}</strong><p>La excepción de sesión afectó esta preparación o generación.</p></article>`).join('') : '<p class="muted">No hay generaciones o sesiones afectadas registradas.</p>';
}

function updateWarningEditorRule() {
  const decision = warningPromptDecision({ estado: $('#warning-state').value, tratamiento: $('#warning-treatment').value });
  $('#warning-prompt-rule').textContent = decision.label;
  $('#warning-prompt-rule').className = decision.included ? 'included' : 'excluded';
  $('#warning-prompt-help').textContent = decision.help;
}

function updateWarningResolutionFields() {
  const state = $('#warning-state').value;
  const section = $('#warning-resolution-section');
  section.hidden = state === 'pendiente';
  const discarded = state === 'descartada';
  if (discarded) $('#warning-resolution-type').value = 'decision_editorial';
  $('#warning-resolution-type').disabled = discarded;
  $('#warning-resolution-legend').textContent = discarded ? 'Decisión de descarte' : 'Resolución';
  $('#warning-resolution-help').textContent = discarded
    ? 'Descartar exige una decisión editorial motivada; no equivale a resolver por evidencia.'
    : 'Resolver exige motivo, actor, fecha y, si corresponde, las fuentes que aportan la evidencia.';
  const needsDecision = state !== 'pendiente';
  $('#warning-resolution-reason').required = needsDecision;
  $('#warning-resolution-date').required = needsDecision;
  const evidence = !discarded && $('#warning-resolution-type').value === 'evidencia';
  $('#warning-resolution-sources-wrap').hidden = !evidence;
  updateWarningEditorRule();
}

function updateWarningTypeSuggestion() {
  const typeId = normalizeCharacterization($('#warning-type').value);
  const item = editorialVocabularyRecord(editorialVocabularies(), 'tipos_advertencia', typeId);
  const help = $('#warning-type-help');
  const button = $('#apply-warning-type-defaults');
  if (!item) {
    help.textContent = typeId
      ? 'Este tipo todavía no está administrado. Podés incorporarlo desde Taxonomía.'
      : 'Elegí un tipo del vocabulario administrado en Taxonomía.';
    button.hidden = true;
    return;
  }
  help.textContent = `${item.descripcion || item.nombre}. Sugerencia: ${human(item.tratamiento_sugerido)}, prioridad ${human(item.prioridad_sugerida)}.`;
  button.hidden = false;
}

function applyWarningTypeSuggestion() {
  const item = editorialVocabularyRecord(
    editorialVocabularies(),
    'tipos_advertencia',
    normalizeCharacterization($('#warning-type').value),
  );
  if (!item) return;
  $('#warning-treatment').value = item.tratamiento_sugerido;
  $('#warning-priority').value = item.prioridad_sugerida;
  updateWarningEditorRule();
  $('#warning-editor-status').textContent = 'Se aplicó la sugerencia del vocabulario. Revisala antes de confirmar la decisión.';
}

function openWarning(index = -1, { proposedState = '' } = {}) {
  const warning = index >= 0 ? deep(S.eventDraft.advertencias[index]) : blankWarning();
  if (proposedState) warning.estado = proposedState;
  S.warningSelectedId = warning.advertencia_id;
  renderWarningCards();
  $('#warning-index').value = String(index);
  $('#warning-editor-title').textContent = index >= 0 ? 'Editar advertencia' : 'Nueva advertencia';
  $('#warning-id').value = warning.advertencia_id;
  $('#warning-type').value = warning.tipo;
  $('#warning-description').value = warning.descripcion;
  $('#warning-state').value = warning.estado;
  $('#warning-treatment').value = warning.tratamiento;
  $('#warning-priority').value = warning.prioridad;
  $('#warning-actor').value = warning.resolucion?.decidida_por || warning.historial?.at(-1)?.realizada_por || WARNING_EDITOR_ACTOR;
  $('#warning-notes').value = warning.notas_editoriales || '';
  $('#warning-resolution-type').value = warning.estado === 'descartada' ? 'decision_editorial' : warning.resolucion?.tipo || 'evidencia';
  $('#warning-resolution-date').value = warningDateTimeLocal(warning.resolucion?.decidida_el || warningNow());
  $('#warning-resolution-reason').value = warning.resolucion?.motivo || '';
  $('#warning-confirmed').checked = false;
  $('#warning-editor-status').textContent = proposedState ? `Completá y confirmá la decisión para pasar a ${WARNING_STATE_LABELS[proposedState]}.` : 'Cada aplicación agrega fecha y actor al historial.';
  updateWarningTypeSuggestion();
  renderWarningLinkOptions(warning);
  renderWarningTrace(warning);
  updateWarningResolutionFields();
  $('#warning-editor').showModal();
  (index >= 0 ? $('#warning-description') : $('#warning-id')).focus();
}

function checkedWarningValues(selector) {
  return $$('input:checked', $(selector)).map((input) => input.value);
}

function gatherWarning() {
  const index = Number($('#warning-index').value);
  const original = index >= 0 ? S.eventDraft.advertencias[index] : null;
  const timestamp = warningNow();
  const state = $('#warning-state').value;
  const actor = $('#warning-actor').value.trim();
  const linkedSources = checkedWarningValues('#warning-source-options');
  const resolutionType = state === 'descartada' ? 'decision_editorial' : $('#warning-resolution-type').value;
  const resolutionSources = state === 'resuelta' && resolutionType === 'evidencia'
    ? checkedWarningValues('#warning-resolution-source-options')
    : [];
  const decidedAt = state === 'pendiente' ? null : new Date($('#warning-resolution-date').value).toISOString();
  const next = {
    ...(original || blankWarning()),
    advertencia_id: slug($('#warning-id').value),
    tipo: normalizeCharacterization($('#warning-type').value),
    descripcion: $('#warning-description').value.trim(),
    estado: state,
    tratamiento: $('#warning-treatment').value,
    prioridad: $('#warning-priority').value,
    signal_ids: checkedWarningValues('#warning-signal-options'),
    fuente_ids: unique([...linkedSources, ...resolutionSources]),
    notas_editoriales: $('#warning-notes').value.trim(),
    creada_el: original?.creada_el || timestamp,
    actualizada_el: timestamp,
    resuelta_el: state === 'resuelta' ? decidedAt : null,
    resuelta_con_fuente_ids: state === 'resuelta' ? resolutionSources : [],
    resolucion: state === 'pendiente' ? null : {
      tipo: resolutionType,
      motivo: $('#warning-resolution-reason').value.trim(),
      decidida_el: decidedAt,
      decidida_por: actor,
      fuente_ids: resolutionSources,
    },
    historial: deep(original?.historial || []),
  };
  delete next.incluir_en_prompt;
  const change = warningChangeSummary(original, next);
  next.historial.push(warningHistoryEntry(next, change.action, change.detail, actor, timestamp));
  return next;
}

function quickWarningChange(index, field, value) {
  const warning = S.eventDraft.advertencias[index];
  if (!warning || warning[field] === value) return renderWarningCards();
  if (field === 'estado' && ['resuelta', 'descartada'].includes(value)) {
    openWarning(index, { proposedState: value });
    return;
  }
  const before = deep(warning);
  const label = field === 'estado' ? WARNING_STATE_LABELS[value] : field === 'tratamiento' ? WARNING_TREATMENT_LABELS[value] : WARNING_PRIORITY_LABELS[value];
  if (!confirm(`¿Confirmar ${human(field)} “${label}” para ${warning.advertencia_id}? La decisión quedará fechada y firmada por ${WARNING_EDITOR_ACTOR}.`)) return renderWarningCards();
  warning[field] = value;
  if (field === 'estado' && value === 'pendiente') {
    warning.resolucion = null;
    warning.resuelta_el = null;
    warning.resuelta_con_fuente_ids = [];
  }
  const timestamp = warningNow();
  warning.actualizada_el = timestamp;
  const change = warningChangeSummary(before, warning);
  warning.historial = [...(warning.historial || []), warningHistoryEntry(warning, change.action, change.detail, WARNING_EDITOR_ACTOR, timestamp)];
  markEventDraftChanged();
  renderWarningCards();
}

function blankSignal() {
  const eventId = slug($('#e-id').value || S.eventDraft.id || $('#e-title').value || 'evento');
  const existing = new Set(S.eventDraft.senales.map((item) => item.id));
  return { id: uniqueId(`sig-${eventId}-${String(S.eventDraft.senales.length + 1).padStart(3, '0')}`, existing), fecha: today(), titulo: '', tipo: '', descripcion: '', estado_revision: 'pendiente', origen: 'ia', fuente_ids: [], intensidad: null, localizaciones: [] };
}

function renderSignalSourceOptions(selected = []) {
  $('#sig-source-options').innerHTML = S.eventDraft.fuentes.length ? S.eventDraft.fuentes.map((source) => `<label class="check-card"><input type="checkbox" value="${esc(source.id)}" ${selected.includes(source.id) ? 'checked' : ''}><span><strong>${esc(source.medio)}</strong><small>${esc(source.titulo)}</small></span></label>`).join('') : '<p class="muted">Agregá una fuente al macroevento para vincularla.</p>';
}

function addLocationRow(location = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'location-row';
  wrapper.innerHTML = `<label class="field"><span>Etiqueta</span><input data-location="etiqueta" value="${esc(location.etiqueta || '')}"></label><label class="field"><span>País</span><input data-location="pais" value="${esc(location.pais || '')}"></label><label class="field"><span>Latitud</span><input data-location="latitud" type="number" step="any" min="-90" max="90" value="${location.latitud ?? ''}"></label><label class="field"><span>Longitud</span><input data-location="longitud" type="number" step="any" min="-180" max="180" value="${location.longitud ?? ''}"></label><button type="button" class="icon remove-location" aria-label="Eliminar localización">×</button>`;
  $('.remove-location', wrapper).onclick = () => wrapper.remove();
  $('#location-rows').append(wrapper);
}

function openSignal(index = -1) {
  const signal = index >= 0 ? deep(S.eventDraft.senales[index]) : blankSignal();
  $('#signal-index').value = String(index);
  $('#signal-editor-title').textContent = index >= 0 ? 'Editar señal' : 'Nueva señal';
  $('#sig-id').value = signal.id;
  $('#sig-date').value = signal.fecha;
  $('#sig-title').value = signal.titulo;
  $('#sig-type').value = signal.tipo;
  $('#sig-status').value = signal.estado_revision;
  $('#sig-origin').value = signal.origen;
  $('#sig-intensity').value = signal.intensidad ?? '';
  $('#sig-description').value = signal.descripcion;
  renderSignalSourceOptions(signal.fuente_ids || []);
  $('#location-rows').innerHTML = '';
  (signal.localizaciones || []).forEach(addLocationRow);
  $('#signal-editor').showModal();
  $('#sig-title').focus();
}

function gatherLocations() {
  return $$('.location-row', $('#location-rows')).map((row) => {
    const value = (name) => $(`[data-location="${name}"]`, row).value.trim();
    return { etiqueta: value('etiqueta'), pais: value('pais'), latitud: value('latitud') === '' ? null : Number(value('latitud')), longitud: value('longitud') === '' ? null : Number(value('longitud')) };
  }).filter((item) => item.etiqueta || item.pais || item.latitud !== null || item.longitud !== null);
}

function blankSource() {
  const eventId = slug($('#e-id').value || S.eventDraft.id || $('#e-title').value || 'evento');
  const existing = new Set(S.eventDraft.fuentes.map((item) => item.id));
  return { id: uniqueId(`src-${eventId}-${String(S.eventDraft.fuentes.length + 1).padStart(3, '0')}`, existing), media_id: '', medio_catalogado: false, medio: '', titulo: '', fecha: today(), idioma: '', tipo: '', url: '', estado_verificacion: 'pendiente', observaciones: '', revisada_el: '' };
}

function fillCatalogOptions(filter = '', selected = '') {
  const q = normalize(filter);
  const records = S.catalog.records
    .filter((item) => !q || normalize(`${item.media_id} ${item.nombre} ${item.region} ${item.familia} ${item.funcion} ${item.perspectiva}`).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  $('#src-media-id').innerHTML = `<option value="">Fuente no catalogada</option>${records.map((item) => `<option value="${esc(item.media_id)}">${esc(item.nombre)} · ${esc(item.region || 'sin región')}</option>`).join('')}`;
  if (records.some((item) => item.media_id === selected)) $('#src-media-id').value = selected;
  const meta = $('#src-catalog-meta');
  const createButton = $('#open-catalog-entry');
  if (!q) {
    meta.textContent = `${records.length} fuentes catalogadas, ordenadas A–Z.`;
    createButton.hidden = true;
  } else if (records.length) {
    meta.textContent = `${records.length} ${records.length === 1 ? 'coincidencia' : 'coincidencias'}, ordenadas A–Z.`;
    createButton.hidden = true;
  } else {
    meta.textContent = 'No existe una ficha coincidente. Podés preparar un alta asistida sin comenzar desde una ficha vacía.';
    createButton.hidden = false;
  }
}

function renderCatalogPreview(mediaId = '') {
  const media = mediaById(mediaId);
  const assisted = media?.revision_asistida;
  $('#catalog-preview').innerHTML = media ? `<h3>${esc(media.nombre)}</h3><div class="mini-grid"><span><b>Región</b>${esc(media.region || 'Sin determinar')}</span><span><b>Familia</b>${esc(media.familia || 'Sin determinar')}</span><span><b>Función</b>${esc(media.funcion || 'Sin determinar')}</span><span><b>Perspectiva</b>${esc(media.perspectiva || 'Sin determinar')}</span><span><b>Confianza</b>${esc(media.confianza || 'Sin determinar')}</span><span><b>Corroboración</b>${esc(media.corroboracion || 'Sin determinar')}</span></div><p>${esc(media.uso || 'Sin uso recomendado definido.')}</p>${assisted ? '<p class="catalog-review-note">Ficha creada mediante alta asistida. Conserva por campo qué fue verificado, propuesto o quedó sin determinar.</p>' : ''}` : '<p class="muted">La publicación se registrará como fuente no catalogada. Esto no bloquea el trabajo.</p>';
}

function validSourceUrl() {
  try {
    const url = new URL($('#src-url').value.trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function updateSourceUrlActions() {
  const valid = Boolean(validSourceUrl());
  $('#open-source-url').disabled = !valid;
  $('#copy-source-url').disabled = !valid;
  $('#source-url-help').textContent = valid ? 'La fuente se abre en una pestaña nueva.' : 'Ingresá una URL HTTPS válida para abrirla o copiarla.';
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const area = document.createElement('textarea');
  area.value = value;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

function openSource(index = -1) {
  const source = index >= 0 ? deep(S.eventDraft.fuentes[index]) : blankSource();
  $('#source-index').value = String(index);
  $('#source-editor-title').textContent = index >= 0 ? 'Editar fuente' : 'Nueva fuente';
  $('#src-id').value = source.id;
  $('#src-status').value = source.estado_verificacion;
  $('#src-catalog-search').value = '';
  fillCatalogOptions('', source.media_id);
  $('#src-media-id').value = source.media_id || '';
  $('#src-medium').value = source.medio;
  $('#src-title').value = source.titulo;
  $('#src-date').value = source.fecha;
  $('#src-reviewed').value = source.revisada_el;
  $('#src-language').value = source.idioma;
  $('#src-type').value = source.tipo;
  $('#src-url').value = source.url;
  $('#src-notes').value = source.observaciones;
  renderCatalogPreview(source.media_id);
  updateSourceUrlActions();
  $('#source-editor').showModal();
  $('#src-catalog-search').focus();
}

function catalogHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function catalogSite(value) {
  try {
    return `${new URL(value).origin}/`;
  } catch {
    return '';
  }
}

function setCatalogState(field, state = 'propuesto') {
  const select = $(`[data-state-for="${field}"]`);
  if (select) select.value = ['verificado', 'propuesto', 'sin_determinar'].includes(state) ? state : 'propuesto';
}

function setCatalogField(field, value = '', state) {
  const input = $(`[data-catalog-field="${field}"]`);
  if (input) input.value = value ?? '';
  if (state) setCatalogState(field, state);
}

function catalogDuplicates(name = $('#cat-name').value, url = $('#cat-url').value) {
  const normalizedName = normalize(name);
  const host = catalogHost(url);
  return S.catalog.records.filter((item) => (normalizedName && normalize(item.nombre) === normalizedName) || (host && catalogHost(item.url) === host));
}

function updateCatalogDuplicateWarning() {
  const matches = catalogDuplicates();
  const node = $('#catalog-duplicate-warning');
  node.hidden = matches.length === 0;
  node.textContent = matches.length
    ? `Posible duplicado: ${matches.map((item) => item.nombre).join(' · ')}. Volvé al selector y vinculá la ficha existente.`
    : '';
  return matches;
}

function sourceTypeProposal(type = '') {
  const normalized = normalize(type);
  if (/institucional|organismo|gubernamental|oficial|fuente primaria/.test(normalized)) {
    return {
      family: 'Institución / fuente primaria',
      function: 'Documentación institucional y evidencia primaria',
      control: 'Institucional',
    };
  }
  if (/periodistic|noticia|revista|medio/.test(normalized)) {
    return {
      family: 'Medio especializado',
      function: 'Cobertura sectorial especializada',
      control: '',
    };
  }
  return { family: '', function: '', control: '' };
}

function openCatalogEntry() {
  const sourceUrl = $('#src-url').value.trim();
  const sourceName = $('#src-medium').value.trim() || $('#src-catalog-search').value.trim();
  const sourceType = $('#src-type').value.trim();
  const proposal = sourceTypeProposal(sourceType);
  $('#catalog-entry-form').reset();
  S.catalogResearchEvidence = sourceUrl ? [{ campo: 'referencia', url: sourceUrl, nota: 'Publicación registrada en el macroevento.' }] : [];
  setCatalogField('nombre', sourceName, 'propuesto');
  const proposedSite = catalogSite(sourceUrl);
  setCatalogField('url', proposedSite, proposedSite ? 'propuesto' : 'sin_determinar');
  setCatalogField('sede', '', 'sin_determinar');
  setCatalogField('region', '', 'sin_determinar');
  setCatalogField('idioma', $('#src-language').value.trim(), $('#src-language').value.trim() ? 'propuesto' : 'sin_determinar');
  setCatalogField('familia', proposal.family, proposal.family ? 'propuesto' : 'sin_determinar');
  setCatalogField('referencia', sourceUrl, sourceUrl ? 'verificado' : 'sin_determinar');
  setCatalogField('funcion', proposal.function, proposal.function ? 'propuesto' : 'sin_determinar');
  setCatalogField('propiedad', '', 'sin_determinar');
  setCatalogField('control', proposal.control, proposal.control ? 'propuesto' : 'sin_determinar');
  setCatalogField('orientacion', '', 'sin_determinar');
  setCatalogField('perspectiva', '', 'sin_determinar');
  setCatalogField('confianza', '', 'sin_determinar');
  setCatalogField('corroboracion', '', 'sin_determinar');
  $('#cat-corroborate-with').value = '';
  $('#cat-use').value = '';
  $('#cat-observations').value = sourceType ? `Clasificación inicial basada en el tipo de publicación: ${sourceType}.` : '';
  $('#catalog-research-prompt').value = '';
  $('#catalog-research-response').value = '';
  $('#copy-catalog-research').disabled = true;
  $('#catalog-review-confirmed').checked = false;
  updateCatalogDuplicateWarning();
  $('#catalog-entry-editor').showModal();
  $('#cat-name').focus();
}

function catalogResearchPrompt() {
  const source = {
    nombre: $('#cat-name').value.trim(),
    publicacion: $('#src-title').value.trim(),
    url_publicacion: $('#src-url').value.trim(),
    fecha: $('#src-date').value,
    idioma_observado: $('#src-language').value.trim(),
    tipo_observado: $('#src-type').value.trim(),
  };
  return `Actúa como investigador de fuentes para el Observatorio editorial de Memo Geopolítico.

Investiga la organización, institución o medio descrito abajo. Usa búsqueda web actual, prioriza el sitio oficial y contrasta los campos interpretativos con fuentes independientes. No inventes. Si un dato no puede comprobarse, devuélvelo vacío y marca "sin_determinar".

FUENTE A INVESTIGAR
${JSON.stringify(source, null, 2)}

Devuelve exclusivamente un objeto JSON válido, sin bloque Markdown, con esta estructura:
{
  "nombre": "",
  "url": "",
  "sede": "",
  "region": "",
  "idioma": "",
  "familia": "",
  "funcion": "",
  "propiedad": "",
  "control": "",
  "orientacion": "",
  "perspectiva": "",
  "confianza": "",
  "uso": "",
  "corroboracion": "",
  "corroborar_con": "",
  "observaciones": "",
  "referencia": "",
  "estados": {
    "nombre": "verificado|propuesto|sin_determinar",
    "url": "verificado|propuesto|sin_determinar",
    "sede": "verificado|propuesto|sin_determinar",
    "region": "verificado|propuesto|sin_determinar",
    "idioma": "verificado|propuesto|sin_determinar",
    "familia": "verificado|propuesto|sin_determinar",
    "funcion": "verificado|propuesto|sin_determinar",
    "propiedad": "verificado|propuesto|sin_determinar",
    "control": "verificado|propuesto|sin_determinar",
    "orientacion": "verificado|propuesto|sin_determinar",
    "perspectiva": "verificado|propuesto|sin_determinar",
    "confianza": "verificado|propuesto|sin_determinar",
    "corroboracion": "verificado|propuesto|sin_determinar",
    "referencia": "verificado|propuesto|sin_determinar"
  },
  "evidencias": [
    {"campo": "nombre", "url": "https://...", "nota": "Qué demuestra la fuente"}
  ]
}

Reglas: nombre, dominio, sede, propiedad e idioma solo pueden marcarse "verificado" con evidencia consultable. Familia, función, orientación, perspectiva, confianza y corroboración son propuestas editoriales salvo evidencia explícita; nunca las presentes como validación automática.`;
}

function generateCatalogResearch() {
  const prompt = catalogResearchPrompt();
  $('#catalog-research-prompt').value = prompt;
  $('#copy-catalog-research').disabled = false;
  message('Encargo de investigación preparado. Copialo y ejecutalo en ChatGPT.', 'warning');
}

function parseResearchJson(value) {
  const cleaned = String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

function applyCatalogResearch() {
  try {
    const payload = parseResearchJson($('#catalog-research-response').value);
    const map = {
      nombre: 'nombre', url: 'url', sede: 'sede', region: 'region', idioma: 'idioma', familia: 'familia',
      funcion: 'funcion', propiedad: 'propiedad', control: 'control', orientacion: 'orientacion',
      perspectiva: 'perspectiva', confianza: 'confianza', corroboracion: 'corroboracion', referencia: 'referencia',
    };
    Object.entries(map).forEach(([key, field]) => {
      const value = typeof payload[key] === 'string' ? payload[key].trim() : '';
      const state = payload.estados?.[key] || (value ? 'propuesto' : 'sin_determinar');
      setCatalogField(field, state === 'sin_determinar' ? '' : value, state);
    });
    $('#cat-corroborate-with').value = String(payload.corroborar_con || '').trim();
    $('#cat-use').value = String(payload.uso || '').trim();
    $('#cat-observations').value = String(payload.observaciones || '').trim();
    S.catalogResearchEvidence = Array.isArray(payload.evidencias)
      ? payload.evidencias.filter((item) => item && typeof item.url === 'string' && /^https:\/\//i.test(item.url)).map((item) => ({ campo: String(item.campo || ''), url: item.url, nota: String(item.nota || '') }))
      : [];
    updateCatalogDuplicateWarning();
    message('Respuesta aplicada como propuesta. Revisá cada condición antes de confirmar.', 'warning', true);
  } catch (error) {
    message(`No se pudo aplicar la respuesta JSON: ${error.message}`, 'error', true);
  }
}

function catalogRecordFromForm() {
  const states = {};
  $$('.catalog-field-state').forEach((select) => { states[select.dataset.stateFor] = select.value; });
  const fieldValue = (field) => {
    const input = $(`[data-catalog-field="${field}"]`);
    return states[field] === 'sin_determinar' ? '' : input.value.trim();
  };
  const name = fieldValue('nombre');
  const url = fieldValue('url');
  if (!name || !url || states.nombre === 'sin_determinar' || states.url === 'sin_determinar') {
    throw new Error('El nombre y el sitio institucional deben quedar determinados antes de crear la ficha.');
  }
  const existingIds = new Set(S.catalog.records.map((item) => item.media_id));
  const nextId = Math.max(0, ...S.catalog.records.map((item) => Number(item.id) || 0)) + 1;
  return {
    id: nextId,
    media_id: uniqueId(name, existingIds),
    nombre: name,
    url,
    sede: fieldValue('sede'),
    region: fieldValue('region'),
    idioma: fieldValue('idioma'),
    familia: fieldValue('familia'),
    funcion: fieldValue('funcion'),
    propiedad: fieldValue('propiedad'),
    control: fieldValue('control'),
    orientacion: fieldValue('orientacion'),
    perspectiva: fieldValue('perspectiva'),
    fiabilidad: 0,
    independencia: 0,
    transparencia: 0,
    rigor: 0,
    correcciones: 0,
    separacion: 0,
    puntuacion: 0,
    confianza: fieldValue('confianza'),
    uso: $('#cat-use').value.trim(),
    corroboracion: fieldValue('corroboracion'),
    corroborar_con: $('#cat-corroborate-with').value.trim(),
    estado: 'Activo',
    observaciones: $('#cat-observations').value.trim(),
    referencia: fieldValue('referencia'),
    fecha_revision: today(),
    revision_asistida: {
      version: 1,
      estado: 'confirmada_por_usuario',
      revisada_el: today(),
      estados: states,
      evidencias: deep(S.catalogResearchEvidence),
      publicacion_origen: {
        titulo: $('#src-title').value.trim(),
        url: $('#src-url').value.trim(),
      },
    },
  };
}

async function createCatalogEntry() {
  if (updateCatalogDuplicateWarning().length) throw new Error('La ficha coincide con una fuente ya catalogada.');
  if (!$('#catalog-review-confirmed').checked) throw new Error('Debés confirmar la revisión humana antes de crear la ficha.');
  const record = catalogRecordFromForm();
  const incoming = deep(S.catalog);
  incoming.records.push(record);
  incoming.metadata = {
    ...(incoming.metadata || {}),
    ultima_revision: today(),
    total_fuentes: incoming.records.length,
    total_medios: incoming.records.length,
  };
  const response = await api('/api/catalog', { method: 'PUT', body: JSON.stringify(incoming) });
  S.catalog = response.catalog;
  S.catalogValidation = response.validation;
  S.validation = response.data_validation;
  const backups = await api('/api/backups');
  S.backups = backups.backups || [];
  S.catalogBackups = backups.catalog_backups || [];
  const created = mediaById(record.media_id) || S.catalog.records.find((item) => normalize(item.nombre) === normalize(record.nombre));
  $('#src-catalog-search').value = created.nombre;
  fillCatalogOptions(created.nombre, created.media_id);
  $('#src-media-id').value = created.media_id;
  $('#src-medium').value = created.nombre;
  renderCatalogPreview(created.media_id);
  $('#catalog-entry-editor').close('created');
  renderData();
  renderHelp();
  message(`Ficha “${created.nombre}” creada, respaldada y vinculada a esta publicación. Aplicá la fuente para recalcular la diversidad.`);
  $('#src-title').focus();
}

function analyzeDiversity(sources = []) {
  const mediaRecords = sources.map((source) => ({ source, media: source.medio_catalogado ? mediaById(source.media_id) : null }));
  const uniqueMedia = unique(mediaRecords.map(({ source }) => source.media_id || `custom:${normalize(source.medio)}`));
  const regions = unique(mediaRecords.map(({ media }) => media?.region));
  const families = unique(mediaRecords.map(({ media }) => media?.familia));
  const functions = unique(mediaRecords.map(({ media }) => media?.funcion));
  const perspectives = unique(mediaRecords.map(({ media }) => media?.perspectiva));
  const verified = sources.filter((source) => source.estado_verificacion === 'verificada').length;
  const pending = sources.filter((source) => ['pendiente', 'revisada'].includes(source.estado_verificacion)).length;
  const cataloged = sources.filter((source) => source.medio_catalogado).length;
  const agency = mediaRecords.filter(({ media }) => normalize(media?.familia).includes('agencia de noticias')).length;
  const highCorroboration = mediaRecords.filter(({ media }) => /alta|obligatoria/.test(normalize(media?.corroboracion))).length;
  const official = mediaRecords.filter(({ media }) => /estatal|oficial|gubernamental|organismo internacional|comando militar/.test(normalize(`${media?.control} ${media?.familia}`))).length;
  const uniqueCatalogMedia = [...new Map(mediaRecords.filter(({ media }) => media).map(({ media }) => [media.media_id, media])).values()];
  const primary = uniqueCatalogMedia.filter((media) => /oficial|gubernamental|organismo internacional|agencia gubernamental|comando militar|multilateral|institucion|fuente primaria/.test(normalize(`${media.control} ${media.familia} ${media.funcion}`))).length;
  const analytical = uniqueCatalogMedia.filter((media) => /think tank|academ|investig|instituto|consultoria|analisis|base de datos|revista/.test(normalize(`${media.familia} ${media.funcion}`))).length;
  const localRegional = uniqueCatalogMedia.filter((media) => {
    const region = normalize(media.region);
    return region && !['global', 'occidente', 'global/occidente'].includes(region) && !/^global\s*\//.test(region);
  }).length;
  const warnings = [];
  if (!sources.length) warnings.push('No hay fuentes registradas.');
  if (sources.length && !verified) warnings.push('Ninguna fuente está verificada para un encargo.');
  if (sources.length >= 3 && regions.length <= 1) warnings.push('La muestra está concentrada en una sola región mediática.');
  if (sources.length >= 3 && agency / sources.length > 0.5) warnings.push('Más de la mitad de la muestra depende de agencias de noticias.');
  if (sources.some((source) => !source.medio_catalogado)) warnings.push('Existen medios no catalogados que requieren clasificación posterior.');
  if (highCorroboration) warnings.push(`${highCorroboration} ${highCorroboration === 1 ? 'fuente requiere' : 'fuentes requieren'} corroboración alta u obligatoria.`);
  if (sources.length >= 2 && perspectives.length <= 1) warnings.push('La muestra presenta poca diversidad de perspectivas geopolíticas.');
  return { publications: sources.length, uniqueSources: uniqueMedia.length, catalogedPublications: cataloged, catalogedSources: uniqueCatalogMedia.length, regions, families, functions, perspectives, verified, pending, agency, highCorroboration, official, primary, analytical, localRegional, warnings };
}

function diversityHtml(summary) {
  return `<div class="diversity-kpis"><span><b>${summary.publications}</b> publicaciones</span><span><b>${summary.uniqueSources}</b> fuentes únicas</span><span><b>${summary.catalogedSources}</b> catalogadas</span><span><b>${summary.verified}</b> verificadas</span><span><b>${summary.regions.length}</b> regiones</span><span><b>${summary.families.length}</b> familias</span><span><b>${summary.perspectives.length}</b> perspectivas</span></div><p class="help">Publicaciones cuenta documentos registrados; fuentes únicas cuenta medios o instituciones distintos; catalogadas cuenta las fuentes únicas con ficha clasificatoria.</p><div class="diversity-groups"><p><b>Regiones:</b> ${esc(summary.regions.join(' · ') || 'Sin clasificación')}</p><p><b>Familias:</b> ${esc(summary.families.join(' · ') || 'Sin clasificación')}</p><p><b>Perspectivas:</b> ${esc(summary.perspectives.join(' · ') || 'Sin clasificación')}</p></div>${summary.warnings.map((item) => `<p class="issue warning">${esc(item)}</p>`).join('') || '<p class="issue success">La muestra no activa advertencias descriptivas.</p>'}`;
}

function assessSufficiency(exp = S.expDraft) {
  const sources = selectedSourcesForExp(exp).filter((source) => source.estado_verificacion === 'verificada');
  const diversity = analyzeDiversity(sources);
  const events = (exp.macroevento_ids || []).map(byId).filter(Boolean);
  const signals = events.flatMap((event) => event.senales || []).filter((signal) => (exp.signal_ids || []).includes(signal.id));
  const thresholds = {
    movimiento: { sources: 1, media: 1, families: 1, perspectives: 1, primary: 0, analytical: 0, local: 0 },
    foco: { sources: 4, media: 3, families: 2, perspectives: 2, primary: 1, analytical: 1, local: 1 },
    dossier: { sources: 6, media: 4, families: 3, perspectives: 3, primary: 1, analytical: 1, local: 1 },
  }[exp.tipo_documento] || { sources: 1, media: 1, families: 1, perspectives: 1, primary: 0, analytical: 0, local: 0 };
  const checks = [
    { key: 'sources', ok: diversity.verified >= thresholds.sources, label: `Al menos ${thresholds.sources} fuentes verificadas`, actual: diversity.verified },
    { key: 'media', ok: diversity.uniqueSources >= thresholds.media, label: `Al menos ${thresholds.media} fuentes únicas`, actual: diversity.uniqueSources },
    { key: 'families', ok: diversity.families.length >= thresholds.families, label: `Al menos ${thresholds.families} familias de fuente`, actual: diversity.families.length },
    { key: 'perspectives', ok: diversity.perspectives.length >= thresholds.perspectives, label: `Al menos ${thresholds.perspectives} perspectivas`, actual: diversity.perspectives.length },
    { key: 'primary', ok: diversity.primary >= thresholds.primary, label: thresholds.primary ? 'Al menos una fuente institucional o primaria' : 'Fuente primaria opcional', actual: diversity.primary },
    { key: 'analytical', ok: diversity.analytical >= thresholds.analytical, label: thresholds.analytical ? 'Al menos una fuente analítica, académica o especializada' : 'Fuente analítica opcional', actual: diversity.analytical },
    { key: 'local', ok: diversity.localRegional >= thresholds.local, label: thresholds.local ? 'Al menos una perspectiva local o regional' : 'Perspectiva local opcional', actual: diversity.localRegional },
    { key: 'signals', ok: signals.length > 0 && signals.every((signal) => !['pendiente', 'descartada'].includes(signal.estado_revision)), label: 'Señales seleccionadas y revisadas', actual: signals.length },
  ];
  if (exp.tipo_documento !== 'movimiento') checks.push({ key: 'uncertainties', ok: (exp.incertidumbres || []).length > 0, label: 'Incertidumbres explícitas', actual: (exp.incertidumbres || []).length });
  const required = checks.filter((check) => !/opcional/.test(check.label));
  return { sufficient: required.every((check) => check.ok), checks, diversity, missing: required.filter((check) => !check.ok).map((check) => check.label) };
}

function sufficiencyHtml(result) {
  return `<div class="sufficiency"><div class="sufficiency-head"><span class="sufficiency-status ${result.sufficient ? 'good' : 'warn'}">${result.sufficient ? 'Suficiente para preparar el encargo de redacción' : 'Evidencia insuficiente para redactar sin advertencias'}</span><span class="badge ${result.sufficient ? 'good' : 'warn'}">${result.checks.filter((item) => item.ok).length}/${result.checks.length} criterios</span></div><div class="sufficiency-checks">${result.checks.map((item) => `<div class="sufficiency-check ${item.ok ? 'ok' : 'missing'}"><b>${item.ok ? '✓' : '!'}</b><span>${esc(item.label)} <small>(actual: ${item.actual})</small></span></div>`).join('')}</div><p class="sufficiency-note">Esta puerta es editorial y orientativa. El encargo de investigación puede generarse en cualquier momento; un encargo de redacción con evidencia incompleta exige confirmación explícita y conservará marcadores [VERIFICAR].</p></div>`;
}

function blankExpedient(preEventId = '') {
  const existing = new Set(S.data.expedientes_editoriales.map((item) => item.id));
  const id = uniqueId(`exp-${today()}-${String(S.data.expedientes_editoriales.length + 1).padStart(3, '0')}`, existing);
  const event = preEventId ? byId(preEventId) : null;
  return { id, estado: 'borrador', tipo_documento: 'foco', titulo_trabajo: event ? event.titulo : '', pregunta_editorial: '', tesis_central: '', macroevento_ids: preEventId ? [preEventId] : [], signal_ids: [], source_ids: [], geografias_publicas: event ? event.regiones.map(slug) : [], temas_publicos: [], procesos_publicos: [], incertidumbres: [], documentos_relacionados: [], extension_objetivo: 1800, creado: today(), actualizado: today() };
}

function openExpedient(id = '', preEventId = '', showPrompt = false) {
  const original = id ? expById(id) : blankExpedient(preEventId);
  if (!original) return;
  S.expDraft = deep(original);
  S.currentPrompt = '';
  S.currentPromptMode = '';
  S.currentPromptFilename = '';
  $('#exp-original-id').value = id || '';
  $('#expedient-editor-title').textContent = id ? 'Editar encargo editorial' : 'Nuevo encargo editorial';
  $('#x-id').value = original.id;
  $('#x-doc-type').value = original.tipo_documento;
  $('#x-editor-status').value = original.estado;
  $('#x-length').value = original.extension_objetivo;
  $('#x-title').value = original.titulo_trabajo;
  $('#x-question').value = original.pregunta_editorial;
  $('#x-thesis').value = original.tesis_central;
  $('#x-geographies').value = original.geografias_publicas.join(', ');
  $('#x-topics').value = original.temas_publicos.join(', ');
  $('#x-processes').value = original.procesos_publicos.join(', ');
  $('#x-uncertainties').value = original.incertidumbres.join('\n');
  $('#x-related').value = original.documentos_relacionados.join('\n');
  resetPromptOutput();
  $('#delete-expedient').hidden = !id;
  $('#duplicate-expedient').hidden = !id;
  renderExpEventOptions();
  renderExpMaterialOptions();
  $('#expedient-editor').showModal();
  $('#x-title').focus();
  if (showPrompt) {
    setTimeout(() => generateResearchPlan(true), 0);
  }
}

function selectedCheckboxValues(container) {
  return $$('input[type="checkbox"]:checked', $(container)).map((input) => input.value);
}

function syncExpDraftFromForm(includeMaterial = true) {
  if (!S.expDraft) return;
  S.expDraft.id = slug($('#x-id').value || $('#x-title').value);
  S.expDraft.estado = $('#x-editor-status').value;
  S.expDraft.tipo_documento = $('#x-doc-type').value;
  S.expDraft.titulo_trabajo = $('#x-title').value.trim();
  S.expDraft.pregunta_editorial = $('#x-question').value.trim();
  S.expDraft.tesis_central = $('#x-thesis').value.trim();
  S.expDraft.extension_objetivo = Number($('#x-length').value || 1800);
  S.expDraft.geografias_publicas = commas($('#x-geographies').value).map(slug);
  S.expDraft.temas_publicos = commas($('#x-topics').value).map(slug);
  S.expDraft.procesos_publicos = commas($('#x-processes').value).map(slug);
  S.expDraft.incertidumbres = lines($('#x-uncertainties').value);
  S.expDraft.documentos_relacionados = lines($('#x-related').value);
  S.expDraft.macroevento_ids = selectedCheckboxValues('#x-event-options');
  if (includeMaterial) {
    S.expDraft.signal_ids = selectedCheckboxValues('#x-signal-options');
    S.expDraft.source_ids = selectedCheckboxValues('#x-source-options');
  }
  S.expDraft.actualizado = today();
}

function renderExpEventOptions() {
  $('#x-event-options').innerHTML = S.data.macroeventos.map((event) => `<label class="check-card"><input type="checkbox" value="${esc(event.id)}" ${S.expDraft.macroevento_ids.includes(event.id) ? 'checked' : ''}><span><strong>${esc(event.titulo)}</strong><small>${esc(event.regiones.join(' · '))}</small></span></label>`).join('');
  $$('input', $('#x-event-options')).forEach((input) => input.addEventListener('change', () => {
    syncExpDraftFromForm(false);
    const allowedSignals = new Set(S.expDraft.macroevento_ids.flatMap((eventId) => byId(eventId)?.senales.map((item) => item.id) || []));
    const allowedSources = new Set(S.expDraft.macroevento_ids.flatMap((eventId) => byId(eventId)?.fuentes.map((item) => item.id) || []));
    S.expDraft.signal_ids = S.expDraft.signal_ids.filter((id) => allowedSignals.has(id));
    S.expDraft.source_ids = S.expDraft.source_ids.filter((id) => allowedSources.has(id));
    renderExpMaterialOptions();
  }));
}

function selectedEventsForExp() {
  return S.expDraft.macroevento_ids.map(byId).filter(Boolean);
}

function renderExpMaterialOptions() {
  const events = selectedEventsForExp();
  const signals = events.flatMap((event) => event.senales.map((signal) => ({ event, signal })));
  const sources = events.flatMap((event) => event.fuentes.map((source) => ({ event, source })));
  $('#x-signal-options').innerHTML = signals.length ? signals.map(({ event, signal }) => `<label class="check-card"><input type="checkbox" value="${esc(signal.id)}" ${S.expDraft.signal_ids.includes(signal.id) ? 'checked' : ''}><span><strong>${esc(signal.titulo)}</strong><small>${esc(event.titulo)} · ${esc(human(signal.estado_revision))}</small></span></label>`).join('') : '<p class="muted">Seleccioná uno o más macroeventos.</p>';
  $('#x-source-options').innerHTML = sources.length ? sources.map(({ event, source }) => {
    const verified = source.estado_verificacion === 'verificada';
    const media = sourceCatalogMeta(source);
    return `<label class="check-card ${verified ? '' : 'disabled'}"><input type="checkbox" value="${esc(source.id)}" ${S.expDraft.source_ids.includes(source.id) ? 'checked' : ''} ${verified ? '' : 'disabled'}><span><strong>${esc(source.medio)}</strong><small>${esc(source.titulo)} · ${esc(human(source.estado_verificacion))}${media ? ` · ${esc(media.perspectiva)}` : ''}</small></span></label>`;
  }).join('') : '<p class="muted">Seleccioná uno o más macroeventos.</p>';
  $$('input', $('#x-signal-options')).forEach((input) => input.addEventListener('change', updateExpDiversity));
  $$('input', $('#x-source-options')).forEach((input) => input.addEventListener('change', updateExpDiversity));
  updateExpDiversity();
}

function selectedSourcesForExp(exp = S.expDraft) {
  return (exp.macroevento_ids || []).flatMap((eventId) => byId(eventId)?.fuentes || []).filter((source) => exp.source_ids.includes(source.id));
}

function updateExpDiversity() {
  if (!S.expDraft) return;
  S.expDraft.signal_ids = selectedCheckboxValues('#x-signal-options');
  S.expDraft.source_ids = selectedCheckboxValues('#x-source-options');
  $('#exp-diversity').innerHTML = diversityHtml(analyzeDiversity(selectedSourcesForExp()));
  $('#exp-sufficiency').innerHTML = sufficiencyHtml(assessSufficiency(S.expDraft));
}

function gatherExpedient() {
  syncExpDraftFromForm(true);
  return deep(S.expDraft);
}

function validatePromptExp(exp) {
  const problems = [];
  if (!exp.tipo_documento) problems.push('Falta el tipo documental.');
  if (!exp.titulo_trabajo) problems.push('Falta el título de trabajo.');
  if (!exp.pregunta_editorial) problems.push('Falta la pregunta editorial.');
  if (!exp.tesis_central) problems.push('Falta la tesis central.');
  if (!exp.macroevento_ids.length) problems.push('Seleccioná al menos un macroevento.');
  if (!exp.temas_publicos.length) problems.push('Asigná al menos un tema público.');
  const sources = selectedSourcesForExp(exp);
  if (!sources.length) problems.push('Seleccioná al menos una fuente verificada.');
  if (sources.some((source) => source.estado_verificacion !== 'verificada')) problems.push('El encargo contiene una fuente no verificada.');
  return problems;
}

function yamlList(items, indent = '') {
  return items.length ? items.map((item) => `${indent}- ${item}`).join('\n') : `${indent}[]`;
}

function buildDraftPrompt(exp) {
  const events = exp.macroevento_ids.map(byId).filter(Boolean);
  const selectedSignals = events.flatMap((event) => event.senales).filter((signal) => exp.signal_ids.includes(signal.id));
  const selectedSources = selectedSourcesForExp(exp).filter((source) => source.estado_verificacion === 'verificada');
  const diversity = analyzeDiversity(selectedSources);
  const sourceBlocks = selectedSources.map((source, index) => {
    const media = sourceCatalogMeta(source);
    return `${index + 1}. ${source.medio}: “${source.titulo}”\n   - Fecha: ${source.fecha || 'sin fecha'}\n   - URL: ${source.url}\n   - Tipo: ${source.tipo || 'sin clasificar'}\n   - Medio: ${media ? `${media.familia}; perspectiva ${media.perspectiva}; confianza ${media.confianza}; corroboración ${media.corroboracion}` : 'no catalogado'}\n   - Observaciones editoriales: ${source.observaciones || 'ninguna'}`;
  }).join('\n\n');
  const analyticalBlocks = events.map((event) => `### ${event.titulo}\n- Descripción provisional: ${event.descripcion || 'no consignada'}\n- Actores propuestos: ${(event.actores || []).join(', ') || 'no consignados'}\n- Intereses propuestos: ${(event.intereses || []).join('; ') || 'no consignados'}\n- Escenario base provisional: ${event.escenarios?.base || 'no consignado'}\n- Escenario adverso provisional: ${event.escenarios?.adverso || 'no consignado'}\n- Escenario transformador provisional: ${event.escenarios?.transformador || 'no consignado'}`).join('\n\n');
  const signalBlocks = selectedSignals.map((signal) => `- ${signal.fecha || 'sin fecha'} — ${signal.titulo}: ${signal.descripcion || 'sin descripción'} [estado ${signal.estado_revision}; origen ${signal.origen}]`).join('\n') || '- No se seleccionaron señales específicas.';
  const warnings = diversity.warnings.length ? diversity.warnings.map((item) => `- ${item}`).join('\n') : '- No se detectaron advertencias descriptivas adicionales.';
  const typeRules = {
    movimiento: 'Redactá una pieza breve, completa y autónoma. Explicá qué cambió, por qué merece observación y cuáles son sus posibles consecuencias. No presupongas ni exijas un Dossier relacionado.',
    foco: 'Redactá un análisis de un proceso estructural o de largo plazo. Incluí antecedentes, actores, intereses, indicadores, escenarios y elementos que permitan futuras actualizaciones.',
    dossier: 'Redactá un análisis autónomo que responda una pregunta delimitada. Integrá contexto, evidencia, controversias, perspectivas y escenarios sin depender de otra publicación.',
  };
  const sufficiency = assessSufficiency(exp);
  return `# Encargo editorial para ChatGPT\n\nActuá como analista senior de geopolítica y redactor de Memo Geopolítico. Debés producir un **borrador Markdown sujeto a revisión humana**.\n\n## Tipo de documento\n${human(exp.tipo_documento)}\n\n${typeRules[exp.tipo_documento]}\n\n## Título de trabajo\n${exp.titulo_trabajo}\n\n## Pregunta editorial\n${exp.pregunta_editorial}\n\n## Tesis central propuesta\n${exp.tesis_central}\n\nLa tesis es provisional. No la trates como un hecho demostrado: contrastala exclusivamente con la evidencia autorizada y conservá las incertidumbres.\n\n## Extensión objetivo\nAproximadamente ${exp.extension_objetivo} palabras.\n\n## Evidencia autorizada y verificada\nUsá estas fuentes para respaldar afirmaciones factuales. No inventes fuentes, cifras, citas ni enlaces.\n\n${sourceBlocks}\n\n## Señales revisadas vinculadas con la evidencia\nLas señales resumen cambios observados, pero su redacción editorial no reemplaza la lectura de las fuentes autorizadas.\n\n${signalBlocks}\n\n## Hipótesis e insumos analíticos provisionales\nLos elementos siguientes proceden de la ficha del Observatorio. Sirven para orientar la investigación y la estructura, pero **no constituyen evidencia por sí mismos**. Toda afirmación factual derivada de ellos debe estar respaldada por una fuente autorizada o marcada [VERIFICAR].\n\n${analyticalBlocks}\n\n## Composición de la evidencia\n- Publicaciones: ${diversity.publications}\n- Fuentes únicas: ${diversity.uniqueSources}\n- Fuentes únicas catalogadas: ${diversity.catalogedSources}\n- Regiones mediáticas: ${diversity.regions.join(', ') || 'sin clasificación'}\n- Familias: ${diversity.families.join(', ') || 'sin clasificación'}\n- Perspectivas: ${diversity.perspectives.join(', ') || 'sin clasificación'}\n- Fuentes oficiales o estatales: ${diversity.official}\n- Fuentes que requieren corroboración alta u obligatoria: ${diversity.highCorroboration}\n\nAdvertencias:\n${warnings}\n\n## Suficiencia documental\n${sufficiency.sufficient ? 'La puerta editorial considera suficiente la evidencia seleccionada.' : `La evidencia todavía es incompleta. Faltan: ${sufficiency.missing.join('; ')}. Redactá únicamente un borrador de trabajo y utilizá [VERIFICAR] donde corresponda.`}\n\n## Incertidumbres que deben conservarse\n${yamlList(exp.incertidumbres)}\n\n## Clasificación pública\n- Geografías: ${exp.geografias_publicas.join(', ') || 'pendiente'}\n- Temas: ${exp.temas_publicos.join(', ') || 'pendiente'}\n- Procesos: ${exp.procesos_publicos.join(', ') || 'pendiente'}\n\n## Reglas obligatorias\n1. No inventes hechos, cifras, citas, fuentes ni enlaces.\n2. Distinguí hechos respaldados, interpretación e incertidumbre.\n3. Usá las fuentes autorizadas para cada afirmación factual.\n4. No conviertas los insumos analíticos provisionales en hechos sin respaldo.\n5. Cuando falte evidencia, escribí [VERIFICAR: descripción concreta].\n6. Integrá los enlaces en el texto cuando corresponda.\n7. No publiques puntuaciones internas del Observatorio.\n8. No trates una fuente oficial o estatal como verificación independiente.\n9. Señalá de forma sobria las perspectivas o fuentes locales ausentes.\n10. Mantené tono analítico, preciso y no alarmista.\n11. El documento debe comprenderse por sí mismo.\n12. No afirmes que el borrador está listo para publicar.\n\n## Formato de salida\nEntregá exclusivamente un archivo Markdown completo con este frontmatter inicial:\n\n\`\`\`yaml\n---\ntitle: "${exp.titulo_trabajo.replaceAll('"', '\\"')}"\ndescription: "[COMPLETAR DESPUÉS DE REDACTAR]"\ndraftedAt: ${today()}\nupdatedAt: ${today()}\nstatus: draft\ndocumentType: ${exp.tipo_documento}\ngeographies:\n${yamlList(exp.geografias_publicas, '  ')}\ntopics:\n${yamlList(exp.temas_publicos, '  ')}\nprocesses:\n${yamlList(exp.procesos_publicos, '  ')}\nsourceBriefs:\n  - ${exp.id}\nrelatedEditorialRefs:\n${exp.documentos_relacionados.length ? yamlList(exp.documentos_relacionados, '  ') : '  []'}\n---\n\`\`\`\n\nDespués del frontmatter, redactá el documento con subtítulos claros y enlaces integrados.\n`;
}

function validateResearchExp(exp) {
  const problems = [];
  if (!exp.tipo_documento) problems.push('Falta el tipo documental.');
  if (!exp.titulo_trabajo) problems.push('Falta el título de trabajo.');
  if (!exp.pregunta_editorial) problems.push('Falta la pregunta editorial.');
  if (!exp.tesis_central) problems.push('Falta la tesis central provisional.');
  if (!exp.macroevento_ids.length) problems.push('Seleccioná al menos un macroevento.');
  return problems;
}

function evidenceBlocks(exp) {
  const events = exp.macroevento_ids.map(byId).filter(Boolean);
  const signals = events.flatMap((event) => event.senales || []).filter((signal) => exp.signal_ids.includes(signal.id));
  const sources = selectedSourcesForExp(exp).filter((source) => source.estado_verificacion === 'verificada');
  const sourceText = sources.length
    ? sources.map((source, index) => `${index + 1}. ${source.medio}: “${source.titulo}”\n   - ${source.fecha || 'sin fecha'} · ${source.url}\n   - Aporta: ${source.observaciones || 'sin observación editorial'}`).join('\n\n')
    : 'No se seleccionaron fuentes verificadas.';
  const signalText = signals.length
    ? signals.map((signal) => `- ${signal.fecha || 'sin fecha'} — ${signal.titulo}: ${signal.descripcion || 'sin descripción'} [${signal.estado_revision}; origen ${signal.origen}]`).join('\n')
    : '- No se seleccionaron señales.';
  return { events, signals, sources, sourceText, signalText };
}

function buildResearchPlan(exp) {
  const evidence = evidenceBlocks(exp);
  const assessment = assessSufficiency(exp);
  const analyticalText = evidence.events.map((event) => `### ${event.titulo}\n- Descripción provisional: ${event.descripcion || 'no consignada'}\n- Actores propuestos: ${(event.actores || []).join(', ') || 'no consignados'}\n- Intereses propuestos: ${(event.intereses || []).join('; ') || 'no consignados'}\n- Indicadores propuestos: ${(event.indicadores || []).join('; ') || 'no consignados'}`).join('\n\n');
  const missing = assessment.missing.length
    ? assessment.missing.map((item) => `- ${item}`).join('\n')
    : '- La puerta cuantitativa está cubierta; revisar igualmente vacíos temáticos y contradicciones.';
  const uncertainties = (exp.incertidumbres || []).length
    ? (exp.incertidumbres || []).map((item) => `- ${item}`).join('\n')
    : '- No se consignaron incertidumbres todavía.';
  return `# Encargo de ampliación documental

Actuá como investigador geopolítico senior. **No redactes todavía el artículo.** Prepará un plan de investigación verificable para completar el encargo editorial siguiente.

## Documento previsto
- Tipo: ${human(exp.tipo_documento)}
- Título de trabajo: ${exp.titulo_trabajo}
- Extensión futura: aproximadamente ${exp.extension_objetivo} palabras

## Pregunta editorial
${exp.pregunta_editorial}

## Tesis provisional
${exp.tesis_central}

La tesis es una hipótesis editorial que debe contrastarse; no la presentes como conclusión confirmada.

## Evidencia ya verificada
${evidence.sourceText}

## Señales ya revisadas
${evidence.signalText}

## Hipótesis e insumos analíticos del Observatorio
Los siguientes elementos orientan la búsqueda, pero no constituyen evidencia por sí mismos:

${analyticalText}

## Composición actual de la evidencia
- Artículos verificados: ${assessment.diversity.verified}
- Fuentes únicas: ${assessment.diversity.uniqueSources}
- Fuentes únicas catalogadas: ${assessment.diversity.catalogedSources}
- Regiones mediáticas: ${assessment.diversity.regions.join(', ') || 'sin clasificación'}
- Familias: ${assessment.diversity.families.join(', ') || 'sin clasificación'}
- Perspectivas: ${assessment.diversity.perspectives.join(', ') || 'sin clasificación'}

## Vacíos documentales prioritarios
${missing}

## Incertidumbres ya identificadas
${uncertainties}

## Tareas
1. Identificá las afirmaciones centrales que todavía carecen de respaldo suficiente.
2. Diferenciá vacíos de evidencia de hipótesis analíticas que necesitan comprobación.
3. Proponé búsquedas concretas para cubrir cada vacío.
4. Priorizá documentos primarios, organismos multilaterales, fuentes locales o regionales, investigación académica y análisis especializado.
5. Evitá duplicar notas que reproduzcan la misma agencia.
6. Señalá contradicciones, límites, paywalls y sesgos previsibles.
7. No presentes ninguna fuente candidata como verificada: la revisión humana será obligatoria.

## Formato de salida
Entregá:

### A. Matriz de vacíos
Una tabla con: afirmación a respaldar, evidencia actual, evidencia faltante, prioridad y riesgo de error.

### B. Fuentes candidatas
Para cada fuente: título, institución o medio, URL confirmada, fecha, tipo, región/perspectiva, afirmación que puede respaldar, utilidad y necesidad de corroboración. No inventes URLs.

### C. Búsquedas recomendadas
Consultas listas para usar, agrupadas por actor, región, infraestructura, financiación, impactos y escenarios.

### D. Criterio de cierre
Explicá qué combinación mínima de fuentes permitiría volver al Observatorio y generar un encargo de redacción responsable.
`;
}

function suggestedPromptFilename(mode, exp) {
  const suffix = mode === 'draft' ? 'encargo-redaccion' : 'encargo-investigacion';
  return `${exp.id}-${suffix}.md`;
}

function normalizeMarkdownFilename(value, fallback) {
  const cleaned = String(value || fallback || 'encargo.md')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return cleaned.toLowerCase().endsWith('.md') ? cleaned : `${cleaned}.md`;
}

function setPromptControls(enabled) {
  $('#copy-prompt').disabled = !enabled;
  $('#download-prompt').disabled = !enabled;
  $('#prompt-filename').disabled = !enabled;
}

function updatePromptEditorialStateNote() {
  const note = $('#prompt-editorial-state-note');
  if (!note) return;
  note.textContent = `Estado editorial actual: ${human($('#x-editor-status').value)}. Generar, copiar o descargar no lo modifica automáticamente.`;
}

function setPromptLocalStatus(title, detail, type = 'neutral') {
  const node = $('#prompt-mode-label');
  node.className = `prompt-local-status ${type}`;
  node.innerHTML = `<b>${esc(title)}</b><span>${esc(detail)}</span>`;
}

function resetPromptOutput() {
  S.currentPrompt = '';
  S.currentPromptMode = '';
  S.currentPromptFilename = '';
  $('#prompt-preview').value = '';
  $('#prompt-filename').value = '';
  $('#prompt-state-suggestion').hidden = true;
  setPromptLocalStatus('Sin encargo generado.', 'Elegí investigación para ampliar evidencia o redacción para preparar el futuro borrador.');
  setPromptControls(false);
  updatePromptEditorialStateNote();
}

function setPrompt(mode, content, exp = gatherExpedient()) {
  S.currentPromptMode = mode;
  S.currentPrompt = content;
  S.currentPromptFilename = suggestedPromptFilename(mode, exp);
  $('#prompt-preview').value = content;
  $('#prompt-filename').value = S.currentPromptFilename;
  $('#prompt-state-suggestion').hidden = true;
  setPromptControls(true);
  if (mode === 'research') {
    setPromptLocalStatus('Encargo de investigación generado.', 'Está visible en el panel. No se descargó ningún archivo y no es el artículo.', 'success');
  } else {
    setPromptLocalStatus('Encargo de redacción generado.', 'Está visible en el panel. No se descargó ningún archivo; el futuro borrador seguirá sujeto a revisión humana.', 'success');
  }
  updatePromptEditorialStateNote();
}

function generateResearchPlan(silent = false) {
  const exp = gatherExpedient();
  const problems = validateResearchExp(exp);
  if (problems.length) {
    $('#prompt-preview').value = `No se puede generar el plan:\n\n${problems.map((item) => `- ${item}`).join('\n')}`;
    setPromptLocalStatus('No se pudo generar el encargo.', problems[0], 'error');
    if (!silent) message(problems[0], 'error');
    return false;
  }
  setPrompt('research', buildResearchPlan(exp), exp);
  if (!silent) message('Encargo de investigación generado. No es el artículo final.');
  return true;
}

function generateDraftPrompt(silent = false) {
  const exp = gatherExpedient();
  const problems = validatePromptExp(exp);
  if (problems.length) {
    $('#prompt-preview').value = `No se puede generar el encargo de redacción:\n\n${problems.map((item) => `- ${item}`).join('\n')}`;
    setPromptLocalStatus('No se pudo generar el encargo.', problems[0], 'error');
    if (!silent) message(problems[0], 'error');
    return false;
  }
  const assessment = assessSufficiency(exp);
  if (!assessment.sufficient && !silent) {
    const proceed = confirm(`El encargo todavía no alcanza la suficiencia documental recomendada para ${human(exp.tipo_documento)}. Faltan:\n\n- ${assessment.missing.join('\n- ')}\n\n¿Generar de todos modos un encargo de redacción con advertencias y marcadores [VERIFICAR]?`);
    if (!proceed) return false;
  }
  setPrompt('draft', buildDraftPrompt(exp), exp);
  if (!silent) message(
    assessment.sufficient ? 'Encargo de redacción generado. No es el artículo final.' : 'Encargo de redacción generado con advertencias. No es el artículo final.',
    assessment.sufficient ? 'success' : 'warning',
  );
  return true;
}

function downloadText(filename, content, type = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function save() {
  const savedEventId = S.lastEditedEventId;
  try {
    const response = await api('/api/data', { method: 'PUT', body: JSON.stringify(S.data) });
    S.data = response.data;
    S.validation = response.validation;
    S.publicSyncPlan = null;
    dirty(false);
    await refreshBackups();
    fillFilters();
    renderAll();
    await refreshPublicSyncReadiness();
    const action = preparationEnabled() && savedEventId && byId(savedEventId)
      ? { label: 'Preparar análisis y seguimiento', href: preparationUrl(savedEventId) }
      : null;
    message(`Guardado. Backup: ${response.backup || 'no creado'}.`, 'success', false, action);
    S.lastEditedEventId = '';
  } catch (error) {
    S.validation = error.payload || S.validation;
    dirty(true);
    if (error.code === 'SERVER_OFFLINE') {
      message(error.message, 'error', true);
      return;
    }
    renderData();
    message(error.message, 'error');
    view('data');
  }
}

function publicSyncProblem(error) {
  const block = error?.payload?.blocks?.[0];
  return block?.detail || block?.title || error.message || 'La sincronización no pudo completarse.';
}

function renderPublicSyncReadiness({ checking = false, unavailable = '' } = {}) {
  const button = $('#sync-public');
  if (!button) return;
  if (checking) {
    button.disabled = true;
    button.textContent = 'Comprobando…';
    button.title = 'Comparando los macroeventos guardados con la proyección pública local.';
    return;
  }
  if (S.changed) {
    button.disabled = true;
    button.textContent = 'Guardá para sincronizar';
    button.title = 'La detección de eventos nuevos se ejecuta sobre los datos guardados.';
    return;
  }
  if (unavailable || !S.publicSyncPlan) {
    button.disabled = true;
    button.textContent = 'Sincronización no disponible';
    button.title = unavailable || 'No se pudo comprobar la proyección pública local.';
    return;
  }

  const created = Number(S.publicSyncPlan.counts?.created || 0);
  const updated = Number(S.publicSyncPlan.counts?.updated || 0);
  if (created > 0) {
    button.disabled = false;
    button.textContent = `Sincronizar ${created} ${created === 1 ? 'nuevo' : 'nuevos'}`;
    button.title = `Se detectaron ${created} macroevento${created === 1 ? '' : 's'} nuevo${created === 1 ? '' : 's'} para incorporar al sitio local.`;
    return;
  }

  button.disabled = true;
  if (updated > 0) {
    button.textContent = 'Sin eventos nuevos';
    button.title = `Hay ${updated} actualización${updated === 1 ? '' : 'es'}, pero este botón solo se habilita cuando se agregan macroeventos.`;
  } else {
    button.textContent = 'Sitio sincronizado';
    button.title = `La proyección pública ya contiene los ${S.publicSyncPlan.counts?.after || 0} macroeventos guardados.`;
  }
}

async function refreshPublicSyncReadiness({ silent = true } = {}) {
  renderPublicSyncReadiness({ checking: true });
  try {
    S.publicSyncPlan = await api('/api/public-sync/plan', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    renderPublicSyncReadiness();
    return S.publicSyncPlan;
  } catch (error) {
    S.publicSyncPlan = null;
    const problem = publicSyncProblem(error);
    renderPublicSyncReadiness({ unavailable: problem });
    if (!silent) message(problem, 'error', true);
    return null;
  }
}

async function syncPublicProjection() {
  const button = $('#sync-public');
  const originalLabel = button.textContent;
  if (S.changed) {
    return message('Guardá primero los cambios pendientes y luego pulsá “Sincronizar sitio”.', 'warning');
  }
  if (S.eventDraftChanged) {
    return message('Aplicá o cancelá los cambios abiertos en la ficha antes de sincronizar.', 'warning');
  }

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = 'Analizando…';
  try {
    const plan = await api('/api/public-sync/plan', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    S.publicSyncPlan = plan;
    if (Number(plan.counts?.created || 0) < 1) {
      renderPublicSyncReadiness();
      message('No se detectaron macroeventos nuevos para sincronizar.', 'warning');
      return;
    }
    if (plan.operation === 'sin_cambios') {
      message(`El sitio local ya está sincronizado: ${plan.counts.after} procesos.`, 'success');
      return;
    }

    const warningNote = plan.validation?.warnings?.length
      ? `\nAdvertencias editoriales no bloqueantes: ${plan.validation.warnings.length}.`
      : '';
    const accepted = confirm(
      `Se actualizará la proyección pública local.\n\n`
      + `Procesos actuales: ${plan.counts.before}\n`
      + `Procesos resultantes: ${plan.counts.after}\n`
      + `Nuevos: ${plan.counts.created}\n`
      + `Actualizados: ${plan.counts.updated}\n`
      + `Sin cambios: ${plan.counts.unchanged}${warningNote}\n\n`
      + 'Se conservarán los estados editoriales y se creará un respaldo. '
      + 'No se ejecutará Git ni se publicará en Internet.\n\n¿Continuar?',
    );
    if (!accepted) {
      message('Sincronización cancelada; no se modificó ningún archivo.', 'warning');
      return;
    }

    button.textContent = 'Sincronizando…';
    const result = await api('/api/public-sync/apply', {
      method: 'POST',
      body: JSON.stringify({ plan_id: plan.plan_id, confirmed: true }),
    });
    await bootstrap();
    const appliedPlan = result.plan || plan;
    message(
      `Sitio local sincronizado: ${appliedPlan.counts.before} → ${appliedPlan.counts.after} procesos. `
      + `Backup: ${result.backup?.relative || 'no requerido'}.`,
      'success',
      true,
    );
  } catch (error) {
    message(publicSyncProblem(error), 'error', true);
  } finally {
    button.removeAttribute('aria-busy');
    button.textContent = originalLabel;
    await refreshPublicSyncReadiness();
  }
}

async function validate() {
  S.validation = await api('/api/validate', { method: 'POST', body: JSON.stringify(S.data) });
  renderData();
  message(S.validation.valid ? 'Estructura válida.' : 'La validación detectó errores.', S.validation.valid ? 'success' : 'error');
}

async function refreshBackups() {
  const payload = await api('/api/backups');
  S.backups = payload.backups || [];
  S.catalogBackups = payload.catalog_backups || [];
  renderData();
}

async function restore(name, type) {
  if (!confirm(`¿Restaurar ${name}? Se respaldará el estado actual.`)) return;
  try {
    const endpoint = type === 'catalog' ? '/api/catalog/restore' : '/api/restore';
    const response = await api(endpoint, { method: 'POST', body: JSON.stringify({ name }) });
    if (type === 'catalog') {
      S.catalog = response.catalog;
      S.catalogValidation = response.validation;
      message('Catálogo restaurado.');
    } else {
      S.data = response.data;
      S.validation = response.validation;
      S.publicSyncPlan = null;
      dirty(false);
      message('Backup editorial restaurado.');
    }
    await refreshBackups();
    fillFilters();
    renderAll();
    await refreshPublicSyncReadiness();
  } catch (error) {
    message(error.message, 'error');
  }
}

function importDataFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || '{}'));
      if (!Array.isArray(payload.macroeventos)) throw new Error('El archivo no contiene macroeventos.');
      S.data = payload;
      if (!Array.isArray(S.data.expedientes_editoriales)) S.data.expedientes_editoriales = [];
      dirty(true);
      fillFilters();
      renderAll();
      message('JSON cargado en memoria. Revisá, validá y guardá.', 'warning');
    } catch (error) {
      message(`No se pudo importar: ${error.message}`, 'error');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function importCatalogFile(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(String(reader.result || '{}'));
      if (!Array.isArray(payload.records)) throw new Error('El archivo no contiene records.');
      if (!confirm(`¿Importar un catálogo con ${payload.records.length} registros? Se creará un backup del catálogo actual.`)) return;
      const response = await api('/api/catalog', { method: 'PUT', body: JSON.stringify(payload) });
      S.catalog = response.catalog;
      S.catalogValidation = response.validation;
      S.validation = response.data_validation;
      await refreshBackups();
      renderAll();
      message(`Catálogo importado. Backup: ${response.backup || 'no creado'}.`);
    } catch (error) {
      message(`No se pudo importar el catálogo: ${error.message}`, 'error');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function resetCandidateImport(clearText = true) {
  S.candidateImport = null;
  if (clearText) $('#candidate-json').value = '';
  $('#candidate-preview-section').hidden = true;
  $('#candidate-import-summary').innerHTML = '';
  $('#candidate-preview-list').innerHTML = '';
  $('#candidate-import-confirmed').checked = false;
  $('#candidate-selection-count').textContent = 'Ningún candidato seleccionado';
  $('#apply-candidate-import').disabled = true;
}

function openCandidateImport() {
  resetCandidateImport(true);
  $('#candidate-import-editor').showModal();
  $('#candidate-json').focus();
}

function candidateStatus(report) {
  if (report.action === 'no_change') return { label: 'Sin novedad', className: 'bad' };
  if (report.action === 'composite') return { label: 'Compuesto', className: 'bad' };
  if (report.blocked) return { label: 'Bloqueado', className: 'bad' };
  if (report.action === 'update') return { label: 'Actualización', className: 'info' };
  if (report.action === 'new') return { label: 'Nuevo', className: 'good' };
  return { label: 'Revisión humana', className: 'warn' };
}

function candidateIssueList(items, type) {
  return items.length ? `<ul class="candidate-issues ${type}">${items.map((item) => `<li>${esc(item.detail || item)}</li>`).join('')}</ul>` : '';
}

function selectedCandidateReports() {
  return (S.candidateImport?.candidates || []).filter((report) => report.selected && !report.blocked && ['new', 'update'].includes(report.action));
}

function syncCandidateImportControls() {
  const selected = selectedCandidateReports().length;
  const selectedWarnings = (S.candidateImport?.candidates || []).reduce((sum, report) => {
    const items = report.action === 'update' ? report.update_plan?.new_warnings : report.item_plan?.warnings;
    return sum + (items || []).filter((item) => item.selected && warningDecisionReady(item)).length;
  }, 0);
  $('#candidate-selection-count').textContent = selected
    ? `${selected} ${selected === 1 ? 'candidato seleccionado' : 'candidatos seleccionados'} · ${selectedWarnings} ${selectedWarnings === 1 ? 'advertencia confirmada' : 'advertencias confirmadas'}`
    : 'Ninguna acción seleccionada';
  $('#apply-candidate-import').disabled = !selected || !$('#candidate-import-confirmed').checked;
}

function changeValue(value) {
  if (Array.isArray(value)) return value.join(' · ') || '—';
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '—') || '—';
}

function candidateDecisionControls(report) {
  if (report.blocked) return '';
  const targets = S.data.macroeventos.map((event) => `<option value="${esc(event.id)}" ${report.target_id === event.id ? 'selected' : ''}>${esc(event.titulo)}</option>`).join('');
  return `<div class="candidate-decision">
    <label class="field"><span>Tratamiento</span><select data-candidate-action="${report.index}">
      <option value="review" ${report.action === 'review' ? 'selected' : ''}>Elegir tratamiento…</option>
      <option value="new" ${report.action === 'new' ? 'selected' : ''}>Crear macroevento nuevo</option>
      <option value="update" ${report.action === 'update' ? 'selected' : ''}>Actualizar macroevento existente</option>
    </select></label>
    <label class="field grow ${report.action === 'new' ? 'decision-target-hidden' : ''}"><span>Macroevento de destino</span><select data-candidate-target="${report.index}"><option value="">Seleccionar…</option>${targets}</select></label>
    <label class="field"><span>Tipo de evolución</span><select data-candidate-evolution="${report.index}">
      ${['continuidad', 'avance', 'aceleracion', 'bloqueo', 'retraso', 'desescalamiento', 'reversion', 'cambio_alcance', 'cambio_actores', 'contradiccion'].map((value) => `<option value="${value}" ${report.classification.evolution_type === value ? 'selected' : ''}>${esc(human(value))}</option>`).join('')}
    </select></label>
  </div>`;
}

function candidateWarningPlan(report, items) {
  if (!items?.length) return '<p class="muted">ChatGPT no devolvió advertencias para este candidato.</p>';
  return `<div class="candidate-warning-list">${items.map((item, index) => {
    const warning = item.value;
    const ready = warningDecisionReady(item);
    const pendingSources = warning.vinculos_pendientes?.fuente_ids || [];
    const pendingSignals = warning.vinculos_pendientes?.signal_ids || [];
    const blockingIssues = item.conflicts.filter((conflict) => conflict.blocking);
    const reviewIssues = item.conflicts.filter((conflict) => !conflict.blocking);
    return `<article class="candidate-warning-item ${item.blocked ? 'blocked' : ready ? '' : 'decision-required'}">
      <header>
        <label class="candidate-select"><input type="checkbox" data-candidate-warning="${report.index}:${index}" ${item.selected ? 'checked' : ''} ${item.blocked || !ready ? 'disabled' : ''}><span><b>${esc(warning.advertencia_id)}</b><small>${item.blocked ? 'Conflicto aislado: no se aplicará' : ready ? 'Incorporar esta advertencia' : 'Completá la decisión para habilitarla'}</small></span></label>
        <span class="badge ${item.blocked ? 'bad' : ready ? 'good' : 'warn'}">${item.blocked ? 'Bloqueada' : ready ? 'Lista' : 'Decisión pendiente'}</span>
      </header>
      <p>${esc(warning.descripcion || 'Sin descripción')}</p>
      <div class="candidate-warning-meta"><span><b>Tipo</b>${esc(warning.tipo || '—')}</span><span><b>Referencias válidas</b>${warning.signal_ids.length} señales · ${warning.fuente_ids.length} fuentes</span></div>
      ${candidateIssueList(blockingIssues, 'error')}${candidateIssueList(reviewIssues, 'warning')}
      ${(pendingSources.length || pendingSignals.length) ? `<p class="pending-links"><b>Vínculos pendientes conservados:</b> ${esc([...pendingSignals, ...pendingSources].join(' · '))}</p>` : ''}
      <div class="candidate-warning-decision">
        <label class="field"><span>Estado de entrada</span><select data-warning-state="${report.index}:${index}"><option value="">Confirmar…</option><option value="pendiente" ${warning.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option></select></label>
        <label class="field"><span>Tratamiento propuesto</span><select data-warning-treatment="${report.index}:${index}"><option value="">Elegir…</option>${Object.entries(WARNING_TREATMENT_LABELS).map(([value, label]) => `<option value="${value}" ${warning.tratamiento === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
        <label class="field"><span>Prioridad</span><select data-warning-priority="${report.index}:${index}">${Object.entries(WARNING_PRIORITY_LABELS).map(([value, label]) => `<option value="${value}" ${warning.prioridad === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
      </div>
    </article>`;
  }).join('')}</div>`;
}

function candidateNewPlan(report) {
  if (report.action !== 'new') return '';
  const plan = report.item_plan;
  const sources = plan.sources.length
    ? plan.sources.map((item, index) => `<label class="candidate-update-item"><input type="checkbox" data-new-source="${report.index}:${index}" ${item.selected ? 'checked' : ''}><span><strong>${esc(item.value.medio || 'Fuente')}</strong><small>${esc(item.value.titulo || item.value.url || 'Sin título')}</small></span></label>`).join('')
    : '<p class="muted">No hay publicaciones.</p>';
  const signals = plan.signals.length
    ? plan.signals.map((item, index) => `<label class="candidate-update-item"><input type="checkbox" data-new-signal="${report.index}:${index}" ${item.selected ? 'checked' : ''}><span><strong>${esc(item.value.titulo || 'Señal')}</strong><small>${esc(item.value.fecha || 'Sin fecha')} · ${esc(item.value.tipo || 'Sin tipo')}</small></span></label>`).join('')
    : '<p class="muted">No hay señales.</p>';
  return `<section class="candidate-update-plan candidate-intake-plan">
    <header><div><p class="eyebrow">CONTENIDO PROPUESTO</p><h4>Confirmación por ítem</h4></div><span class="badge info">${plan.sources.length} fuentes · ${plan.signals.length} señales · ${plan.warnings.length} advertencias</span></header>
    <div class="candidate-update-columns"><div><h5>Publicaciones</h5>${sources}</div><div><h5>Señales</h5>${signals}</div></div>
    <details open><summary>Advertencias · confirmar una por una</summary>${candidateWarningPlan(report, plan.warnings)}</details>
  </section>`;
}

function candidateUpdatePlan(report) {
  if (report.action !== 'update' || !report.update_plan) return '';
  const plan = report.update_plan;
  const target = byId(report.target_id);
  const sources = plan.new_sources.length
    ? plan.new_sources.map((item, index) => `<label class="candidate-update-item"><input type="checkbox" data-update-source="${report.index}:${index}" ${item.selected ? 'checked' : ''}><span><strong>${esc(item.value.medio || 'Fuente')}</strong><small>${esc(item.value.titulo || item.value.url || 'Sin título')}</small></span></label>`).join('')
    : '<p class="muted">No hay publicaciones nuevas.</p>';
  const signals = plan.new_signals.length
    ? plan.new_signals.map((item, index) => `<label class="candidate-update-item"><input type="checkbox" data-update-signal="${report.index}:${index}" ${item.selected ? 'checked' : ''}><span><strong>${esc(item.value.titulo || 'Señal')}</strong><small>${esc(item.value.fecha || 'Sin fecha')} · ${esc(item.value.tipo || 'Sin tipo')}</small></span></label>`).join('')
    : '<p class="muted">No hay señales nuevas.</p>';
  const changes = plan.field_changes.length
    ? plan.field_changes.map((change, index) => `<label class="candidate-field-change"><input type="checkbox" data-update-field="${report.index}:${index}" ${change.selected ? 'checked' : ''}><span><strong>${esc(change.label)}</strong><small><b>Actual:</b> ${esc(changeValue(change.current))}</small><small><b>Propuesto:</b> ${esc(changeValue(change.proposed))}</small></span></label>`).join('')
    : '<p class="muted">No se detectaron cambios materiales en los campos principales.</p>';
  return `<section class="candidate-update-plan">
    <header><div><p class="eyebrow">ACTUALIZACIÓN PROPUESTA</p><h4>${esc(target?.titulo || report.target_id)}</h4></div><span class="badge info">${plan.new_sources.length} fuentes · ${plan.new_signals.length} señales · ${plan.new_warnings.length} advertencias</span></header>
    <div class="candidate-update-columns"><div><h5>Publicaciones nuevas</h5>${sources}</div><div><h5>Señales nuevas</h5>${signals}</div></div>
    <details open><summary>Advertencias nuevas · confirmar una por una</summary>${candidateWarningPlan(report, plan.new_warnings)}</details>
    <details open><summary>Cambios de ficha · ninguno se aplica sin marcarlo</summary><div class="candidate-field-changes">${changes}</div></details>
  </section>`;
}

function renderCandidateImport() {
  const batch = S.candidateImport;
  if (!batch) {
    $('#candidate-preview-section').hidden = true;
    syncCandidateImportControls();
    return;
  }
  $('#candidate-preview-section').hidden = false;
  $('#candidate-import-summary').innerHTML = [
    `<span class="badge info">${batch.summary.total} analizados</span>`,
    `<span class="badge good">${batch.summary.new} nuevos</span>`,
    `<span class="badge info">${batch.summary.updates} actualizaciones</span>`,
    `<span class="badge warn">${batch.summary.review} para revisar</span>`,
    `<span class="badge bad">${batch.summary.blocked} bloqueados</span>`,
    `<span class="badge info">${batch.summary.warnings} advertencias</span>`,
    batch.summary.warning_conflicts ? `<span class="badge warn">${batch.summary.warning_conflicts} con revisión</span>` : '',
    batch.summary.pending_links ? `<span class="badge warn">${batch.summary.pending_links} vínculos pendientes</span>` : '',
  ].filter(Boolean).join('');
  $('#candidate-preview-list').innerHTML = batch.candidates.map((report) => {
    const event = report.value;
    const status = candidateStatus(report);
    const topics = (event.tema_ids || []).map(topicById).filter(Boolean).map((topic) => topic.nombre);
    const warnings = candidateIssueList(report.warnings, 'warning');
    const errors = candidateIssueList(report.errors, 'error');
    const duplicates = candidateIssueList(report.duplicates, 'warning');
    return `<article class="candidate-preview-card ${report.blocked ? 'blocked' : ''}">
      <header>
        <label class="candidate-select">
          <input type="checkbox" data-candidate-index="${report.index}" ${report.selected ? 'checked' : ''} ${report.blocked || !['new', 'update'].includes(report.action) ? 'disabled' : ''}>
          <span><b>Candidato ${report.index + 1}</b><small>${report.blocked ? 'No se puede aplicar' : ['new', 'update'].includes(report.action) ? 'Aplicar esta decisión' : 'Elegí un tratamiento'}</small></span>
        </label>
        <span class="badge ${status.className}">${status.label}</span>
      </header>
      <h3>${esc(event.titulo || 'Sin título')}</h3>
      <p class="candidate-id">${esc(event.id)}</p>
      <p>${esc(event.descripcion || 'Sin descripción estratégica.')}</p>
      <div class="candidate-facts">
        <span><b>Regiones</b>${esc(event.regiones.join(' · ') || '—')}</span>
        <span><b>Categoría</b>${esc(event.categoria || '—')}</span>
        <span><b>Temas</b>${esc(topics.join(' · ') || 'Sin coincidencias')}</span>
        <span><b>Evidencia y alertas</b>${event.fuentes.length} publicaciones · ${event.senales.length} señales · ${report.item_plan.warnings.length} advertencias</span>
      </div>
      ${errors}${duplicates}${warnings}
      ${candidateDecisionControls(report)}
      ${candidateNewPlan(report)}
      ${candidateUpdatePlan(report)}
      <details><summary>Ver estado de entrada</summary><dl><dt>Estado editorial</dt><dd>Borrador</dd><dt>Verificación</dt><dd>Pendiente</dd><dt>Clasificación temática</dt><dd>Propuesta por IA · pendiente de revisión</dd><dt>Fecha de corte</dt><dd>${esc(event.fecha_corte)}</dd></dl></details>
    </article>`;
  }).join('');
  $$('[data-candidate-index]', $('#candidate-preview-list')).forEach((input) => {
    input.addEventListener('change', () => {
      const report = S.candidateImport.candidates[Number(input.dataset.candidateIndex)];
      report.selected = input.checked && !report.blocked;
      syncCandidateImportControls();
    });
  });
  $$('[data-candidate-action]', $('#candidate-preview-list')).forEach((select) => {
    select.onchange = () => {
      const report = S.candidateImport.candidates[Number(select.dataset.candidateAction)];
      const targetId = report.target_id || report.matches?.[0]?.event?.id || '';
      configureCandidateAction(report, select.value, byId(targetId));
      renderCandidateImport();
    };
  });
  $$('[data-candidate-target]', $('#candidate-preview-list')).forEach((select) => {
    select.onchange = () => {
      const report = S.candidateImport.candidates[Number(select.dataset.candidateTarget)];
      if (!select.value) configureCandidateAction(report, 'review');
      else configureCandidateAction(report, 'update', byId(select.value));
      renderCandidateImport();
    };
  });
  $$('[data-candidate-evolution]', $('#candidate-preview-list')).forEach((select) => {
    select.onchange = () => {
      const report = S.candidateImport.candidates[Number(select.dataset.candidateEvolution)];
      report.classification.evolution_type = select.value;
    };
  });
  const bindUpdateToggle = (selector, key) => {
    $$(selector, $('#candidate-preview-list')).forEach((input) => {
      input.onchange = () => {
        const [reportIndex, itemIndex] = input.getAttribute(selector.slice(1, -1)).split(':').map(Number);
        S.candidateImport.candidates[reportIndex].update_plan[key][itemIndex].selected = input.checked;
      };
    });
  };
  bindUpdateToggle('[data-update-source]', 'new_sources');
  bindUpdateToggle('[data-update-signal]', 'new_signals');
  bindUpdateToggle('[data-update-field]', 'field_changes');
  for (const [selector, key] of [['[data-new-source]', 'sources'], ['[data-new-signal]', 'signals']]) {
    $$(selector, $('#candidate-preview-list')).forEach((input) => {
      input.onchange = () => {
        const [reportIndex, itemIndex] = input.getAttribute(selector.slice(1, -1)).split(':').map(Number);
        S.candidateImport.candidates[reportIndex].item_plan[key][itemIndex].selected = input.checked;
      };
    });
  }
  const warningItemsFor = (report) => (report.action === 'update' ? report.update_plan?.new_warnings : report.item_plan?.warnings) || [];
  $$('[data-candidate-warning]', $('#candidate-preview-list')).forEach((input) => {
    input.onchange = () => {
      const [reportIndex, itemIndex] = input.dataset.candidateWarning.split(':').map(Number);
      const item = warningItemsFor(S.candidateImport.candidates[reportIndex])[itemIndex];
      item.selected = input.checked && warningDecisionReady(item);
      syncCandidateImportControls();
    };
  });
  for (const [selector, field] of [['[data-warning-state]', 'estado'], ['[data-warning-treatment]', 'tratamiento'], ['[data-warning-priority]', 'prioridad']]) {
    $$(selector, $('#candidate-preview-list')).forEach((select) => {
      select.onchange = () => {
        const [reportIndex, itemIndex] = select.getAttribute(selector.slice(1, -1)).split(':').map(Number);
        const item = warningItemsFor(S.candidateImport.candidates[reportIndex])[itemIndex];
        configureCandidateWarning(item, { [field]: select.value });
        renderCandidateImport();
      };
    });
  }
  syncCandidateImportControls();
}

function analyzeCandidateInput() {
  try {
    const parsed = parseCandidateText($('#candidate-json').value);
    S.candidateImport = prepareCandidateBatch(parsed, {
      existingEvents: S.data.macroeventos,
      taxonomy: S.taxonomy,
      catalog: S.catalog,
      config: S.config,
      importedAt: today(),
      batchId: `chatgpt-${today()}-${Date.now()}`,
    });
    $('#candidate-import-confirmed').checked = false;
    renderCandidateImport();
    const { total, blocked } = S.candidateImport.summary;
    message(
      blocked ? `Se analizaron ${total} candidatos; ${blocked} quedaron bloqueados.` : `Se analizaron ${total} candidatos. Elegí cuáles incorporar.`,
      blocked ? 'warning' : 'success',
    );
  } catch (error) {
    resetCandidateImport(false);
    message(error.message, 'error', true);
  }
}

function loadCandidateFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    $('#candidate-json').value = String(reader.result || '');
    analyzeCandidateInput();
  };
  reader.onerror = () => message('No se pudo leer el archivo seleccionado.', 'error');
  reader.readAsText(file, 'utf-8');
}

async function applyCandidateImport() {
  const selected = selectedCandidateReports();
  if (!selected.length) return message('Seleccioná al menos una decisión aplicable.', 'warning');
  if (!$('#candidate-import-confirmed').checked) return message('Confirmá la revisión humana antes de incorporar.', 'warning');
  const result = applyCandidateDecisions(S.data, S.candidateImport.candidates, {
    batchId: S.candidateImport.metadata.batch_id,
    importedAt: S.candidateImport.metadata.imported_at,
    importedTimestamp: S.candidateImport.metadata.imported_timestamp,
    originalText: S.candidateImport.metadata.original_text,
    formatVersion: S.candidateImport.metadata.schema_version,
    query: S.candidateImport.metadata.consulta,
  });
  try {
    const validation = await api('/api/validate', { method: 'POST', body: JSON.stringify(result.data) });
    if (!validation.valid) {
      const firstError = validation.errors?.[0] || 'La base resultante no supera la validación.';
      return message(`No se aplicaron las decisiones: ${firstError}`, 'error', true);
    }
    S.data = result.data;
    S.validation = validation;
    dirty(true);
    fillFilters();
    renderAll();
    $('#candidate-import-editor').close();
    view('events');
    const summary = [
      result.applied.new ? `${result.applied.new} nuevos` : '',
      result.applied.updates ? `${result.applied.updates} actualizaciones` : '',
      result.applied.sources ? `${result.applied.sources} fuentes` : '',
      result.applied.signals ? `${result.applied.signals} señales` : '',
      result.applied.warnings ? `${result.applied.warnings} advertencias` : '',
      result.applied.warning_rejections ? `${result.applied.warning_rejections} advertencias no aplicadas` : '',
      result.applied.pending_links ? `${result.applied.pending_links} con vínculos pendientes` : '',
      result.applied.field_changes ? `${result.applied.field_changes} cambios de ficha` : '',
    ].filter(Boolean).join(' · ');
    message(`${summary} aplicados en memoria. Revisá y pulsá Guardar para persistir.`);
  } catch (error) {
    message(`No se pudo validar la importación: ${error.message}`, 'error', true);
  }
}

// Navegación y acciones delegadas
$('#nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (button) view(button.dataset.view);
});

document.addEventListener('click', (event) => {
  const go = event.target.closest('[data-go]');
  if (go) view(go.dataset.go);
  const editEvent = event.target.closest('[data-edit-event]');
  if (editEvent) openEvent(editEvent.dataset.editEvent);
  const editInternalCategory = event.target.closest('[data-edit-internal-category]');
  if (editInternalCategory) openInternalCategoryEditor(editInternalCategory.dataset.editInternalCategory);
  const newEditorialVocabulary = event.target.closest('[data-new-editorial-vocabulary]');
  if (newEditorialVocabulary) {
    event.preventDefault();
    openEditorialVocabularyEditor(newEditorialVocabulary.dataset.newEditorialVocabulary);
  }
  const editEditorialVocabulary = event.target.closest('[data-edit-editorial-vocabulary]');
  if (editEditorialVocabulary) {
    const [kind, id] = editEditorialVocabulary.dataset.editEditorialVocabulary.split(':');
    openEditorialVocabularyEditor(kind, id);
  }
  const createExp = event.target.closest('[data-create-exp]');
  if (createExp) openExpedient('', createExp.dataset.createExp);
  const publicationQuick = event.target.closest('[data-publication-quick]');
  if (publicationQuick) {
    $('#f-publication').value = publicationQuick.dataset.publicationQuick;
    renderEvents();
  }
  const editExp = event.target.closest('[data-edit-exp]');
  if (editExp) openExpedient(editExp.dataset.editExp);
  const promptExp = event.target.closest('[data-prompt-exp]');
  if (promptExp) openExpedient(promptExp.dataset.promptExp, '', true);
  const restoreButton = event.target.closest('[data-restore]');
  if (restoreButton) restore(restoreButton.dataset.restore, restoreButton.dataset.backupType);
  const editSignal = event.target.closest('[data-edit-signal]');
  if (editSignal) openSignal(Number(editSignal.dataset.editSignal));
  const deleteSignal = event.target.closest('[data-delete-signal]');
  if (deleteSignal && confirm('¿Eliminar esta señal del macroevento?')) {
    const signal = S.eventDraft.senales[Number(deleteSignal.dataset.deleteSignal)];
    const linkedWarning = (S.eventDraft.advertencias || []).find((warning) => (warning.signal_ids || []).includes(signal.id));
    if (linkedWarning) return message(`No se puede eliminar: la señal está vinculada con ${linkedWarning.advertencia_id}. Desvinculala primero desde Advertencias.`, 'warning');
    S.eventDraft.senales.splice(Number(deleteSignal.dataset.deleteSignal), 1);
    renderSignalCards();
    markEventDraftChanged();
  }
  const editSource = event.target.closest('[data-edit-source]');
  if (editSource) openSource(Number(editSource.dataset.editSource));
  const deleteSource = event.target.closest('[data-delete-source]');
  if (deleteSource && confirm('¿Eliminar esta fuente del macroevento?')) {
    const source = S.eventDraft.fuentes[Number(deleteSource.dataset.deleteSource)];
    const linkedWarning = (S.eventDraft.advertencias || []).find((warning) => (
      (warning.fuente_ids || []).includes(source.id)
      || (warning.resuelta_con_fuente_ids || []).includes(source.id)
      || (warning.resolucion?.fuente_ids || []).includes(source.id)
    ));
    if (linkedWarning) return message(`No se puede eliminar: la fuente está vinculada con ${linkedWarning.advertencia_id}. Desvinculala o reabrí la advertencia primero.`, 'warning');
    S.eventDraft.fuentes.splice(Number(deleteSource.dataset.deleteSource), 1);
    S.eventDraft.senales.forEach((signal) => { signal.fuente_ids = signal.fuente_ids.filter((id) => id !== source.id); });
    renderSourceCards();
    renderSignalCards();
    markEventDraftChanged();
  }
});

$('#menu').onclick = toggleNavigation;
$('#nav-overlay').onclick = () => closeNavigation();
mobileNavigation.addEventListener('change', syncNavigationMode);
$('#open-help').onclick = () => { renderHelp(); $('#help-dialog').showModal(); $('#close-help-dialog').focus(); };
$('#close-help-dialog').onclick = $('#close-help-dialog-footer').onclick = () => $('#help-dialog').close();

$('#new-event').onclick = () => openEvent('', 'new');
$('#new-internal-category').onclick = () => openInternalCategoryEditor();
$('#manage-internal-categories').onclick = () => openInternalCategoryEditor('', true);
$('#close-internal-category-editor').onclick = $('#cancel-internal-category-editor').onclick = closeInternalCategoryEditor;
$('#internal-category-form').addEventListener('submit', applyInternalCategory);
$('#internal-category-name').addEventListener('input', () => {
  if (!$('#internal-category-original-id').value) $('#internal-category-id').value = normalizeCharacterization($('#internal-category-name').value);
});
$('#close-editorial-vocabulary-editor').onclick = $('#cancel-editorial-vocabulary-editor').onclick = closeEditorialVocabularyEditor;
$('#editorial-vocabulary-form').addEventListener('submit', applyEditorialVocabulary);
$('#editorial-vocabulary-kind').addEventListener('change', updateEditorialVocabularyFields);
$('#editorial-vocabulary-name').addEventListener('input', () => {
  if (!$('#editorial-vocabulary-original-id').value) {
    $('#editorial-vocabulary-id').value = normalizeEditorialVocabularyId(
      $('#editorial-vocabulary-kind').value,
      $('#editorial-vocabulary-name').value,
    );
  }
});
$('#open-candidate-import').onclick = openCandidateImport;
$('#close-candidate-import').onclick = $('#cancel-candidate-import').onclick = () => $('#candidate-import-editor').close();
$('#clear-candidate-import').onclick = () => { resetCandidateImport(true); $('#candidate-json').focus(); };
$('#analyze-candidates').onclick = analyzeCandidateInput;
$('#candidate-file').onchange = (event) => {
  const file = event.target.files?.[0];
  if (file) loadCandidateFile(file);
  event.target.value = '';
};
$('#copy-candidate-format').onclick = async () => {
  try {
    await copyText(candidateFormatInstructions());
    message('Instrucciones de formato copiadas. Pegalas al final del prompt de búsqueda.');
  } catch (error) {
    message(`No se pudieron copiar las instrucciones: ${error.message}`, 'error');
  }
};
$('#download-candidate-template').onclick = () => {
  downloadText('plantilla-candidatos-observatorio.json', `${JSON.stringify(candidateExample(), null, 2)}\n`, 'application/json;charset=utf-8');
  message('Plantilla JSON descargada.');
};
$('#select-importable-candidates').onclick = () => {
  const next = (S.candidateImport?.candidates || []).find((report) => !report.selected && !report.blocked && ['new', 'update'].includes(report.action));
  if (next) next.selected = true;
  renderCandidateImport();
};
$('#clear-candidate-selection').onclick = () => {
  for (const report of S.candidateImport?.candidates || []) report.selected = false;
  renderCandidateImport();
};
$('#candidate-import-confirmed').onchange = syncCandidateImportControls;
$('#apply-candidate-import').onclick = applyCandidateImport;
$('#new-expedient').onclick = () => openExpedient();
$('#save').onclick = save;
$('#sync-public').onclick = syncPublicProjection;
$('#reload').onclick = async () => {
  if (S.changed && !confirm('Hay cambios sin guardar. ¿Recargar y descartarlos?')) return;
  await bootstrap();
  message('Datos recargados.');
};
$('#validate').onclick = validate;
$('#refresh-backups').onclick = refreshBackups;
$('#import').onchange = (event) => { const file = event.target.files?.[0]; if (file) importDataFile(file); event.target.value = ''; };
$('#import-catalog').onchange = (event) => { const file = event.target.files?.[0]; if (file) importCatalogFile(file); event.target.value = ''; };

['#f-search', '#f-region', '#f-category', '#f-type', '#f-role', '#f-status', '#f-publication', '#f-gap', '#f-sort'].forEach((selector) => $(selector).addEventListener(selector === '#f-search' ? 'input' : 'change', renderEvents));
$('#clear-filters').onclick = () => { ['#f-search', '#f-region', '#f-category', '#f-type', '#f-role', '#f-status', '#f-publication', '#f-gap'].forEach((selector) => { $(selector).value = ''; }); $('#f-sort').value = 'rel'; renderEvents(); };
['#o-search', '#o-type', '#o-role', '#o-status'].forEach((selector) => $(selector).addEventListener(selector === '#o-search' ? 'input' : 'change', renderOverview));
$('#clear-overview-search').onclick = () => { ['#o-search', '#o-type', '#o-role', '#o-status'].forEach((selector) => { $(selector).value = ''; }); renderOverview(); $('#o-search').focus(); };
$('#t-search').addEventListener('input', renderTaxonomy);
$('#t-category').addEventListener('change', renderTaxonomy);
$('#clear-taxonomy').onclick = () => { $('#t-search').value = ''; $('#t-category').value = ''; renderTaxonomy(); };
$('#sg-axis').addEventListener('change', () => applySearchProfile(false));
$('#sg-region').addEventListener('change', recommendGeneratorSources);
$('#sg-source-limit').addEventListener('change', recommendGeneratorSources);
$('#sg-languages').addEventListener('change', recommendGeneratorSources);
['#sg-period', '#sg-hmin', '#sg-hmax', '#sg-max-events', '#sg-output-mode', '#sg-actors'].forEach((selector) => $(selector).addEventListener(selector === '#sg-actors' ? 'input' : 'change', invalidateSearchPrompt));
$('#sg-topic-search').addEventListener('input', renderGeneratorTopics);
$('#sg-source-search').addEventListener('input', renderGeneratorSources);
$('#sg-recommend-sources').onclick = recommendGeneratorSources;
$('#sg-clear-sources').onclick = () => {
  S.searchGenerator.sources = [];
  invalidateSearchPrompt();
  renderGeneratorSources();
};
$('#sg-add-source').onclick = () => {
  const name = $('#sg-external-name').value.trim();
  const rawUrl = $('#sg-external-url').value.trim();
  let url;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== 'https:') throw new Error('HTTPS requerido');
  } catch {
    return message('Ingresá una URL HTTPS válida para la fuente externa.', 'error');
  }
  const normalizedUrl = url.toString();
  if (S.searchGenerator.sources.some((source) => source.url === normalizedUrl)) return message('Esa fuente ya está seleccionada.', 'warning');
  S.searchGenerator.sources.push({
    selection_id: `externa:${slug(name || url.hostname)}-${Date.now()}`,
    media_id: '',
    catalogada: false,
    prioritaria: false,
    nombre: name || url.hostname,
    url: normalizedUrl,
    region: '',
    idioma: '',
    familia: 'Fuente externa',
    funcion: '',
    perspectiva: '',
    puntuacion: 0,
    estado: 'No catalogada',
    razon: 'Agregada manualmente para esta búsqueda.',
  });
  $('#sg-external-name').value = '';
  $('#sg-external-url').value = '';
  invalidateSearchPrompt();
  renderGeneratorSources();
};
$('#sg-generate').onclick = generateSearchPrompt;
$('#sg-copy-prompt').onclick = async () => {
  if (!S.searchGenerator.prompt) return;
  try {
    await copyText(S.searchGenerator.prompt);
    message('Prompt de búsqueda copiado.');
  } catch (error) {
    message(`No se pudo copiar: ${error.message}`, 'error');
  }
};
$('#sg-download-prompt').onclick = () => {
  if (!S.searchGenerator.prompt) return;
  downloadText(`prompt-busqueda-${searchProfile().id}-${today()}.md`, `${S.searchGenerator.prompt}\n`);
  message('Prompt de búsqueda descargado.');
};
['#x-search', '#x-type', '#x-status', '#x-event'].forEach((selector) => $(selector).addEventListener(selector === '#x-search' ? 'input' : 'change', renderExpedients));
$('#clear-expedients').onclick = () => { ['#x-search', '#x-type', '#x-status', '#x-event'].forEach((selector) => { $(selector).value = ''; }); renderExpedients(); };

// Editor de macroeventos
$('#close-event-editor').onclick = $('#cancel-event-editor').onclick = () => { closeContextHelp(false); S.eventDraftChanged = false; $('#event-editor').close(); };
$('#event-form').addEventListener('input', markEventDraftChanged);
$('#event-form').addEventListener('change', markEventDraftChanged);
$('#prepare-analysis-followup').onclick = () => openPreparation($('#event-original-id').value);
$('#e-theme-search').addEventListener('input', renderThemeEditor);
$('#e-theme-review').addEventListener('change', () => { if ($('#e-theme-review').value === 'revisada' && !$('#e-theme-reviewed').value) $('#e-theme-reviewed').value = today(); });
$('#e-related-search').addEventListener('input', renderEventRelations);
$('#e-is-rector').addEventListener('change', () => {
  S.eventDraft.es_macroevento_rector = $('#e-is-rector').checked;
  if (S.eventDraft.es_macroevento_rector) setEventRectorIds(S.eventDraft, []);
  renderEventRelations();
});
$('#add-signal').onclick = () => openSignal();
$('#add-source').onclick = () => openSource();
$('#event-record-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-event-tab]');
  if (tab) activateEventRecordTab(tab.dataset.eventTab);
});
$('#event-record-tabs').addEventListener('keydown', (event) => {
  const tabs = $$('[data-event-tab]', $('#event-record-tabs'));
  const current = tabs.indexOf(event.target.closest('[data-event-tab]'));
  if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  activateEventRecordTab(tabs[next].dataset.eventTab, { focus: true });
});
$('#add-warning').onclick = () => openWarning();
for (const selector of ['#warning-filter-state', '#warning-filter-treatment', '#warning-filter-priority', '#warning-filter-signal', '#warning-filter-source', '#warning-filter-prompt']) {
  $(selector).addEventListener('change', renderWarningCards);
}
$('#clear-warning-filters').onclick = () => clearWarningFilters();
$('#warning-radar').onclick = () => { S.warningRadar = !S.warningRadar; renderWarningCards(); };
$('#warning-cards').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-warning]');
  if (edit) openWarning(Number(edit.dataset.editWarning));
  const reactivate = event.target.closest('[data-reactivate-warning]');
  if (reactivate) quickWarningChange(Number(reactivate.dataset.reactivateWarning), 'tratamiento', 'relevante');
});
$('#warning-cards').addEventListener('change', (event) => {
  const control = event.target.closest('[data-warning-field]');
  if (!control) return;
  event.stopPropagation();
  quickWarningChange(Number(control.dataset.warningIndex), control.dataset.warningField, control.value);
});
['#s-impact', '#s-prob', '#s-reach', '#s-persistence', '#s-spread', '#s-gap', '#s-uncertainty', '#s-urgency', '#s-coverage'].forEach((selector) => $(selector).addEventListener('input', calcEvent));
$('#event-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = gatherEvent();
  const originalId = $('#event-original-id').value;
  if (S.data.macroeventos.some((item) => item.id === value.id && item.id !== originalId)) return message(`Ya existe el ID ${value.id}.`, 'error');
  if (originalId) {
    const index = S.data.macroeventos.findIndex((item) => item.id === originalId);
    S.data.macroeventos[index] = value;
    S.data.expedientes_editoriales.forEach((exp) => { exp.macroevento_ids = exp.macroevento_ids.map((id) => id === originalId ? value.id : id); });
    if (originalId !== value.id) S.data.macroeventos.forEach((item) => {
      if (item.id === value.id) return;
      if (item.macroevento_rector_id === originalId) item.macroevento_rector_id = value.id;
      item.macroevento_rector_ids = eventRectorIds(item).map((id) => id === originalId ? value.id : id);
      setEventRectorIds(item, item.macroevento_rector_ids);
      item.macroevento_relacionado_ids = (item.macroevento_relacionado_ids || []).map((id) => id === originalId ? value.id : id);
    });
  } else S.data.macroeventos.push(value);
  const relatedIds = new Set(value.macroevento_relacionado_ids || []);
  S.data.macroeventos.forEach((item) => {
    if (item.id === value.id) return;
    const current = new Set((item.macroevento_relacionado_ids || []).map((id) => id === originalId ? value.id : id));
    if (relatedIds.has(item.id)) current.add(value.id);
    else {
      current.delete(value.id);
      if (originalId) current.delete(originalId);
    }
    item.macroevento_relacionado_ids = [...current];
  });
  S.lastEditedEventId = value.id;
  S.eventDraftChanged = false;
  $('#event-editor').close();
  dirty(true);
  fillFilters();
  renderAll();
});
$('#delete-event').onclick = () => {
  const id = $('#event-original-id').value;
  const item = byId(id);
  if (!item || !confirm(`¿Eliminar “${item.titulo}”? También se retirará de encargos editoriales relacionados.`)) return;
  S.data.macroeventos = S.data.macroeventos.filter((event) => event.id !== id);
  S.data.macroeventos.forEach((event) => {
    setEventRectorIds(event, eventRectorIds(event).filter((rectorId) => rectorId !== id));
    event.macroevento_relacionado_ids = (event.macroevento_relacionado_ids || []).filter((relatedId) => relatedId !== id);
  });
  S.data.expedientes_editoriales.forEach((exp) => { exp.macroevento_ids = exp.macroevento_ids.filter((eventId) => eventId !== id); });
  $('#event-editor').close();
  dirty(true);
  fillFilters();
  renderAll();
};
$('#duplicate-event').onclick = () => { const id = $('#event-original-id').value; $('#event-editor').close(); openEvent(id, 'duplicate'); };

// Editor de señales
$('#close-signal-editor').onclick = $('#cancel-signal-editor').onclick = () => { closeContextHelp(false); $('#signal-editor').close(); };
$('#add-location').onclick = () => addLocationRow();
$('#signal-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const index = Number($('#signal-index').value);
  const value = { id: slug($('#sig-id').value || $('#sig-title').value), fecha: $('#sig-date').value, titulo: $('#sig-title').value.trim(), tipo: normalizeCharacterization($('#sig-type').value), descripcion: $('#sig-description').value.trim(), estado_revision: $('#sig-status').value, origen: $('#sig-origin').value, fuente_ids: selectedCheckboxValues('#sig-source-options'), intensidad: $('#sig-intensity').value === '' ? null : Number($('#sig-intensity').value), localizaciones: gatherLocations() };
  if (S.eventDraft.senales.some((item, itemIndex) => item.id === value.id && itemIndex !== index)) return message(`Ya existe la señal ${value.id}.`, 'error');
  if (index >= 0) {
    const oldId = S.eventDraft.senales[index].id;
    S.eventDraft.senales[index] = value;
    if (oldId !== value.id) (S.eventDraft.advertencias || []).forEach((warning) => {
      if (!(warning.signal_ids || []).includes(oldId)) return;
      const timestamp = warningNow();
      warning.signal_ids = warning.signal_ids.map((id) => id === oldId ? value.id : id);
      warning.actualizada_el = timestamp;
      warning.historial = [...(warning.historial || []), warningHistoryEntry(warning, 'vinculos_actualizados', `Se actualizó el vínculo de señal ${oldId} → ${value.id}.`, WARNING_EDITOR_ACTOR, timestamp)];
    });
  } else S.eventDraft.senales.push(value);
  $('#signal-editor').close();
  renderSignalCards();
  markEventDraftChanged();
});

// Editor de fuentes
$('#close-source-editor').onclick = $('#cancel-source-editor').onclick = () => { closeContextHelp(false); $('#source-editor').close(); };
$('#src-catalog-search').addEventListener('input', () => fillCatalogOptions($('#src-catalog-search').value, ''));
$('#src-url').addEventListener('input', updateSourceUrlActions);
$('#src-language').addEventListener('blur', () => { $('#src-language').value = normalizeLanguageCode($('#src-language').value); });
$('#src-type').addEventListener('blur', () => { $('#src-type').value = normalizeCharacterization($('#src-type').value); });
$('#open-source-url').addEventListener('click', () => { const url = validSourceUrl(); if (url) window.open(url, '_blank', 'noopener,noreferrer'); });
$('#copy-source-url').addEventListener('click', async () => { const url = validSourceUrl(); if (!url) return; await copyText(url); message('URL copiada.'); });
$('#src-media-id').addEventListener('change', () => {
  const media = mediaById($('#src-media-id').value);
  if (media) $('#src-medium').value = media.nombre;
  renderCatalogPreview($('#src-media-id').value);
});
$('#open-catalog-entry').onclick = openCatalogEntry;
$('#close-catalog-entry').onclick = $('#cancel-catalog-entry').onclick = () => $('#catalog-entry-editor').close('cancel');
['#cat-name', '#cat-url'].forEach((selector) => $(selector).addEventListener('input', updateCatalogDuplicateWarning));
$('#generate-catalog-research').onclick = generateCatalogResearch;
$('#copy-catalog-research').onclick = async () => {
  const prompt = $('#catalog-research-prompt').value;
  if (!prompt) return;
  try {
    await copyText(prompt);
    message('Encargo de catalogación copiado.');
  } catch (error) {
    message(`No se pudo copiar: ${error.message}`, 'error');
  }
};
$('#apply-catalog-research').onclick = applyCatalogResearch;
$('#catalog-entry-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await createCatalogEntry();
  } catch (error) {
    message(error.message, 'error', true);
  }
});
$('#source-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const index = Number($('#source-index').value);
  const mediaId = $('#src-media-id').value;
  const value = { id: slug($('#src-id').value || $('#src-title').value), media_id: mediaId, medio_catalogado: Boolean(mediaId), medio: $('#src-medium').value.trim(), titulo: $('#src-title').value.trim(), fecha: $('#src-date').value, idioma: normalizeLanguageCode($('#src-language').value), tipo: normalizeCharacterization($('#src-type').value), url: $('#src-url').value.trim(), estado_verificacion: $('#src-status').value, observaciones: $('#src-notes').value.trim(), revisada_el: $('#src-reviewed').value };
  if (S.eventDraft.fuentes.some((item, itemIndex) => item.id === value.id && itemIndex !== index)) return message(`Ya existe la fuente ${value.id}.`, 'error');
  if (index >= 0) {
    const oldId = S.eventDraft.fuentes[index].id;
    S.eventDraft.fuentes[index] = value;
    if (oldId !== value.id) {
      S.eventDraft.senales.forEach((signal) => { signal.fuente_ids = signal.fuente_ids.map((id) => id === oldId ? value.id : id); });
      (S.eventDraft.advertencias || []).forEach((warning) => {
        const linked = (warning.fuente_ids || []).includes(oldId)
          || (warning.resuelta_con_fuente_ids || []).includes(oldId)
          || (warning.resolucion?.fuente_ids || []).includes(oldId);
        if (!linked) return;
        const timestamp = warningNow();
        warning.fuente_ids = (warning.fuente_ids || []).map((id) => id === oldId ? value.id : id);
        warning.resuelta_con_fuente_ids = (warning.resuelta_con_fuente_ids || []).map((id) => id === oldId ? value.id : id);
        if (warning.resolucion) warning.resolucion.fuente_ids = (warning.resolucion.fuente_ids || []).map((id) => id === oldId ? value.id : id);
        warning.actualizada_el = timestamp;
        warning.historial = [...(warning.historial || []), warningHistoryEntry(warning, 'vinculos_actualizados', `Se actualizó el vínculo de fuente ${oldId} → ${value.id}.`, WARNING_EDITOR_ACTOR, timestamp)];
      });
    }
  } else S.eventDraft.fuentes.push(value);
  $('#source-editor').close();
  renderSourceCards();
  renderSignalCards();
  markEventDraftChanged();
});

// Editor de advertencias
$('#close-warning-editor').onclick = $('#cancel-warning-editor').onclick = () => { closeContextHelp(false); $('#warning-editor').close(); };
$('#warning-state').addEventListener('change', updateWarningResolutionFields);
$('#warning-treatment').addEventListener('change', updateWarningEditorRule);
$('#warning-type').addEventListener('input', updateWarningTypeSuggestion);
$('#apply-warning-type-defaults').onclick = applyWarningTypeSuggestion;
$('#warning-resolution-type').addEventListener('change', updateWarningResolutionFields);
$('#warning-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const index = Number($('#warning-index').value);
  if ($('#warning-state').value === 'resuelta' && $('#warning-resolution-type').value === 'evidencia'
    && !checkedWarningValues('#warning-resolution-source-options').length) {
    $('#warning-editor-status').textContent = 'Seleccioná al menos una fuente para resolver por evidencia.';
    $('#warning-resolution-source-options input')?.focus();
    return;
  }
  const value = gatherWarning();
  if (S.eventDraft.advertencias.some((item, itemIndex) => item.advertencia_id === value.advertencia_id && itemIndex !== index)) {
    $('#warning-editor-status').textContent = `Ya existe ${value.advertencia_id}.`;
    $('#warning-id').focus();
    return;
  }
  if (index >= 0) S.eventDraft.advertencias[index] = value;
  else S.eventDraft.advertencias.push(value);
  S.warningSelectedId = value.advertencia_id;
  $('#warning-editor').close();
  activateEventRecordTab('warnings');
  renderWarningCards();
  markEventDraftChanged();
});

// Encargos editoriales (el esquema conserva la clave histórica expedientes_editoriales)
$('#close-expedient-editor').onclick = $('#cancel-expedient-editor').onclick = () => { closeContextHelp(false); $('#expedient-editor').close(); };
['#x-doc-type', '#x-uncertainties'].forEach((selector) => $(selector).addEventListener(selector === '#x-uncertainties' ? 'input' : 'change', () => { if (S.expDraft) { syncExpDraftFromForm(true); updateExpDiversity(); } }));
$('#generate-research-plan').onclick = () => generateResearchPlan();
$('#generate-draft-prompt').onclick = () => generateDraftPrompt();
$('#copy-prompt').onclick = async () => {
  const content = $('#prompt-preview').value;
  if (!content) return message('Primero generá un encargo de investigación o de redacción.', 'warning');
  try {
    await copyText(content);
    setPromptLocalStatus('Encargo copiado.', 'El contenido está en el portapapeles. No se creó un artículo final.', 'success');
    updatePromptEditorialStateNote();
    message('Encargo copiado al portapapeles.');
  } catch (error) {
    setPromptLocalStatus('No se pudo copiar.', error.message || 'El navegador bloqueó el portapapeles.', 'error');
    message('No se pudo copiar el encargo.', 'error');
  }
};
$('#download-prompt').onclick = () => {
  const content = $('#prompt-preview').value;
  if (!content) return message('Primero generá un encargo de investigación o de redacción.', 'warning');
  const exp = gatherExpedient();
  const fallback = suggestedPromptFilename(S.currentPromptMode || 'research', exp);
  const filename = normalizeMarkdownFilename($('#prompt-filename').value, fallback);
  $('#prompt-filename').value = filename;
  S.currentPromptFilename = filename;
  downloadText(filename, content);
  setPromptLocalStatus('Encargo descargado.', `Archivo: ${filename}. Contiene instrucciones para ChatGPT, no el artículo final.`, 'success');
  $('#prompt-state-suggestion').hidden = false;
  updatePromptEditorialStateNote();
  message(`Archivo descargado como: ${filename}`);
};
$('#mark-prompt-exported').onclick = () => {
  $('#x-editor-status').value = 'prompt_exportado';
  S.expDraft.estado = 'prompt_exportado';
  $('#prompt-state-suggestion').hidden = true;
  setPromptLocalStatus('Estado preparado para aplicar.', 'El encargo se marcará como “Encargo exportado” solo cuando pulses Aplicar encargo; luego deberás Guardar para persistirlo.', 'warning');
  updatePromptEditorialStateNote();
};
$('#x-editor-status').addEventListener('change', updatePromptEditorialStateNote);
$('#expedient-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = gatherExpedient();
  const originalId = $('#exp-original-id').value;
  if (S.data.expedientes_editoriales.some((item) => item.id === value.id && item.id !== originalId)) return message(`Ya existe el encargo editorial ${value.id}.`, 'error');
  if (['listo_para_prompt', 'prompt_exportado'].includes(value.estado)) {
    const problems = validatePromptExp(value);
    if (problems.length) return message(problems[0], 'error');
  }
  if (originalId) {
    const index = S.data.expedientes_editoriales.findIndex((item) => item.id === originalId);
    S.data.expedientes_editoriales[index] = value;
  } else S.data.expedientes_editoriales.push(value);
  $('#expedient-editor').close();
  dirty(true);
  fillFilters();
  renderAll();
});
$('#delete-expedient').onclick = () => {
  const id = $('#exp-original-id').value;
  const item = expById(id);
  if (!item || !confirm(`¿Eliminar el encargo editorial “${item.titulo_trabajo}”?`)) return;
  S.data.expedientes_editoriales = S.data.expedientes_editoriales.filter((exp) => exp.id !== id);
  $('#expedient-editor').close();
  dirty(true);
  fillFilters();
  renderAll();
};
$('#duplicate-expedient').onclick = () => {
  const original = gatherExpedient();
  const existing = new Set(S.data.expedientes_editoriales.map((item) => item.id));
  S.expDraft = { ...deep(original), id: uniqueId(`${original.id}-copia`, existing), titulo_trabajo: `${original.titulo_trabajo} (copia)`, estado: 'borrador', creado: today(), actualizado: today() };
  $('#exp-original-id').value = '';
  $('#x-id').value = S.expDraft.id;
  $('#x-title').value = S.expDraft.titulo_trabajo;
  $('#x-editor-status').value = 'borrador';
  $('#delete-expedient').hidden = true;
  $('#duplicate-expedient').hidden = true;
  resetPromptOutput();
  message('Copia preparada. Aplicá el encargo para incorporarla.');
};

initContextHelp();
setupDialogDismissal();
syncNavigationMode();

document.addEventListener('keydown', (event) => {
  if (!navigationIsOpen()) return;
  const openDialog = $$('dialog[open]').at(-1);
  if (event.key === 'Escape' && !openDialog) {
    event.preventDefault();
    closeNavigation();
    return;
  }
  if (event.key !== 'Tab' || openDialog) return;
  const focusable = $$('button:not([disabled])', $('#sidebar')).filter((node) => node.offsetParent !== null);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

// Estado del servidor local. La pestaña conserva los cambios aunque Node se detenga.
setInterval(checkHealth, 10000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkHealth(); });

bootstrap().then(checkHealth).catch((error) => {
  console.error(error);
  document.body.innerHTML = `<main class="fatal"><h1>No se pudo iniciar el Observatorio</h1><p>${esc(error.message)}</p></main>`;
});
