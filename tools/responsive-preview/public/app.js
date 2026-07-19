const SITE_ORIGIN = 'http://127.0.0.1:4321';

const routeForm = document.getElementById('route-form');
const routeSelect = document.getElementById('route-select');
const customRoute = document.getElementById('custom-route');
const reloadButton = document.getElementById('reload-all');
const openReal = document.getElementById('open-real');
const deviceCards = [...document.querySelectorAll('.device-card')];

let currentPath = '/';

function normalizePath(value) {
  let route = String(value || '/').trim();
  if (!route) return '/';

  try {
    const parsed = new URL(route, SITE_ORIGIN);
    route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    // Continúa con la normalización local.
  }

  if (!route.startsWith('/')) route = `/${route}`;
  return route;
}

function targetUrl(path) {
  return `${SITE_ORIGIN}${normalizePath(path)}`;
}

function loadRoute(path, { force = false } = {}) {
  currentPath = normalizePath(path);
  const url = targetUrl(currentPath);

  deviceCards.forEach((card) => {
    const iframe = card.querySelector('iframe');
    if (!iframe) return;
    iframe.src = force ? `${url}${url.includes('?') ? '&' : '?'}responsiveReload=${Date.now()}` : url;
  });

  openReal.href = url;
  window.history.replaceState(null, '', `/?route=${encodeURIComponent(currentPath)}`);
}

function updateCustomRouteVisibility() {
  const isCustom = routeSelect.value === 'custom';
  customRoute.hidden = !isCustom;
  if (isCustom) {
    customRoute.value = currentPath;
    customRoute.focus();
  }
}

function updateDeviceScale(card) {
  const shell = card.querySelector('.viewport-shell');
  const stage = card.querySelector('.viewport-stage');
  const iframe = card.querySelector('iframe');
  if (!shell || !stage || !iframe) return;

  const width = Number(card.dataset.width);
  const height = Number(card.dataset.height);
  const availableWidth = Math.max(shell.clientWidth - 20, 1);
  const scale = Math.min(1, availableWidth / width);

  stage.style.width = `${Math.round(width * scale)}px`;
  stage.style.height = `${Math.round(height * scale)}px`;
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.transform = `scale(${scale})`;

  const dimensions = card.querySelector('.device-card__header p');
  if (dimensions) {
    const prefix = card.dataset.device === 'tablet' ? 'iPad Air · ' : '';
    dimensions.textContent = `${prefix}${width} × ${height}`;
  }
}

function updateAllScales() {
  deviceCards.forEach(updateDeviceScale);
}

routeSelect.addEventListener('change', () => {
  updateCustomRouteVisibility();
  if (routeSelect.value !== 'custom') loadRoute(routeSelect.value);
});

routeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const path = routeSelect.value === 'custom' ? customRoute.value : routeSelect.value;
  loadRoute(path);
});

reloadButton.addEventListener('click', () => loadRoute(currentPath, { force: true }));

document.querySelectorAll('.rotate-button').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.device-card');
    if (!card) return;
    const previousWidth = card.dataset.width;
    card.dataset.width = card.dataset.height;
    card.dataset.height = previousWidth;
    updateDeviceScale(card);
  });
});

const resizeObserver = new ResizeObserver(updateAllScales);
deviceCards.forEach((card) => resizeObserver.observe(card));

const initialRoute = new URLSearchParams(window.location.search).get('route') || '/';
const knownOption = [...routeSelect.options].find((option) => option.value === initialRoute);
if (knownOption) routeSelect.value = initialRoute;
else {
  routeSelect.value = 'custom';
  customRoute.hidden = false;
  customRoute.value = initialRoute;
}

loadRoute(initialRoute);
requestAnimationFrame(updateAllScales);
window.addEventListener('resize', updateAllScales);
