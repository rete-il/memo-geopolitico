export const contactDefinitions = [
  { key: 'general', label: 'Consultas generales', description: 'Consultas sobre Memo Geopolítico y su contenido.' },
  { key: 'editorial', label: 'Editorial y correcciones', description: 'Observaciones sobre los análisis y avisos de errores, con referencia al artículo correspondiente.' },
  { key: 'collaborations', label: 'Colaboraciones', description: 'Propuestas de artículos, investigaciones y otras colaboraciones.' },
  { key: 'press', label: 'Prensa', description: 'Consultas periodísticas y solicitudes de entrevistas.' },
];

export function contactAddress(config, key) {
  const contacts = config.institutional.contacts;
  const localPart = contacts.channels[key];
  return localPart && contacts.domain ? `${localPart}@${contacts.domain}` : '';
}

export function visibleContacts(config, local = false) {
  const contacts = config.institutional.contacts;
  if (!(local ? contacts.enabledInDevelopment : contacts.enabledInProduction)) return [];
  return contactDefinitions.flatMap(definition => {
    const email = contactAddress(config, definition.key);
    return email ? [{ ...definition, email, href: `mailto:${email}` }] : [];
  });
}

export function contactsForPage(config, slug, local = false) {
  const page = config.institutional.pages[slug];
  if (!page || !(local ? page.enabledInDevelopment : page.enabledInProduction)) return [];
  const keys = slug === 'contacto' ? contactDefinitions.map(item => item.key)
    : slug === 'correcciones' || slug === 'derechos' ? ['editorial']
    : slug === 'privacidad' ? [config.institutional.contacts.privacyChannel] : [];
  return visibleContacts(config, local).filter(contact => keys.includes(contact.key));
}

export function correctionMailto(email, title, url) {
  const subject = `Corrección: ${title.replace(/[\r\n]+/g, ' ')}`;
  const body = `Artículo: ${url}\r\n\r\nError u observación:\r\n\r\nFuente o explicación de la corrección:\r\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function validateContacts(config) {
  const contacts = config.institutional.contacts;
  if (!contacts || typeof contacts.enabledInDevelopment !== 'boolean' || typeof contacts.enabledInProduction !== 'boolean') {
    throw new Error('Indicadores de contacto inválidos');
  }
  if (typeof contacts.domain !== 'string' || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(contacts.domain) || contacts.domain.length > 253) {
    throw new Error('Dominio de correo inválido');
  }
  const keys = contactDefinitions.map(item => item.key);
  if (!contacts.channels || Object.keys(contacts.channels).some(key => !keys.includes(key))) throw new Error('Canal de contacto desconocido');
  for (const key of keys) {
    const value = contacts.channels[key];
    if (typeof value !== 'string' || value.length > 64 || (value && !/^[a-z0-9]+(?:[._+-][a-z0-9]+)*$/i.test(value))) {
      throw new Error(`Alias de correo inválido: ${key}`);
    }
  }
  if (contacts.privacyChannel !== '' && !keys.includes(contacts.privacyChannel)) throw new Error('Elegir un canal existente para privacidad');
}
