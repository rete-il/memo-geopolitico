import { normalizeSearchText } from '../../tools/lib/search-policy.mjs';
import { filterValue, mountUrlFilters } from './url-filters';

const form = document.querySelector<HTMLFormElement>('[data-media-filters]');
const rows = [...document.querySelectorAll<HTMLTableRowElement>('[data-media-row]')];
const searchIndex = new Map(rows.map((row) => [row, normalizeSearchText(row.dataset.search)]));
const count = document.querySelector<HTMLElement>('[data-media-count]');

const value = (name: string) => filterValue(form, name);

function apply() {
  const query = normalizeSearchText(value('q'));
  const region = value('region');
  const fn = value('function');
  const perspective = value('perspective');
  let visible = 0;

  for (const row of rows) {
    const matches =
      (!query || searchIndex.get(row)?.includes(query)) &&
      (!region || row.dataset.region === region) &&
      (!fn || row.dataset.function === fn) &&
      (!perspective || row.dataset.perspective === perspective);
    row.hidden = !matches;
    if (matches) visible += 1;
  }

  if (count) count.textContent = `${visible} ${visible === 1 ? 'medio' : 'medios'}`;
}

mountUrlFilters({ form, names: ['q', 'region', 'function', 'perspective'], apply });

export {};
