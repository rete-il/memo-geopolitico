# Hoja de ruta del Observatorio

## DATA-002 — Administración básica

Estado esperado: terminado después de validar crear, editar, activar, ordenar y eliminar monitores.

## DATA-003 — Modelo de relevancia geopolítica

Objetivo: definir categorías, admisión, índices, períodos, fuentes y esquema de datos.

Entregables:

- metodología;
- modelo de datos;
- esquema JSON;
- caso de ejemplo;
- criterios de aceptación.

## UI-002 — Tarjetas de portada

- nuevo título;
- tarjetas independientes;
- relevancia, atención y brecha;
- indicadores contextuales;
- enlace a la ficha;
- consistencia visual con alertas.

## PAGE-001 — Ficha individual

Ruta:

```text
/observatorio/[id]/
```

## PAGE-002 — Comparador general

Ruta:

```text
/observatorio/
```

## DATA-004 — Historial de cortes

- conservar actualizaciones;
- representar evolución;
- registrar cambios de clasificación;
- evitar sobrescritura destructiva.

## Orden de ejecución

1. Cerrar DATA-002.
2. Aprobar DATA-003.
3. Implementar migración de datos.
4. Construir UI-002.
5. Construir PAGE-001.
6. Construir PAGE-002.
7. Añadir DATA-004.
