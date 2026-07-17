# SPEC-009 — QA y release

**Estado:** Borrador  
**Release:** Beta 6  
**Work items:** QA-002, QA-003, CI-001, PERF-001, SEC-001, OPS-004, REL-001

## Objetivo

Definir evidencia mínima para fusionar `beta` a `main`.

## Cobertura

- Type checking y lint.
- Pruebas unitarias de lógica.
- E2E de navegación y flujos.
- Enlaces y rutas.
- Accesibilidad.
- SEO.
- Rendimiento.
- Seguridad y cabeceras.
- Rollback.

## Criterios de aceptación

- CI verde.
- P0/P1 del release cerrados o aceptados explícitamente.
- Rutas críticas pasan smoke test.
- No existen regresiones conocidas sin documentar.
- Product Owner aprueba el merge.
