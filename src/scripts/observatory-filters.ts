import { normalizeSearchText } from '../../tools/lib/search-policy.mjs';
import { filterValue, mountUrlFilters } from './url-filters';

const form = document.querySelector<HTMLFormElement>(
  '[data-observatory-filters]',
);
const cards = [
  ...document.querySelectorAll<HTMLElement>('[data-process-card]'),
];
const searchIndex = new Map(cards.map((card) => [card, normalizeSearchText(card.dataset.search)]));
const count = document.querySelector<HTMLElement>('[data-results-count]');
const empty = document.querySelector<HTMLElement>('[data-filter-empty]');

const readValue = (name: string) => filterValue(form, name);

function applyFilters() {
  const query = normalizeSearchText(readValue('q'));
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
      (!query || searchIndex.get(card)?.includes(query)) &&
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

}

mountUrlFilters({
  form,
  names: ['q', 'region', 'theme', 'actor', 'editorial', 'tracking', 'relevance', 'attention'],
  apply: applyFilters,
  anchor: '#explorar',
});

export {};
