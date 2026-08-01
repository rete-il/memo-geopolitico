# Secuencia para actualizar el progreso del proyecto

**Proyecto:** Memo Geopolítico — Reacondicionamiento y expansión
**Rama de trabajo:** `beta`
**Producción estable:** `main` → `https://memogeopolitico.com`
**Última revisión de este procedimiento:** 17 de julio de 2026

## 1. Objetivo

Este procedimiento define la secuencia obligatoria para registrar el avance del proyecto sin perder trazabilidad entre:

- el trabajo planificado;
- el código implementado;
- las validaciones realizadas;
- la documentación técnica;
- los cambios publicados en la rama `beta`.

La fuente de verdad del seguimiento se encuentra en:

```text
project-management/data/
├── project.json
├── releases.json
└── work-items.json
```

Los archivos siguientes son paneles generados automáticamente y **no deben editarse manualmente**:

```text
project-management/STATUS.md
project-management/ROADMAP.md
project-management/BACKLOG.md
```

Se regeneran mediante:

```powershell
node project-management/tools/update-dashboard.mjs
```

---

## 2. Resumen de la secuencia

```text
Confirmar rama beta
        ↓
Actualizar beta desde GitHub
        ↓
Seleccionar el work item
        ↓
Actualizar work-items.json
        ↓
Registrar evidencia, riesgo o decisión
        ↓
Ejecutar validaciones técnicas
        ↓
Regenerar los paneles
        ↓
Revisar diferencias en Git
        ↓
Commit en beta
        ↓
Push a origin/beta
        ↓
Verificación final
```

---

## 3. Paso 1 — Confirmar que se trabaja en `beta`

Desde la raíz del proyecto:

```powershell
git branch --show-current
```

El resultado debe ser:

```text
beta
```

Cuando la rama actual no sea `beta`:

```powershell
git switch beta
```

Luego actualizarla desde GitHub:

```powershell
git pull --ff-only origin beta
```

Comprobar el estado del repositorio:

```powershell
git status
```

Antes de comenzar una nueva tarea, lo ideal es que aparezca:

```text
nothing to commit, working tree clean
```

> No ejecutar el procedimiento sobre `main`. La rama `main` corresponde al sitio público estable.

---

## 4. Paso 2 — Identificar el trabajo que se actualizará

Consultar:

```text
project-management/BACKLOG.md
```

Buscar el ID del trabajo, por ejemplo:

```text
FIX-001
FEAT-003
NAV-001
QA-001
```

Después localizar el mismo ID en:

```text
project-management/data/work-items.json
```

Cada tarea debe conservar un ID único y estable. No se debe cambiar el ID después de comenzar la implementación.

---

## 5. Paso 3 — Actualizar el estado del work item

Editar exclusivamente el objeto correspondiente dentro de:

```text
project-management/data/work-items.json
```

Campos principales:

| Campo | Función |
|---|---|
| `status` | Estado operativo de la tarea. |
| `progress` | Porcentaje de avance entre 0 y 100. |
| `owner` | Persona responsable. |
| `release` | Release en la que se entregará. |
| `dependencies` | IDs de trabajos que deben resolverse antes. |
| `acceptanceCriteria` | Condiciones verificables para cerrar la tarea. |
| `notes` | Contexto, bloqueo, evidencia pendiente o aclaración. |

### Estados permitidos

| Estado | Uso |
|---|---|
| `proposed` | Trabajo identificado, todavía no preparado. |
| `ready` | Definido, priorizado y listo para comenzar. |
| `in_progress` | Implementación en curso. Requiere `progress`. |
| `blocked` | No puede continuar. La causa debe figurar en `notes`. |
| `review` | Implementación terminada y pendiente de validación. |
| `done` | Cumple criterios de aceptación, pruebas y documentación. |
| `deferred` | Postergado deliberadamente. |

---

## 6. Secuencias según el tipo de actualización

