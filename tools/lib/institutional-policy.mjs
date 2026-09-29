import { contactAddress, validateContacts } from './contact-policy.mjs';
import { identityDefinitions } from './institutional-identity.mjs';
import { institutionalPageDependencies } from './institutional-presentation.mjs';
const fieldNames = {provider:'proveedor del boletín', signupUrl:'enlace de alta y temas', preferencesUrl:'enlace de preferencias y baja', privacyUrl:'privacidad del proveedor'};
export function publicationBlockers(config, slug) {
  const { identity: id, subscription: sub } = config.institutional;
  const missing = [];
  if (!config.institutional.reviewed) missing.push('Revisar y aprobar los textos institucionales');
  for (const { key, label } of identityDefinitions) {
    if (!id[key]?.trim()) missing.push(`Completar: ${label}`);
  }
  if (!contactAddress(config, 'general')) missing.push('Completar el correo general');
  if (!contactAddress(config, config.institutional.contacts.privacyChannel)) missing.push('Elegir el canal para consultas de privacidad');
  if (['correcciones', 'derechos'].includes(slug) && !contactAddress(config, 'editorial')) missing.push('Completar el correo editorial');
  if (['contacto', 'correcciones', 'derechos', 'privacidad'].includes(slug) && !config.institutional.contacts.enabledInProduction) missing.push('Habilitar los canales de contacto públicos');
  for (const dependency of institutionalPageDependencies[slug] || []) {
    if (!config.institutional.pages[dependency]?.enabledInProduction) missing.push(`Activar la página de ${config.institutional.pages[dependency]?.label || dependency}`);
  }
  if (slug === 'suscripcion') {
    for (const key of ['provider', 'signupUrl', 'preferencesUrl', 'privacyUrl']) if (!sub[key]) missing.push(`Completar ${fieldNames[key]}`);
    if (!sub.doubleOptInVerified) missing.push('Verificar confirmación de alta, preferencias y baja con el proveedor');
  }
  return missing;
}

export function visibleInstitutionalPages(config, local = false) {
  return Object.entries(config.institutional.pages).filter(([slug, page]) => local
    ? page.enabledInDevelopment
    : page.enabledInProduction && publicationBlockers(config, slug).length === 0)
    .map(([slug, page]) => ({ slug, ...page }));
}

export function validateFeatureConfiguration(config) {
  const i = config.institutional;
  if (!i || typeof i.reviewed !== 'boolean') throw new Error('Configuración institucional inválida');
  validateContacts(config);
  for (const v of Object.values(i.identity)) if (typeof v !== 'string' || v.length > 1500) throw new Error('Dato institucional inválido');
  for (const key of ['signupUrl', 'preferencesUrl', 'privacyUrl']) {
    const value = i.subscription[key];
    if (value && (new URL(value).protocol !== 'https:' || new URL(value).username || new URL(value).password)) throw new Error(`Usar una dirección HTTPS pública: ${key}`);
  }
  for (const [slug, page] of Object.entries(i.pages)) {
    if (typeof page.enabledInDevelopment !== 'boolean' || typeof page.enabledInProduction !== 'boolean') throw new Error('Indicadores inválidos');
    if (page.enabledInProduction) {
      const blockers = publicationBlockers(config, slug);
      if (blockers.length) throw new Error(`${page.label}: ${blockers.join('; ')}`);
    }
  }
  if (typeof config.support.enabledInProduction !== 'boolean' || typeof config.support.enabledInDevelopment !== 'boolean') throw new Error('Indicadores de apoyo inválidos');
  if (new URL(config.support.kofiUrl).protocol !== 'https:') throw new Error('La dirección de apoyo debe usar HTTPS');
  return config;
}
