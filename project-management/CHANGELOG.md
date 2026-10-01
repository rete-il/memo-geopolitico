# Changelog de gestión del proyecto

## 2026-10-01 — Promoción autorizada de EE. UU.–China a main

- El usuario indicó «actualizar main» y aceptó la entrega validada. La tarea ED-EEUU-CHINA-COMPLEMENTARIOS-20261001 pasa de review a done, avance 100 %.
- Main avanzó de 5790d4a4c338e21d01820b64069b4249f76dc4a0 a 9b9f9273c7e1696e84bee5b43a4261c6cbeb5113; origin/main y origin/beta quedaron iguales. Se promovió el mismo producto con QA aprobado: 326 pruebas y comprobaciones públicas/editoriales.
- Producción respondió HTTP 200 en /observatorio/rectores/ con el nuevo rector y su complemento de IA. Resultados ampliados de rutas y presentación: ver records/COMPLECION-EEUU-CHINA-2026-10-01.md.
- Esta entrada sustituye el estado anterior de revisión y main pendiente; las entradas de entrega beta se conservan como historial.

## 2026-10-01 — Compleción EE. UU.–China en beta, previa a main

- Se prepara la tarea ED-EEUU-CHINA-COMPLEMENTARIOS-20261001 en review para beta-4-editorial: cuatro complementarios propios y cuatro análisis, conservando tres relaciones transversales.
- Se registran cuatro señales trasladadas sin duplicación, cinco antecedentes históricos nuevos, nueve fuentes nuevas y tres reverificadas. La cronología y sus límites están en records/COMPLECION-EEUU-CHINA-2026-10-01.md.
- La tarjeta distingue dependencias y relaciones; las referencias conservan anclas y enlazan al propietario. IA mantiene un parámetro único en el rector y evaluación sin asignar.
- QA de la integración final aprobado y producto entregado a beta. La revisión humana y el futuro pase a main permanecen pendientes; producción no se modifica.
- Entrega de producto verificada: ac16472c1e1f2c57e4bbbcffdc5a3e4f5ecaf72f en origin/beta. QA: 326 pruebas, check/build público y editorial, datos, enlaces y revisión responsive aprobados. Main permanece en 5790d4a4c338e21d01820b64069b4249f76dc4a0.

## 2026-10-01 — Incorporación EE. UU.–China para beta

- Se registra el alcance autorizado del artículo y su macroevento, incluido el parámetro cualitativo de cooperación en IA; Sahel queda fuera.
- La integración necesita conservar la evaluación no asignada y los campos analíticos en persistencia y proyección, sin inventar puntuaciones.
- Producto integrado, validado y entregado en origin/beta: bb5b49eeabcddf28fb2847d91b951edfe6930647. La instrucción del usuario autorizó la incorporación y su entrega a beta. Main conserva 5790d4a4c338e21d01820b64069b4249f76dc4a0; producción permanece sin cambios. Este registro documenta la verificación remota del commit de producto. Main y producción quedan fuera del alcance. Detalles en `records/INCORPORACION-EEUU-CHINA-2026-10-01.md`.

## 2026-09-29 — Release autorizado a beta y main

- Se reúne el trabajo editorial, institucional y de experiencia de lectura desarrollado desde el 18 de septiembre.
- Corregidos filtros, bibliografías, matriz, accesibilidad, rutas, metadatos y administración local; preferencia de vista opcional durante seis meses.
- SheetJS 0.20.3 comprobado con los mismos 107 registros; caché de recursos versionados corregida.
- 303 pruebas aprobadas; las seis páginas institucionales y los correos quedan habilitados. Suscripción y apoyo siguen desactivados.
- Autorización, alcance, comprobaciones y reversión en `records/RELEASE-2026-09-29.md`.

## 2026-09-23 — Páginas institucionales y funciones opcionales

- Siete páginas con textos compartidos y control local/público en el Centro local, junto a Ko-fi.
- Configuración única para correos e integración con suscripción alojada; no se habilitan servicios sin datos ni se simulan altas.
- Pie, rutas y sitemap respetan los indicadores. Todos los agregados institucionales permanecen privados para revisión local; sin beta ni despliegue.
- Alcance, puesta en marcha y datos externos pendientes en `records/PAGINAS-INSTITUCIONALES-2026-09-23.md`.

## 2026-09-19 — Opinión en portada por incorporación

- La portada muestra hasta tres lecturas publicadas, seleccionadas por `incorporado_el`; en registros antiguos sin ese dato usa la fecha original. Los empates se resuelven por fecha original y slug, sin rotación aleatoria.
- Componente `HomeOpinion.astro` con tarjetas adaptables, un enlace por ficha y acceso al catálogo. Se distinguen fecha original y fecha de incorporación; se reutiliza el catálogo sin copiar contenido en la home.
- Selector independiente probado con una entrevista antigua recién incorporada, exclusión de borradores y conservación del catálogo original. Para nuevas lecturas, registrar siempre la fecha de incorporación; la portada se actualiza en la siguiente compilación.

## 2026-09-19 — Navegación editorial sin accesos redundantes

- Política compartida y componente reutilizable para publicaciones, expedientes y Opinión; referencias a señales con destino preciso y acceso único a originales.
- Se evita repetir la introducción como actualización y se conserva ese campo independiente durante la sincronización.
- Auditoría automática de destinos y anclas sobre ambas compilaciones. Diagnóstico, alcance y límites en `records/NAVEGACION-EDITORIAL-2026-09-19.md`.

## 2026-09-19 — Fuente única para el catálogo publicado

- Se generaliza la propiedad de subtítulos y resúmenes a todas las publicaciones, sin activación individual; las copias se actualizan al iniciar, compilar o guardar durante desarrollo.
- Los expedientes con varios artículos toman la presentación del más reciente, conservando cada artículo y los borradores independientes.
- Se comprueba la propagación de cambios, la incorporación automática de publicaciones futuras y la conservación de datos de investigación. Ver `records/PRESENTACION-EDITORIAL-2026-09-19.md`.

## 2026-09-18 — Periodismo Puro

- Primera integración local: fuente curada, cuatro entrevistas en Opinión y ampliación de tres análisis y expedientes con perspectivas de contraste.
- Catálogo sincronizado de 107 fuentes; puntuaciones pendientes visibles como «Por evaluar».
- Fechas, atribuciones y alcance de revisión documentados. Ver `records/INTEGRACION-PERIODISMO-PURO-2026-09-18.md`. Sin despliegue remoto.

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
