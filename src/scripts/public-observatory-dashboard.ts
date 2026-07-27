const dashboard = document.querySelector<HTMLElement>(
  '[data-public-dashboard]',
);
const navButtons = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-dashboard-nav]'),
];
const views = [
  ...document.querySelectorAll<HTMLElement>('[data-dashboard-view]'),
];
const title = document.querySelector<HTMLElement>('[data-dashboard-title]');

const viewTitles: Record<string, string> = {
  panorama: 'Panorama',
  procesos: 'Procesos',
  matriz: 'Matriz',
  senales: 'Señales',
  fuentes: 'Fuentes',
  expedientes: 'Expedientes',
  taxonomia: 'Taxonomía',
};

function showView(viewName: string, updateHash = true) {
  if (!viewTitles[viewName]) return;

  for (const view of views) {
    view.hidden = view.dataset.dashboardView !== viewName;
  }
  for (const button of navButtons) {
    button.setAttribute(
      'aria-selected',
      String(button.dataset.dashboardNav === viewName),
    );
  }
  if (title) title.textContent = viewTitles[viewName];

  if (updateHash) {
    history.replaceState(null, '', `${window.location.pathname}#${viewName}`);
  }
  dashboard?.scrollIntoView({ block: 'start' });
}

for (const button of navButtons) {
  button.addEventListener('click', () => {
    showView(button.dataset.dashboardNav || 'panorama');
  });
}

const requestedView = window.location.hash.replace('#', '');
if (requestedView && viewTitles[requestedView]) {
  showView(requestedView, false);
}

const form = document.querySelector<HTMLFormElement>('[data-dashboard-filters]');
const processRows = [
  ...document.querySelectorAll<HTMLElement>('[data-dashboard-process]'),
];
const resultsCount = document.querySelector<HTMLElement>(
  '[data-dashboard-results-count]',
);
const emptyState = document.querySelector<HTMLElement>(
  '[data-dashboard-filter-empty]',
);

const readValue = (name: string) => {
  const element = form?.elements.namedItem(name);
  return element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement
    ? element.value.trim()
    : '';
};

function applyFilters() {
  const query = readValue('q').toLowerCase();
  const state = readValue('state');
  const region = readValue('region');
  const theme = readValue('theme');
  let visible = 0;

  for (const row of processRows) {
    const matches =
      (!query || row.dataset.search?.includes(query)) &&
      (!state || row.dataset.state === state) &&
      (!region || row.dataset.region?.split(' ').includes(region)) &&
      (!theme || row.dataset.theme?.split(' ').includes(theme));

    row.hidden = !matches;
    if (matches) visible += 1;
  }

  if (resultsCount) {
    resultsCount.textContent = `${visible} ${
      visible === 1 ? 'proceso' : 'procesos'
    }`;
  }
  if (emptyState) emptyState.hidden = visible !== 0;
}

if (form) {
  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  form.addEventListener('reset', () => window.setTimeout(applyFilters, 0));
}

export {};
