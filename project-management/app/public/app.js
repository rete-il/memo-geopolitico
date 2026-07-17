const STATUS_LABELS = {
  proposed: 'Propuesta', ready: 'Lista', in_progress: 'En progreso', blocked: 'Bloqueada',
  review: 'En revisión', done: 'Terminada', deferred: 'Postergada'
};

const app = {
  state: null,
  view: 'overview',
  editingItemId: null,
  filters: { search: '', status: '', release: '', priority: '' }
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
const lines = value => String(value || '').split(/\r?\n/).map(v => v.trim()).filter(Boolean);

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Error ${response.status}`);
    error.data = data;
    throw error;
  }
  return data;
}

function showMessage(text, type = 'success') {
  const box = $('#global-message');
  box.textContent = text;
  box.className = `message is-${type}`;
  box.hidden = false;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => { box.hidden = true; }, 5000);
}

function setLoading(button, loading, label = 'Procesando…') {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

async function loadState(message = '') {
  app.state = await api('/api/state');
  renderAll();
  if (message) showMessage(message);
}

function progressValue(item) {
  if (item.status === 'done') return 100;
  if (item.status === 'review') return Number.isFinite(item.progress) ? item.progress : 90;
  if (item.status === 'in_progress') return Number.isFinite(item.progress) ? item.progress : 25;
  return 0;
}

function statusBadge(status) {
  return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(STATUS_LABELS[status] || status)}</span>`;
}

function priorityBadge(priority) {
  return `<span class="priority-badge priority-${escapeHtml(priority)}">${escapeHtml(priority)}</span>`;
}

function renderSummary() {
  const { summary } = app.state;
  const cards = [
    ['Avance general', `${summary.overallProgress}%`, `${summary.total} work items`],
    ['En progreso', summary.counts.in_progress || 0, `${summary.counts.review || 0} en revisión`],
    ['Bloqueadas', summary.blocked, summary.blocked ? 'Requieren atención' : 'Sin bloqueos'],
    ['P0 abiertas', summary.p0Open, 'Prioridad crítica'],
    ['Terminadas', summary.counts.done || 0, `${Math.round(((summary.counts.done || 0) / Math.max(1, summary.total)) * 100)}% del total`]
  ];
  $('#summary-cards').innerHTML = cards.map(([label, value, detail]) => `<article class="summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`).join('');
}

function renderOverview() {
  renderSummary();
  const current = app.state.releases.find(r => r.id === app.state.project.currentRelease);
  $('#current-release-title').textContent = current?.name || app.state.project.currentRelease;
  $('#current-release-progress').textContent = `${current?.progress || 0}%`;
  $('#current-release-bar').style.width = `${current?.progress || 0}%`;
  $('#current-release-goal').textContent = current?.goal || '';

  const git = app.state.git;
  $('#git-summary').innerHTML = [
    ['Rama actual', git.branch], ['Rama esperada', app.state.project.workingBranch],
    ['Último commit', git.lastCommit || '—'], ['Cambios locales', git.status ? `${git.status.split('\n').length} archivo(s)` : 'Ninguno']
  ].map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('');
  const branchBadge = $('#branch-badge');
  branchBadge.textContent = `Rama: ${git.branch}`;
  branchBadge.className = `branch-badge ${git.branch === app.state.project.workingBranch ? 'is-correct' : 'is-warning'}`;

  const active = app.state.items.filter(i => ['in_progress', 'review', 'blocked'].includes(i.status)).slice(0, 8);
  $('#active-items').innerHTML = active.length ? active.map(item => `<button class="task-row" data-edit-item="${escapeHtml(item.id)}"><strong>${escapeHtml(item.id)}</strong><span class="task-title">${escapeHtml(item.title)}</span>${statusBadge(item.status)}<span>${progressValue(item)}%</span></button>`).join('') : '<div class="empty-state">No hay tareas activas.</div>';

  const validation = app.state.validation;
  $('#quality-summary').innerHTML = `<div class="issue-summary">
    <div class="issue-summary-item"><span>Errores</span><strong class="${validation.errors.length ? 'is-error' : 'is-ok'}">${validation.errors.length}</strong></div>
    <div class="issue-summary-item"><span>Advertencias</span><strong class="${validation.warnings.length ? 'is-warning' : 'is-ok'}">${validation.warnings.length}</strong></div>
    <div class="issue-summary-item"><span>Estado</span><strong class="${validation.valid ? 'is-ok' : 'is-error'}">${validation.valid ? 'Válido' : 'Requiere corrección'}</strong></div>
  </div>`;

  $('#release-progress-list').innerHTML = app.state.releases.filter(r => r.id !== 'future').map(release => `<div class="release-progress-row"><span>${escapeHtml(release.name)}</span><div class="progress-track"><span style="width:${release.progress}%"></span></div><strong>${release.progress}%</strong></div>`).join('');
}

