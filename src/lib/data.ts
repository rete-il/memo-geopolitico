import fs from 'node:fs';
import path from 'node:path';
import publicObservatory from '../data/public/observatorio.json';
import publicMedia from '../data/public/medios.json';
import type {
  CatalogItem,
  MediaRecord,
  PublicPackage,
  PublicProcess,
  PublicSource,
} from './types';

export const editorialPreviewEnabled =
  import.meta.env.PUBLIC_INCLUDE_DRAFTS === 'true';

const emptyPreview: PublicPackage = {
  formato: 'memo-geopolitico-publico',
  schema_version: 2,
  generado_el: '',
  procesos: [],
  fuentes: [],
  recursos_visuales: [],
  catalogos: {
    temas: [],
    subtemas: [],
    regiones: [],
    subregiones: [],
    paises_territorios: [],
    espacios_geopoliticos: [],
    actores: [],
    etiquetas: [],
    autores: [],
  },
};

function readPreview(): PublicPackage {
  if (!editorialPreviewEnabled) return emptyPreview;
  const previewPath = path.resolve(
    process.cwd(),
    'local-preview',
    'observatorio.json',
  );
  if (!fs.existsSync(previewPath)) return emptyPreview;
  return JSON.parse(fs.readFileSync(previewPath, 'utf8')) as PublicPackage;
}

function mergeById<T>(items: T[], identity: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(identity(item), item);
  return [...map.values()];
}

const publicPackage = publicObservatory as PublicPackage;
const previewPackage = readPreview();

export const publicProcesses: PublicProcess[] = [...publicPackage.procesos]
  .sort((a, b) =>
    b.publicacion.actualizado_el.localeCompare(a.publicacion.actualizado_el),
  );

export const processes: PublicProcess[] = mergeById(
  [
    ...publicPackage.procesos,
    ...(editorialPreviewEnabled ? previewPackage.procesos : []),
  ],
  (item) => item.macroevento_id,
)
  .sort((a, b) =>
    b.publicacion.actualizado_el.localeCompare(a.publicacion.actualizado_el),
  );

export const sources: PublicSource[] = mergeById(
  [
    ...publicPackage.fuentes,
    ...(editorialPreviewEnabled ? previewPackage.fuentes : []),
  ],
  (item) => item.fuente_id,
);

export const sourceById = new Map(
  sources.map((source) => [source.fuente_id, source]),
);

type CatalogKey = keyof PublicPackage['catalogos'];

export function catalog(key: CatalogKey): CatalogItem[] {
  return mergeById(
    [
      ...publicPackage.catalogos[key],
      ...(editorialPreviewEnabled ? previewPackage.catalogos[key] : []),
    ],
    (item) => item.id,
  ).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
}

export const catalogMaps = {
  temas: new Map(catalog('temas').map((item) => [item.id, item])),
  subtemas: new Map(catalog('subtemas').map((item) => [item.id, item])),
  regiones: new Map(catalog('regiones').map((item) => [item.id, item])),
  subregiones: new Map(catalog('subregiones').map((item) => [item.id, item])),
  paises: new Map(
    catalog('paises_territorios').map((item) => [item.id, item]),
  ),
  espacios: new Map(
    catalog('espacios_geopoliticos').map((item) => [item.id, item]),
  ),
  actores: new Map(catalog('actores').map((item) => [item.id, item])),
  etiquetas: new Map(catalog('etiquetas').map((item) => [item.id, item])),
};

export function labelFor(
  map: Map<string, CatalogItem>,
  id: string | null | undefined,
): string {
  if (!id) return '';
  return map.get(id)?.nombre || '';
}

export function processesForRegion(id: string): PublicProcess[] {
  return processes.filter(
    (item) =>
      item.clasificacion.geografia.region_ids.includes(id) ||
      item.clasificacion.geografia.subregion_ids.includes(id) ||
      item.clasificacion.geografia.pais_ids.includes(id) ||
      item.clasificacion.geografia.espacio_ids.includes(id),
  );
}

export function processesForTheme(id: string): PublicProcess[] {
  return processes.filter(
    (item) =>
      item.clasificacion.tema_principal_id === id ||
      item.clasificacion.tema_secundario_ids.includes(id) ||
      item.clasificacion.subtema_ids.includes(id),
  );
}

export function processesForActor(id: string): PublicProcess[] {
  return processes.filter((item) =>
    item.clasificacion.actor_ids.includes(id),
  );
}

export function processesForLabel(id: string): PublicProcess[] {
  return processes.filter((item) =>
    item.clasificacion.etiqueta_ids.includes(id),
  );
}

export function publicProcessesForLabel(id: string): PublicProcess[] {
  return publicProcesses.filter((item) =>
    item.clasificacion.etiqueta_ids.includes(id),
  );
}

export const mediaRecords = (
  publicMedia as { records: MediaRecord[] }
).records;
