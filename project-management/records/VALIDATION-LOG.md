# Registro de validaciones

| Fecha | Entorno | Work item / release | Validación | Resultado | Evidencia |
|---|---|---|---|---|---|
| 2026-07-17 | Producción | OPS-001 | Deploy, dominio y HTTPS | Aprobado | `docs/19-*` y `docs/20-*` |
| 2026-07-19 | Paquete de actualización | IA-001 / planificación editorial | Validación estructural y regeneración del dashboard | Aprobado | `update-dashboard.mjs`: JSON válidos, IDs y dependencias válidos |
| 2026-07-19 | Entorno reconstruido | NAV-001 / HOME-002 / ED-008 / ED-009 / ED-010 / DATA-004 | Astro Check y build estático de la implementación editorial | Aprobado | 34 archivos: 0 errores, 0 advertencias y 0 hints; rutas nuevas y heredadas generadas |
| 2026-07-19 | Localhost Windows | ED-011 | Revisión visual de tarjetas de Focos en escritorio, tablet y teléfono | Aprobado | Párrafo completo, fecha de actualización y enlace `Leer foco` visibles en los tres viewports |
| 2026-07-19 | Localhost Windows / Node 22 | QA-006 | Inicio y uso de Responsive Preview v2 | Aprobado | Tres paneles operativos; error `spawn EINVAL` corregido mediante `cmd.exe` |

| 2026-07-21 | Paquete local autónomo | OBS-001 | `npm run check` y validación estructural del Observatorio v0.3.0 | Aprobado técnico; QA local integral pendiente | Esquema v2; 14 macroeventos, 26 señales, 20 fuentes, 1 expediente, 92 medios; 0 errores y 0 advertencias |
| 2026-07-21 | Piloto editorial local | OBS-002 | Flujo fuente–señal–expediente y generación de encargos para el Corredor de Lobito | Parcial / correcto para continuar investigación | 2 fuentes Reuters verificadas, 2 señales revisadas, advertencia de diversidad y suficiencia insuficiente, encargos descargados |

## Regla

Cada tarea `review` o `done` que cambie código debe registrar aquí la validación aplicable: build, ruta, teclado, responsive, SEO, datos o producción.

## 2026-10-01 — ED-EEUU-CHINA-20261001

<!-- QA-EEUU-CHINA-20261001 -->
- Node 22.12.0 oficial, SHA256 contrastado con SHASUMS256 del distribuidor. npm ci completado; package.json y package-lock.json no modificados.
- npm run qa:production aprobado; tras completar los enlaces entrantes, npm run qa final aprobado: 320 pruebas, cero fallos, Astro Check sin errores ni warnings (59 hints en archivos existentes).
- Compilaciones finales de producción y editorial aprobadas: 813 y 830 documentos HTML comprobados, respectivamente; 101 expedientes y 76 publicaciones públicas.
- Validaciones de datos, build, SEO, navegación y tipografía aprobadas; cero enlaces internos y anclas rotos en ambas compilaciones.
- QA visual en localhost:8766 a 1440, 768 y 390 píxeles: título, resumen, cuerpo y fuentes legibles, sin desbordamiento horizontal. Ficha de IA comprobada en teléfono; estado anunciado y evaluación editorial sin asignar visibles.
- Navegación comprobada: Publicaciones y Macroeventos rectores muestran la incorporación; el artículo abre su seguimiento y el botón Abrir expediente abre la ficha. La metodología explica la ausencia de puntuación. Menú por teclado, Escape, clic exterior, retorno y foco visible comprobados.
- Preservación verificada: los 100 macroeventos canónicos anteriores y las 362 fuentes públicas anteriores son idénticos. Solo se añaden los tres vínculos entrantes en las fichas públicas de semiconductores, África central y remilitarización; permanecen intactos sus demás campos y propietarios.
- Bibliografía del artículo: ocho fuentes verificadas y cuatro señales públicas. Cinco referencias adicionales y una señal de mayo se conservan pendientes en el corpus interno; no respaldan la proyección pública.
- Prueba específica sobre el JSON público guardado aprobada: cada relación está presente de forma idéntica en ambos extremos, con fuentes identificables y propietarios canónicos.
- git diff --check y git diff --cached --check aprobados antes del commit de producto. Commit bb5b49eeabcddf28fb2847d91b951edfe6930647 subido y confirmado en origin/beta; main remota y local permanecen en 5790d4a4c338e21d01820b64069b4249f76dc4a0.
- npm ci informó ocho vulnerabilidades del conjunto de dependencias fijado (una moderada, seis altas y una crítica) y un aviso de limpieza EPERM, con salida exitosa. No se alteraron dependencias ni se aplicaron actualizaciones fuera del alcance.
<!-- FIN-QA-EEUU-CHINA-20261001 -->