function populateFilters() {
  const statusSelect = $('#filter-status');
  const currentStatus = statusSelect.value;
  statusSelect.innerHTML = '<option value="">Todos</option>' + app.state.project.statusVocabulary.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(STATUS_LABELS[s] || s)}</option>`).join('');
  statusSelect.value = currentStatus || app.filters.status;
  const releaseSelect = $('#filter-release');
  const currentRelease = releaseSelect.value;
  releaseSelect.innerHTML = '<option value="">Todas</option>' + app.state.releases.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}</option>`).join('');
  releaseSelect.value = currentRelease || app.filters.release;
}

function filteredItems() {
  const query = app.filters.search.trim().toLowerCase();
  return app.state.items.filter(item => {
    const haystack = [item.id, item.title, item.epic, item.owner, item.type].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) &&
      (!app.filters.status || app.filters.status.split(',').includes(item.status)) &&
      (!app.filters.release || item.release === app.filters.release) &&
      (!app.filters.priority || item.priority === app.filters.priority);
  }).sort((a, b) => a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id));
}

function renderItems() {
  populateFilters();
  const items = filteredItems();
  $('#items-count').textContent = `${items.length} de ${app.state.items.length} tareas`;
  $('#items-empty').hidden = items.length > 0;
  $('#items-table-body').innerHTML = items.map(item => {
    const release = app.state.releases.find(r => r.id === item.release);
    const progress = progressValue(item);
    return `<tr data-edit-item="${escapeHtml(item.id)}">
      <td><strong>${escapeHtml(item.id)}</strong></td>
      <td class="item-title-cell"><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.epic)} · ${escapeHtml(item.type)}</small></td>
      <td>${escapeHtml(release?.name.replace(/^Beta \d+ — /, '') || item.release)}</td>
      <td>${priorityBadge(item.priority)}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${escapeHtml(item.owner)}</td>
      <td><div class="mini-progress"><div class="progress-track"><span style="width:${progress}%"></span></div><span>${progress}%</span></div></td>
    </tr>`;
  }).join('');
}

function renderReleases() {
  $('#release-cards').innerHTML = app.state.releases.map(release => `<article class="release-card panel ${release.id === app.state.project.currentRelease ? 'is-current' : ''}">
    <div class="release-card-top"><div><p class="eyebrow">${release.id === app.state.project.currentRelease ? 'RELEASE ACTUAL' : `SECUENCIA ${release.sequence}`}</p><h3>${escapeHtml(release.name)}</h3></div><span class="metric-pill">${release.progress}%</span></div>
    <p>${escapeHtml(release.goal)}</p>
    <div class="progress-track"><span style="width:${release.progress}%"></span></div>
    <div class="release-meta"><span>${release.itemCount} tareas</span><span>Objetivo: ${escapeHtml(release.target)}</span></div>
    <ul class="criteria-list">${(release.exitCriteria || []).slice(0,4).map(c => `<li>${escapeHtml(c)}</li>`).join('') || '<li>Sin criterios comprometidos.</li>'}</ul>
    <div class="release-actions"><button class="button button-ghost" data-edit-release="${escapeHtml(release.id)}">Editar release</button></div>
  </article>`).join('');
}

function renderActivity() {
  $('#activity-date').value ||= new Date().toISOString().slice(0, 10);
  $('#activity-list').innerHTML = app.state.activity.length ? app.state.activity.map(entry => `<article class="activity-entry"><h4>${escapeHtml(entry.heading)}</h4><pre>${escapeHtml(entry.body)}</pre></article>`).join('') : '<div class="empty-state">No hay entradas registradas.</div>';
}

function renderValidation() {
  const validation = app.state.validation;
  $('#validation-summary').innerHTML = [
    ['Estado', validation.valid ? 'Válido' : 'Con errores', validation.valid ? 'Datos consistentes' : 'No regenerar hasta corregir'],
    ['Errores', validation.errors.length, 'Bloquean guardado'],
    ['Advertencias', validation.warnings.length, 'Revisión recomendada']
  ].map(([label, value, detail]) => `<article class="summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`).join('');
  $('#validation-errors').innerHTML = validation.errors.length ? validation.errors.map(v => `<li>${escapeHtml(v)}</li>`).join('') : '<li>Sin errores.</li>';
  $('#validation-warnings').innerHTML = validation.warnings.length ? validation.warnings.map(v => `<li>${escapeHtml(v)}</li>`).join('') : '<li>Sin advertencias.</li>';
}