### 6.1. Comenzar una tarea

Cambiar:

```json
{
  "status": "in_progress",
  "progress": 10,
  "owner": "Rete",
  "notes": "Trabajo iniciado en la rama beta."
}
```

El porcentaje inicial puede ser `5`, `10` o el valor que represente mejor el trabajo realmente ejecutado.

No marcar una tarea como `in_progress` sin responsable ni porcentaje.

### 6.2. Registrar avance durante la implementación

Actualizar `progress` y `notes`:

```json
{
  "status": "in_progress",
  "progress": 45,
  "owner": "Rete",
  "notes": "Componente principal implementado. Falta responsive y validación de teclado."
}
```

El porcentaje debe reflejar entregables completados, no solamente tiempo transcurrido.

Guía orientativa:

| Avance | Interpretación |
|---:|---|
| 10 % | Análisis iniciado y alcance confirmado. |
| 25 % | Estructura o primera implementación disponible. |
| 50 % | Funcionalidad principal implementada. |
| 75 % | Casos secundarios y responsive en desarrollo. |
| 90 % | Implementación terminada, pendiente de revisión. |
| 100 % | Solo para tareas realmente cerradas como `done`. |

### 6.3. Registrar un bloqueo

Cambiar el estado y explicar la causa:

```json
{
  "status": "blocked",
  "progress": 45,
  "owner": "Rete",
  "notes": "Bloqueada hasta aprobar la taxonomía regional. Dependencia: DATA-002."
}
```

También revisar que el ID bloqueante figure en `dependencies` cuando corresponda.

Registrar riesgos relevantes en:

```text
project-management/RISK-REGISTER.md
```

### 6.4. Enviar una tarea a revisión

Cuando la implementación esté terminada:

```json
{
  "status": "review",
  "progress": 90,
  "owner": "Rete",
  "notes": "Implementación terminada. Pendiente de revisión visual, teclado y build."
}
```

Antes de utilizar `review`, comprobar:

- implementación terminada;
- build local correcto;
- pruebas aplicables ejecutadas;
- evidencia visual preparada cuando cambia la UI;
- documentación preliminar actualizada.

### 6.5. Cerrar una tarea

Una tarea pasa a `done` únicamente cuando cumple:

- todos sus criterios de aceptación;
- las condiciones de `QUALITY-GATES.md` aplicables;
- las pruebas técnicas correspondientes;
- la actualización documental necesaria;
- la evidencia registrada.

Ejemplo:

```json
{
  "status": "done",
  "progress": 100,
  "owner": "Rete",
  "notes": "Validada en 390 px, 768 px y escritorio. Build y check correctos."
}
```

Registrar la validación en:

```text
project-management/records/VALIDATION-LOG.md
```

Cuando la tarea modifica el funcionamiento real del sitio, actualizar también `docs/`.

### 6.6. Postergar una tarea

```json
{
  "status": "deferred",
  "progress": null,
  "owner": "TBD",
  "notes": "Postergada para una release posterior por cambio de prioridad."
}
```

Registrar el cambio de alcance en:

```text
project-management/CHANGELOG.md
```

---

## 7. Paso 4 — Registrar avances, validaciones y decisiones

No todo debe quedar únicamente dentro de `notes`.

### Registro de avance

Agregar una entrada en:

```text
project-management/records/PROGRESS-LOG.md
```

Formato recomendado:

```markdown
## 2026-07-17 — NAV-001

- Estado anterior: `ready`
- Estado nuevo: `in_progress`
- Avance: 10 %
- Trabajo realizado: análisis del header y definición del comportamiento móvil.
- Próximo paso: implementar el drawer y el control de foco.
- Bloqueos: ninguno.
```

### Registro de validación

Agregar una entrada en:

```text
project-management/records/VALIDATION-LOG.md
```

Formato recomendado:

