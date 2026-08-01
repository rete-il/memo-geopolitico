const app = {
  workflow: null,
  state: null,
  savedSnapshot: '',
  backups: [],
  currentView: 'overview',
  editingId: null,
  filters: { search: '', type: '', status: '' },
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const main = $('#main');
const message = $('#message');
const saveState = $('#save-state');
const stageDialog = $('#stage-dialog');
const documentDialog = $('#document-dialog');
const confirmDialog = $('#confirm-dialog');

const clone = (value) => JSON.parse(JSON.stringify(value));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[char]);
const slugify = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const statusLabels = () => Object.fromEntries(app.workflow.status_options.map((item) => [item.id, item.label]));
const typeLabels = () => Object.fromEntries(app.workflow.document_types.map((item) => [item.id, item.label]));
const phaseMap = () => Object.fromEntries(app.workflow.phases.map((item) => [item.id, item]));

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = `message is-visible${error ? ' is-error' : ''}`;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => { message.className = 'message'; message.textContent = ''; }, 4200);
}

function serialize() { return JSON.stringify(app.state); }
function setDirty() {
  const dirty = serialize() !== app.savedSnapshot;
  saveState.textContent = dirty ? 'Cambios sin guardar' : 'Sin cambios';
  saveState.classList.toggle('is-dirty', dirty);
  return dirty;
}

function progressFor(doc) {
  const applicable = app.workflow.stages.filter((stage) => doc.stages[stage.id]?.status !== 'not_applicable');
  const done = applicable.filter((stage) => doc.stages[stage.id]?.status === 'done').length;
  return applicable.length ? Math.round((done / applicable.length) * 100) : 0;
}

function currentStage(doc) {
  return app.workflow.stages.find((stage) => ['in_progress', 'blocked'].includes(doc.stages[stage.id]?.status))
    || app.workflow.stages.find((stage) => !['done', 'not_applicable'].includes(doc.stages[stage.id]?.status))
    || app.workflow.stages.at(-1);
}

function docOverallStatus(doc) {
  const values = Object.values(doc.stages).map((step) => step.status);
  if (values.includes('blocked')) return 'blocked';
  if (doc.stages.final_md?.status === 'done') return 'done';
  if (values.includes('in_progress')) return 'in_progress';
  return 'not_started';
}

function statusBadge(status) {
  return `<span class="status-badge status-badge--${escapeHtml(status)}">${escapeHtml(statusLabels()[status] || status)}</span>`;
}

function metric(label, value, note) {
  return `<article class="panel metric-card"><div class="metric-card__label">${escapeHtml(label)}</div><div class="metric-card__value">${escapeHtml(value)}</div><div class="metric-card__note">${escapeHtml(note)}</div></article>`;
}

