import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const classificationSchema = z.object({
  tema_principal_id: z.string().nullable(),
  tema_secundario_ids: z.array(z.string()).default([]),
  subtema_ids: z.array(z.string()).default([]),
  geografia: z.object({
    alcance: z.enum(['global', 'regional', 'transfronterizo', 'nacional', 'local']),
    region_ids: z.array(z.string()).default([]),
    subregion_ids: z.array(z.string()).default([]),
    pais_ids: z.array(z.string()).default([]),
    espacio_ids: z.array(z.string()).default([]),
  }),
  actor_ids: z.array(z.string()).default([]),
  etiqueta_ids: z.array(z.string()).default([]),
});

export const collections = {
  publicaciones: defineCollection({
    loader: glob({
      pattern: '{publicadas,_preview}/**/*.md',
      base: './src/content/publicaciones',
      generateId: ({ entry }) => entry.replace(/\.md$/, ''),
    }),
    schema: z.object({
      schema_version: z.literal(2),
      post_id: z.string(),
      slug: z.string(),
      tipo_publicacion: z.enum([
        'ensayo',
        'analisis',
        'explicador',
        'analisis_cartografico',
        'nota_coyuntura',
        'comparacion',
        'prospectiva',
      ]),
      titulo: z.string(),
      subtitulo: z.string().default(''),
      resumen: z.string(),
      autor_ids: z.array(z.string()).min(1),
      publicacion: z.object({
        estado: z.enum(['borrador', 'en_revision', 'listo', 'publicado']),
        publicado_el: z.string().nullable(),
        actualizado_el: z.string(),
      }),
      macroevento_principal_id: z.string(),
      macroevento_secundario_ids: z.array(z.string()).default([]),
      clasificacion: classificationSchema,
      fuente_ids: z.array(z.string()).default([]),
      recurso_visual_ids: z.array(z.string()).default([]),
      post_relacionado_ids: z.array(z.string()).default([]),
    }),
  }),
};
