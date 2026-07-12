export function getRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('es-ES', { numeric: 'auto' });
  const now = new Date();

  const diffInMilliseconds = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.round(diffInMilliseconds / (1000 * 60 * 60));
  const diffInDays = Math.round(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (Math.abs(diffInDays) >= 1) {
    return rtf.format(diffInDays, 'day');
  } else if (Math.abs(diffInHours) >= 1) {
    return rtf.format(diffInHours, 'hour');
  } else {
    return rtf.format(diffInMinutes, 'minute');
  }
}
