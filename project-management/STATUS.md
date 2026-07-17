# Estado del proyecto

> Archivo generado. Editar `data/*.json` y ejecutar `node project-management/tools/update-dashboard.mjs`.

**Actualizado:** 2026-07-17  
**Rama de trabajo:** `beta`  
**Release actual:** Beta 0 — Baseline, seguridad y control  
**Avance ponderado total:** **3%**

## Resumen

| Métrica | Valor |
|---|---:|
| Total de work items | 80 |
| Terminados | 3 |
| En progreso | 0 |
| En revisión | 1 |
| Bloqueados | 0 |
| Listos | 14 |
| P0 abiertos | 25 |

## Release actual

**Objetivo:** Consolidar documentación, rama de trabajo, reproducibilidad y correcciones P0/P1 antes del refactor visual.

**Avance del release:** 24%

### Trabajo activo

| ID | Estado | Trabajo | Responsable | Progreso |
|---|---|---|---|---:|
| DOC-001 | ◆ En revisión | Incorporar documentación técnica v2 al repositorio | Rete | 90% |

### Próximas tareas listas

| ID | Prioridad | Trabajo | Release | Dependencias |
|---|---|---|---|---|
| PM-003 | P0 | Confirmar rama beta local y upstream origin/beta | beta-0-baseline | — |
| PM-004 | P0 | Integrar project-management/ en la rama beta | beta-0-baseline | PM-002, PM-003 |
| OPS-002 | P1 | Versionar Node con .nvmrc o .node-version | beta-0-baseline | — |
| OPS-003 | P1 | Versionar configuración Netlify en netlify.toml | beta-0-baseline | OPS-002 |
| QA-001 | P0 | Agregar astro check y dependencias necesarias | beta-0-baseline | — |
| FIX-001 | P0 | Corregir rutas inexistentes del encabezado | beta-0-baseline | — |
| FIX-002 | P0 | Completar el índice /ensayos/ | beta-0-baseline | — |
| FIX-003 | P0 | Retirar o normalizar placeholder Indo-Pacífico | beta-0-baseline | — |
| FIX-004 | P0 | Corregir o retirar CTA Ko-fi provisional | beta-0-baseline | — |
| SEO-001 | P1 | Crear default-og.png y validar Open Graph | beta-0-baseline | — |
| SEO-002 | P1 | Publicar robots.txt seguro y sitemap | beta-0-baseline | OPS-003 |
| UX-001 | P1 | Crear página 404 coherente con la marca | beta-0-baseline | — |
| UI-001 | P1 | Cargar iconografía globalmente o empaquetarla | beta-0-baseline | — |
| IA-001 | P0 | Aprobar arquitectura editorial Monitor/Análisis/Ensayos/Directorio/Regiones | beta-1-foundations | FIX-001 |

### P0 abiertos

| ID | Estado | Trabajo | Release |
|---|---|---|---|
| PM-003 | Lista | Confirmar rama beta local y upstream origin/beta | beta-0-baseline |
| PM-004 | Lista | Integrar project-management/ en la rama beta | beta-0-baseline |
| DOC-001 | En revisión | Incorporar documentación técnica v2 al repositorio | beta-0-baseline |
| QA-001 | Lista | Agregar astro check y dependencias necesarias | beta-0-baseline |
| FIX-001 | Lista | Corregir rutas inexistentes del encabezado | beta-0-baseline |
| FIX-002 | Lista | Completar el índice /ensayos/ | beta-0-baseline |
| FIX-003 | Lista | Retirar o normalizar placeholder Indo-Pacífico | beta-0-baseline |
| FIX-004 | Lista | Corregir o retirar CTA Ko-fi provisional | beta-0-baseline |
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
