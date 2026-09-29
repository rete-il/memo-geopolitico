type FilterOptions = {
  form: HTMLFormElement | null;
  names: string[];
  apply: () => void;
  anchor?: string;
};

export function filterValue(form: HTMLFormElement | null, name: string) {
  const field = form?.elements.namedItem(name);
  return field instanceof HTMLInputElement || field instanceof HTMLSelectElement
    ? field.value.trim() : '';
}

/** URL state is shared by filters: Enter never submits a new page; Back restores it. */
export function mountUrlFilters({ form, names, apply, anchor }: FilterOptions) {
  if (!form) return;
  let editing: EventTarget | null = null;
  const restore = () => {
    editing = null;
    const params = new URLSearchParams(window.location.search);
    for (const name of names) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = params.get(name) || '';
      }
    }
    apply();
  };
  const update = (replace = false) => {
    apply();
    const params = new URLSearchParams(window.location.search);
    for (const name of names) {
      const value = filterValue(form, name);
      if (value) params.set(name, value);
      else params.delete(name);
    }
    const next = `${window.location.pathname}${params.size ? `?${params}` : ''}${anchor || window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history[replace ? 'replaceState' : 'pushState'](null, '', next);
  };
  form.addEventListener('input', (event) => {
    const typing = event.target instanceof HTMLInputElement;
    update(typing && editing === event.target);
    editing = typing ? event.target : null;
  });
  form.addEventListener('change', () => { update(); editing = null; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    update();
    editing = null;
  });
  form.addEventListener('reset', () => {
    window.setTimeout(() => { update(); editing = null; }, 0);
  });
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  restore();
}
