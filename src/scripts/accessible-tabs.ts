type TabsOptions = {
  tablist: HTMLElement | null;
  onActivate?: (id: string, tab: HTMLButtonElement) => void;
};

/** Each tab points to one named panel. Arrow keys activate; Tab leaves the tablist. */
export function mountAccessibleTabs({ tablist, onActivate }: TabsOptions) {
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const syncOrientation = () => {
    if (tabs.length < 2) return;
    const first = tabs[0].getBoundingClientRect();
    const second = tabs[1].getBoundingClientRect();
    const horizontal = Math.abs(second.left - first.left);
    const vertical = Math.abs(second.top - first.top);
    // Derive the axis from rendered positions, so CSS owns responsive breakpoints.
    if (horizontal || vertical) tablist.setAttribute('aria-orientation', horizontal > vertical ? 'horizontal' : 'vertical');
  };
  const activate = (tab: HTMLButtonElement, updateUrl = false) => {
    for (const candidate of tabs) {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(candidate.getAttribute('aria-controls') || '');
      if (panel) panel.hidden = !selected;
    }
    const id = tab.dataset.tab || '';
    onActivate?.(id, tab);
    if (updateUrl && window.location.hash !== `#${id}`) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    }
  };
  const restore = () => {
    const id = window.location.hash.slice(1);
    const requested = tabs.find(tab => tab.dataset.tab === id);
    if (requested || tabs[0]) activate(requested || tabs[0]);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab, true));
    tab.addEventListener('keydown', (event) => {
      syncOrientation();
      const vertical = tablist.getAttribute('aria-orientation') === 'vertical';
      const forward = vertical ? 'ArrowDown' : 'ArrowRight';
      const backward = vertical ? 'ArrowUp' : 'ArrowLeft';
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : event.key === forward ? (index + 1) % tabs.length
          : event.key === backward ? (index - 1 + tabs.length) % tabs.length : -1;
      if (next < 0) return;
      event.preventDefault();
      tabs[next].focus();
      activate(tabs[next], true);
    });
  });
  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', restore);
  window.addEventListener('resize', syncOrientation);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncOrientation).observe(tablist);
  syncOrientation();
  restore();
}
