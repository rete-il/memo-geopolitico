# Portada editorial — revisión local del 6 de octubre de 2026

## Decisiones del usuario

- Adoptar la propuesta «Investigación y lectura» como portada.
- Mantener textos neutros, sin tuteo, voseo ni tratamiento personal.
- Explicar la investigación, la verificación de fuentes y la comparación entre relevancia geopolítica y atención mediática.
- Distribuir las cuatro imágenes generadas en Inicio, Observatorio, Publicaciones y Acerca de.
- Revisar los cambios en localhost y en VS Code antes de enviarlos a GitHub.

## Distribución de imágenes

| Página | Archivo público | Función |
| --- | --- | --- |
| Inicio | `/images/editorial/inicio-investigacion.webp` | Presentación general de la investigación geopolítica. |
| Observatorio | `/images/editorial/observatorio-fuentes.webp` | Comparación de documentos y contraste de fuentes. |
| Publicaciones | `/images/editorial/publicaciones-atlas.webp` | Lectura y análisis del contexto mundial. |
| Acerca de | `/images/editorial/acerca-investigacion.webp` | Representación conceptual del trabajo editorial. |

Las imágenes tienen 840 × 560 píxeles y formato WebP. Su presentación incluye texto alternativo y el pie «Imagen editorial generada con IA». Se conservan las composiciones completas; en móvil aparecen después del texto con altura reducida. Los originales y los prompts se conservan en `outputs/landing/`.

## Contenido y evidencia

La portada utiliza publicaciones autorizadas y metadatos editoriales canónicos. El destacado y las lecturas recientes no deben repetir la misma publicación. Las valoraciones numéricas sólo se muestran con un fundamento público válido, fechado y respaldado por las fuentes verificadas del proceso. La diferencia entre relevancia y atención es un juicio editorial provisional, no un porcentaje de cobertura.

La comparación entre Gaza, Sudán y la República Democrática del Congo continúa siendo una posible pregunta de investigación. Esta revisión no incorpora afirmaciones ni rankings comparativos sin una muestra común documentada.

## Revisión local

- URL prevista: `http://localhost:4321/`.
- VS Code: tarea «Memo: vista local» para iniciar el servidor y «Memo: verificar producción» para las comprobaciones.
- La configuración de desarrollo utiliza el contenido público; no habilita borradores editoriales.
- Comprobaciones automáticas: `npm run qa` completado con salida 0. Incluye pruebas, validación de datos, comprobación de Astro/TypeScript, compilaciones pública y editorial, enlaces, SEO, navegación y tipografía. Sin enlaces ni anclas internas rotas.
- Comprobación visual: Inicio, Observatorio, Publicaciones y Acerca de revisados en escritorio y móvil (390 y 320 píxeles); las cuatro imágenes cargan completas y no hay desbordes horizontales. Despliegue nativo de muestra y límites comprobado; navegación móvil al archivo de Publicaciones comprobada.
- Astro/TypeScript: 0 errores, 0 advertencias y 61 sugerencias no bloqueantes en la comprobación completa; ninguna señala los archivos nuevos de portada o imagen editorial.
- Evidencia visual: `outputs/landing/localhost-inicio-20261006.jpg`.
- Estado de publicación: cambios locales; no enviados a GitHub ni desplegados.
