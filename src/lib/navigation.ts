import { opinionEnabled } from './opinion';
import { institutionalPages } from './institutional';
import { visualResourcesAvailable } from './visual-resources';
import { siteRoutes } from '../config/routes';

export type NavigationLink = { href: string; label: string };

// Desktop and the expanded menu share this list and its visibility rules.
export const primaryNavigation: NavigationLink[] = [
  { href: siteRoutes.home, label: 'Inicio' },
  { href: siteRoutes.rectors, label: 'Macroeventos rectores' },
  { href: siteRoutes.observatory, label: 'Observatorio' },
  { href: siteRoutes.publications, label: 'Publicaciones' },
  ...(opinionEnabled ? [{ href: siteRoutes.opinion, label: 'Opinión' }] : []),
  ...(visualResourcesAvailable ? [{ href: siteRoutes.visualResources, label: 'Recursos visuales' }] : []),
  { href: siteRoutes.about, label: 'Acerca de' },
  ...institutionalPages
    .filter(page => page.slug === 'contacto')
    .map(page => ({ href: `/${page.slug}/`, label: page.label })),
];

export const explorationNavigation: NavigationLink[] = [
  { href: siteRoutes.regions, label: 'Regiones' },
  { href: siteRoutes.geopoliticalSpaces, label: 'Espacios geopolíticos' },
  { href: siteRoutes.themes, label: 'Temas' },
  { href: siteRoutes.actors, label: 'Actores' },
  { href: siteRoutes.labels, label: 'Etiquetas' },
  { href: siteRoutes.media, label: 'Medios' },
];

export const followUpNavigation: NavigationLink[] = [
  { href: `${siteRoutes.observatory}?editorial=en_curso#explorar`, label: 'Trabajo en curso' },
  { href: siteRoutes.dashboard, label: 'Panel de seguimiento' },
  { href: siteRoutes.signals, label: 'Señales' },
  { href: siteRoutes.methodology, label: 'Metodología' },
];

export const siteSearch: NavigationLink = {
  href: `${siteRoutes.observatory}#explorar`,
  label: 'Buscar en el Observatorio',
};

const footerCandidates: NavigationLink[] = [
  ...primaryNavigation.filter(item => item.href !== siteRoutes.home),
  ...explorationNavigation.filter(item => item.href === siteRoutes.media),
  ...followUpNavigation.filter(item => ([siteRoutes.dashboard, siteRoutes.methodology] as string[]).includes(item.href)),
  ...institutionalPages.map(page => ({ href: `/${page.slug}/`, label: page.label })),
];

export const footerNavigation: NavigationLink[] = [
  ...new Map(footerCandidates.map(item => [item.href, item])).values(),
];
