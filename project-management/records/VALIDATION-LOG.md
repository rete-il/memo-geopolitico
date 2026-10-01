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
