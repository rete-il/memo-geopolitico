import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const uniqueIdList = z
  .array(z.string().min(1))
  .default([])
  .superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        message: 'Los IDs de clasificación no pueden repetirse.',
      });
    }
  });

const classificationSchema = z
  .object({
    tema_principal_id: z.string().min(1),
    tema_secundario_ids: uniqueIdList,
    subtema_ids: uniqueIdList,
    geografia: z.object({
      alcance: z.enum([
        'global',
        'regional',
        'transfronterizo',
        'nacional',
        'local',
      ]),
      region_ids: uniqueIdList,
      subregion_ids: uniqueIdList,
      pais_ids: uniqueIdList,
      espacio_ids: uniqueIdList,
    }),
    actor_ids: uniqueIdList,
    etiqueta_ids: uniqueIdList,
  })
  .superRefine((classification, context) => {
    if (
      classification.tema_secundario_ids.includes(
        classification.tema_principal_id,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['tema_secundario_ids'],
        message:
          'El tema principal no puede repetirse como tema secundario.',
      });
    }
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
