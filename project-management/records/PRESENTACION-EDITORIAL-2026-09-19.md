# Presentación editorial: fuente única

La tarjeta de contrapesos conservaba copias antiguas del resumen en los datos del Observatorio y en la vista editorial. El artículo publicado contenía la ampliación, pero mantener copias independientes permitía que divergieran. La frase del subtítulo también se había reutilizado incorrectamente como explicación de importancia e intereses.

## Dónde editar

Para todos los artículos publicados, editar solamente `subtitulo` y `resumen` en su Markdown de `src/content/publicaciones/publicadas/`. No modificar manualmente esos campos en los JSON ni en las copias del artículo. La regla se aplica por defecto a los 75 artículos actuales y a las futuras publicaciones; ya no existe una activación individual.

La integración de Astro sincroniza al iniciar desarrollo o compilar y al guardar artículos durante desarrollo. La sincronización local también aplica esta regla después de exportar. El subtítulo alimenta la pregunta de seguimiento y el encargo publicado; el resumen alimenta las síntesis públicas. Las copias publicadas del Markdown se regeneran completas para evitar que una vista editorial antigua prevalezca en las tarjetas.

Los archivos JSON exportados siguen conteniendo texto literal por su formato de distribución, pero ya no requieren ediciones independientes. Los borradores no publicados y sus investigaciones conservan su contenido editorial propio. Las copias publicadas se identifican por nombre y post_id, sin sobrescribir un borrador por coincidir en proceso.

Cuando existen varias publicaciones sobre un proceso, su presentación en el Observatorio corresponde a la de fecha de publicación más reciente; la actualización y el nombre de archivo resuelven empates. Cada artículo conserva su propio subtítulo, resumen y cuerpo. Esta regla cubre el caso de las dos publicaciones sobre Lobito.

Antes de extender la regla se guardaron los datos del Observatorio en `_backups_local/presentacion-catalogo-20260919/`. La sincronización no modifica estados editoriales, fechas, fuentes, señales ni hipótesis de investigación.

Se retiró la repetición de la pregunta en el cuerpo del artículo y se dieron contenidos específicos a importancia, claves e intereses. Las hipótesis, señales y fuentes mantienen su función propia.

## Validación

La prueba de sincronización modifica una coma en una fuente temporal y comprueba su propagación, preservación de señales y artículos ajenos, e idempotencia. La revisión de presentación debe comprobar el resumen ampliado en la tarjeta servida, además de los archivos.

Preferencia editorial del usuario: emplear sujetos concretos, ejemplos y acciones identificables; evitar formulaciones abstractas. El subtítulo se reemplazó por la redacción exacta solicitada el 19 de septiembre. El resumen de la tarjeta supera las noventa palabras y explica los casos de Brasil y El Salvador, los tribunales, los congresos y los cambios de liderazgo.
