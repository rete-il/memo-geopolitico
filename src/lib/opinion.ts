import { z } from 'astro/zod';
import readings from '../data/opinion/lecturas.json';
import { compareOpinionRecency } from '../../tools/lib/opinion-selection.mjs';

const httpsURL = z.string().url().refine((url) => url.startsWith('https://'));
const opinionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  estado: z.enum(['borrador', 'publicado']),
  formato: z.enum(['articulo', 'entrevista']).default('articulo'),
  entrevistador: z.string().optional(),
  perfil_entrevistador: z.object({
    presentacion: z.string(),
    hitos: z.array(z.object({ titulo: z.string(), texto: z.string() })),
    fuentes: z.array(z.object({ titulo: z.string(), url: httpsURL })),
  }).optional(),
  nota_revision: z.string().optional(),
  incorporado_el: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  relacionados: z.array(z.object({ titulo: z.string(), url: z.string().startsWith('/') })).default([]),
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
    fecha_emision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    audio_url: httpsURL.optional(),
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
  .sort(compareOpinionRecency);

export const opinionEnabled = opinionReadings.length > 0;
