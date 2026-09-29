/** @typedef {'list' | 'cards'} ObservatoryView */
/**
 * @typedef {{
 *   getItem: (key: string) => string | null,
 *   setItem: (key: string, value: string) => void,
 *   removeItem: (key: string) => void
 * }} BrowserStorage
 */
/** @typedef {{ version: 2, consent: true, view: ObservatoryView, activatedAt: number, expiresAt: number }} ViewPreferenceRecord */
/** @typedef {{ status: 'stored', value: ObservatoryView, expiresAt: number } | { status: 'empty' | 'expired' | 'unavailable', value: null }} ViewPreferenceState */

export const browserStorageDefinitions = [
  {
    id: 'observatoryView',
    key: 'memo-observatory-view',
    label: 'Vista del Observatorio',
    purpose: 'Recordar la presentación elegida: lista o tarjetas, solo al activar «Recordar esta vista en este navegador».',
    technology: 'Almacenamiento local del navegador',
    retention: 'Seis meses desde que se activa «Recordar esta vista en este navegador», sin renovar el plazo al cambiar de vista. Puede borrarse antes al desmarcar la casilla, usar el control de esta página o borrar los datos del sitio en el navegador. Al vencer, deja de aplicarse y se elimina cuando se vuelve a acceder a la preferencia.',
    values: ['list', 'cards'],
    defaultValue: 'list',
  },
];

const viewDefinition = browserStorageDefinitions[0];

/** @param {BrowserStorage | null | undefined} storage */
function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** @param {unknown} view @returns {view is ObservatoryView} */
function isView(view) {
  return view === 'list' || view === 'cards';
}

/** @param {unknown} timestamp @returns {timestamp is number} */
function isTimestamp(timestamp) {
  return typeof timestamp === 'number'
    && Number.isSafeInteger(timestamp)
    && Number.isFinite(new Date(timestamp).getTime());
}

/** Six calendar months in UTC, preserving the time and clamping the day. @param {number} activatedAt */
function expirationFrom(activatedAt) {
  const expiry = new Date(activatedAt);
  const day = expiry.getUTCDate();
  expiry.setUTCDate(1);
  expiry.setUTCMonth(expiry.getUTCMonth() + 6);
  const lastDay = new Date(expiry.getTime());
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  expiry.setUTCDate(Math.min(day, lastDay.getUTCDate()));
  return expiry.getTime();
}

/** @param {unknown} record @returns {record is ViewPreferenceRecord} */
function isRecord(record) {
  if (!record || typeof record !== 'object') return false;
  const candidate = /** @type {Partial<ViewPreferenceRecord>} */ (record);
  return candidate.version === 2
    && candidate.consent === true
    && isView(candidate.view)
    && isTimestamp(candidate.activatedAt)
    && isTimestamp(candidate.expiresAt)
    && candidate.expiresAt > candidate.activatedAt
    && candidate.expiresAt === expirationFrom(candidate.activatedAt);
}

/**
 * @param {BrowserStorage | null} storage
 * @param {number} now
 * @returns {{ status: 'stored', record: ViewPreferenceRecord } | { status: 'empty' | 'expired' | 'unavailable', record: null }}
 */
function readRecord(storage, now) {
  if (!storage || !isTimestamp(now)) return { status: 'unavailable', record: null };
  try {
    const raw = storage.getItem(viewDefinition.key);
    if (raw === null) return { status: 'empty', record: null };
    let record;
    try {
      record = JSON.parse(raw);
    } catch {
      record = null;
    }
    if (!isRecord(record)) {
      // Legacy strings do not represent an explicit opt-in.
      storage.removeItem(viewDefinition.key);
      return { status: 'empty', record: null };
    }
    if (now >= record.expiresAt) {
      storage.removeItem(viewDefinition.key);
      return { status: 'expired', record: null };
    }
    return { status: 'stored', record };
  } catch {
    return { status: 'unavailable', record: null };
  }
}

/**
 * Restores only an explicit, unexpired choice; removes legacy, invalid or expired data.
 * @param {BrowserStorage | null} [storage]
 * @param {number} [now] Unix timestamp in milliseconds.
 * @returns {ViewPreferenceState}
 */
export function getViewPreference(storage, now = Date.now()) {
  const state = readRecord(resolveStorage(storage), now);
  return state.status === 'stored'
    ? { status: 'stored', value: state.record.view, expiresAt: state.record.expiresAt }
    : { status: state.status, value: null };
}

/**
 * Explicit opt-in only: starts a new six-month period for the current view.
 * @param {string} view
 * @param {BrowserStorage | null} [storage]
 * @param {number} [now] Unix timestamp in milliseconds.
 * @returns {boolean}
 */
export function saveViewPreference(view, storage, now = Date.now()) {
  if (!isView(view) || !isTimestamp(now)) return false;
  const expiresAt = expirationFrom(now);
  if (!isTimestamp(expiresAt) || expiresAt <= now) return false;
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(viewDefinition.key, JSON.stringify({
      version: 2,
      consent: true,
      view,
      activatedAt: now,
      expiresAt,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Changes a still-valid remembered view without starting or extending consent.
 * Re-reads storage so a revoked or expired choice cannot be restored by a stale tab.
 * @param {string} view
 * @param {BrowserStorage | null} [storage]
 * @param {number} [now] Unix timestamp in milliseconds.
 * @returns {boolean}
 */
export function updateViewPreference(view, storage, now = Date.now()) {
  if (!isView(view)) return false;
  const target = resolveStorage(storage);
  const state = readRecord(target, now);
  if (!target || state.status !== 'stored') return false;
  try {
    target.setItem(viewDefinition.key, JSON.stringify({ ...state.record, view }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes only the preference owned by this feature, not other site data.
 * @param {BrowserStorage | null} [storage]
 * @returns {boolean}
 */
export function clearViewPreference(storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(viewDefinition.key);
    return true;
  } catch {
    return false;
  }
}
