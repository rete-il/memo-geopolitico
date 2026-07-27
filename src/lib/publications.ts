import { getCollection, type CollectionEntry } from 'astro:content';
import { editorialPreviewEnabled } from './data';

export type PublicationEntry = CollectionEntry<'publicaciones'>;

interface PublicationOptions {
  includePreview?: boolean;
  publishedOnly?: boolean;
}

const statePriority = {
  borrador: 0,
  en_revision: 1,
  listo: 2,
  publicado: 3,
} as const;

function preferredEntry(
  current: PublicationEntry | undefined,
  candidate: PublicationEntry,
): PublicationEntry {
  if (!current) return candidate;

  const currentPriority = statePriority[current.data.publicacion.estado];
  const candidatePriority = statePriority[candidate.data.publicacion.estado];

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
        statePriority[b.data.publicacion.estado] -
        statePriority[a.data.publicacion.estado];
      if (stateDifference !== 0) return stateDifference;

      return (
        b.data.publicacion.actualizado_el.localeCompare(
          a.data.publicacion.actualizado_el,
        ) || a.data.titulo.localeCompare(b.data.titulo, 'es')
      );
    });
}