function renderAll() {
  renderOverview();
  renderItems();
  renderReleases();
  renderActivity();
  renderValidation();
}

function setView(view) {
  app.view = view;
  $$('.view').forEach(section => section.classList.toggle('is-active', section.id === `view-${view}`));
  $$('.nav-item').forEach(button => button.classList.toggle('is-active', button.dataset.view === view));
  const titles = { overview: 'Resumen del proyecto', items: 'Work items', releases: 'Releases', activity: 'Actividad', validation: 'Validación' };
  $('#page-title').textContent = titles[view] || 'Project Dashboard';
  $('.sidebar').classList.remove('is-open');
  $('#mobile-nav-toggle').setAttribute('aria-expanded', 'false');
}

function openItemDialog(item = null) {
  app.editingItemId = item?.id || null;
  $('#item-dialog-title').textContent = item ? `Editar ${item.id}` : 'Nueva tarea';
  $('#item-id').value = item?.id || '';
  $('#item-id').readOnly = Boolean(item);
  $('#item-type').value = item?.type || 'PM';
  $('#item-title').value = item?.title || '';
  $('#item-epic').value = item?.epic || 'Gestión';
  $('#item-owner').value = item?.owner || 'TBD';
  $('#item-priority').value = item?.priority || 'P1';
  $('#item-size').value = item?.size || 'S';
  $('#item-status').innerHTML = app.state.project.statusVocabulary.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(STATUS_LABELS[s] || s)}</option>`).join('');
  $('#item-status').value = item?.status || 'proposed';
  $('#item-progress').value = item?.progress ?? '';
  $('#item-release').innerHTML = app.state.releases.map(r => `<option value="${escapeHtml(r.id)}">${escapeHtml(r.name)}</option>`).join('');
  $('#item-release').value = item?.release || app.state.project.currentRelease;
  $('#item-dependencies').value = (item?.dependencies || []).join(', ');
  $('#item-criteria').value = (item?.acceptanceCriteria || []).join('\n');
  $('#item-notes').value = item?.notes || '';
  $('#item-form-errors').hidden = true;
  updateProgressField();
  $('#item-dialog').showModal();
  $('#item-title').focus();
}

function updateProgressField() {
  const enabled = ['in_progress', 'review'].includes($('#item-status').value);
  $('#item-progress').disabled = !enabled;
  $('#item-progress').required = enabled;
  if (!enabled) $('#item-progress').value = '';
}

async function saveItem(event) {
  event.preventDefault();
  const submit = event.submitter;
  setLoading(submit, true, 'Guardando…');
  const payload = {
    id: $('#item-id').value,
    type: $('#item-type').value,
    title: $('#item-title').value,
    epic: $('#item-epic').value,
    owner: $('#item-owner').value,
    priority: $('#item-priority').value,
    size: $('#item-size').value,
    status: $('#item-status').value,
    progress: $('#item-progress').value,
    release: $('#item-release').value,
    dependencies: $('#item-dependencies').value.split(',').map(v => v.trim()).filter(Boolean),
    acceptanceCriteria: lines($('#item-criteria').value),
    notes: $('#item-notes').value
  };
  try {
    const result = app.editingItemId
      ? await api(`/api/work-items/${encodeURIComponent(app.editingItemId)}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await api('/api/work-items', { method: 'POST', body: JSON.stringify(payload) });
    app.state = result.state;
    $('#item-dialog').close();
    renderAll();
    showMessage(`${payload.id.toUpperCase()} guardada y paneles regenerados.`);
  } catch (error) {
    const details = error.data?.validation?.errors || [error.message];
    $('#item-form-errors').textContent = details.join('\n');
    $('#item-form-errors').hidden = false;
  } finally { setLoading(submit, false); }
}

function openReleaseDialog(id) {
  const release = app.state.releases.find(r => r.id === id);
  if (!release) return;
  $('#release-dialog-title').textContent = release.name;
  $('#release-id').value = release.id;
  $('#release-goal').value = release.goal || '';
  $('#release-target').value = release.target || '';
  $('#release-criteria').value = (release.exitCriteria || []).join('\n');
  $('#release-current').checked = release.id === app.state.project.currentRelease;
  $('#release-dialog').showModal();
}