function renderOverview() {
  const docs = app.state.documents;
  const ready = docs.filter((doc) => doc.stages.final_md?.status === 'done').length;
  const blocked = docs.filter((doc) => Object.values(doc.stages).some((step) => step.status === 'blocked')).length;
  const inReview = docs.filter((doc) => ['draft', 'review'].some((id) => ['in_progress', 'done'].includes(doc.stages[id]?.status)) && doc.stages.final_md?.status !== 'done').length;
  const avg = docs.length ? Math.round(docs.reduce((sum, doc) => sum + progressFor(doc), 0) / docs.length) : 0;
  main.innerHTML = `
    <section class="metric-grid">
      ${metric('Documentos', docs.length, 'Piezas en seguimiento')}
      ${metric('Etapas', app.workflow.stages.length, 'Hasta el Markdown definitivo')}
      ${metric('Progreso medio', `${avg}%`, 'Sobre etapas aplicables')}
      ${metric('En revisión', inReview, 'Borrador o revisión editorial')}
      ${metric('Bloqueados', blocked, ready ? `${ready} definitivos` : 'Sin definitivos todavía')}
    </section>
    <section class="overview-grid">
      <article class="panel card">
        <div class="section-heading"><div><h2>Documentos activos</h2><p>Estado de los casos piloto y nuevas piezas.</p></div><button class="button button--primary button--small" id="new-doc-overview">Nuevo documento</button></div>
        <div class="document-list">
          ${docs.length ? docs.map((doc) => {
            const progress = progressFor(doc);
            const stage = currentStage(doc);
            return `<div class="document-row"><div><div class="document-row__title">${escapeHtml(doc.title)}</div><div class="document-row__meta">${escapeHtml(typeLabels()[doc.document_type])} · Etapa ${stage.number}: ${escapeHtml(stage.title)}</div></div><div><div class="progress"><span style="width:${progress}%"></span></div><div class="progress-label">${progress}% completado</div></div><button class="button button--ghost button--small edit-document" data-id="${escapeHtml(doc.id)}">Abrir</button></div>`;
          }).join('') : '<div class="empty-state">Todavía no hay documentos.</div>'}
        </div>
      </article>
      <aside class="panel card">
        <div class="section-heading"><div><h2>Fases del flujo</h2><p>Cuatro bloques, trece etapas.</p></div></div>
        <div class="phase-summary">${app.workflow.phases.map((phase) => `<div class="phase-summary__item"><strong>${phase.number}. ${escapeHtml(phase.title)}</strong><span>${escapeHtml(phase.purpose)}</span></div>`).join('')}</div>
      </aside>
    </section>`;
  $('#new-doc-overview')?.addEventListener('click', () => openDocumentEditor());
  $$('.edit-document', main).forEach((button) => button.addEventListener('click', () => openDocumentEditor(button.dataset.id)));
}

function selectedFlowDocument() {
  const id = $('#flow-document-select')?.value;
  return app.state.documents.find((doc) => doc.id === id) || app.state.documents[0] || null;
}

function renderFlow() {
  const docOptions = app.state.documents.map((doc) => `<option value="${escapeHtml(doc.id)}">${escapeHtml(doc.title)}</option>`).join('');
  main.innerHTML = `
    <div class="flow-toolbar">
      <div class="flow-legend">${app.workflow.status_options.map((item) => statusBadge(item.id)).join('')}</div>
      <label class="field"><span class="sr-only">Documento</span><select id="flow-document-select"><option value="">Vista del proceso</option>${docOptions}</select></label>
    </div>
    <div id="flow-content"></div>`;
  $('#flow-document-select').addEventListener('change', renderFlowContent);
  renderFlowContent();
}

function renderFlowContent() {
  const doc = selectedFlowDocument();
  const phases = phaseMap();
  $('#flow-content').innerHTML = `<div class="flow-container">${app.workflow.phases.map((phase) => {
    const stages = app.workflow.stages.filter((stage) => stage.phase === phase.id);
    return `<section class="phase-block"><header class="phase-header"><strong>${phase.number}. ${escapeHtml(phase.title)}</strong><span>${escapeHtml(phase.purpose)}</span></header><div class="stage-row" style="--count:${stages.length}">${stages.map((stage) => {
      const status = doc ? doc.stages[stage.id]?.status || 'not_started' : 'not_started';
      return `<button class="stage-card" data-stage="${escapeHtml(stage.id)}"><span class="stage-card__number">${stage.number}</span><h3>${escapeHtml(stage.title)}</h3><p>${escapeHtml(stage.summary)}</p><div class="stage-card__output">Salida: ${escapeHtml(stage.outputs.join('; '))}</div><span class="gate-mark">◆ Puerta de control</span><div style="margin-top:10px">${doc ? statusBadge(status) : `<span class="chip">${escapeHtml(phases[stage.phase].title)}</span>`}</div></button>`;
    }).join('')}</div></section>`;
  }).join('')}</div>`;
  $$('.stage-card', $('#flow-content')).forEach((button) => button.addEventListener('click', () => openStage(button.dataset.stage, doc)));
}

