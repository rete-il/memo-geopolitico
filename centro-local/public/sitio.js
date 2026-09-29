let state;
let validationSequence = 0;
let validationTimer;
let saving = false;
let dirty = false;
const form = document.querySelector('#settings');
const statusRegion = document.querySelector('#status');
const saveButton = document.querySelector('#save-settings');
const resetButton = document.querySelector('#discard-settings');
const labels = {domain:'Dominio de correo',provider:'Proveedor del boletín',signupUrl:'URL del formulario de alta y temas',preferencesUrl:'URL para preferencias y baja',privacyUrl:'URL de privacidad del proveedor',doubleOptInVerified:'Alta con confirmación y baja verificadas',enabledInDevelopment:'Visible en local',enabledInProduction:'Hacer público',kofiUrl:'Dirección de Ko-fi',showOnPublications:'Mostrar en publicaciones',showInFooter:'Mostrar en el pie'};

function message(text, error = false) {
  statusRegion.textContent = text;
  statusRegion.classList.toggle('status-error', error);
}
function input(parent, object, key, path, description = '', context = '') {
  const label = document.createElement('label');
  const field = document.createElement(key === 'retention' ? 'textarea' : 'input');
  if (key === 'retention') field.rows = 4;
  else field.type = typeof object[key] === 'boolean' ? 'checkbox' : key.endsWith('Email') ? 'email' : key.endsWith('Url') ? 'url' : 'text';
  if (field.type === 'checkbox') field.checked = object[key]; else field.value = object[key];
  field.dataset.path = [...path, key].join('.');
  const name = labels[key] || key;
  if (context) field.setAttribute('aria-label', `${context}: ${name}`);
  if (field.type === 'checkbox') label.append(field, document.createTextNode(' ' + name));
  else label.append(document.createTextNode(name), field);
  parent.append(label);
  if (description) {
    const help = document.createElement('small');
    help.className = 'field-help'; help.id = field.dataset.path.replaceAll('.', '-') + '-help'; help.textContent = description;
    field.setAttribute('aria-describedby', help.id); parent.append(help);
  }
}
function readForm() {
  const config = structuredClone(state.config);
  for (const field of form.querySelectorAll('[data-path]')) {
    const keys = field.dataset.path.split('.'); const key = keys.pop();
    let object = config; for (const part of keys) object = object[part];
    object[key] = field.type === 'checkbox' ? field.checked : field.value.trim();
  }
  config.institutional.reviewed = document.querySelector('#reviewed').checked;
  return config;
}
function renderChecks(result) {
  for (const [slug, page] of Object.entries(result.config.institutional.pages)) {
    const box = document.querySelector(`[data-page-state="${slug}"]`);
    const blockers = result.blockers[slug] || [];
    box.replaceChildren();
    const summary = document.createElement('p'); summary.className = 'page-readiness';
    summary.textContent = !page.enabledInProduction ? 'Publicación desactivada' : blockers.length ? 'No se puede activar todavía' : 'Lista para publicar en la próxima generación';
    box.append(summary);
    if (blockers.length) {
      const details = document.createElement('details'); details.open = page.enabledInProduction;
      const title = document.createElement('summary'); title.textContent = page.enabledInProduction ? 'Requisitos de esta página' : 'Requisitos si se decide activarla'; details.append(title);
      const list = document.createElement('ul'); list.className = 'blockers';
      for (const text of blockers) { const item = document.createElement('li'); item.textContent = text; list.append(item); }
      details.append(list); box.append(details);
    }
  }
  const requirements = document.querySelector('#requirements'); requirements.replaceChildren();
  for (const requirement of result.publicationRequirements) {
    const item = document.createElement('li');
    item.textContent = `${requirement.text} · ${requirement.pages.map(page => page.label).join(', ')}`;
    requirements.append(item);
  }
  if (!result.publicationRequirements.length) {
    const item = document.createElement('li'); item.textContent = 'Las páginas seleccionadas no tienen requisitos pendientes de activación.'; requirements.append(item);
  }
}
function render() {
  for (const name of ['pages','support','identity','subscription','contacts']) document.getElementById(name).replaceChildren();
  for (const [slug, page] of Object.entries(state.config.institutional.pages)) {
    const box = document.createElement('section'); box.className = 'page';
    const title = document.createElement('h2'); title.textContent = page.label; box.append(title);
    const saved = document.createElement('p'); saved.className = 'saved-state';
    saved.textContent = `Guardado: ${page.enabledInDevelopment ? 'visible' : 'oculto'} en local · ${page.enabledInProduction ? 'habilitado' : 'desactivado'} para publicar`;
    box.append(saved);
    for (const key of ['enabledInDevelopment','enabledInProduction']) input(box, page, key, ['institutional','pages',slug], '', page.label);
    const link = document.createElement('a'); link.href = `http://127.0.0.1:8766/${slug}/`; link.textContent = 'Ver en local'; link.setAttribute('aria-label', `Ver ${page.label} en local`); box.append(link);
    const readiness = document.createElement('div'); readiness.dataset.pageState = slug; box.append(readiness);
    document.querySelector('#pages').append(box);
  }
  for (const definition of state.identityDefinitions) {
    labels[definition.key] = definition.label;
    input(document.getElementById('identity'), state.config.institutional.identity, definition.key, ['institutional','identity'], definition.description);
  }
  for (const key of Object.keys(state.config.institutional.subscription)) input(document.getElementById('subscription'), state.config.institutional.subscription, key, ['institutional','subscription']);
  const contacts = state.config.institutional.contacts; const contactBox = document.querySelector('#contacts');
  for (const key of ['domain','enabledInDevelopment','enabledInProduction']) input(contactBox, contacts, key, ['institutional','contacts'], '', 'Canales de contacto');
  for (const definition of state.contactDefinitions) {
    labels[definition.key] = definition.label + ' · Alias'; input(contactBox, contacts.channels, definition.key, ['institutional','contacts','channels']);
  }
  const privacyLabel = document.createElement('label'); const privacy = document.createElement('select'); privacy.dataset.path = 'institutional.contacts.privacyChannel';
  for (const option of [{key:'',label:'Pendiente de asignar'}, ...state.contactDefinitions]) {
    const element = document.createElement('option'); element.value = option.key; element.textContent = option.label; privacy.append(element);
  }
  privacy.value = contacts.privacyChannel; privacyLabel.append(document.createTextNode('Canal existente para consultas de privacidad '), privacy); contactBox.append(privacyLabel);
  for (const key of Object.keys(state.config.support)) input(document.querySelector('#support'), state.config.support, key, ['support'], '', 'Apoyo al proyecto');
  document.querySelector('#reviewed').checked = state.config.institutional.reviewed;
  renderChecks(state); dirty = false; resetButton.disabled = true; saveButton.disabled = true;
}
async function request(route, method, config) {
  const response = await fetch(route, {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify({revision:state.revision, config})});
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'No se pudo comprobar la configuración.');
    error.status = response.status;
    throw error;
  }
  return result;
}
function scheduleValidation() {
  if (!state || saving) return;
  clearTimeout(validationTimer);
  const sequence = ++validationSequence;
  const config = readForm(); dirty = JSON.stringify(config) !== JSON.stringify(state.config);
  resetButton.disabled = !dirty; saveButton.disabled = true;
  if (!dirty) { renderChecks(state); message('Sin cambios pendientes. La configuración guardada se aplicará al volver a generar el sitio.'); return; }
  message('Cambios sin guardar. Comprobando los requisitos…');
  validationTimer = setTimeout(async () => {
    try {
      const result = await request('/api/site-settings/validate', 'POST', config);
      if (sequence !== validationSequence || saving) return;
      renderChecks(result); saveButton.disabled = !result.validation.valid;
      const reason = result.publicationRequirements.length ? 'Hay requisitos pendientes junto a las páginas seleccionadas.' : result.validation.error;
      message(result.validation.valid ? 'Cambios sin guardar. Los requisitos están completos; ya se puede guardar.' : `No se puede guardar todavía. ${reason}`, !result.validation.valid);
    } catch (error) { if (sequence === validationSequence) message(`No se guardó ningún cambio. ${error.message}`, true); }
  }, 200);
}
form.addEventListener('input', scheduleValidation);
form.addEventListener('change', scheduleValidation);
resetButton.addEventListener('click', () => {
  clearTimeout(validationTimer); ++validationSequence; render(); message('Se recuperó la configuración guardada. No se modificó el sitio.');
});
form.addEventListener('submit', async event => {
  event.preventDefault(); if (!state || saving || !dirty) return;
  clearTimeout(validationTimer); ++validationSequence;
  const config = readForm(); saving = true;
  for (const control of form.querySelectorAll('input,textarea,select,button')) control.disabled = true;
  message('Comprobando y guardando…');
  try {
    state = await request('/api/site-settings', 'PUT', config);
    render(); message('Configuración guardada. No se ha publicado ni desplegado: se aplicará al volver a generar el sitio.');
  } catch (error) {
    let confirmed = false;
    if (!error.status || error.status >= 500) {
      try {
        const response = await fetch('/api/site-settings');
        if (!response.ok) throw new Error('No se pudo consultar el estado guardado.');
        const current = await response.json();
        if (JSON.stringify(current.config) === JSON.stringify(config)) {
          state = current; render(); confirmed = true;
          message('Guardado confirmado al consultar la configuración. No se ha publicado ni desplegado el sitio.');
        }
      } catch { /* Preserve the draft until the saved state can be confirmed. */ }
    }
    if (!confirmed) {
      message(error.status && error.status < 500 ? `No se guardaron estos cambios. ${error.message}`
        : 'No se pudo confirmar el guardado. Es necesario recargar para comprobar la configuración antes de volver a guardar.', true);
      statusRegion.focus();
    }
  }
  finally {
    saving = false;
    for (const control of form.querySelectorAll('input,textarea,select')) control.disabled = false;
    resetButton.disabled = !dirty; saveButton.disabled = true;
  }
});
fetch('/api/site-settings').then(response => {
  if (!response.ok) throw new Error('No se pudo cargar la configuración'); return response.json();
}).then(data => { state = data; render(); message('Configuración guardada cargada. Guardar aquí no publica el sitio.'); })
  .catch(error => message(error.message, true));
