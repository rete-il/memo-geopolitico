const form = document.querySelector<HTMLFormElement>(
  '[data-observatory-filters]',
);
const results = document.querySelector<HTMLElement>('[data-process-results]');
const cards = [
  ...document.querySelectorAll<HTMLElement>('[data-process-card]'),
];
const count = document.querySelector<HTMLElement>('[data-results-count]');
const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
const viewButtons = [
  ...document.querySelectorAll<HTMLButtonElement>('[data-view]'),
];

const readValue = (name: string) => {
  const element = form?.elements.namedItem(name);
  return element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement
    ? element.value.trim()
    : '';
};

const setValue = (name: string, value: string) => {
  const element = form?.elements.namedItem(name);
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement
  ) {
    element.value = value;
  }
};

function applyFilters(updateUrl = true) {
  const query = readValue('q').toLowerCase();
  const region = readValue('region');
  const theme = readValue('theme');
  const actor = readValue('actor');
  const editorial = readValue('editorial');
  const tracking = readValue('tracking');
  const relevance = Number(readValue('relevance') || 0);
  const attention = Number(readValue('attention') || 0);

  let visible = 0;
  for (const card of cards) {
    const matches =
      (!query || card.dataset.search?.includes(query)) &&
      (!region || card.dataset.region?.split(' ').includes(region)) &&
      (!theme || card.dataset.theme?.split(' ').includes(theme)) &&
      (!actor || card.dataset.actor?.split(' ').includes(actor)) &&
      (!editorial ||
        (editorial === 'en_curso'
          ? card.dataset.editorialState !== 'publicado'
          : card.dataset.editorialState === editorial)) &&
      (!tracking || card.dataset.trackingState === tracking) &&
      (!relevance || Number(card.dataset.relevance) >= relevance) &&
      (!attention || Number(card.dataset.attention) <= attention);
    card.hidden = !matches;
    if (matches) visible += 1;
  }

  if (count)
    count.textContent = `${visible} ${visible === 1 ? 'proceso' : 'procesos'}`;
  if (empty) empty.hidden = visible !== 0;

  if (updateUrl) {
    const params = new URLSearchParams();
    for (const name of [
      'q',
      'region',
      'theme',
      'actor',
      'editorial',
      'tracking',
      'relevance',
      'attention',
    ]) {
      const value = readValue(name);
      if (value) params.set(name, value);
    }
    const url = `${window.location.pathname}${params.size ? `?${params}` : ''}#explorar`;
    history.replaceState(null, '', url);
  }
}

if (form) {
  const params = new URLSearchParams(window.location.search);
  for (const name of [
    'q',
    'region',
    'theme',
    'actor',
    'editorial',
    'tracking',
    'relevance',
    'attention',
  ]) {
    const value = params.get(name);
    if (value) setValue(name, value);
  }
  applyFilters(false);
  form.addEventListener('input', () => applyFilters());
  form.addEventListener('change', () => applyFilters());
  form.addEventListener('reset', () => {
    window.setTimeout(() => applyFilters(), 0);
  });
}

for (const button of viewButtons) {
  button.addEventListener('click', () => {
    const view = button.dataset.view || 'list';
    results?.setAttribute('data-view', view);
    for (const item of viewButtons) {
      item.setAttribute('aria-pressed', String(item === button));
    }
    localStorage.setItem('memo-observatory-view', view);
  });
}

const preferredView = localStorage.getItem('memo-observatory-view');
if (preferredView && ['list', 'cards'].includes(preferredView)) {
  viewButtons.find((button) => button.dataset.view === preferredView)?.click();
}

export {};
