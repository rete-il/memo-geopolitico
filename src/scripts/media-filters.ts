const form = document.querySelector<HTMLFormElement>('[data-media-filters]');
const rows = [...document.querySelectorAll<HTMLTableRowElement>('[data-media-row]')];
const count = document.querySelector<HTMLElement>('[data-media-count]');

const value = (name: string) => {
  const element = form?.elements.namedItem(name);
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement
    ? element.value.trim()
    : '';
};

function apply() {
  const query = value('q').toLowerCase();
  const region = value('region');
  const fn = value('function');
  const perspective = value('perspective');
  let visible = 0;

  for (const row of rows) {
    const matches =
      (!query || row.dataset.search?.includes(query)) &&
      (!region || row.dataset.region === region) &&
      (!fn || row.dataset.function === fn) &&
      (!perspective || row.dataset.perspective === perspective);
    row.hidden = !matches;
    if (matches) visible += 1;
  }

  if (count) count.textContent = `${visible} ${visible === 1 ? 'medio' : 'medios'}`;
}

form?.addEventListener('input', apply);
form?.addEventListener('change', apply);

export {};
