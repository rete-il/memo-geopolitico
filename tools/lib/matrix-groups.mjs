import { hasAssignedRatings } from './editorial-ratings.mjs';

/**
 * Group equal coordinates without changing the editorial ratings.
 * @param {import('../../src/lib/types').PublicProcess[]} processes
 */
export function groupMatrixProcesses(processes) {
  /** @type {Map<string, {id: string, attention: number, relevance: number, processes: import('../../src/lib/types').PublicProcess[]}>} */
  const groups = new Map();
  for (const process of processes) {
    if (!hasAssignedRatings(process)) continue;
    const attention = process.valoraciones.atencion_mediatica;
    const relevance = process.valoraciones.relevancia_geopolitica;
    const key = `${attention}-${relevance}`;
    if (!groups.has(key)) groups.set(key, {
      id: `matriz-grupo-a${String(attention).replaceAll('.', '_')}-r${String(relevance).replaceAll('.', '_')}`,
      attention, relevance, processes: [],
    });
    groups.get(key).processes.push(process);
  }
  return [...groups.values()].sort((a, b) =>
    b.relevance - a.relevance || a.attention - b.attention,
  );
}
