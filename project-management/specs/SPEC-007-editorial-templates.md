# SPEC-007 — Plantillas editoriales

**Estado:** Borrador
**Release:** Beta 4
**Work items:** ED-001 a ED-007

## Objetivo

Unificar lectura, metadata, fuentes y navegación de análisis y ensayos.

## Tono de la interfaz y las páginas institucionales

Preferencia editorial acordada el 27 de septiembre de 2026: registro institucional neutro, directo y comprensible. Evitar voseo, tuteo y fórmulas de cercanía personal como «Hablemos del proyecto». Describir la finalidad de cada canal o acción sin dirigirse al lector como «vos», «tú» o «usted». Preferir rótulos como «Consultas y comunicaciones» e instrucciones concretas como «Para consultas sobre una publicación, indicar su enlace». Mantener la claridad sin añadir expresiones burocráticas ni alterar citas o textos atribuidos a terceros.

## Encabezado

### Tipografía y títulos de página

Criterio acordado el 28 de septiembre de 2026: todos los títulos principales usan `src/components/PageTitle.astro`. La escala adaptable, familia, peso, interlineado y espaciado se definen una sola vez en `src/styles/global.css` (`.page-title` y variables `--type-*`). Las páginas pueden adaptar la composición y el ancho de lectura, pero no introducir tamaños de H1 propios.

- Georgia y su alternativa serif para títulos editoriales; tipografía del sistema para navegación, controles, entradillas y textos institucionales. El cuerpo de artículos conserva la serif de lectura.
- Los encabezados editoriales de sección, tarjeta y subsección consumen la escala común; los rótulos funcionales de filtros, tablas y navegación conservan su jerarquía sans.
- Los títulos de página y encabezados estáticos no llevan punto final de cierre. Se conservan signos de interrogación, exclamación, abreviaturas y la puntuación de citas o fuentes externas.
- Una página tiene un único H1. El render compartido de Markdown omite un H1 que repite el título principal y convierte otros H1 del cuerpo en H2.
- `npm run validate:typography` revisa el HTML compilado; `node tools/validate-typography.mjs dist-local` aplica la misma revisión a las páginas institucionales locales. Complementar con revisión visual en escritorio y móvil al modificar la escala.

### Contenido del encabezado

- Tipo de contenido.
- Región y severidad cuando corresponda.
- Título y bajada.
- Autor, publicación, actualización y tiempo de lectura.

## Cuerpo

- Índice de contenidos.
- Ancho de lectura controlado.
- Recursos visuales amplios.
- Fuentes y notas.
- Contenido relacionado.
- Anterior/siguiente.

## Criterios de aceptación

- Análisis y ensayos comparten infraestructura sin perder identidad.
- Metadata y JSON-LD son válidos.
- La lectura funciona en móvil y escritorio.
- Las fuentes son trazables.
