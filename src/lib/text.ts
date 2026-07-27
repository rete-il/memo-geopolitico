export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'Sin fecha';
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function humanize(value: string): string {
  const words = value.replaceAll('_', ' ').replaceAll('-', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function editorialStageLabel(value: string): string {
  const labels: Record<string, string> = {
    borrador: 'En documentación',
    en_revision: 'En revisión editorial',
    listo: 'Listo para publicación',
    publicado: 'Publicado',
  };
  return labels[value] || humanize(value);
}

export function clampScale(value: number): number {
  return Math.min(5, Math.max(1, Number(value) || 1));
}
