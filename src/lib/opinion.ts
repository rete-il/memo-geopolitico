import { z } from 'astro/zod';
import readings from '../data/opinion/lecturas.json';

const httpsURL = z.string().url().refine((url) => url.startsWith('https://'));
const opinionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  estado: z.enum(['borrador', 'publicado']),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  autor: z.object({
    nombre: z.string().min(1),
    biografia: z.string().min(1),
    url: httpsURL,
  }),
  origen: z.object({
    medio: z.string().min(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    url: httpsURL,
  }),
  resumen: z.array(z.string().min(1)).min(1),
});

export type OpinionReading = z.infer<typeof opinionSchema>;

const catalog = z.array(opinionSchema).parse(readings);
if (new Set(catalog.map((reading) => reading.slug)).size !== catalog.length) {
  throw new Error('Las lecturas de Opinión deben tener slugs únicos.');
}

// Draft recommendations are local-only, even when building the editorial preview.
export const opinionReadings = catalog
  .filter((reading) => reading.estado === 'publicado' || import.meta.env.DEV)
  .sort((a, b) => b.origen.fecha.localeCompare(a.origen.fecha));

export const opinionEnabled = opinionReadings.length > 0;
