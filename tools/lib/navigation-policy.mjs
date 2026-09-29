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
