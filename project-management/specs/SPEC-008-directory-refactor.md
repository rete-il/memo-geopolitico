# SPEC-008 — Refactor del Directorio

**Estado:** Borrador  
**Release:** Beta 5  
**Work items:** DIR-001 a DIR-009

## Objetivo

Descomponer la página y el script monolíticos, manteniendo funcionalidad y mejorando accesibilidad, móvil y pruebas.

## Capas

- Datos y schema.
- Normalización.
- Filtros y orden.
- Estado de URL.
- Presentación.
- Exportación.

## UX

- Filtros agrupados por intención.
- Chips de filtros activos.
- Limpiar todos.
- Estado vacío útil.
- Tabla en escritorio, tarjetas en móvil.
- Modal accesible.

## Criterios de aceptación

- Resultados equivalentes al sistema actual.
- Filtros compartibles mediante URL.
- Búsqueda con y sin tildes probada.
- Exportación y paginación probadas.
- Archivos principales reducen responsabilidad y tamaño.
