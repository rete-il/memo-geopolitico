import { normalizeSearchText } from '../../tools/lib/search-policy.mjs';
import { filterValue, mountUrlFilters } from './url-filters';
import { mountAccessibleTabs } from './accessible-tabs';
const title = document.querySelector<HTMLElement>('[data-dashboard-title]');

mountAccessibleTabs({
  tablist: document.querySelector('[data-dashboard-tabs]'),
  onActivate: (_id, tab) => { if (title) title.textContent = tab.textContent?.trim() || ''; },
});

const form = document.querySelector<HTMLFormElement>('[data-dashboard-filters]');
const processRows = [
  ...document.querySelectorAll<HTMLElement>('[data-dashboard-process]'),
];
const searchIndex = new Map(processRows.map((row) => [row, normalizeSearchText(row.dataset.search)]));
const resultsCount = document.querySelector<HTMLElement>(
  '[data-dashboard-results-count]',
);
const emptyState = document.querySelector<HTMLElement>(
  '[data-dashboard-filter-empty]',
);

const readValue = (name: string) => filterValue(form, name);

function applyFilters() {
  const query = normalizeSearchText(readValue('q'));
  const state = readValue('state');
  const region = readValue('region');
  const theme = readValue('theme');
  let visible = 0;

  for (const row of processRows) {
    const matches =
      (!query || searchIndex.get(row)?.includes(query)) &&
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

mountUrlFilters({
  form, names: ['q', 'state', 'region', 'theme'], apply: applyFilters, anchor: '#procesos',
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-matrix-group]')) {
  const group = document.getElementById(button.dataset.matrixGroup || '') as HTMLDetailsElement | null;
  button.addEventListener('click', () => {
    if (!group) return;
    group.open = true;
    group.querySelector('summary')?.focus();
    group.scrollIntoView({ block: 'nearest' });
  });
  group?.addEventListener('toggle', () => button.setAttribute('aria-expanded', String(group.open)));
}

export {};
