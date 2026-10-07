import { siteRoutes } from './routes.ts';

export const homeRoutes = {
  publications: siteRoutes.publications,
  observatory: siteRoutes.observatory,
  rectors: siteRoutes.rectors,
  opinion: siteRoutes.opinion,
  themes: siteRoutes.themes,
  regions: siteRoutes.regions,
  methodology: siteRoutes.methodology,
} as const;

export interface HomeSelectionConfig {
  featuredPostId: string;
  latestLimit: number;
  themeIds: readonly string[];
}

export const homeConfig = {
  featuredPostId: 'eeuu-china-competencia-tecnologica-cooperacion-ia',
  latestLimit: 3,
  themeIds: [
    'seguridad-conflicto',
    'diplomacia-gobernanza',
    'geoeconomia-comercio-sanciones',
    'infraestructura-conectividad',
    'energia-recursos-estrategicos',
    'tecnologia-poder-digital',
  ],
  routes: homeRoutes,
  anchors: {
    structure: 'home-structure',
    themes: 'home-themes',
    chronology: 'cronologia',
    themePublications: 'theme-publications-heading',
    themeProcesses: 'theme-processes-heading',
  },
  description: 'Investigación, contraste de fuentes y seguimiento de procesos geopolíticos. Publicaciones, evidencia y valoraciones editoriales con fundamentos y límites explícitos.',
  intro: {
    kicker: 'Análisis geopolítico independiente',
    title: 'Procesos que transforman el mundo',
    lead: 'Investigación, verificación y contraste de fuentes para comprender procesos geopolíticos y comparar su relevancia con la atención mediática.',
    action: 'Explorar temas',
    imageAsset: 'inicio',
  },
  publication: {
    sectionLabel: 'Análisis destacado y evidencia',
    featured: 'Análisis destacado',
    action: 'Consultar análisis',
    evidenceAction: 'Evidencia y seguimiento',
    published: 'Publicado el',
    undated: 'Fecha de publicación sin consignar',
    fallbackTopic: 'Publicaciones',
  },
  evaluation: {
    kicker: 'Ejemplo de valoración documentada',
    title: 'Relevancia y atención mediática',
    judgment: 'Juicio editorial',
    provisional: 'Valoraciones provisionales',
    confidence: 'Confianza',
    relevance: 'Relevancia',
    attention: 'Atención mediática',
    difference: 'Diferencia entre valoraciones',
    differenceNote: 'No equivale a un porcentaje de cobertura.',
    basis: 'Fundamento',
    sample: 'Muestra dirigida',
    piece: ['pieza', 'piezas'],
    origin: ['origen', 'orígenes'],
    disclosure: 'Ver muestra y límites',
    period: 'Periodo de la muestra',
    origins: 'Orígenes editoriales',
    limits: 'Alcance y límites',
    action: 'Consultar el fundamento',
    unassigned: 'Sin asignar',
  },
  method: {
    title: 'Del documento al análisis',
    action: 'Consultar metodología',
    steps: [
      'Investigar fuentes y fechar la evidencia',
      'Contrastar fuentes y atribuir posiciones oficiales',
      'Distinguir hechos, inferencias y escenarios',
      'Observar la cobertura con una muestra y límites explícitos',
    ],
  },
  themes: {
    title: 'Explorar por tema',
    regionAction: 'Explorar regiones',
    publicationsAction: 'Publicaciones',
    followupAction: 'Seguimiento',
    navigationLabel: 'Contenido de',
  },
  latest: {
    kicker: 'Lecturas completas',
    title: 'Últimas publicaciones',
    action: 'Consultar publicaciones',
    description: 'Ordenadas por fecha de publicación, de la más reciente a la más antigua.',
  },
  opinion: {
    limit: 3,
    eyebrow: 'Últimas incorporaciones',
    title: 'Opinión',
    description: 'Voces y perspectivas para contrastar los análisis. Lecturas recién incorporadas al sitio, con su fecha original a la vista.',
    moreLabel: 'Ver más opiniones',
    href: homeRoutes.opinion,
  },
  paths: [
    {
      key: 'rectors', group: 'observatory', title: 'Macroeventos rectores',
      role: 'Marco estructural', action: 'Explorar macroeventos rectores',
      description: 'Hipótesis sobre grandes transformaciones que organizan procesos complementarios.',
      zero: 'Sin rectores disponibles', singular: 'rector disponible', plural: 'rectores disponibles',
    },
    {
      key: 'observatory', group: 'observatory', title: 'Observatorio',
      role: 'Evidencia y seguimiento', action: 'Explorar el Observatorio',
      description: 'Expedientes con señales fechadas, fuentes trazables y relaciones entre procesos.',
      zero: 'Sin expedientes disponibles', singular: 'expediente disponible', plural: 'expedientes disponibles',
    },
    {
      key: 'publications', group: 'publications', title: 'Publicaciones',
      role: 'Interpretación y lectura', action: 'Consultar publicaciones',
      description: 'Análisis completos con argumentos, contexto y referencias a las fuentes utilizadas.',
      zero: 'Sin publicaciones disponibles', singular: 'publicación disponible', plural: 'publicaciones disponibles',
    },
  ],
  pathsSection: {
    kicker: 'Mapa editorial',
    title: 'Cómo se organiza el sitio',
    description: 'Marco estructural, evidencia y análisis: tres accesos conectados.',
    relationship: 'Un expediente puede reunir varios análisis. Las conexiones permiten distintas rutas de lectura.',
    groups: [
      { key: 'observatory', label: 'Dentro del Observatorio' },
      { key: 'publications', label: 'Lectura del análisis' },
    ],
  },
  pathsLabel: 'Estructura, seguimiento y análisis',
} as const satisfies HomeSelectionConfig & Record<string, unknown>;
