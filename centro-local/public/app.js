const pageMeta = {
  inicio: { title: 'Inicio', eyebrow: 'Estado general' },
  observatorio: { title: 'Observatorio', eyebrow: 'Macroeventos y expedientes' },
  medios: { title: 'Medios', eyebrow: 'Catálogo de fuentes' },
  workflow: { title: 'Flujo editorial', eyebrow: 'Seguimiento de piezas' },
};

const elements = {
  body: document.body,
  menuButton: document.querySelector('#menu-button'),
  overlay: document.querySelector('#sidebar-overlay'),
  pageTitle: document.querySelector('#page-title'),
  pageEyebrow: document.querySelector('#page-eyebrow'),
  status: document.querySelector('#topbar-status'),
  workspace: document.querySelector('#workspace'),
};

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value ?? '—';
}

function setPill(id, ok, pending = false) {
  const pill = document.querySelector(`#pill-${id}`);
  if (!pill) return;
  pill.className = `pill ${pending ? 'is-pending' : ok ? 'is-ok' : 'is-error'}`;
  pill.textContent = pending ? 'Comprobando' : ok ? 'Disponible' : 'Revisar';
}

function setNavState(id, ok) {
  const state = document.querySelector(`#nav-state-${id}`);
  if (!state) return;
  state.className = `nav-state ${ok ? 'is-ok' : 'is-error'}`;
  state.setAttribute('aria-label', ok ? 'Disponible' : 'No disponible');
}

function closeNavigation({ restoreFocus = false } = {}) {
  elements.body.classList.remove('nav-open');
  elements.menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) elements.menuButton.focus();
}

function activateView(id, { updateHash = true } = {}) {
  const view = pageMeta[id] ? id : 'inicio';
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.panel === view);
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  const frame = document.querySelector(`[data-panel="${view}"] iframe`);
  if (frame && !frame.src) frame.src = frame.dataset.src;
  elements.pageTitle.textContent = pageMeta[view].title;
  elements.pageEyebrow.textContent = pageMeta[view].eyebrow;
  document.title = `${pageMeta[view].title} · Centro local · Memo Geopolítico`;
  closeNavigation();
  if (updateHash) history.replaceState(null, '', view === 'inicio' ? '#' : `#${view}`);
  elements.workspace.focus({ preventScroll: true });
}

function renderTopStatus(payload) {
  const moduleValues = Object.values(payload.modules || {});
  const modulesReady = moduleValues.length > 0 && moduleValues.every((item) => item.running);
  const dataReady = payload.data?.ok === true;
  const dot = elements.status.querySelector('.status-dot');
  const label = elements.status.querySelector('span:last-child');
  dot.className = `status-dot ${modulesReady && dataReady ? 'is-ok' : 'is-warning'}`;
  label.textContent = modulesReady && dataReady
    ? 'Centro preparado'
    : 'Hay elementos para revisar';
}

function renderStatus(payload) {
  renderTopStatus(payload);
  const modules = payload.modules || {};
  const data = payload.data || {};
  const versions = payload.versions || {};

  setText('#center-version-label', `Centro local v${versions.centro || payload.version || '—'}`);
  setText('#observatory-version-label', `Observatorio local v${versions.observatorio || '—'}`);

  const obsReady = Boolean(modules.observatorio?.running && data.observatorio?.ok);
  const mediaReady = Boolean(data.medios?.ok);
  const workflowReady = Boolean(modules.workflow?.running && data.workflow?.ok);
  setPill('observatorio', obsReady);
  setPill('medios', mediaReady);
  setPill('workflow', workflowReady);
  setNavState('observatorio', obsReady);
  setNavState('medios', mediaReady);
  setNavState('workflow', workflowReady);

  setText('#count-macroeventos', data.observatorio?.macroeventos);
  setText('#count-temas', data.observatorio?.temas);
  setText('#count-media-canonical', data.medios?.canonical);
  setText('#count-media-derived', data.medios?.derived);
  setText('#count-stages', data.workflow?.etapas);
  setText('#count-documents', data.workflow?.documentos);

  const mediaWarning = document.querySelector('#media-warning');
  if (data.medios?.warning) {
    mediaWarning.hidden = false;
    mediaWarning.textContent = data.medios.warning;
  } else {
    mediaWarning.hidden = true;
    mediaWarning.textContent = '';
  }
}

async function refreshStatus() {
  elements.status.querySelector('.status-dot').className = 'status-dot is-pending';
  elements.status.querySelector('span:last-child').textContent = 'Comprobando módulos';
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Estado HTTP ${response.status}`);
    renderStatus(await response.json());
  } catch (error) {
    elements.status.querySelector('.status-dot').className = 'status-dot is-error';
    elements.status.querySelector('span:last-child').textContent = 'No se pudo comprobar el Centro';
    ['observatorio', 'medios', 'workflow'].forEach((id) => setPill(id, false));
    console.error(error);
  }
}

async function retryModules() {
  const button = document.querySelector('#retry-modules');
  button.disabled = true;
  button.textContent = 'Iniciando…';
  try {
    await fetch('/api/modules/retry', { method: 'POST' });
    await refreshStatus();
  } finally {
    button.disabled = false;
    button.textContent = 'Reintentar inicio';
  }
}

elements.menuButton.addEventListener('click', () => {
  const opening = !elements.body.classList.contains('nav-open');
  elements.body.classList.toggle('nav-open', opening);
  elements.menuButton.setAttribute('aria-expanded', String(opening));
  if (opening) document.querySelector('[data-view].is-active')?.focus();
});
elements.overlay.addEventListener('click', () => closeNavigation({ restoreFocus: true }));
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => activateView(button.dataset.view));
});
document.querySelectorAll('[data-open-view]').forEach((button) => {
  button.addEventListener('click', () => activateView(button.dataset.openView));
});
document.querySelectorAll('[data-reload-frame]').forEach((button) => {
  button.addEventListener('click', () => {
    const frame = document.querySelector(`#${button.dataset.reloadFrame}`);
    if (frame?.src) frame.src = frame.src;
  });
});
document.querySelector('#refresh-status').addEventListener('click', refreshStatus);
document.querySelector('#retry-modules').addEventListener('click', retryModules);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && elements.body.classList.contains('nav-open')) {
    closeNavigation({ restoreFocus: true });
  }
});
window.addEventListener('hashchange', () => activateView(location.hash.slice(1) || 'inicio', { updateHash: false }));

activateView(location.hash.slice(1) || 'inicio', { updateHash: false });
refreshStatus();