function openStage(stageId, doc = null) {
  const stage = app.workflow.stages.find((item) => item.id === stageId);
  const phase = phaseMap()[stage.phase];
  $('#stage-phase').textContent = `${phase.number}. ${phase.title}`;
  $('#stage-title').textContent = `${stage.number}. ${stage.title}`;
  const docStep = doc?.stages[stage.id];
  $('#stage-body').innerHTML = `
    <p>${escapeHtml(stage.summary)}</p>
    ${doc ? `<p><strong>Documento:</strong> ${escapeHtml(doc.title)} · ${statusBadge(docStep.status)}</p>` : ''}
    <div class="detail-grid">
      <section class="detail-block"><h3>Entradas</h3><ul>${stage.inputs.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></section>
      <section class="detail-block"><h3>Acciones</h3><ul>${stage.actions.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></section>
      <section class="detail-block"><h3>Salidas</h3><ul>${stage.outputs.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></section>
      <section class="detail-block"><h3>Responsable</h3><p>${escapeHtml(stage.responsible)}</p><p><strong>Artefacto:</strong> ${escapeHtml(stage.artifact)}</p></section>
    </div>
    <div class="gate-box"><strong>Puerta de control</strong><p>${escapeHtml(stage.gate)}</p></div>
    ${docStep ? `<div class="detail-grid" style="margin-top:14px"><section class="detail-block"><h3>Nota actual</h3><p>${escapeHtml(docStep.note || '—')}</p></section><section class="detail-block"><h3>Artefacto registrado</h3><p>${escapeHtml(docStep.artifact || '—')}</p></section></div>` : ''}`;
  stageDialog.showModal();
}

function renderDocuments() {
  const types = app.workflow.document_types.map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
  const statuses = app.workflow.status_options.filter((item) => item.id !== 'not_applicable').map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('');
  main.innerHTML = `
    <section class="panel filter-bar">
      <label class="field"><span>Buscar</span><input id="doc-search" type="search" placeholder="Título, slug o macroevento" value="${escapeHtml(app.filters.search)}"></label>
      <label class="field"><span>Tipo</span><select id="doc-type"><option value="">Todos</option>${types}</select></label>
      <label class="field"><span>Estado</span><select id="doc-status"><option value="">Todos</option>${statuses}</select></label>
      <button class="button button--primary" id="new-document">Nuevo documento</button>
    </section>
    <section class="panel table-wrap"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Etapa actual</th><th>Progreso</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="documents-body"></tbody></table><div id="documents-empty" class="empty-state" hidden>No hay documentos para los filtros seleccionados.</div></section>`;
  $('#doc-type').value = app.filters.type;
  $('#doc-status').value = app.filters.status;
  const update = () => {
    app.filters.search = $('#doc-search').value;
    app.filters.type = $('#doc-type').value;
    app.filters.status = $('#doc-status').value;
    renderDocumentRows();
  };
  $('#doc-search').addEventListener('input', update);
  $('#doc-type').addEventListener('change', update);
  $('#doc-status').addEventListener('change', update);
  $('#new-document').addEventListener('click', () => openDocumentEditor());
  renderDocumentRows();
}