```markdown
## 2026-07-17 — NAV-001

- Validación: navegación móvil.
- Resultado: aprobada.
- Entorno: localhost / rama beta.
- Resoluciones: 390 px, 768 px y 1440 px.
- Pruebas: teclado, Escape, foco y enlaces.
- Evidencia: captura o referencia al commit.
```

### Registro de decisiones

Una decisión transversal o difícil de revertir debe registrarse en:

```text
project-management/DECISION-LOG.md
```

Ejemplos:

- taxonomía regional definitiva;
- rutas dinámicas regionales;
- metodología de Fricción vs. Narrativa;
- estrategia de componentes;
- cambio del dominio canónico;
- dependencia técnica nueva.

### Registro de riesgos

Actualizar:

```text
project-management/RISK-REGISTER.md
```

cuando aparezca un riesgo que pueda afectar alcance, calidad, coste, seguridad o release.

---

## 8. Paso 5 — Actualizar release o alcance cuando corresponda

### Cambiar la release actual

Editar:

```text
project-management/data/project.json
```

Campo:

```json
"currentRelease": "beta-1-foundations"
```

### Modificar una release

Editar:

```text
project-management/data/releases.json
```

Se puede actualizar:

- objetivo;
- fecha objetivo;
- criterios de salida;
- orden de ejecución.

### Mover una tarea a otra release

Editar `release` en el work item:

```json
"release": "beta-2-navigation-regions"
```

Todo cambio de alcance o release debe registrarse también en:

```text
project-management/CHANGELOG.md
```

---

## 9. Paso 6 — Ejecutar las validaciones técnicas

Cuando la actualización acompaña cambios de código, ejecutar desde la raíz:

```powershell
npm run check
npm run build
```

Cuando corresponda, revisar también la versión de producción local:

```powershell
npm run preview
```

Si todavía no existe `npm run check`, registrar esa limitación y ejecutar como mínimo:

```powershell
npm run build
```

No marcar como `done` una tarea con errores bloqueantes.

---

## 10. Paso 7 — Regenerar los paneles dinámicos

Desde la raíz del proyecto:

```powershell
node project-management/tools/update-dashboard.mjs
```

Resultado esperado:

```text
Dashboard actualizado: 80 work items, avance N%.
```

El número de work items puede aumentar cuando se incorporen tareas nuevas.

El script valida:

- IDs duplicados;
- estados inválidos;
- releases inexistentes;
- tamaños desconocidos;
- dependencias inexistentes;
- tareas `in_progress` sin porcentaje.

También actualiza automáticamente:

```text
project-management/data/project.json → lastUpdated
```

Y regenera:

```text
project-management/STATUS.md
project-management/ROADMAP.md
project-management/BACKLOG.md
```

### Si el script informa un error

No editar los paneles generados para ocultarlo. Corregir el dato de origen en `data/*.json` y ejecutar nuevamente el script.

---

## 11. Paso 8 — Revisar el resultado antes del commit

Comprobar el estado:

```powershell
git status --short
```

Revisar las diferencias:

```powershell
git diff
```

Cuando los cambios ya estén preparados:

```powershell
git diff --cached
```

Confirmar especialmente:

- que la rama actual sea `beta`;
- que `STATUS.md`, `ROADMAP.md` y `BACKLOG.md` coincidan con los datos;
- que no se hayan agregado archivos temporales;
- que no se hayan modificado secretos o credenciales;
- que `main` no reciba cambios.

---

## 12. Paso 9 — Preparar y confirmar los cambios

### Actualización exclusivamente de gestión

```powershell
git add project-management
git commit -m "pm: actualiza progreso del proyecto"
git push origin beta
```

### Implementación de código y actualización de progreso

Se recomienda separar los commits cuando mejore la trazabilidad:

```powershell
git add src public package.json package-lock.json
git commit -m "feat: implementa navegación regional"

git add project-management docs
git commit -m "pm: registra avance y validación de navegación regional"

git push origin beta
```

