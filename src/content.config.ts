import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

export const collections = {
  ensayos: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/ensayos' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      author: z.string().default('Equipo Editorial'),
      tags: z.array(z.string()).optional(),
      coverImage: z.string().optional(),
    }),
  }),
  alertas: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/alertas' }),
    schema: z.object({
      title: z.string(),
      region: z.string(),
      date: z.coerce.date(),
      coordenadas: z.tuple([z.number(), z.number()]),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      en_mapa: z.boolean().optional(),
      vinculo: z.string(),
    }),
  }),
  profundidad: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/profundidad' }),
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      sources: z
        .array(
          z.object({
            title: z.string(),
            url: z.string().url(),
            summary: z.string(),
          }),
        )
        .optional(),
    }),
  }),
};