## 2026-10-01 — ED-EEUU-CHINA-COMPLEMENTARIOS-20261001

<!-- QA-EEUU-CHINA-COMPLEMENTARIOS-20261001 -->
- Node 22.12.0: npm run qa aprobado, 326 pruebas y cero fallos; Astro Check con 0 errores, 0 warnings y 60 hints. Compilaciones pública/editorial aprobadas: 836/853 documentos HTML, 105 expedientes y 80 artículos públicos. Datos, SEO, navegación y tipografía aprobados; cero enlaces internos o anclas rotos en ambos builds. git diff --check aprobado. QA visual a 1440, 768 y 390 píxeles sin desbordamiento horizontal; cuatro hijos y tres transversales visibles, artículos/fichas legibles, teclado, Escape, clic exterior y retorno del foco comprobados. Se verificó el enlace anterior de la señal IA y su navegación al nuevo propietario.
- Preservados los otros 100 macroeventos y sus proyecciones, las tres relaciones transversales y sus propietarios. Cuatro señales trasladadas sin duplicación; cinco antecedentes distintos, nueve fuentes nuevas y tres reverificadas.
- Producto aplicado, validado y entregado a origin/beta en ac16472c1e1f2c57e4bbbcffdc5a3e4f5ecaf72f. Main local y remota permanecen en 5790d4a4c338e21d01820b64069b4249f76dc4a0. La revisión del usuario y un futuro pase a main siguen pendientes; la tarea conserva review. La gestión se registra por separado del producto.
<!-- FIN-QA-EEUU-CHINA-COMPLEMENTARIOS-20261001 -->

Registro: [Compleción EE. UU.–China](COMPLECION-EEUU-CHINA-2026-10-01.md).

## 2026-10-01 — ED-EEUU-CHINA-COMPLEMENTARIOS-20261001 — Promoción a main y comprobación pública

<!-- QA-PRODUCCION-EEUU-CHINA-20261001 -->
- Usuario: autorización expresa «actualizar main»; aceptación de la entrega y cierre de la tarea en done, avance 100 %.
- Promoción de 5790d4a4c338e21d01820b64069b4249f76dc4a0 a 9b9f9273c7e1696e84bee5b43a4261c6cbeb5113; origin/main y origin/beta iguales después del push. QA previo aprobado sobre el mismo producto: 326 pruebas y comprobaciones integrales ya documentadas.
- HTTP inicial: https://memogeopolitico.com/observatorio/rectores/?verificacion=9b9f927 respondió 200 con el nuevo rector y el complemento de IA.
- Verificación en producción el 1 de octubre de 2026: once rutas respondieron HTTP 200 (índice de rectores, cinco artículos y cinco expedientes), todas con título correcto, URL canónica propia y sin noindex. El navegador público mostró 13 rectores; la tarjeta EE. UU.–China mostró cuatro complementarios y tres relacionados, y al desplegar los complementarios se mostraron los cuatro con enlaces a análisis y expedientes. Captura a 1280 × 720 sin desbordamiento horizontal. El producto coincide con la versión que aprobó las 326 pruebas y el QA responsive previo.
<!-- FIN-QA-PRODUCCION-EEUU-CHINA-20261001 -->

Esta entrada supera la espera de revisión y promoción a main de la etapa beta. Detalle: [Compleción EE. UU.–China](COMPLECION-EEUU-CHINA-2026-10-01.md).

## 2026-10-01 — ED-EEUU-CHINA-EVALUACION-20261001 — QA local

