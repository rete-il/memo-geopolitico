import type { PublicationEntry } from './publications';
import type { PublicationState, PublicProcess } from './types';

export const publicationStatePriority: Record<PublicationState, number> = {
  borrador: 0,
  en_revision: 1,
  listo: 2,
  publicado: 3,
};

export const editorialStateDefinitions = [
  {
    state: 'borrador',
    slug: 'borrador',
    label: 'En documentación',
    title: 'Expedientes en documentación',
    description:
      'Procesos cuyo expediente todavía reúne antecedentes, señales y fuentes.',
  },
  {
    state: 'en_revision',
    slug: 'en-revision',
    label: 'En revisión editorial',
    title: 'Expedientes en revisión editorial',
    description:
      'Procesos sometidos a revisión de coherencia, fuentes y valoraciones.',
  },
  {
    state: 'listo',
    slug: 'listo',
    label: 'Listos para publicación',
    title: 'Expedientes listos para publicación',
    description:
      'Procesos que completaron la revisión y esperan la autorización final.',
  },
  {
    state: 'publicado',
    slug: 'publicado',
    label: 'Publicado',
    title: 'Expedientes publicados',
    description:
      'Procesos que ya cuentan con una publicación autorizada para lectura.',
  },
] as const satisfies ReadonlyArray<{
  state: PublicationState;
  slug: string;
  label: string;
  title: string;
  description: string;
}>;

export function relatedPublicationsForProcess(
  process: PublicProcess,
  entries: PublicationEntry[],
): PublicationEntry[] {
  return entries
    .filter(
      ({ data }) =>
        data.macroevento_principal_id === process.macroevento_id ||
        data.macroevento_secundario_ids.includes(process.macroevento_id),
    )
    .sort((a, b) => {
      const priorityDifference =
        publicationStatePriority[b.data.publicacion.estado] -
        publicationStatePriority[a.data.publicacion.estado];
      if (priorityDifference !== 0) return priorityDifference;

      return b.data.publicacion.actualizado_el.localeCompare(
        a.data.publicacion.actualizado_el,
      );
    });
}

export function relatedPublicationForProcess(
  process: PublicProcess,
  entries: PublicationEntry[],
): PublicationEntry | undefined {
  return relatedPublicationsForProcess(process, entries)[0];
}

export function primaryPublicationForProcess(
  process: PublicProcess,
  entries: PublicationEntry[],
): PublicationEntry | undefined {
  return entries
    .filter(
      ({ data }) =>
        data.macroevento_principal_id === process.macroevento_id,
    )
    .sort((a, b) => {
      const priorityDifference =
        publicationStatePriority[b.data.publicacion.estado] -
        publicationStatePriority[a.data.publicacion.estado];
      if (priorityDifference !== 0) return priorityDifference;

      return b.data.publicacion.actualizado_el.localeCompare(
        a.data.publicacion.actualizado_el,
      );
    })[0];
}

export function effectiveEditorialState(
  process: PublicProcess,
  entries: PublicationEntry[],
): PublicationState {
  return (
    primaryPublicationForProcess(process, entries)?.data.publicacion.estado ||
    process.publicacion.estado
  );
}

export function editorialStateDefinition(state: PublicationState) {
  return editorialStateDefinitions.find((item) => item.state === state);
}

export function editorialStateFromSlug(slug: string) {
  return editorialStateDefinitions.find((item) => item.slug === slug);
}

export function editorialStateSlug(state: PublicationState): string {
  return editorialStateDefinition(state)?.slug || state.replaceAll('_', '-');
}
