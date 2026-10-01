import type { PublicProcess } from './types';

export function processRectorIds(process: PublicProcess): string[] {
  return [...new Set([
    ...(process.macroevento_rector_id ? [process.macroevento_rector_id] : []),
    ...(process.macroevento_rector_ids || []),
  ].filter(Boolean))];
}

export function processDependsOnRector(
  process: PublicProcess,
  rectorId: string,
): boolean {
  return processRectorIds(process).includes(rectorId);
}


/** Separate explicit dependencies from cross-process links without changing ownership. */
export function groupRectorProcesses(rector: PublicProcess, processes: PublicProcess[]) {
  const rectorId = rector.macroevento_id;
  const complementaries = processes.filter(process => process.macroevento_id !== rectorId
    && !process.es_macroevento_rector && processDependsOnRector(process, rectorId));
  const excludedIds = new Set([rectorId, ...complementaries.map(process => process.macroevento_id)]);
  const typedRelations = [...new Map(processes.flatMap(process => process.relaciones_tipadas || [])
    .filter(relation => relation.tipo !== 'subordinada'
      && [relation.origen_id, relation.destino_id].includes(rectorId))
    .map(relation => [relation.relacion_id, relation])).values()];
  const relatedIds = new Set([
    ...(rector.macroevento_relacionado_ids || []),
    ...processes.filter(process => process.macroevento_relacionado_ids?.includes(rectorId))
      .map(process => process.macroevento_id),
    ...typedRelations.map(relation => relation.origen_id === rectorId ? relation.destino_id : relation.origen_id),
  ]);
  const transversals = processes
    .filter(process => relatedIds.has(process.macroevento_id) && !excludedIds.has(process.macroevento_id))
    .map(process => ({
      process,
      relations: typedRelations.filter(relation => [relation.origen_id, relation.destino_id].includes(process.macroevento_id)),
    }))
    .sort((a, b) => a.process.titulo.localeCompare(b.process.titulo, 'es'));
  return { complementaries, transversals };
}
