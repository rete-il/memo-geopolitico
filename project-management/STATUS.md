# Estado del proyecto

> Archivo generado. Editar `data/*.json` y ejecutar `node project-management/tools/update-dashboard.mjs`.

**Actualizado:** 2026-09-15

**Rama de trabajo:** `beta`

**Release actual:** Beta 0 — Baseline, seguridad y control

**Avance ponderado total:** **30%**

## Resumen

| Métrica | Valor |
|---|---:|
| Total de work items | 114 |
| Terminados | 29 |
| En progreso | 2 |
| En revisión | 13 |
| Bloqueados | 0 |
| Listos | 5 |
| P0 abiertos | 19 |

## Release actual

**Objetivo:** Consolidar documentación, rama de trabajo, reproducibilidad y correcciones P0/P1 antes del refactor visual.

**Avance del release:** 87%

### Trabajo activo

| ID | Estado | Trabajo | Responsable | Progreso |
|---|---|---|---|---:|
| NAV-001 | ◆ En revisión | Implementar cabecera editorial y menú hamburguesa izquierdo accesible | Rete | 90% |
| ED-008 | ◆ En revisión | Crear índices de Alertas, Focos y Dossiers | Rete | 90% |
| ED-009 | ◆ En revisión | Migrar Ensayos a Focos y Profundidad a Dossiers sin romper URLs | Rete | 90% |
| ED-010 | ◆ En revisión | Crear la página Acerca de Memo Geopolítico | Rete | 80% |
| DIR-010 | ◆ En revisión | Renombrar Directorio como Medios y preservar la ruta anterior | Rete | 90% |
| QA-005 | ▶ En progreso | Validar cabecera, índices, rutas heredadas y navegación por teclado | Rete | 70% |
| OBS-001 | ◆ En revisión | Consolidar el Observatorio autónomo de macroeventos y expedientes v0.3.0 | Rete | 90% |
| OBS-002 | ▶ En progreso | Completar el piloto del Corredor de Lobito hasta un Markdown publicable | Rete | 45% |
| ED-ACOP-20260915 | ◆ En revisión | Completar análisis y complementarios del rector de acoplamiento mundial | Codex | 95% |
| ED-INDOPAC-20260915 | ◆ En revisión | Completar rector y nueve complementarios del Indo-Pacífico | Codex | 95% |
| ED-NUCLEAR-20260915 | ◆ En revisión | Completar rector nuclear y siete procesos complementarios | Codex | 95% |
| ED-MINERALES-20260915 | ◆ En revisión | Completar rector de minerales de África central y seis complementarios | Codex | 95% |
| ED-REARME-20260915 | ◆ En revisión | Completar rector de remilitarización industrial y seis procesos complementarios | Codex | 95% |
| ED-HEMISFERIO-20260915 | ◆ En revisión | Completar rector hemisférico y seis procesos complementarios | Codex | 95% |
| ED-DERECHAS-20260915 | ◆ En revisión | Completar rector de derechas transnacionales y seis procesos complementarios | Codex | 95% |

### Próximas tareas listas

| ID | Prioridad | Trabajo | Release | Dependencias |
|---|---|---|---|---|
| OPS-002 | P1 | Versionar Node con .nvmrc o .node-version | beta-0-baseline | — |
| OPS-003 | P1 | Versionar configuración Netlify en netlify.toml | beta-0-baseline | OPS-002 |
| SEO-001 | P1 | Crear default-og.png y validar Open Graph | beta-0-baseline | — |
| SEO-002 | P1 | Publicar robots.txt seguro y sitemap | beta-0-baseline | OPS-003 |
| UX-001 | P1 | Crear página 404 coherente con la marca | beta-0-baseline | — |

### P0 abiertos

| ID | Estado | Trabajo | Release |
|---|---|---|---|
| REG-001 | Propuesta | Aprobar taxonomía de regiones, subregiones y teatros | beta-2-navigation-regions |
| REG-002 | Propuesta | Crear fuente central src/config/regions.ts | beta-2-navigation-regions |
| REG-003 | Propuesta | Crear índice /regiones/ y rutas dinámicas | beta-2-navigation-regions |
| REG-004 | Propuesta | Crear plantilla regional con datos e interpretación separados | beta-2-navigation-regions |
| NAV-001 | En revisión | Implementar cabecera editorial y menú hamburguesa izquierdo accesible | beta-0-baseline |
| FRIC-001 | Propuesta | Revisar criterios editoriales y escala de relevancia y atención | beta-3-monitor-friction |
| FRIC-002 | Propuesta | Evolucionar el modelo de datos con fuentes, confianza e historial | beta-3-monitor-friction |
| FRIC-003 | Propuesta | Ampliar el dataset editorial de relevancia y atención | beta-3-monitor-friction |
| FRIC-004 | Propuesta | Evolucionar el panel y las tarjetas responsive | beta-3-monitor-friction |
| FRIC-006 | Propuesta | Publicar nota metodológica del módulo editorial | beta-3-monitor-friction |
| DIR-001 | Propuesta | Definir arquitectura modular y contratos | beta-5-directory |
| DIR-002 | Propuesta | Extraer filtros, orden y paginación a módulos puros | beta-5-directory |
| DIR-003 | Propuesta | Separar toolbar, filtros, KPIs, tabla y modal | beta-5-directory |
| OPS-004 | Propuesta | Crear smoke test y procedimiento de rollback | beta-6-hardening |
| DOC-002 | Propuesta | Actualizar docs/ al estado implementado | beta-6-hardening |
| REL-001 | Propuesta | Aprobar merge beta → main | beta-6-hardening |
| ED-008 | En revisión | Crear índices de Alertas, Focos y Dossiers | beta-0-baseline |
| ED-009 | En revisión | Migrar Ensayos a Focos y Profundidad a Dossiers sin romper URLs | beta-0-baseline |
| QA-005 | En progreso | Validar cabecera, índices, rutas heredadas y navegación por teclado | beta-0-baseline |

## Cómo actualizar

1. Editar `data/work-items.json`.
2. Ejecutar el generador.
3. Revisar cambios.
4. Hacer commit en `beta`.
