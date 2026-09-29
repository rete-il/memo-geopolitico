import { catalog, processesForRegion } from './data';
import { geographicCatalogEntries } from '../../tools/lib/seo-policy.mjs';

export const geographicEntries = geographicCatalogEntries({
  regiones: catalog('regiones'),
  subregiones: catalog('subregiones'),
  paises_territorios: catalog('paises_territorios'),
  espacios_geopoliticos: catalog('espacios_geopoliticos'),
}).filter(({ item }) => processesForRegion(item.id).length > 0);
