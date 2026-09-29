import features from '../config/features.json';
import { visibleInstitutionalPages, publicationBlockers, validateFeatureConfiguration } from '../../tools/lib/institutional-policy.mjs';
import { contactsForPage } from '../../tools/lib/contact-policy.mjs';
export { identityDefinitions } from '../../tools/lib/institutional-identity.mjs';
export { identitySections, contactActions, resolveInstitutionalLinks } from '../../tools/lib/institutional-presentation.mjs';
validateFeatureConfiguration(features);
export const institutionalConfig = features.institutional;
export const institutionalLocal = import.meta.env.DEV || import.meta.env.MODE === 'institutional';
export const institutionalPages = visibleInstitutionalPages(features, institutionalLocal);
export const institutionalBlockers = (slug: string) => publicationBlockers(features, slug);
export const institutionalContacts = (slug: string) => institutionalPages.some(page => page.slug === slug)
  ? contactsForPage(features, slug, institutionalLocal) : [];