function renderDocumentRows() {
  const query = app.filters.search.toLowerCase().trim();
  const rows = app.state.documents.filter((doc) => {
    if (query && ![doc.title, doc.slug, ...(doc.source_macroevents || [])].join(' ').toLowerCase().includes(query)) return false;
    if (app.filters.type && doc.document_type !== app.filters.type) return false;
    if (app.filters.status && docOverallStatus(doc) !== app.filters.status) return false;
    return true;
  });
  $('#documents-body').innerHTML = rows.map((doc) => {
    const stage = currentStage(doc);
    const progress = progressFor(doc);
    const status = docOverallStatus(doc);
    return `<tr><td><div class="table-title">${escapeHtml(doc.title)}</div><div class="document-row__meta">${escapeHtml(doc.slug)} · ${(doc.source_macroevents || []).map(escapeHtml).join(', ')}</div></td><td>${escapeHtml(typeLabels()[doc.document_type])}</td><td>${stage.number}. ${escapeHtml(stage.title)}</td><td><div class="progress"><span style="width:${progress}%"></span></div><div class="progress-label">${progress}%</div></td><td>${statusBadge(status)}</td><td><button class="button button--ghost button--small edit-document" data-id="${escapeHtml(doc.id)}">Editar</button></td></tr>`;
  }).join('');
  $('#documents-empty').hidden = rows.length > 0;
  $$('.edit-document', $('#documents-body')).forEach((button) => button.addEventListener('click', () => openDocumentEditor(button.dataset.id)));
}

function blankStages() {
  return Object.fromEntries(app.workflow.stages.map((stage) => [stage.id, { status: 'not_started', note: '', artifact: '' }]));
}

