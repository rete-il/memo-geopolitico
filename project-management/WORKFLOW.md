# Workflow de ejecución y seguimiento

## 1. Ciclo de una iniciativa

```text
Necesidad
  ↓
Work item en data/work-items.json
  ↓
Especificación en specs/ cuando corresponda
  ↓
Ready
  ↓
Implementación en beta o feature/*
  ↓
Review
  ↓
Pruebas y aceptación
  ↓
Done
  ↓
Actualizar docs/ y CHANGELOG
```

## 2. Preparación de una tarea

Una tarea puede pasar a `ready` cuando:

- objetivo y alcance están claros;
- dependencias están resueltas o planificadas;
- existen criterios de aceptación;
- se conoce la ruta, componente o dato afectado;
- no contradice una decisión aprobada;
- si es una función amplia, existe una especificación.

## 3. Inicio de trabajo

Al iniciar:

1. cambiar `status` a `in_progress`;
2. asignar `owner`;
3. establecer `progress` inicial;
4. registrar notas o riesgos;
5. regenerar dashboard;
6. crear rama `feature/*` solo si mejora el aislamiento.

## 4. Revisión

Una tarea pasa a `review` cuando:

- implementación terminada;
- build local correcto;
- pruebas aplicables ejecutadas;
- documentación técnica preliminar actualizada;
- existe evidencia visual si cambia UI.

## 5. Cierre

Una tarea pasa a `done` únicamente cuando cumple `QUALITY-GATES.md` y sus criterios de aceptación.

## 6. Actualización semanal sugerida

- Revisar bloqueos y dependencias.
- Actualizar porcentaje de tareas en curso.
- Confirmar release actual.
- Registrar decisiones nuevas.
- Registrar cambios de alcance.
- Ejecutar `update-dashboard.mjs`.
- Hacer commit de gestión separado del código cuando sea conveniente.

## 7. Cambios de alcance

Un nuevo trabajo se incorpora con:

- ID;
- tipo;
- epic;
- prioridad;
- release;
- tamaño;
- dependencias;
- criterios de aceptación.

Si desplaza una tarea o release, registrar el motivo en `CHANGELOG.md` y, si es una decisión transversal, en `DECISION-LOG.md`.

## 8. Convención de commits

```text
docs: update project dashboard
pm: reprioritize regional navigation
fix: correct header routes
feat: add mobile region menu
refactor: extract directory filters
test: cover narrative friction classification
```
