# Notas de release

## Beta 0

**Estado:** Implementación editorial en revisión.

### Incluido

- Baseline técnico y documental.
- Sistema de project management y dashboard local.
- Administración de Relevancia vs. atención mediática.
- Arquitectura editorial Alertas, Focos y Dossiers.
- Cabecera editorial de dos niveles y menú hamburguesa izquierdo.
- Accesos públicos Inicio, Alertas, Focos, Dossiers, Acerca de y Medios.
- Compatibilidad temporal con Ensayos, Profundidad y Directorio.
- Tarjetas de Focos con párrafo completo, fecha de actualización y enlace.
- Responsive Preview v2 para escritorio, tablet y teléfono simultáneos.

### Validación realizada

- Astro Check y build aprobados en el paquete de implementación reconstruido.
- Portada revisada visualmente en localhost en tres viewports.
- Responsive Preview v2 ejecutado correctamente en Windows con Node 22.

### Pendiente antes del cierre

- Recorrido manual de todas las rutas nuevas y heredadas.
- Validación completa de teclado, Escape, trampa de foco y retorno de foco del menú.
- Revisión editorial de `/acerca-de/` y de los índices.
- Ejecución final de `npm run check`, `npm run build` y `git diff --check` en el repositorio instalado.
- Commit y push únicamente sobre `beta`.

### Riesgos conocidos

- La rama `beta` debe confirmarse antes de modificar archivos o hacer push.
- La URL beta pública permanece inactiva.
- Las fichas de Relevancia vs. atención mediática no sustituyen a Dossiers completos; son páginas contextuales de valoración editorial.

## Beta 4 — Compleción EE. UU.–China — 2026-10-01

**Estado:** integrada y validada en beta; review pendiente de revisión humana previa a un futuro pase a main.

- Cuatro expedientes y análisis propios: riesgos de IA, inversión saliente en tecnologías sensibles, bienes no sensibles y licencias de tierras raras.
- Tarjetas con complementarios y relaciones transversales diferenciados, enlaces explícitos, tipo y mecanismo; anclas compatibles para señales trasladadas.
- Cuatro traslados con propiedad única, cinco antecedentes nuevos, nueve fuentes nuevas y tres reverificadas. IA distingue diálogo informado de canal operativo, sin asignar puntuaciones ni probabilidades.
- Tres vínculos transversales conservados; sin incorporar Sahel ni alterar main o producción. La entrega beta y el futuro pase a main se registran como pasos separados.
- Detalles y comprobaciones: [COMPLECION-EEUU-CHINA-2026-10-01.md](COMPLECION-EEUU-CHINA-2026-10-01.md).
- Entrega de producto verificada: ac16472c1e1f2c57e4bbbcffdc5a3e4f5ecaf72f en origin/beta. QA: 326 pruebas, check/build público y editorial, datos, enlaces y revisión responsive aprobados. Main permanece en 5790d4a4c338e21d01820b64069b4249f76dc4a0.

## Producción — EE. UU.–China — 2026-10-01

**Estado actual:** promoción autorizada a main ejecutada; tarea done, avance 100 %.

- El pedido «actualizar main» habilitó el avance desde 5790d4a4c338e21d01820b64069b4249f76dc4a0 a 9b9f9273c7e1696e84bee5b43a4261c6cbeb5113, conservando el producto previamente validado en beta. Origin/main y origin/beta quedaron iguales.
- Incluye el análisis rector, cuatro análisis y expedientes propios, relaciones transversales diferenciadas y anclas conservadas, con límites de fuentes y evaluación editorial sin asignar.
- La comprobación HTTP inicial confirma el nuevo contenido en el índice de rectores. Las once rutas respondieron HTTP 200, con canónicas correctas y sin noindex; la tarjeta pública muestra cuatro complementarios y tres relacionados. Detalle en [COMPLECION-EEUU-CHINA-2026-10-01.md](COMPLECION-EEUU-CHINA-2026-10-01.md).
- El estado anterior de beta en review y de main pendiente queda superado por esta entrega; se conserva como antecedente histórico.

## Preparación local — Evaluación EE. UU.–China — 2026-10-01

**Estado:** review; QA automatizado y visual aprobados, revisión del usuario y publicación pendientes. Tarea ED-EEUU-CHINA-EVALUACION-20261001.

- El rector recibe relevancia 4,8/5, atención 4/5 y brecha +0,8, con confianza media. La ficha metodológica expone la evidencia y los límites de la muestra dirigida.
- Siete piezas periodísticas de cinco orígenes dentro de la ventana del 1 de septiembre al 1 de octubre; deduplicación editorial de agencias y límites de acceso explícitos. Siete fuentes estructurales respaldan la relevancia.
- Fundamentos conservados al guardar; solo se publican con evaluación coincidente y fuentes verificadas. Los cuatro complementarios continúan sin asignación propia y el resto del corpus no cambia.
- QA automatizado integral aprobado: 333 pruebas y ambas compilaciones. Comprobación visual responsive aprobada a 1200, 768 y 390 píxeles mediante marcos del build local; sin desbordamiento, enlaces legibles, teclado y retorno de foco comprobados. Esta entrega no se ha enviado a beta ni a main y no constituye un despliegue.
- Detalle: [Evaluación EE. UU.–China](EVALUACION-EEUU-CHINA-2026-10-01.md).

## Producción — Evaluación EE. UU.–China — 2026-10-01

**Estado actual:** producto publicado y verificado; tarea ED-EEUU-CHINA-EVALUACION-20261001 en done, avance 100 %.

- Producto d9d117cc76f5d6c0539e4ca9ed2b42a669f5b099, enviado atómicamente a origin/beta y origin/main por autorización expresa «pasar a beta y a main». Main local coincide y el checkout permanece en beta.
- Verificación pública del 2026-10-01T19:29:05.3457195Z: relevancia 4,8/5, atención 4/5, brecha +0,8 y confianza media; expediente y fundamento disponibles en producción. Ficha de fundamento con relevancia 4,8; atención4,0; brecha+0,8; confianza media; siete piezas periodísticas. Enlace Abrir expediente funciona; expediente muestra los mismos valores.
- El fundamento expone siete fuentes estructurales y siete piezas periodísticas de cinco orígenes, con fechas, atribución, acceso parcial y límites. Los cuatro complementarios conservan la ausencia de valoración propia.
- QA de 333 pruebas, check, compilaciones, datos, SEO, navegación, tipografía y revisión responsive aprobados sobre el producto publicado.
- Este hito supera la preparación local en review y sus pendientes. La gestión de cierre se conserva separada del commit de producto; detalle en [Evaluación EE. UU.–China](EVALUACION-EEUU-CHINA-2026-10-01.md).