También puede utilizarse un único commit cuando el cambio sea pequeño y atómico.

No utilizar:

```powershell
git push origin main
```

---

## 13. Paso 10 — Verificación final

Ejecutar:

```powershell
git branch --show-current
git status
git log -1 --oneline
```

Resultados esperados:

- rama actual: `beta`;
- working tree limpio;
- último commit visible en `origin/beta`;
- ningún cambio en `main`;
- paneles regenerados y coherentes.

También revisar en GitHub:

```text
Repositorio → Branches → beta
```

Confirmar que el commit aparece en la rama `beta`.

---

## 14. Incorporar un work item nuevo

Cuando aparezca trabajo no previsto, agregar un objeto nuevo en:

```text
project-management/data/work-items.json
```

Estructura base:

```json
{
  "id": "FEAT-999",
  "type": "FEAT",
  "epic": "Nombre del epic",
  "title": "Descripción concreta del trabajo",
  "priority": "P1",
  "status": "proposed",
  "release": "beta-2-navigation-regions",
  "size": "M",
  "owner": "TBD",
  "dependencies": [],
  "progress": null,
  "acceptanceCriteria": [
    "Criterio verificable 1.",
    "Criterio verificable 2."
  ],
  "notes": ""
}
```

Prefijos permitidos:

```text
FIX      Corrección
FEAT     Nueva funcionalidad
REF      Refactorización
UX       Mejora de experiencia
A11Y     Accesibilidad
SEO      SEO y metadatos
OPS      Operaciones, build o Netlify
QA       Calidad y pruebas
DATA     Datos y modelos
CONTENT  Contenido editorial
PM       Project management
```

Prioridades:

```text
P0  Crítica o bloqueante
P1  Alta
P2  Media
P3  Futura
```

Tamaños:

```text
XS  Muy pequeño
S   Pequeño
M   Mediano
L   Grande
XL  Muy grande; conviene dividirlo
```

Después de agregarlo, ejecutar siempre el generador.

---

## 15. Actualización semanal recomendada

Una vez por semana realizar esta revisión, incluso cuando no haya una release terminada:

1. confirmar la rama `beta`;
2. actualizar desde GitHub;
3. revisar tareas `in_progress`, `review` y `blocked`;
4. actualizar porcentajes y responsables;
5. comprobar dependencias;
6. revisar P0 y P1 abiertos;
7. actualizar riesgos;
8. registrar decisiones nuevas;
9. revisar el alcance de la release actual;
10. ejecutar el generador;
11. revisar `STATUS.md` y `ROADMAP.md`;
12. hacer commit de seguimiento;
13. push a `origin/beta`.

Commit sugerido:

```powershell
git commit -m "pm: actualización semanal del proyecto"
```

---

## 16. Checklist rápido

```markdown
- [ ] Estoy en la rama `beta`.
- [ ] Actualicé `beta` desde GitHub.
- [ ] Identifiqué el work item correcto.
- [ ] Actualicé `status`, `progress`, `owner` y `notes`.
- [ ] Registré bloqueos, riesgos o decisiones cuando correspondía.
- [ ] Ejecuté las pruebas técnicas aplicables.
- [ ] Ejecuté `update-dashboard.mjs`.
- [ ] Revisé `STATUS.md`, `ROADMAP.md` y `BACKLOG.md`.
- [ ] Revisé `git diff`.
- [ ] Hice commit en `beta`.
- [ ] Hice push a `origin/beta`.
- [ ] Verifiqué el commit en GitHub.
```

---

## 17. Regla fundamental

```text
Datos canónicos primero
        ↓
Paneles generados después
        ↓
Validación antes de cerrar
        ↓
Commit solamente en beta
```

Nunca actualizar manualmente el porcentaje únicamente en `STATUS.md`, `ROADMAP.md` o `BACKLOG.md`, porque esos cambios serán reemplazados en la siguiente ejecución del generador.
