import type { HomeSelectionConfig } from '../config/home.ts';
import type { PublicationEntry } from './publications.ts';
import type { CatalogItem, PublicEvaluationBasis, PublicProcess, PublicSource } from './types.ts';
import { validateEvaluationBasis } from '../../tools/lib/evaluation-basis.mjs';

export interface HomePublicationView {
  publication: PublicationEntry;
  topic?: CatalogItem;
  process?: PublicProcess;
}

export interface HomeEvaluationView {
  process: PublicProcess;
  basis: PublicEvaluationBasis;
  origins: string[];
}

export interface HomeCorpus {
  publications: PublicationEntry[];
  processes: PublicProcess[];
  themes: CatalogItem[];
  sourceById: Map<string, PublicSource>;
}

export interface HomeContent {
  featured?: HomePublicationView;
  evaluation?: HomeEvaluationView;
  latest: HomePublicationView[];
  themes: CatalogItem[];
  counts: { publications: number; observatory: number; rectors: number };
}

function documentedEvaluation(
  process: PublicProcess | undefined,
  sourceById: Map<string, PublicSource>,
): HomeEvaluationView | undefined {
  const basis = process?.fundamento_evaluacion;
  if (!process || !basis
      || !Number.isFinite(process.valoraciones.relevancia_geopolitica)
      || !Number.isFinite(process.valoraciones.atencion_mediatica)
      || validateEvaluationBasis(basis, process, sourceById).length > 0) return;
  // The public projection already checks the exact referenced evaluation.
  // Rendering never introduces scores or bases from an internal preview.
  return {
    process,
    basis,
    origins: [...new Set(basis.atencion.muestra.map((piece) => piece.origen_editorial))],
  };
}

export function selectHomeContent(
  corpus: HomeCorpus,
  config: HomeSelectionConfig,
): HomeContent {
  const publications = corpus.publications
    .filter(({ data }) => data.publicacion.estado === 'publicado')
    .sort((a, b) =>
      (b.data.publicacion.publicado_el || '').localeCompare(a.data.publicacion.publicado_el || '')
      || a.data.titulo.localeCompare(b.data.titulo, 'es')
      || a.data.post_id.localeCompare(b.data.post_id),
    );
  const activeThemes = new Map(
    corpus.themes.filter((theme) => theme.estado === 'activo').map((theme) => [theme.id, theme]),
  );
  const processById = new Map(corpus.processes.map((process) => [process.macroevento_id, process]));
  const view = (publication: PublicationEntry): HomePublicationView => ({
    publication,
    topic: activeThemes.get(publication.data.clasificacion.tema_principal_id),
    process: processById.get(publication.data.macroevento_principal_id),
  });
  const selected = publications.find(({ data }) => data.post_id === config.featuredPostId)
    || publications[0];
  const featured = selected ? view(selected) : undefined;
  return {
    featured,
    evaluation: documentedEvaluation(featured?.process, corpus.sourceById),
    latest: publications
      .filter(({ data }) => data.post_id !== selected?.data.post_id)
      .slice(0, Math.max(0, Math.floor(config.latestLimit)))
      .map(view),
    themes: [...new Set(config.themeIds)]
      .map((id) => activeThemes.get(id))
      .filter((theme): theme is CatalogItem => Boolean(theme)),
    counts: {
      publications: publications.length,
      observatory: corpus.processes.length,
      rectors: corpus.processes.filter((process) => process.es_macroevento_rector).length,
    },
  };
}
