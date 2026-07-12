import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

export const collections = {
  ensayos: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/ensayos' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      author: z.string().default('Equipo Editorial'),
      tags: z.array(z.string()).optional(),
      coverImage: z.string().optional(),
    }),
  }),
  alertas: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/alertas' }),
    schema: z.object({
      title: z.string(),
      region: z.string(), // Añadido para el diseño
      date: z.date(),
      lat: z.number(),
      lng: z.number(),
      severity: z.enum(['low', 'medium', 'critical']),
    }),
  }),
};
