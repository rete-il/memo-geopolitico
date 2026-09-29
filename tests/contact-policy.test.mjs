import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contactAddress, contactsForPage, correctionMailto, visibleContacts, validateContacts } from '../tools/lib/contact-policy.mjs';
const config = JSON.parse(fs.readFileSync(new URL('../src/config/features.json', import.meta.url), 'utf8'));

test('los cuatro canales acordados se presentan por finalidad desde un registro único', () => {
  const c = structuredClone(config);
  c.institutional.contacts.enabledInDevelopment = true;
  c.institutional.pages.contacto.enabledInDevelopment = true;
  c.institutional.pages.correcciones.enabledInDevelopment = true;
  assert.deepEqual(contactsForPage(c, 'contacto', true).map(contact => contact.email), [
    'contacto@memogeopolitico.com', 'editorial@memogeopolitico.com',
    'colaboraciones@memogeopolitico.com', 'prensa@memogeopolitico.com',
  ]);
  c.institutional.contacts.domain = 'example.org';
  c.institutional.contacts.channels.editorial = 'redaccion';
  assert.equal(contactsForPage(c, 'contacto', true).find(item => item.key === 'editorial').email, 'redaccion@example.org');
  assert.equal(contactsForPage(c, 'correcciones', true)[0].email, 'redaccion@example.org');
});

test('visibilidad independiente por entorno y página; no se inventa un canal de privacidad', () => {
  const c = structuredClone(config);
  c.institutional.contacts.enabledInDevelopment = true;
  c.institutional.contacts.enabledInProduction = false;
  c.institutional.pages.contacto.enabledInDevelopment = true;
  c.institutional.pages.contacto.enabledInProduction = true;
  assert.equal(contactsForPage(c, 'contacto', true).length, 4);
  assert.deepEqual(visibleContacts(c), []);
  assert.deepEqual(contactsForPage(c, 'contacto'), []);
  c.institutional.contacts.enabledInProduction = true;
  assert.equal(contactsForPage(c, 'contacto').length, 4);
  c.institutional.pages.contacto.enabledInProduction = false;
  assert.deepEqual(contactsForPage(c, 'contacto'), []);
  c.institutional.contacts.enabledInDevelopment = false;
  assert.deepEqual(contactsForPage(c, 'contacto', true), []);
  c.institutional.contacts.enabledInDevelopment = true;
  c.institutional.contacts.privacyChannel = '';
  c.institutional.pages.privacidad.enabledInDevelopment = true;
  assert.deepEqual(contactsForPage(c, 'privacidad', true), []);
  c.institutional.contacts.privacyChannel = 'general';
  assert.equal(contactsForPage(c, 'privacidad', true)[0].email, contactAddress(c, 'general'));
});

test('enlace de corrección conserva acentos, título y URL sin mezclar parámetros', () => {
  const href = correctionMailto('editorial@example.org', 'Taiwán & poder?\nUna revisión', 'https://example.org/publicaciones/taiwan/?a=1&b=2');
  const url = new URL(href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, 'editorial@example.org');
  assert.equal(url.searchParams.get('subject'), 'Corrección: Taiwán & poder? Una revisión');
  assert.match(url.searchParams.get('body'), /https:\/\/example.org\/publicaciones\/taiwan\/\?a=1&b=2/);
  assert.deepEqual([...url.searchParams.keys()], ['subject', 'body']);
});

test('el registro rechaza direcciones malformadas y canales no destinados al sitio', () => {
  assert.doesNotThrow(() => validateContacts(config));
  for (const invalid of ['example.org?subject=otro', 'https://example.org', 'example.org\n']) {
    const c = structuredClone(config); c.institutional.contacts.domain = invalid;
    assert.throws(() => validateContacts(c));
  }
  const c = structuredClone(config);
  c.institutional.contacts.channels.general = 'a@example.org';
  assert.throws(() => validateContacts(c));
  c.institutional.contacts.channels.general = 'contacto';
  c.institutional.contacts.channels.accounts = 'cuentas';
  assert.throws(() => validateContacts(c));
});
