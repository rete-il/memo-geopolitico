import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {visibleInstitutionalPages, validateFeatureConfiguration, publicationBlockers} from '../tools/lib/institutional-policy.mjs';
const initial=JSON.parse(fs.readFileSync(new URL('../src/config/features.json',import.meta.url)));
test('páginas no públicas no se generan; vista local independiente',()=>{
 const c=structuredClone(initial);for(const page of Object.values(c.institutional.pages)){page.enabledInProduction=false;page.enabledInDevelopment=true;}
 assert.equal(visibleInstitutionalPages(c).length,0);assert.equal(visibleInstitutionalPages(c,true).length,7);
 c.institutional.pages.contacto.enabledInDevelopment=false;assert.equal(visibleInstitutionalPages(c,true).length,6);
});
test('activar exige identidad y revisión; suscripción añade dependencias',()=>{
 const c=structuredClone(initial);for(const page of Object.values(c.institutional.pages))page.enabledInProduction=false;
 c.institutional.reviewed=false;c.institutional.pages.contacto.enabledInProduction=true;
 assert.throws(()=>validateFeatureConfiguration(c));c.institutional.reviewed=true;
 for(const key of Object.keys(c.institutional.identity))c.institutional.identity[key]=key.endsWith('Email')?'test@example.org':'Dato de prueba';
 c.institutional.contacts.privacyChannel='general';c.institutional.contacts.enabledInProduction=true;
 assert.equal(publicationBlockers(c,'contacto').length,0);assert.equal(visibleInstitutionalPages(c).length,1);
 c.institutional.pages.suscripcion.enabledInProduction=true;assert.throws(()=>validateFeatureConfiguration(c));
 c.institutional.pages.privacidad.enabledInProduction=true;
 assert.throws(()=>validateFeatureConfiguration(c));
 c.institutional.pages['aviso-legal'].enabledInProduction=true;
 Object.assign(c.institutional.subscription,{provider:'Prueba',signupUrl:'https://example.org/signup',preferencesUrl:'https://example.org/preferences',privacyUrl:'https://example.org/privacy',doubleOptInVerified:true});
 assert.doesNotThrow(()=>validateFeatureConfiguration(c));
 c.institutional.subscription.signupUrl='javascript:alert(1)';assert.throws(()=>validateFeatureConfiguration(c));
});

test('Privacidad conserva acceso a la identificación central del responsable',()=>{
 const c=structuredClone(initial);
 c.institutional.pages['aviso-legal'].enabledInProduction=false;
 assert.ok(publicationBlockers(c,'privacidad').includes('Activar la página de Aviso legal'));
 c.institutional.pages['aviso-legal'].enabledInProduction=true;
 assert.ok(!publicationBlockers(c,'privacidad').includes('Activar la página de Aviso legal'));
});
