# Implementación del rector Rusia–Ucrania

**Fecha:** 2026-09-02
**Rama:** `beta`
**Macroevento rector:** `rusia-ucrania-redes-seguridad-sostenimiento`
**Estado de los análisis nuevos:** borrador / vista editorial local
**Publicación de los análisis nuevos:** no autorizada

## Resultado

El rector **«Guerra Rusia–Ucrania y reconfiguración de redes internacionales de seguridad y sostenimiento»** quedó organizado en seis procesos complementarios independientes. Se reutilizó el proceso existente del mar Negro y se crearon cinco expedientes nuevos con pregunta de seguimiento, hipótesis principal y alternativas, mecanismo causal, escenarios, indicadores de fortalecimiento y debilitamiento, condiciones de refutación e incertidumbres.

## Procesos creados

1. `asistencia-militar-occidental-ucrania-transformacion`
2. `base-industrial-defensa-guerra-rusia-ucrania`
3. `rusia-adaptacion-sanciones-restricciones-tecnologicas`
4. `terceros-estados-sostenimiento-rusia-guerra-ucrania`
5. `garantias-seguridad-arquitectura-europea-posguerra-ucrania`

Los cinco cuentan con análisis editorial completo en `src/content/publicaciones/_preview/`. Ninguno fue promovido a `publicadas/` ni genera una ruta de publicación en la construcción pública.

## Proceso reutilizado

- `mar-negro-azov-guerra-logistica`: se convirtió en rama subordinada del rector sin perder identidad, análisis publicado, señales propias ni sus conexiones con Turquía y los corredores logísticos.

## Decisiones de fusión y descarte

- Drones, municiones, defensa aérea, mantenimiento y entrenamiento quedaron como dimensiones de asistencia o base industrial, no como procesos autónomos.
- Energía, cereales, puertos, seguros y navegación permanecen en el expediente del mar Negro o en la adaptación sancionatoria según su mecanismo.
- Reconstrucción, activos congelados, movilización social, diáspora y extensión hacia África y Medio Oriente se conservaron como variables, incertidumbres o relaciones transversales hasta que exista causalidad independiente suficiente.
- No se creó una rama genérica de «apoyos externos»: el sostenimiento de Rusia distingue explícitamente a Bielorrusia, Irán, Corea del Norte, China y otros intermediarios por función, evidencia y grado de compromiso.

## Evidencia y propiedad

- Corpus final: 57 macroeventos, 226 señales, 306 fuentes y 53 relaciones tipadas.
- Evidencia nueva: 12 señales y 16 fuentes incorporadas.
- Evidencia reasignada: las 6 señales y 9 fuentes que pertenecían al rector pasaron a sus procesos causales específicos.
- Rector: 0 señales propias, 0 fuentes propias y 13 referencias de segundo orden. La ausencia de propiedad directa es intencional.
- No existen IDs duplicados, señales con propietario discordante ni señales que apunten a fuentes ajenas a su expediente.
- Se combinaron fuentes aliadas, ucranianas, rusas, europeas, multilaterales y de investigación. Las declaraciones oficiales se tratan como evidencia de posición o compromiso, no como prueba autosuficiente de ejecución.

## Relaciones

Se añadieron doce relaciones bajo el contrato transversal:

- Seis relaciones `subordinada`, una por cada rama del rector.
- Industria de defensa ↔ remilitarización industrial mundial.
- Adaptación sancionatoria → corredores alternativos.
- Sostenimiento de Rusia por terceros ↔ Indo-Pacífico.
- Garantías europeas ↔ disuasión nuclear multipolar.
- Rail Baltica → garantías y capacidad de refuerzo europea.
- Turquía → mar Negro y aplicación de Montreux.

Se preservaron las relaciones existentes con el rector sistémico mundial, Sudán, minerales críticos, hemisferio occidental y derechas transnacionales. Cada vínculo conserva tipo, dirección, reciprocidad, mecanismo, evidencia, estado de revisión, justificación y condición de refutación.

## Interfaz y estado editorial

- El listado de rectores muestra seis ramificaciones y separa las acciones «Leer análisis» y «Expediente».
- La construcción pública expone los seis expedientes, pero sólo ofrece análisis para la rama del mar Negro, ya publicada con anterioridad.
- La construcción editorial incorpora los cinco análisis nuevos y los identifica como «Vista local · En documentación».
- La ficha de expediente muestra definición, delimitación, hipótesis, mecanismo, indicadores, refutación, incertidumbres, señales, fuentes y relaciones.
- Se corrigió el cálculo de estado editorial: una publicación donde el proceso aparece sólo como secundario ya no convierte el expediente en «Publicado». Sólo una publicación principal propia puede elevar ese estado.

## Validación

- Contrato transversal: 3/3 pruebas aprobadas.
- Suite completa: 211 pruebas aprobadas, 0 fallos.
- Datos de producción, publicaciones, medios y vista local: válidos; las advertencias de amplitud temática son no bloqueantes y ya forman parte del modelo editorial.
- Astro: 0 errores, 0 advertencias y 49 sugerencias históricas.
- Build público: 517 páginas.
- Build editorial: 541 páginas.
- Validación de build: 57 expedientes, 57 páginas metodológicas y 0 enlaces internos rotos.
- QA visual: listado, ramas, cinco expedientes y cinco análisis revisados en escritorio y a 390 px; 0 errores de navegador y 0 desbordamiento horizontal.
- Exposición: los cinco análisis existen en la construcción editorial y no existen en la construcción pública.

## Rutas locales revisadas

- Vista pública: `http://127.0.0.1:4331/observatorio/rectores/`
- Vista editorial: `http://127.0.0.1:4330/observatorio/rectores/`
- Expediente rector: `http://127.0.0.1:4330/observatorio/rusia-ucrania-redes-seguridad-sostenimiento/`

## Límites preservados

- `main` no fue modificada, fusionada ni sincronizada.
- Los cinco análisis nuevos continúan en estado `borrador`.
- No se realizó despliegue ni publicación remota del sitio.
- No se incorporaron cachés, builds, respaldos ni herramientas temporales al control de versiones.
