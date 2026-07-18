# Estado del proyecto

> Archivo generado. Editar `data/*.json` y ejecutar `node project-management/tools/update-dashboard.mjs`.

**Actualizado:** 2026-07-18

**Rama de trabajo:** `beta`

**Release actual:** Beta 0 — Baseline, seguridad y control

**Avance ponderado total:** **14%**

## Resumen

| Métrica | Valor |
|---|---:|
| Total de work items | 91 |
| Terminados | 21 |
| En progreso | 0 |
| En revisión | 0 |
| Bloqueados | 0 |
| Listos | 7 |
| P0 abiertos | 17 |

## Release actual

**Objetivo:** Consolidar documentación, rama de trabajo, reproducibilidad y correcciones P0/P1 antes del refactor visual.

**Avance del release:** 77%

### Trabajo activo

No hay tareas marcadas como en progreso, revisión o bloqueadas.

### Próximas tareas listas

| ID | Prioridad | Trabajo | Release | Dependencias |
|---|---|---|---|---|
| OPS-002 | P1 | Versionar Node con .nvmrc o .node-version | beta-0-baseline | — |
| OPS-003 | P1 | Versionar configuración Netlify en netlify.toml | beta-0-baseline | OPS-002 |
| SEO-001 | P1 | Crear default-og.png y validar Open Graph | beta-0-baseline | — |
| SEO-002 | P1 | Publicar robots.txt seguro y sitemap | beta-0-baseline | OPS-003 |
| UX-001 | P1 | Crear página 404 coherente con la marca | beta-0-baseline | — |
| UI-001 | P1 | Cargar iconografía globalmente o empaquetarla | beta-0-baseline | — |
| IA-001 | P0 | Aprobar arquitectura editorial Monitor/Análisis/Ensayos/Directorio/Regiones | beta-1-foundations | FIX-001 |

### P0 abiertos

| ID | Estado | Trabajo | Release |
|---|---|---|---|
| IA-001 | Lista | Aprobar arquitectura editorial Monitor/Análisis/Ensayos/Directorio/Regiones | beta-1-foundations |
| REG-001 | Propuesta | Aprobar taxonomía de regiones, subregiones y teatros | beta-2-navigation-regions |
| REG-002 | Propuesta | Crear fuente central src/config/regions.ts | beta-2-navigation-regions |
| REG-003 | Propuesta | Crear índice /regiones/ y rutas dinámicas | beta-2-navigation-regions |
| REG-004 | Propuesta | Crear plantilla regional con datos e interpretación separados | beta-2-navigation-regions |
| NAV-001 | Propuesta | Implementar menú hamburguesa móvil accesible | beta-2-navigation-regions |
| FRIC-001 | Propuesta | Aprobar metodología, umbrales y vocabulario | beta-3-monitor-friction |
| FRIC-002 | Propuesta | Crear modelo de datos con fuentes, confianza y actualización | beta-3-monitor-friction |
| FRIC-003 | Propuesta | Crear dataset editorial inicial real | beta-3-monitor-friction |
| FRIC-004 | Propuesta | Implementar panel y tarjetas responsive | beta-3-monitor-friction |
| FRIC-006 | Propuesta | Publicar página de metodología del indicador | beta-3-monitor-friction |
| DIR-001 | Propuesta | Definir arquitectura modular y contratos | beta-5-directory |
| DIR-002 | Propuesta | Extraer filtros, orden y paginación a módulos puros | beta-5-directory |
| DIR-003 | Propuesta | Separar toolbar, filtros, KPIs, tabla y modal | beta-5-directory |
| OPS-004 | Propuesta | Crear smoke test y procedimiento de rollback | beta-6-hardening |
| DOC-002 | Propuesta | Actualizar docs/ al estado implementado | beta-6-hardening |
| REL-001 | Propuesta | Aprobar merge beta → main | beta-6-hardening |

## Cómo actualizar

1. Editar `data/work-items.json`.
2. Ejecutar el generador.
3. Revisar cambios.
4. Hacer commit en `beta`.
