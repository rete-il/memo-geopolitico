// Page responsibilities are independent from publication requirements and contact visibility.
export const identitySections = {
  'aviso-legal': {
    id: 'responsable',
    title: 'Responsable del sitio',
    keys: ['responsible', 'country', 'address'],
  },
  privacidad: {
    id: 'servicios-y-datos',
    title: 'Servicios y conservación de datos',
    keys: ['hostingProvider', 'mailProvider', 'retention'],
  },
};

export const contactActions = {
  derechos: { label: 'Solicitar autorización de uso', subject: 'Solicitud de autorización de uso' },
  correcciones: { label: 'Comunicar una corrección', subject: 'Comunicación de una corrección' },
  privacidad: { label: 'Consultar sobre datos personales', subject: 'Consulta sobre datos personales' },
};

// A page that delegates essential information must keep that destination available.
export const institutionalPageDependencies = {
  privacidad: ['aviso-legal'],
  suscripcion: ['privacidad'],
};

export function resolveInstitutionalLinks(references = [], currentSlug, visiblePages = []) {
  const visible = new Map(visiblePages.map(page => [page.slug, page]));
  const seen = new Set();
  const links = [];
  for (const reference of references) {
    const page = visible.get(reference.page);
    if (!page || reference.page === currentSlug) continue;
    if (reference.anchor !== undefined && reference.anchor !== identitySections[reference.page]?.id) {
      throw new Error(`Ancla institucional desconocida: ${reference.page}#${reference.anchor}`);
    }
    // Different fragments of the same page must not produce repeated reading paths.
    if (seen.has(reference.page)) continue;
    seen.add(reference.page);
    links.push({
      href: `/${reference.page}/${reference.anchor ? `#${reference.anchor}` : ''}`,
      label: reference.label || page.label,
    });
  }
  return links;
}

export function groupPublicationBlockers(blockersBySlug, pageConfig) {
  const grouped = new Map();
  for (const [slug, blockers] of Object.entries(blockersBySlug)) {
    for (const text of new Set(blockers)) {
      if (!grouped.has(text)) grouped.set(text, { text, pages: [] });
      grouped.get(text).pages.push({ slug, label: pageConfig[slug]?.label || slug });
    }
  }
  return [...grouped.values()];
}
