import type { CatalogItem, Classification } from './types';

export interface TopicCatalogMaps {
  temas: Map<string, CatalogItem>;
  subtemas: Map<string, CatalogItem>;
}

export interface LabelCatalogMaps {
  etiquetas: Map<string, CatalogItem>;
}

export interface TopicReference {
  id: string;
  item: CatalogItem;
  kind: 'tema' | 'subtema';
  primary: boolean;
}

export interface LabelReference {
  id: string;
  item: CatalogItem;
}

export function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

export function classificationTopicIds(
  classification: Classification,
): string[] {
  return uniqueIds([
    classification.tema_principal_id,
    ...classification.tema_secundario_ids,
    ...classification.subtema_ids,
  ]);
}

export function topicReferences(
  classification: Classification,
  maps: TopicCatalogMaps,
): TopicReference[] {
  const primaryId = classification.tema_principal_id;
  const references: TopicReference[] = [];

  for (const id of uniqueIds([
    primaryId,
    ...classification.tema_secundario_ids.filter((item) => item !== primaryId),
  ])) {
    const item = maps.temas.get(id);
    if (item) {
      references.push({
        id,
        item,
        kind: 'tema',
        primary: id === primaryId,
      });
    }
  }

  for (const id of uniqueIds(classification.subtema_ids).filter(
    (item) => item !== primaryId,
  )) {
    const item = maps.subtemas.get(id);
    if (item && !references.some((reference) => reference.id === id)) {
      references.push({ id, item, kind: 'subtema', primary: false });
    }
  }

  return references;
}

export function labelReferences(
  classification: Classification,
  maps: LabelCatalogMaps,
): LabelReference[] {
  return uniqueIds(classification.etiqueta_ids)
    .map((id) => {
      const item = maps.etiquetas.get(id);
      return item ? { id, item } : null;
    })
    .filter((reference): reference is LabelReference => Boolean(reference));
}

export function cardLabelReferences(
  classification: Classification,
  maps: LabelCatalogMaps,
): LabelReference[] {
  return labelReferences(classification, maps).slice(0, 2);
}

export function normalizeTaxonomyLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
    .replace(/\s+/g, ' ');
}

export function topicHref(reference: TopicReference): string {
  return `/temas/${reference.item.slug}/`;
}

export function labelHref(reference: LabelReference): string {
  return `/etiquetas/${reference.item.slug}/`;
}
