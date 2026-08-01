# Changelog de gestión del proyecto

## 2.3 — 2026-07-21

- Se registra el Observatorio editorial autónomo v0.3.0, mantenido fuera del repositorio y del build de Astro.
- Se documenta el flujo macroevento → señales y fuentes → expediente → encargo de investigación → encargo de redacción → revisión humana → Markdown.
- Se incorpora el piloto del Corredor de Lobito como prueba controlada del flujo editorial.
- Se separan evidencia verificada, señales revisadas e hipótesis analíticas provisionales.
- Se establece que la integración futura y la taxonomía pública se decidirán después de completar un corpus piloto.
- GDELT y las APIs externas continúan fuera de las dependencias del sitio.

## 2.2 — 2026-07-19

- Se registra la implementación de la cabecera editorial y la nueva nomenclatura pública.
- Se actualizan los estados de Alertas, Focos, Dossiers, Medios y Relevancia vs. atención mediática.
- Se recomponen las tarjetas de Focos con párrafos completos, fecha de actualización y enlace explícito.
- Se incorpora Responsive Preview v2 para validar simultáneamente escritorio, tablet y teléfono.
- Se documenta la corrección del error `spawn EINVAL` en Windows/Node 22.
- Se registran la validación visual en localhost y las comprobaciones todavía pendientes de teclado y rutas.

## 2.1 — 2026-07-19

- Se aprueba la arquitectura editorial basada en Alertas, Focos y Dossiers.
- Se redefine la navegación principal y el menú hamburguesa izquierdo.
- Se renombra Directorio como Medios en la navegación pública.
- Se consolida el nombre Relevancia vs. atención mediática para la columna derecha.
- Se cierra el alcance avanzado de GDELT y se mantiene como experimento diferido.
- Se incorporan tareas de migración de rutas, índices editoriales, página Acerca de y validación.

## 2.0 — 2026-07-17

- Se incorpora Project Dashboard v0.1 para mantener tareas, releases, registros y paneles desde una interfaz local.
- Se agregan validación ampliada, backups automáticos y lectura de estado Git.


## 1.1 — 17 de julio de 2026

- Se agrega `ACTUALIZAR-PROGRESO.md` con la secuencia operativa completa para actualizar work items, registros, paneles dinámicos y la rama `beta`.

Este registro documenta cambios en alcance, prioridades, releases y sistema de seguimiento. No sustituye el changelog del producto.

## 2026-07-17 — v1.0

- Se crea `project-management/` separado de `docs/`.
- Se define roadmap Beta 0–6.
- Se cargan correcciones, refactors y funciones iniciales.
- Se incluyen menú hamburguesa, navegación regional, páginas regionales y Fricción vs. Narrativa.
- Se crea dashboard regenerable desde JSON.
- Se documentan quality gates, riesgos y decisiones iniciales.
