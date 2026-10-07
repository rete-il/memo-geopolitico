/** Single authority for editorial-image design on every page. */
export const editorialImageDesign = {
  source: { width: 840, height: 560 },
  size: { width: '100%', mobileMaxWidth: 480 },
  breakpoint: 760,
  figure: { fit: 'contain', margin: '0 auto', alignment: 'center' },
  caption: {
    text: 'Imagen editorial generada con IA',
    gap: 'var(--space-2)',
    color: 'var(--ink-600)',
    fontFamily: 'var(--sans)',
    fontSize: 'var(--type-caption-size)',
    fontWeight: 'var(--font-weight-regular)',
    lineHeight: '1.4',
    alignment: 'center',
  },
  layout: {
    desktopColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
    mobileColumns: 'minmax(0, 1fr)',
    desktopGap: 'var(--section-gap)',
    mobileGap: 'var(--space-5)',
    alignment: 'center',
  },
  loading: 'eager',
  decoding: 'async',
  fetchPriority: 'auto',
} as const;

export const editorialImages = {
  inicio: {
    src: '/images/editorial/inicio-investigacion.webp',
    alt: 'Ilustración conceptual de un atlas, un globo y documentos de investigación geopolítica.',
  },
  observatorio: {
    src: '/images/editorial/observatorio-fuentes.webp',
    alt: 'Ilustración conceptual de tres grupos de documentos alrededor de un globo, como representación del contraste de fuentes.',
  },
  rectores: {
    src: '/images/editorial/rectores-marco-estructural.webp',
    alt: 'Ilustración conceptual de un atlas desplegado, documentos organizados y un globo, como representación del marco estructural que relaciona procesos geopolíticos.',
  },
  publicaciones: {
    src: '/images/editorial/publicaciones-atlas.webp',
    alt: 'Ilustración conceptual de un atlas abierto, tarjetas de lectura y un lápiz.',
  },
  opinion: {
    src: '/images/editorial/opinion-perspectivas.webp',
    alt: 'Ilustración conceptual de dos documentos y símbolos de diálogo junto a un globo terráqueo, como representación del intercambio de perspectivas.',
  },
  contacto: {
    src: '/images/editorial/contacto-dialogo.webp',
    alt: 'Ilustración conceptual de documentos y un sobre junto a un globo terráqueo, como representación del contacto editorial.',
  },
  'acerca-de': {
    src: '/images/editorial/acerca-investigacion.webp',
    alt: 'Escena conceptual de una mesa de investigación con un atlas abierto, un globo, notas y una lupa.',
  },
} as const;

export type EditorialImageAsset = keyof typeof editorialImages;
export const editorialImageCaption = editorialImageDesign.caption.text;

const ratio = editorialImageDesign.source.width / editorialImageDesign.source.height;
const variables = {
  '--editorial-width': editorialImageDesign.size.width,
  '--editorial-ratio': `${ratio}`,
  '--editorial-mobile-max-width': `${editorialImageDesign.size.mobileMaxWidth}px`,
  '--editorial-fit': editorialImageDesign.figure.fit,
  '--editorial-margin': editorialImageDesign.figure.margin,
  '--editorial-alignment': editorialImageDesign.figure.alignment,
  '--editorial-caption-gap': editorialImageDesign.caption.gap,
  '--editorial-caption-color': editorialImageDesign.caption.color,
  '--editorial-caption-family': editorialImageDesign.caption.fontFamily,
  '--editorial-caption-size': editorialImageDesign.caption.fontSize,
  '--editorial-caption-weight': editorialImageDesign.caption.fontWeight,
  '--editorial-caption-line-height': editorialImageDesign.caption.lineHeight,
  '--editorial-caption-alignment': editorialImageDesign.caption.alignment,
};

export const editorialImageVariables = Object.entries(variables)
  .map(([name, value]) => `${name}: ${value}`)
  .join('; ');

// Generate the breakpoint from the same design record: media queries cannot
// read ordinary CSS custom properties. No image-specific values live elsewhere.
export const editorialImageCss = `
.editorial-image {
  min-width: 0;
  width: var(--editorial-width);
  margin: var(--editorial-margin);
  justify-self: var(--editorial-alignment);
}

.editorial-image img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: var(--editorial-ratio);
  object-fit: var(--editorial-fit);
}

.editorial-image figcaption {
  margin-top: var(--editorial-caption-gap);
  color: var(--editorial-caption-color);
  font-family: var(--editorial-caption-family);
  font-size: var(--editorial-caption-size);
  font-weight: var(--editorial-caption-weight);
  line-height: var(--editorial-caption-line-height);
  text-align: var(--editorial-caption-alignment);
}

.page-intro--illustrated {
  grid-template-columns: ${editorialImageDesign.layout.desktopColumns};
  gap: ${editorialImageDesign.layout.desktopGap};
  align-items: ${editorialImageDesign.layout.alignment};
}

.page-intro--illustrated > .page-intro__copy {
  min-width: 0;
}

.page-intro--illustrated .page-intro__copy > p:not(.eyebrow) {
  margin: 0;
  color: var(--ink-700);
  font-size: var(--type-lead-size);
}

@media (max-width: ${editorialImageDesign.breakpoint}px) {
  .editorial-image {
    max-width: var(--editorial-mobile-max-width);
  }

  .page-intro--illustrated {
    grid-template-columns: ${editorialImageDesign.layout.mobileColumns};
    gap: ${editorialImageDesign.layout.mobileGap};
  }
}
`;
