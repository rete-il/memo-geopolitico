# Incorporación de EE. UU.–China y cooperación en IA

Fecha: 1 de octubre de 2026. Tarea: ED-EEUU-CHINA-20261001.

## Autorización y estado

El usuario indicó: «Incorporarlo al sitio y pasarlo a beta». Se registra como autorización para integrar el contenido local, preparar el commit y entregar exclusivamente en `origin/beta`, después de las comprobaciones y la revisión de diferencias. Antes del push se presentarán los archivos y commits concretos. No se modifica `main`.

<!-- ESTADO-ENTREGA -->
Producto integrado, validado y entregado en origin/beta: bb5b49eeabcddf28fb2847d91b951edfe6930647. La instrucción del usuario autorizó la incorporación y su entrega a beta. Main conserva 5790d4a4c338e21d01820b64069b4249f76dc4a0; producción permanece sin cambios. Este registro documenta la verificación remota del commit de producto.
<!-- FIN-ESTADO-ENTREGA -->

Según README y `project-management/data/project.json`, beta no tiene un sitio independiente. Netlify publica únicamente main; entregar en beta no cambia `memogeopolitico.com`.

## Alcance

- Incorporar el macroevento «Competencia geoeconómica y tecnológica entre Estados Unidos y China y reorganización de las interdependencias estratégicas» con sus fuentes, señales, delimitaciones y referencias a procesos existentes.
- Incorporar el artículo «Estados Unidos y China negocian los límites de su competencia tecnológica» en el contrato de publicaciones y vincularlo al macroevento. Ruta prevista: `/publicaciones/eeuu-china-competencia-tecnologica-cooperacion-ia/`.
- Conservar el parámetro cualitativo de cooperación en IA y sus estados observables, reglas, evidencias y límites. El estado inicial es cooperación anunciada; la ejecución sigue pendiente de verificación.
- Corregir el contrato de persistencia y proyección necesario para conservar `estado_evaluacion: no_asignada`, los campos analíticos y los parámetros. Evitar la conversión de ausencias en 3/5, 1/5 o confianza media, y su visualización como evaluaciones realizadas.
- Preservar las evaluaciones de registros existentes y la propiedad de las señales referenciadas. La corrección no autoriza calificar el nuevo macroevento ni trasladar señales desde otros procesos.
- Sahel no se incorpora en esta entrega. No se modifica producción ni se crean ramas o PR.

## Fuentes del artículo

El artículo preparado contiene las siguientes ocho referencias. Esta lista inventaría la bibliografía; no sustituye la verificación de contenidos y vigencia. Los antecedentes de 2024–2025 acreditan medidas históricas. Los comunicados de ambos gobiernos sobre un mismo acuerdo no se cuentan como corroboraciones independientes de ejecución. Las propuestas y reservas de expertos se atribuyen a sus autores.

- 2026-09-25 — [Fact Sheet: President Donald J. Trump Advances a Fair and Reciprocal Relationship with China While Hosting Historic State Visit](https://www.whitehouse.gov/fact-sheets/2026/09/fact-sheet-president-donald-j-trump-advances-a-fair-and-reciprocal-relationship-with-china-while-hosting-historic-state-visit/). Identificador: `src-eeuu-china-whitehouse-ia-20260925`.
- 2026-09-26 — [China and the United States Reach Eight Deliverables and Understandings](https://un.china-mission.gov.cn/eng/zgyw/202609/t20260926_12031663.htm). Identificador: `src-eeuu-china-mision-onu-ia-20260926`.
- 2024-10-28 — [Additional Information on Final Regulations Implementing Outbound Investment Executive Order (E.O. 14105)](https://home.treasury.gov/news/press-releases/jy2690). Identificador: `src-eeuu-china-treasury-inversion-20241028`.
- 2025-04-04 — [MOFCOM and GACC Announcement No. 18 of 2025](https://english.mofcom.gov.cn/Policies/AnnouncementsOrders/art/2025/art_0dd87cbee7b045bf93fabe6ab2faceee.html). Identificador: `src-eeuu-china-mofcom-licencias-20250404`.
- 2026-09-27 — [Ambassador Greer Issues a Statement on Announcement of Recommendations from the U.S.-China Board of Trade](https://ustr.gov/about/policy-offices/press-office/press-releases/2026/september/ambassador-greer-issues-statement-announcement-recommendations-us-china-board-trade). Identificador: `src-eeuu-china-ustr-30for30-20260927`.
- 2026-09-27 — [Terms of Reference for 30-for-30 Framework](https://www.whitehouse.gov/wp-content/uploads/2026/09/Terms-of-Reference-for-30-for-30-Framework.pdf). Identificador: `src-eeuu-china-30for30-terms-20260927`.
- 2026-09-29 — [What Actually Happened at the Xi-Trump Summit](https://centerforchinaanalysis.asiasociety.org/p/what-actually-happened-at-the-xi). Identificador: `src-eeuu-china-asiasociety-ia-20260929`.
- 2026-09-28 — [Takeaways from the Trump-Xi White House Summit](https://www.csis.org/analysis/takeaways-trump-xi-white-house-summit). Identificador: `src-eeuu-china-csis-ia-20260928`.

La ficha completa del macroevento puede conservar otras referencias de la investigación preparatoria. La cifra de ocho corresponde a la bibliografía del artículo. Se mantiene el corte editorial del artículo al 30 de septiembre de 2026; la fecha de integración no convierte todos sus antecedentes en una actualización exhaustiva.

## Criterios de pronóstico

La cooperación en IA condiciona los escenarios según compromisos anunciados, mecanismos operativos, continuidad y ampliación, o interrupción documentada. Esta clasificación es una operacionalización editorial propia apoyada en las fuentes; no es una escala publicada por los expertos. No asigna probabilidades ni puntuaciones automáticas. La cordialidad diplomática no demuestra alianza tecnológica; la falta de información pública no prueba ruptura. Chips, mercados, Taiwán y postura militar requieren evidencia específica.

## Validación

<!-- RESULTADOS-QA -->
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
<!-- FIN-RESULTADOS-QA -->

## Entrega y reversión

La entrega requiere comprobar rama y estado, preservar trabajo ajeno, revisar archivos concretos, evitar staging global y confirmar que solo origin/beta recibe el commit. Se anotarán el identificador del commit y la verificación remota cuando se ejecuten.

Si hubiera que retirar la incorporación, preparar una reversión de sus cambios concretos conservando el historial y cualquier trabajo posterior. No usar reset --hard ni force push. Las puntuaciones históricas y los registros de Sahel deben permanecer intactos.
