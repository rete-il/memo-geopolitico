import { getCollection, type CollectionEntry } from 'astro:content';
import { editorialPreviewEnabled } from './data';
import { publicationStatePriority } from './editorial';
import { classificationTopicIds } from './taxonomy';

export type PublicationEntry = CollectionEntry<'publicaciones'>;

interface PublicationOptions {
  includePreview?: boolean;
  publishedOnly?: boolean;
}

function preferredEntry(
  current: PublicationEntry | undefined,
  candidate: PublicationEntry,
): PublicationEntry {
  if (!current) return candidate;

  const currentPriority =
    publicationStatePriority[current.data.publicacion.estado];
  const candidatePriority =
    publicationStatePriority[candidate.data.publicacion.estado];

  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority ? candidate : current;
  }

  return candidate.data.publicacion.actualizado_el >
    current.data.publicacion.actualizado_el
    ? candidate
    : current;
}

export async function getPublicationEntries(
  {
    includePreview = editorialPreviewEnabled,
    publishedOnly = false,
  }: PublicationOptions = {},
): Promise<PublicationEntry[]> {
  const entries = await getCollection('publicaciones');
  const byPostId = new Map<string, PublicationEntry>();

  for (const entry of entries) {
    byPostId.set(
      entry.data.post_id,
      preferredEntry(byPostId.get(entry.data.post_id), entry),
    );
  }

  return [...byPostId.values()]
    .filter(
      ({ data }) =>
        data.publicacion.estado === 'publicado' ||
        (includePreview && !publishedOnly),
    )
    .filter(
      ({ data }) =>
        !publishedOnly || data.publicacion.estado === 'publicado',
    )
    .sort((a, b) => {
      const stateDifference =
        publicationStatePriority[b.data.publicacion.estado] -
        publicationStatePriority[a.data.publicacion.estado];
      if (stateDifference !== 0) return stateDifference;

      return (
        b.data.publicacion.actualizado_el.localeCompare(
          a.data.publicacion.actualizado_el,
        ) || a.data.titulo.localeCompare(b.data.titulo, 'es')
      );
    });
}

export async function publicationsForTheme(
  id: string,
): Promise<PublicationEntry[]> {
  const publications = await getPublicationEntries({
    includePreview: false,
    publishedOnly: true,
  });

  return publicationEntriesForTheme(publications, id);
}

export function publicationEntriesForTheme(
  publications: PublicationEntry[],
  id: string,
): PublicationEntry[] {
  return publications.filter(({ data }) =>
    classificationTopicIds(data.clasificacion).includes(id),
  );
}

export function publicationEntriesForLabel(
  publications: PublicationEntry[],
  id: string,
): PublicationEntry[] {
  return publications
    .filter(({ data }) => data.clasificacion.etiqueta_ids.includes(id))
    .sort((a, b) =>
      b.data.publicacion.actualizado_el.localeCompare(
        a.data.publicacion.actualizado_el,
      ),
    );
}
