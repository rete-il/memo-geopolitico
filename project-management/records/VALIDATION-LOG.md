# Registro de validaciones

| Fecha | Entorno | Work item / release | Validación | Resultado | Evidencia |
|---|---|---|---|---|---|
| 2026-07-17 | Producción | OPS-001 | Deploy, dominio y HTTPS | Aprobado | `docs/19-*` y `docs/20-*` |
| 2026-07-19 | Paquete de actualización | IA-001 / planificación editorial | Validación estructural y regeneración del dashboard | Aprobado | `update-dashboard.mjs`: JSON válidos, IDs y dependencias válidos |
| 2026-07-19 | Entorno reconstruido | NAV-001 / HOME-002 / ED-008 / ED-009 / ED-010 / DATA-004 | Astro Check y build estático de la implementación editorial | Aprobado | 34 archivos: 0 errores, 0 advertencias y 0 hints; rutas nuevas y heredadas generadas |
| 2026-07-19 | Localhost Windows | ED-011 | Revisión visual de tarjetas de Focos en escritorio, tablet y teléfono | Aprobado | Párrafo completo, fecha de actualización y enlace `Leer foco` visibles en los tres viewports |
| 2026-07-19 | Localhost Windows / Node 22 | QA-006 | Inicio y uso de Responsive Preview v2 | Aprobado | Tres paneles operativos; error `spawn EINVAL` corregido mediante `cmd.exe` |

## Regla

Cada tarea `review` o `done` que cambie código debe registrar aquí la validación aplicable: build, ruta, teclado, responsive, SEO, datos o producción.
