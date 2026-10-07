const SITE = 'https://memogeopolitico.com';

/** Compare destinations without erasing meaningful anchors or query parameters. */
export function destinationKey(href) {
  const url = new URL(href, SITE);
  if (url.origin !== SITE) return url.href;
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  return pathname + url.search + url.hash;
}

/** @template {{href: string}} T
 * @param {T[]} items
 * @param {string} currentHref
 * @returns {T[]}
 */
export function uniqueDestinations(items, currentHref = '') {
  const seen = new Set(currentHref ? [destinationKey(currentHref)] : []);
  return items.filter(item => {
    const key = destinationKey(item.href);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Select the most specific visible section, respecting path segment boundaries.
 * @template {{href: string}} T
 * @param {T[]} items
 * @param {string} currentHref
 * @returns {T | undefined}
 */
export function selectActiveNavigationItem(items, currentHref) {
  const currentUrl = new URL(currentHref, SITE);
  if (currentUrl.origin !== SITE) return undefined;
  const pathname = currentUrl.pathname.replace(/\/+$/, '') || '/';
  let activeItem;
  let activePathLength = -1;

  for (const item of items) {
    const url = new URL(item.href, SITE);
    if (url.origin !== SITE) continue;
    const sectionPath = url.pathname.replace(/\/+$/, '') || '/';
    const matches = sectionPath === '/'
      ? pathname === '/'
      : pathname === sectionPath || pathname.startsWith(`${sectionPath}/`);

    if (matches && sectionPath.length > activePathLength) {
      activeItem = item;
      activePathLength = sectionPath.length;
    }
  }

  return activeItem;
}

export function evidenceHref(slug, section = 'cronologia') {
  return `/observatorio/${slug}/#${section}`;
}

export function signalHref(slug, signalId) {
  return evidenceHref(slug, signalId);
}

export function sameText(a, b) {
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
  return normalize(a) === normalize(b);
}
