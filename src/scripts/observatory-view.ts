import {
  browserStorageDefinitions, getViewPreference, saveViewPreference,
  updateViewPreference, clearViewPreference,
} from '../../tools/lib/browser-storage-policy.mjs';

const results = document.querySelector<HTMLElement>('[data-process-results]');
const remember = document.querySelector<HTMLInputElement>('[data-remember-view]');
const status = document.querySelector<HTMLElement>('[data-view-preference-status]');
const buttons = [...document.querySelectorAll<HTMLButtonElement>('button[data-view]')];
const preference = browserStorageDefinitions[0];

if (results && remember && status) {
  let currentView: 'list' | 'cards' = 'list';
  let persistenceRevoked = false;
  let expiryTimer: number | undefined;
  const applyView = (view: 'list' | 'cards') => {
    currentView = view;
    results.setAttribute('data-view', view);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
  };
  const showPreference = (restoreView = false) => {
    window.clearTimeout(expiryTimer);
    const state = getViewPreference();
    remember.checked = state.status === 'stored' && !persistenceRevoked;
    if (restoreView) applyView(remember.checked ? state.value! : 'list');
    if (state.status === 'stored' && !persistenceRevoked) {
      const date = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(state.expiresAt);
      status.textContent = `Vista guardada hasta el ${date}. Puede dejar de recordarse desmarcando la casilla.`;
      // Browser timers have a maximum delay. Recheck long-lived tabs without extending consent.
      expiryTimer = window.setTimeout(() => showPreference(), Math.min(Math.max(state.expiresAt - Date.now(), 1), 2_147_483_647));
    } else if (state.status === 'stored' && persistenceRevoked) {
      status.textContent = 'Esta visita no guardará cambios de vista. No se pudo borrar la preferencia anterior; puede eliminarse desde la configuración de datos del sitio en el navegador.';
    } else if (state.status === 'unavailable') {
      status.textContent = 'El navegador no permite guardar la preferencia. La vista puede cambiarse durante esta visita.';
    } else if (state.status === 'expired') {
      status.textContent = 'La preferencia ha vencido. Para volver a guardarla es necesario marcar la casilla.';
    } else {
      status.textContent = 'La vista no se guarda para próximas visitas.';
    }
  };
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (view !== 'list' && view !== 'cards') return;
      applyView(view);
      if (!remember.checked) return;
      const saved = updateViewPreference(view);
      showPreference();
      if (!saved && remember.checked) {
        status.textContent = 'La vista ha cambiado, pero no se pudo actualizar la preferencia guardada.';
      }
    });
  }
  remember.addEventListener('change', () => {
    const enabled = remember.checked;
    if (enabled) {
      if (saveViewPreference(currentView)) { persistenceRevoked = false; showPreference(); }
      else {
        remember.checked = false;
        status.textContent = 'No se pudo guardar la preferencia. La vista sigue disponible durante esta visita.';
      }
    } else {
      persistenceRevoked = true;
      window.clearTimeout(expiryTimer);
      if (clearViewPreference()) {
        status.textContent = 'Preferencia eliminada. La vista actual se mantiene; al recargar o volver al Observatorio se utilizará Lista.';
      } else {
        status.textContent = 'No se pudo borrar la preferencia. Puede eliminarse desde la configuración de datos del sitio en el navegador.';
      }
    }
  });
  window.addEventListener('storage', event => {
    if (event.key === preference.key || event.key === null) showPreference();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) showPreference(true); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) showPreference(); });
  showPreference(true);
  remember.disabled = false;
}
