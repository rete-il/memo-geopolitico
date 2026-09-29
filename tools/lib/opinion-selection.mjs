/** @template {{slug: string, estado: string, incorporado_el?: string, origen: {fecha: string}}} T
 * @param {T[]} readings
 * @param {number} limit
 * @returns {T[]}
 */
export function latestOpinionReadings(readings, limit = 3) {
  return readings.filter(reading => reading.estado === 'publicado')
    .sort(compareOpinionRecency)
    .slice(0, Math.max(0, limit));
}
/** @param {{slug: string, incorporado_el?: string, origen: {fecha: string}}} a
 * @param {{slug: string, incorporado_el?: string, origen: {fecha: string}}} b
 */
export function compareOpinionRecency(a, b) {
  return (b.incorporado_el || b.origen.fecha).localeCompare(a.incorporado_el || a.origen.fecha)
    || b.origen.fecha.localeCompare(a.origen.fecha) || a.slug.localeCompare(b.slug);
}
