import { opinionEnabled } from './opinion';
import { institutionalPages } from './institutional';
import { visualResourcesAvailable } from './visual-resources';

export type NavigationLink = { href: string; label: string };

// Desktop and the expanded menu share this list and its visibility rules.
export const primaryNavigation: NavigationLink[] = [
  { href: '/', label: 'Inicio' },
  { href: '/observatorio/', label: 'Observatorio' },
  { href: '/publicaciones/', label: 'Publicaciones' },
  ...(opinionEnabled ? [{ href: '/opinion/', label: 'Opinión' }] : []),
  ...(visualResourcesAvailable ? [{ href: '/recursos-visuales/', label: 'Recursos visuales' }] : []),
  { href: '/acerca-de/', label: 'Acerca de' },
  ...institutionalPages
    .filter(page => page.slug === 'contacto')
    .map(page => ({ href: `/${page.slug}/`, label: page.label })),
];

export const explorationNavigation: NavigationLink[] = [
  { href: '/regiones/', label: 'Regiones' },
  { href: '/espacios-geopoliticos/', label: 'Espacios geopolíticos' },
  { href: '/temas/', label: 'Temas' },
  { href: '/actores/', label: 'Actores' },
  { href: '/etiquetas/', label: 'Etiquetas' },
  { href: '/medios/', label: 'Medios' },
];

export const followUpNavigation: NavigationLink[] = [
  { href: '/observatorio/?editorial=en_curso#explorar', label: 'Trabajo en curso' },
  { href: '/observatorio/dashboard/', label: 'Panel de seguimiento' },
  { href: '/observatorio/senales/', label: 'Señales' },
  { href: '/metodologia/relevancia-atencion-mediatica/', label: 'Metodología' },
];

export const siteSearch: NavigationLink = {
  href: '/observatorio/#explorar',
  label: 'Buscar en el Observatorio',
};

const footerCandidates: NavigationLink[] = [
  ...primaryNavigation.filter(item => item.href !== '/'),
  ...explorationNavigation.filter(item => item.href === '/medios/'),
  ...followUpNavigation.filter(item => ['/observatorio/dashboard/', '/metodologia/relevancia-atencion-mediatica/'].includes(item.href)),
  ...institutionalPages.map(page => ({ href: `/${page.slug}/`, label: page.label })),
];

export const footerNavigation: NavigationLink[] = [
  ...new Map(footerCandidates.map(item => [item.href, item])).values(),
];
