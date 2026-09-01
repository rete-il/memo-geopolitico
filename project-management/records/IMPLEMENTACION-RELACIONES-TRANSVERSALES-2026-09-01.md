# Implementación de relaciones transversales — cierre previo al rector mundial

Fecha de cierre: 2026-09-01

Rama objetivo: `beta`

## Resultado

La base queda preparada para continuar con el macroevento rector de riesgo de Tercera Guerra Mundial. El bloqueo señalado por la auditoría transversal fue resuelto sin promover contenidos a `main` ni cambiar el estado editorial de los análisis.

## Cambios realizados

- Se incorporó un contrato canónico para relaciones entre macroeventos con tipo, dirección, reciprocidad, mecanismo, evidencia, estado de revisión, justificación y condición de refutación.
- Se migraron 30 relaciones heredadas al contrato tipado.
- Se asignó propietario canónico a las 214 señales del corpus; 26 usos cruzados quedaron como referencias transversales, sin duplicar la señal original.
- Se añadieron validaciones de integridad para impedir IDs duplicados, destinos inexistentes, autorrelaciones, tipos inválidos, reciprocidad incoherente y evidencia huérfana.
- La proyección pública conserva solamente los campos autorizados y la ficha del Observatorio muestra los mecanismos transversales auditados.
- Se documentó el contrato en `SPEC-011-relaciones-transversales.md` y se añadieron pruebas específicas de migración, normalización y rechazo de inconsistencias.
- Las exportaciones auxiliares y el almacén local de paquetes quedaron excluidos del control de versiones.

## Estado cuantitativo

- 51 macroeventos en el corpus.
- 11 macroeventos rectores.
- 30 relaciones tipadas.
- 214 señales con propietario canónico válido.
- 26 referencias transversales explícitas.

## Verificación

- Contrato transversal: 3 pruebas aprobadas.
- Suite completa: 211 pruebas aprobadas, 0 fallas.
- Validación de datos públicos: aprobada; sólo advertencias editoriales no bloqueantes.
- Astro check: 0 errores y 0 advertencias; 49 sugerencias informativas en archivos históricos.
- Construcción pública y editorial: aprobadas.
- Validación de artefactos: 488 páginas públicas, 506 páginas editoriales, 25 publicaciones públicas, 43 publicaciones editoriales, 51 expedientes y 0 enlaces internos rotos.
- QA visual en localhost: expediente del rector nuclear, relaciones tipadas y análisis editorial completo accesibles. La vista editorial se comprobó sobre el artefacto `dist-preview`.

## Límite editorial preservado

Los nuevos análisis continúan como borradores locales. `beta` recibe el contrato, los expedientes, la proyección autorizada y las herramientas de validación; no se promovió ningún borrador a publicación ni se realizó sincronización con `main`.

## Decisión de continuidad

La arquitectura transversal ya no constituye un bloqueo para redactar el macroevento rector mundial. Su desarrollo deberá reutilizar relaciones y señales existentes mediante referencias, explicitar mecanismos de transmisión y preservar hipótesis alternativas y condiciones de refutación.
