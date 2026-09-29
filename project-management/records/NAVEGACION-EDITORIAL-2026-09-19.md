# Navegación editorial: diagnóstico y corrección general

## Conclusión

El problema era la superposición de navegación en plantillas, componentes y enlaces escritos dentro del Markdown. No se encontraron redirecciones automáticas ni bucles infinitos de ejecución: los recorridos circulares dependían de los clics. Varios rótulos sugerían avanzar, pero abrían el mismo documento desde el principio.

La revisión inicial encontró 29 de 75 publicaciones con tres o más enlaces al mismo expediente; cuatro fichas de entrevistas con tres accesos al original; 89 expedientes con títulos de señales que enlazaban a sí mismos; y 100 expedientes donde «Qué está ocurriendo» repetía la introducción. Un enlace de regreso puede ser útil: el objetivo es distinguirlo de una ampliación y evitar multiplicarlo.

En contrapesos había tres accesos al expediente y dos al análisis general. Ahora hay uno al expediente, directamente a su cronología, y uno al análisis general dentro del texto. Las referencias a señales de otros expedientes abren su señal concreta, no la cabecera de la página.

## Reglas y módulos

- `tools/lib/navigation-policy.mjs`: identidad de destinos, deduplicación, destinos de cronología y señales, comparación de textos. Conserva diferencias de anclas y consultas.
- `src/components/ReadingLinks.astro`: bloque reutilizable de navegación editorial con rótulos que explican el propósito, un enlace por destino y exclusión de la página actual.
- `tools/lib/remark-reading-navigation.mjs`: transformación durante la compilación de todas las publicaciones con proceso principal. Su adaptador utiliza el procesador Sätteri instalado. Elimina párrafos que solo repiten navegación; conserva la prosa cuando retira un enlace interno redundante. El estado de destinos se guarda por documento, nunca globalmente entre artículos.
- Plantilla de publicaciones: retira el bloque anterior al texto que repetía presentación y accesos; añade un único acceso final a evidencia y seguimiento.
- Plantilla del Observatorio: distingue introducción y actualización; sustituye tarjetas completas del artículo por enlaces rotulados; evita repetir enlaces de relaciones ya presentadas y dirige referencias de señales a sus anclas.
- `SignalTimeline.astro`: el título deja de simular una ampliación. La posibilidad de compartir su ubicación se conserva como «Enlace permanente a esta señal».
- Plantilla de Opinión: conserva un acceso al original; el nombre no vuelve a enlazar a la entrevista y la biografía solo enlaza cuando tiene un destino diferente. Los expedientes relacionados abren las fuentes.
- Sincronización editorial: deja de sobrescribir `que_esta_ocurriendo` con el resumen. Si ambos textos existentes coinciden, la plantilla no imprime el segundo. Esto no reconstruye actualizaciones históricas que hayan sido sobrescritas.
- Colecciones: el expediente reutiliza una consulta de publicaciones; ProcessCard omite la consulta cuando recibe tanto publicación como estado. No se introduce una caché global que pueda quedar desactualizada durante la edición.

Las reglas se aplican desde las plantillas y al compilar artículos futuros; no requieren una lista de excepciones por título. La fuente editable de subtítulos y resúmenes sigue siendo la publicación, como se documentó en PRESENTACION-EDITORIAL-2026-09-19.md.

## Límites deliberados

No se ocultan enlaces según el historial del visitante. Se conservan navegación principal y pie, enlaces temáticos, título y botón de entrada de tarjetas, citas externas y bibliografía. Una cita junto a una afirmación y una referencia bibliográfica cumplen funciones distintas. Esta intervención no unifica todavía las bibliografías manuales con las listas automáticas de fuentes: allí pueden persistir accesos repetidos a documentos externos.

El transformador cubre enlaces Markdown directos en párrafos, encabezados y tablas. HTML escrito manualmente y referencias Markdown indirectas no se deduplican automáticamente. El validador del resultado detecta regresiones del acceso al expediente en todo el catálogo actual. Los recorridos recíprocos artículo–expediente siguen existiendo como opciones explícitas, sin fingir que son nuevas lecturas.

## Verificación

- 232 pruebas automatizadas aprobadas, incluida integración con el procesador Markdown real y conservación de citas y énfasis.
- Astro check: cero errores y cero advertencias; 52 avisos informativos.
- Producción: 797 HTML contando 404; vista editorial: 814. En ambos se comprueban los 75 artículos publicados.
- Auditoría de anclas: 2923 enlaces en producción y 3001 en la vista editorial, sin anclas faltantes.
- Validación general: cero enlaces internos rotos; SEO correcto. Los datos conservan 40 advertencias previas.
- Localhost: recorrido publicación → cronología comprobado con clic real y captura visual.

Ejecutar `npm run validate:navigation` después de compilar ambas versiones. La verificación falla si un artículo recupera un acceso genérico al expediente, pierde su acceso único a cronología, una ficha duplica el original o una ancla interna no existe.

Durante esta migración fue necesario regenerar la caché de contenido compilado de Astro en `node_modules/.astro/data-store.json`; una compilación inicialmente conservaba HTML anterior aunque la prueba del módulo pasaba. Se comprobó el resultado servido, no solo el mensaje de compilación. No hubo despliegue remoto.
