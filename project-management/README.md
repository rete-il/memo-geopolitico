# Project Management — Memo Geopolítico

**Versión:** 1.1  
**Creado:** 17 de julio de 2026  
**Rama de trabajo:** `beta`  
**Producción estable:** `main` → `https://memogeopolitico.com`

## Propósito

Esta carpeta gestiona el **trabajo futuro**: correcciones, refactorizaciones, nuevas funciones, riesgos, decisiones, releases y validaciones. No reemplaza `docs/`.

| Carpeta               | Responde a                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| `docs/`               | ¿Cómo funciona hoy el sistema implementado y verificable?                  |
| `project-management/` | ¿Qué vamos a cambiar, en qué orden, con qué criterios y cuál es el avance? |

Una función solo pasa de `project-management/` a `docs/` cuando está implementada, probada y aceptada.

## Paneles dinámicos

Los siguientes archivos se generan desde los datos canónicos:

- [`STATUS.md`](./STATUS.md): estado general, release actual y bloqueos.
- [`ROADMAP.md`](./ROADMAP.md): releases, objetivos y avance.
- [`BACKLOG.md`](./BACKLOG.md): tareas agrupadas por release y estado.

La fuente de verdad está en:

```text
project-management/data/
├── project.json
├── releases.json
└── work-items.json
```

Después de modificar estado, prioridad, release, dependencias o progreso, ejecutar:

```powershell
node project-management/tools/update-dashboard.mjs
```

El script valida IDs, estados, releases y dependencias antes de regenerar los paneles.

## Guía operativa de actualización

La secuencia completa para registrar el avance, regenerar paneles y publicar los cambios en `beta` se encuentra en:

- [`ACTUALIZAR-PROGRESO.md`](./ACTUALIZAR-PROGRESO.md)

## Flujo de actualización

1. Editar `data/work-items.json`.
2. Cambiar `status`, `progress`, `owner`, `notes` o `release`.
3. Ejecutar el generador.
4. Revisar `STATUS.md`, `ROADMAP.md` y `BACKLOG.md`.
5. Registrar una entrada en `CHANGELOG.md` si cambia alcance, release o decisión.
6. Hacer commit en `beta`.

## Vocabulario de estados

| Estado interno | Significado                                        |
| -------------- | -------------------------------------------------- |
| `proposed`     | Identificado, todavía no preparado para ejecutar.  |
| `ready`        | Definido y sin bloqueos conocidos.                 |
| `in_progress`  | En ejecución. Debe incluir `progress`.             |
| `blocked`      | No puede avanzar; documentar causa en `notes`.     |
| `review`       | Implementado y pendiente de revisión o aceptación. |
| `done`         | Cumple criterios de aceptación y documentación.    |
| `deferred`     | Deliberadamente postergado.                        |

## Regla de ramas

```text
main  → producción estable
beta  → integración del reacondicionamiento
feature/* → opcional para tareas aisladas
```

No fusionar `beta` a `main` hasta cumplir [`QUALITY-GATES.md`](./QUALITY-GATES.md).

## Documentos de gestión

- [`PROJECT-CHARTER.md`](./PROJECT-CHARTER.md): propósito, alcance y principios.
- [`WORKFLOW.md`](./WORKFLOW.md): ciclo de una tarea y mantenimiento.
- [`QUALITY-GATES.md`](./QUALITY-GATES.md): Definition of Ready, Done y puertas de release.
- [`RISK-REGISTER.md`](./RISK-REGISTER.md): riesgos, incidencias y dependencias.
- [`DECISION-LOG.md`](./DECISION-LOG.md): decisiones arquitectónicas y de producto.
- [`CHANGELOG.md`](./CHANGELOG.md): cambios de alcance y gestión.
- [`specs/`](./specs/): especificaciones funcionales previas a implementación.
- [`templates/`](./templates/): plantillas reutilizables.
- [`records/`](./records/): historial de avances, validaciones y notas de release.

## Reglas de consistencia

- Cada trabajo usa un ID estable: `FIX-`, `FEAT-`, `REF-`, `UX-`, `A11Y-`, `SEO-`, `OPS-`, `QA-`, `DATA-`, `CONTENT-`, `PM-`.
- Cada nueva funcionalidad relevante requiere especificación.
- Toda decisión irreversible o transversal se registra en `DECISION-LOG.md`.
- Todo cambio de URL debe incluir redirect y prueba.
- Todo cambio visual debe revisarse en móvil y escritorio.
- Una tarea `done` debe tener evidencia de validación.