async function saveRelease(event) {
  event.preventDefault();
  const submit = event.submitter;
  setLoading(submit, true, 'Guardando…');
  try {
    const result = await api(`/api/releases/${encodeURIComponent($('#release-id').value)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        goal: $('#release-goal').value,
        target: $('#release-target').value,
        exitCriteria: lines($('#release-criteria').value),
        makeCurrent: $('#release-current').checked
      })
    });
    app.state = result.state;
    $('#release-dialog').close();
    renderAll();
    showMessage('Release actualizada y paneles regenerados.');
  } catch (error) { showMessage(error.message, 'error'); }
  finally { setLoading(submit, false); }
}

async function saveActivity(event) {
  event.preventDefault();
  const submit = event.submitter;
  setLoading(submit, true, 'Guardando…');
  try {
    const result = await api('/api/progress', {
      method: 'POST',
      body: JSON.stringify({
        date: $('#activity-date').value,
        title: $('#activity-title').value,
        completed: lines($('#activity-completed').value),
        validation: lines($('#activity-validation').value),
        issues: lines($('#activity-issues').value),
        next: lines($('#activity-next').value)
      })
    });
    app.state = result.state;
    event.target.reset();
    $('#activity-date').value = new Date().toISOString().slice(0, 10);
    renderActivity();
    showMessage('Entrada incorporada a PROGRESS-LOG.md.');
  } catch (error) { showMessage(error.message, 'error'); }
  finally { setLoading(submit, false); }
}

async function regenerate(button = $('#regenerate-button')) {
  setLoading(button, true, 'Regenerando…');
  try {
    const result = await api('/api/regenerate', { method: 'POST', body: '{}' });
    app.state = result.state;
    renderAll();
    showMessage(result.output || 'Documentación regenerada.');
  } catch (error) {
    showMessage(error.message, 'error');
    if (error.data?.validation) {
      app.state.validation = error.data.validation;
      renderValidation();
      setView('validation');
    }
  } finally { setLoading(button, false); }
}

function bindEvents() {
  $('#main-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-view]');
    if (button) setView(button.dataset.view);
  });
  document.addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-item]');
    if (edit) openItemDialog(app.state.items.find(item => item.id === edit.dataset.editItem));
    const release = event.target.closest('[data-edit-release]');
    if (release) openReleaseDialog(release.dataset.editRelease);
    const go = event.target.closest('[data-go-view]');
    if (go) {
      if (go.dataset.filterStatus) {
        app.filters.status = go.dataset.filterStatus;
        $('#filter-status').value = app.filters.status.includes(',') ? '' : app.filters.status;
      }
      setView(go.dataset.goView);
      renderItems();
    }
  });
  $('#new-item-button').addEventListener('click', () => openItemDialog());
  $('#close-item-dialog').addEventListener('click', () => $('#item-dialog').close());
  $('#cancel-item-dialog').addEventListener('click', () => $('#item-dialog').close());
  $('#item-form').addEventListener('submit', saveItem);
  $('#item-status').addEventListener('change', updateProgressField);
  $('#close-release-dialog').addEventListener('click', () => $('#release-dialog').close());
  $('#cancel-release-dialog').addEventListener('click', () => $('#release-dialog').close());
  $('#release-form').addEventListener('submit', saveRelease);
  $('#activity-form').addEventListener('submit', saveActivity);
  $('#regenerate-button').addEventListener('click', () => regenerate());
  $('#validation-run-button').addEventListener('click', event => regenerate(event.currentTarget));
  $('#refresh-button').addEventListener('click', () => loadState('Datos recargados desde disco.'));
  $('#mobile-nav-toggle').addEventListener('click', event => {
    const open = !$('.sidebar').classList.contains('is-open');
    $('.sidebar').classList.toggle('is-open', open);
    event.currentTarget.setAttribute('aria-expanded', String(open));
  });
  const filterMap = { '#filter-search':'search', '#filter-status':'status', '#filter-release':'release', '#filter-priority':'priority' };
  Object.entries(filterMap).forEach(([selector, key]) => $(selector).addEventListener('input', event => { app.filters[key] = event.target.value; renderItems(); }));
  $('#clear-filters').addEventListener('click', () => {
    app.filters = { search:'', status:'', release:'', priority:'' };
    ['#filter-search','#filter-status','#filter-release','#filter-priority'].forEach(selector => { $(selector).value = ''; });
    renderItems();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('.sidebar').classList.contains('is-open')) {
      $('.sidebar').classList.remove('is-open');
      $('#mobile-nav-toggle').setAttribute('aria-expanded', 'false');
    }
  });
}

async function init() {
  bindEvents();
  try { await loadState(); }
  catch (error) {
    showMessage(`No se pudo cargar el proyecto: ${error.message}`, 'error');
    console.error(error);
  }
}

init();