- Node 22.12.0; npm run qa completo: 333 pruebas aprobadas, cero fallos. Astro Check: 0 errores, 0 warnings, 61 hints.
- Build público y editorial aprobados: 836/853 documentos HTML, 105 expedientes, 80 artículos públicos. Validación de datos, SEO, navegación y tipografía aprobadas. Cero enlaces internos y anclas rotos en ambos builds.
- Contrato de fundamento: persistencia y recarga; omisión de campos internos; invalidación al cambiar puntuaciones o confianza; exclusión de referencias pendientes, desconocidas o ajenas; validación temporal; HTML escapado y enlaces atribuidos.
- Preservados los otros 104 procesos y las cuatro evaluaciones complementarias pendientes. La gestión conserva los 117 work items anteriores y agrega solo ED-EEUU-CHINA-EVALUACION-20261001; releases globales intactos.
- QA visual responsive pendiente por timeout del control de viewport. No equivale a error visual confirmado ni a revisión aprobada. Revisión del usuario y publicación también pendientes.
- Registro y fuentes: [Evaluación EE. UU.–China](EVALUACION-EEUU-CHINA-2026-10-01.md).

### ED-EEUU-CHINA-EVALUACION-20261001 — Resultado visual y navegación local

- QA visual responsive aprobado sobre el build de producción servido localmente en localhost:8767, mediante marcos de igual origen de 1200, 768 y 390 píxeles. En los tres, body.clientWidth y body.scrollWidth coincidieron: 1185, 753 y 375 píxeles, sin desbordamiento horizontal. Texto y enlaces legibles. En teléfono, el menú abre, Tab conduce a Inicio y Escape cierra y devuelve el foco al botón. En localhost:8766, el expediente muestra 4,8 / 4,0 / +0,8 y el enlace «Cómo interpretar estos valores» navega al fundamento.
- La capacidad de modificar el viewport devolvió un timeout; la comprobación se completó mediante marcos de dimensiones fijas que cargaron el build desde un servidor temporal fuera del repositorio. Las medidas corresponden al contenido de esos marcos, no a dispositivos físicos. No se añaden herramientas de revisión al producto.
- Capturas de esta evaluación: escritorio.png, tablet.png, telefono.png y valoracion-local.png, conservadas en outputs/evaluacion-eeuu-china-2026-10-01 del workspace de la tarea.
- La revisión visual pendiente registrada arriba queda completada. El QA integral conserva 333 pruebas aprobadas; no hubo cambios de código o datos después de esa ejecución. Pendientes revisión del usuario y publicación.

## 2026-10-01 — ED-EEUU-CHINA-EVALUACION-20261001 — Comprobación en producción

Producto d9d117cc76f5d6c0539e4ca9ed2b42a669f5b099, enviado atómicamente a origin/beta y origin/main por autorización expresa «pasar a beta y a main». Main local coincide y el checkout permanece en beta.

- [/metodologia/relevancia-atencion-mediatica/eeuu-china-competencia-geoeconomica-interdependencias/](https://memogeopolitico.com/metodologia/relevancia-atencion-mediatica/eeuu-china-competencia-geoeconomica-interdependencias/): HTTP 200; canónica https://memogeopolitico.com/metodologia/relevancia-atencion-mediatica/eeuu-china-competencia-geoeconomica-interdependencias/; noindex intencional de la ficha metodológica.
- [/observatorio/eeuu-china-competencia-geoeconomica-interdependencias/](https://memogeopolitico.com/observatorio/eeuu-china-competencia-geoeconomica-interdependencias/): HTTP 200; canónica https://memogeopolitico.com/observatorio/eeuu-china-competencia-geoeconomica-interdependencias/; sin noindex.
- [/publicaciones/eeuu-china-competencia-tecnologica-cooperacion-ia/](https://memogeopolitico.com/publicaciones/eeuu-china-competencia-tecnologica-cooperacion-ia/): HTTP 200; canónica https://memogeopolitico.com/publicaciones/eeuu-china-competencia-tecnologica-cooperacion-ia/; sin noindex.

Verificación pública del 2026-10-01T19:29:05.3457195Z: relevancia 4,8/5, atención 4/5, brecha +0,8 y confianza media; expediente y fundamento disponibles en producción. Ficha de fundamento con relevancia 4,8; atención4,0; brecha+0,8; confianza media; siete piezas periodísticas. Enlace Abrir expediente funciona; expediente muestra los mismos valores.

Capturas de producción: valoracion-publicada.png, conservadas entre los artefactos de la tarea.

- Se conserva el QA de 333 pruebas y revisión visual local sobre el mismo producto. Las comprobaciones públicas confirman esta entrega; no se presentan como un nuevo censo de fuentes ni un recálculo de puntuaciones.
- La autorización del usuario y la publicación completan la tarea: done, avance 100 %. Sin modificaciones de los otros 104 procesos ni de releases globales.
