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