function openDocumentEditor(id = null) {
  app.editingId = id;
  const doc = id ? clone(app.state.documents.find((item) => item.id === id)) : {
    id: '', title: '', slug: '', document_type: 'movimiento', source_macroevents: [], owner: 'Editor', priority: 'media', notes: '', stages: blankStages()
  };
  $('#document-dialog-title').textContent = id ? 'Editar documento' : 'Nuevo documento';
  $('#delete-document').hidden = !id;
  $('#document-form-body').innerHTML = `
    <div class="document-form-grid">
      <section>
        <div class="detail-grid">
          <label class="field"><span>Título</span><input name="title" required value="${escapeHtml(doc.title)}"></label>
          <label class="field"><span>ID</span><input name="id" required pattern="[a-z0-9-]+" value="${escapeHtml(doc.id)}" ${id ? 'readonly' : ''}></label>
          <label class="field"><span>Slug</span><input name="slug" value="${escapeHtml(doc.slug)}"></label>
          <label class="field"><span>Tipo documental</span><select name="document_type">${app.workflow.document_types.map((item) => `<option value="${item.id}" ${item.id === doc.document_type ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select></label>
          <label class="field"><span>Macroeventos de origen</span><input name="source_macroevents" value="${escapeHtml((doc.source_macroevents || []).join(', '))}" placeholder="id-uno, id-dos"></label>
          <label class="field"><span>Prioridad</span><select name="priority">${['baja','media','alta'].map((value) => `<option value="${value}" ${value === doc.priority ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
        </div>
        <label class="field" style="margin-top:12px"><span>Notas generales</span><textarea name="notes">${escapeHtml(doc.notes)}</textarea></label>
      </section>
      <aside class="detail-block"><h3>Uso de esta ficha</h3><p>Registra el avance de una pieza desde la propuesta hasta el archivo Markdown definitivo. “Aplicar cambios” modifica la sesión; “Guardar” escribe el JSON local y crea un backup.</p></aside>
    </div>
    <div class="stage-editor-list">${app.workflow.stages.map((stage) => {
      const step = doc.stages[stage.id] || { status: 'not_started', note: '', artifact: '' };
      return `<section class="stage-editor" data-stage="${stage.id}"><div class="stage-editor__head"><span class="stage-editor__number">${stage.number}</span><strong>${escapeHtml(stage.title)}</strong><select name="status-${stage.id}">${app.workflow.status_options.map((item) => `<option value="${item.id}" ${item.id === step.status ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select></div><div class="stage-editor__fields"><label class="field"><span>Nota</span><textarea name="note-${stage.id}">${escapeHtml(step.note)}</textarea></label><label class="field"><span>Artefacto o ruta</span><textarea name="artifact-${stage.id}">${escapeHtml(step.artifact)}</textarea></label></div></section>`;
    }).join('')}</div>`;
  const titleInput = $('[name="title"]', documentDialog);
  const idInput = $('[name="id"]', documentDialog);
  const slugInput = $('[name="slug"]', documentDialog);
  if (!id) titleInput.addEventListener('input', () => { if (!idInput.dataset.edited) idInput.value = `doc-${slugify(titleInput.value)}`; if (!slugInput.dataset.edited) slugInput.value = slugify(titleInput.value); });
  idInput.addEventListener('input', () => { idInput.dataset.edited = 'true'; });
  slugInput.addEventListener('input', () => { slugInput.dataset.edited = 'true'; });
  documentDialog.showModal();
}

$('#document-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const id = String(form.get('id')).trim();
  if (!app.editingId && app.state.documents.some((doc) => doc.id === id)) return showMessage('Ya existe un documento con ese ID.', true);
  const next = {
    id,
    title: String(form.get('title')).trim(),
    slug: String(form.get('slug')).trim(),
    document_type: String(form.get('document_type')),
    source_macroevents: String(form.get('source_macroevents')).split(',').map((x) => x.trim()).filter(Boolean),
    owner: 'Editor',
    priority: String(form.get('priority')),
    notes: String(form.get('notes')).trim(),
    stages: {}
  };
  app.workflow.stages.forEach((stage) => {
    next.stages[stage.id] = {
      status: String(form.get(`status-${stage.id}`)),
      note: String(form.get(`note-${stage.id}`)).trim(),
      artifact: String(form.get(`artifact-${stage.id}`)).trim()
    };
  });
  if (app.editingId) {
    const index = app.state.documents.findIndex((doc) => doc.id === app.editingId);
    app.state.documents[index] = next;
  } else app.state.documents.push(next);
  documentDialog.close();
  setDirty();
  renderCurrentView();
});

$('#delete-document').addEventListener('click', () => {
  if (!app.editingId) return;
  const doc = app.state.documents.find((item) => item.id === app.editingId);
  confirmAction('Eliminar documento', `Se eliminará “${doc.title}” del estado de trabajo. La eliminación no será permanente hasta pulsar Guardar.`, () => {
    app.state.documents = app.state.documents.filter((item) => item.id !== app.editingId);
    documentDialog.close();
    setDirty();
    renderCurrentView();
  });
});

function confirmAction(title, text, action) {
  $('#confirm-title').textContent = title;
  $('#confirm-text').textContent = text;
  const button = $('#confirm-action');
  const handler = (event) => { event.preventDefault(); button.removeEventListener('click', handler); confirmDialog.close(); action(); };
  button.addEventListener('click', handler);
  confirmDialog.showModal();
}

function renderData() {
  main.innerHTML = `
    <section class="data-grid">
      <article class="panel action-card"><h2>Exportaciones</h2><p>Descargá el estado de seguimiento o una documentación Markdown que incluye el diagrama Mermaid, las trece etapas y el estado de cada documento.</p><div style="display:flex;gap:9px;flex-wrap:wrap"><a class="button button--primary" href="/api/export">Exportar JSON</a><a class="button button--ghost" href="/api/export-markdown">Exportar FLUJO_EDITORIAL.md</a></div></article>
      <article class="panel action-card"><h2>Validación</h2><p>Comprueba IDs, tipos documentales, etapas y estados antes de guardar.</p><button class="button button--ghost" id="validate-button">Validar estado actual</button><div id="validation-output" style="margin-top:12px"></div></article>
    </section>
    <section class="panel action-card" style="margin-top:16px"><div class="section-heading"><div><h2>Backups</h2><p>Se conserva una copia previa a cada guardado o restauración.</p></div><button class="button button--ghost button--small" id="refresh-backups">Actualizar</button></div><div class="backup-list" id="backup-list"></div></section>`;
  $('#validate-button').addEventListener('click', validateCurrent);
  $('#refresh-backups').addEventListener('click', loadBackups);
  renderBackups();
}

async function validateCurrent() {
  try {
    const response = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(app.state) });
    const result = await response.json();
    const target = $('#validation-output');
    target.innerHTML = result.valid ? '<span class="status-badge status-badge--done">Estado válido</span>' : `<div class="gate-box"><strong>Errores</strong><ul>${result.errors.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`;
  } catch (error) { showMessage(error.message, true); }
}

async function loadBackups() {
  try {
    const response = await fetch('/api/backups');
    const payload = await response.json();
    app.backups = payload.backups || [];
    renderBackups();
  } catch (error) { showMessage(error.message, true); }
}

function renderBackups() {
  const target = $('#backup-list');
  if (!target) return;
  target.innerHTML = app.backups.length ? app.backups.map((backup) => `<div class="backup-row"><div><strong>${escapeHtml(backup.name)}</strong><small>${new Date(backup.modified_at).toLocaleString('es')} · ${(backup.size / 1024).toFixed(1)} KB</small></div><button class="button button--ghost button--small restore-backup" data-name="${escapeHtml(backup.name)}">Restaurar</button></div>`).join('') : '<div class="empty-state">Todavía no existen backups.</div>';
  $$('.restore-backup', target).forEach((button) => button.addEventListener('click', () => confirmAction('Restaurar backup', `Se reemplazará el estado actual por ${button.dataset.name}. Antes se creará una copia del estado vigente.`, () => restoreBackup(button.dataset.name))));
}

async function restoreBackup(name) {
  try {
    const response = await fetch('/api/restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || payload.errors?.join(' ') || 'No se pudo restaurar.');
    app.state = payload.state;
    app.backups = payload.backups;
    app.savedSnapshot = serialize();
    setDirty();
    renderCurrentView();
    showMessage('Backup restaurado.');
  } catch (error) { showMessage(error.message, true); }
}

function renderCurrentView() {
  const titles = { overview: 'Resumen', flow: 'Flujo completo', documents: 'Documentos', data: 'Datos y exportación' };
  $('#view-title').textContent = titles[app.currentView];
  $$('.nav-item').forEach((button) => button.classList.toggle('is-active', button.dataset.view === app.currentView));
  ({ overview: renderOverview, flow: renderFlow, documents: renderDocuments, data: renderData })[app.currentView]();
  main.focus({ preventScroll: true });
}

async function save() {
  try {
    const response = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(app.state) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.errors?.join(' ') || payload.error || 'No se pudo guardar.');
    app.state.updated_at = payload.updated_at;
    app.backups = payload.backups;
    app.savedSnapshot = serialize();
    setDirty();
    showMessage('Cambios guardados y backup creado.');
    if (app.currentView === 'data') renderData();
  } catch (error) { showMessage(error.message, true); }
}

async function bootstrap() {
  const response = await fetch('/api/bootstrap');
  if (!response.ok) throw new Error('No se pudo cargar el dashboard.');
  const payload = await response.json();
  app.workflow = payload.workflow;
  app.state = payload.state;
  app.backups = payload.backups || [];
  app.savedSnapshot = serialize();
  setDirty();
  renderCurrentView();
}

$$('.nav-item').forEach((button) => button.addEventListener('click', () => {
  app.currentView = button.dataset.view;
  renderCurrentView();
  $('#sidebar').classList.remove('is-open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
}));
$('#menu-button').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('is-open');
  $('#menu-button').setAttribute('aria-expanded', String(open));
});
$('#save-button').addEventListener('click', save);
$('#reload-button').addEventListener('click', () => {
  if (setDirty()) return confirmAction('Recargar datos', 'Se descartarán los cambios sin guardar de esta sesión.', () => location.reload());
  location.reload();
});
window.addEventListener('beforeunload', (event) => { if (setDirty()) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') $('#sidebar').classList.remove('is-open'); });

bootstrap().catch((error) => { main.innerHTML = `<div class="panel card"><h2>Error</h2><p>${escapeHtml(error.message)}</p></div>`; });
