# Registro de avances

Registro cronológico y append-only. No reemplazar entradas anteriores; agregar una nueva por sesión o hito.

## 2026-07-17 — Sistema de gestión integrado

### Completado

- Se incorporó `docs/` versión 2.0.
- Se separó la documentación técnica del sistema de Project Management.
- Se incorporó `project-management/`.
- Se agregó el procedimiento `ACTUALIZAR-PROGRESO.md`.
- Se confirmó el trabajo exclusivo sobre la rama `beta`.

### Validación

- Rama de trabajo: `beta`.
- Repositorio remoto: `origin/beta`.
- Producción continúa vinculada a `main`.
- El sistema de dashboard puede regenerarse mediante Node.

### Próximo trabajo

- Incorporar `astro check`.
- Establecer una línea base reproducible.
- Resolver las incidencias críticas de navegación y contenido.

## 2026-07-17 — Inicio del sistema de gestión

- Se creó la estructura `project-management/`.
- Se definieron releases Beta 0–6.
- Se incorporaron backlog, riesgos, decisiones y especificaciones iniciales.
- La documentación técnica v2 está preparada localmente y pendiente de confirmación en `beta`.

## Plantilla

```markdown
## AAAA-MM-DD — Título del avance

### Completado

-

### En curso

-

### Próximo

-

### Bloqueos o decisiones

-
```

## 2026-07-17 — Dashboard local v0.1 instalado y validado

### Completado

- Se instaló el Project Dashboard v0.1.
- El servidor local quedó operativo en 127.0.0.1:4322.
- Se confirmó que el dashboard detecta correctamente la rama beta.
- Se cargaron 89 work items.
- Se verificó la visualización del resumen, releases y work items.

### Validación

- El dashboard inicia correctamente en Windows.
- La rama actual y la rama esperada son beta.
- La validación estructural informa 0 errores.
- La información de project-management se carga correctamente.
- La interfaz funciona únicamente en localhost.

### Problemas o bloqueos

- Existe una advertencia no bloqueante pendiente de revisión en la sección Validación.
- No se detectaron errores que impidan utilizar el dashboard.

### Próximo trabajo

- Revisar la advertencia de validación.
- Comprobar la edición y persistencia de PMAPP-009.
- Ejecutar Validar y regenerar.
- Cerrar PMAPP-009 como completado.
- Confirmar los cambios mediante commit y push a la rama beta.


## 2026-07-17 — QA-001 — Línea base de Astro Check completada

### Completado

- Se instalaron @astrojs/check y TypeScript.
- Se agregó el script npm run check.
- Se ejecutó la comprobación sobre 23 archivos.
- El resultado fue 0 errores, 0 advertencias y 38 hints.

### Validación

- npm reconoce correctamente el script check.
- astro check finaliza sin errores bloqueantes.
- El build de producción continúa funcionando.

### Problemas o bloqueos

- No existen bloqueos.
- Quedan 38 hints de mantenimiento y migración que serán tratados en una tarea independiente.

### Próximo trabajo

- Crear y ejecutar una tarea de reducción de hints.
- Corregir APIs obsoletas de Astro y Zod.
- Eliminar variables no utilizadas.
- Revisar el script inline del mapa.


## 2026-07-17 — QA-004 — Astro Check completamente saneado

### Completado

- Se redujeron los diagnósticos de Astro Check de 38 hints a 0.
- Se migraron APIs obsoletas de Astro y Zod.
- Se eliminaron imports, parámetros y variables sin uso.
- Se corrigió el bloque JSON inline de MapaGlobal.

### Validación

- Astro Check analizó 23 archivos con 0 errores, 0 advertencias y 0 hints.
- npm run build finalizó correctamente.

### Problemas o bloqueos

- No existen bloqueos.
- La página de archivo de Ensayos continúa pendiente de implementación funcional.

### Próximo trabajo

- Continuar con las tareas restantes de Beta 0.
- Revisar la advertencia de DOC-001 y completar sus criterios de aceptación.


## 2026-07-17 — Cierre de línea base documental y Astro Check

### Completado

- Se completaron los criterios de aceptación de DOC-001.
- Se cerró QA-004 con 0 errores, 0 advertencias y 0 hints.
- La documentación y los paneles de gestión fueron regenerados.

### Validación

- El dashboard informa 0 errores y 0 advertencias.
- npm run check finaliza correctamente.
- npm run build finaliza correctamente.

### Problemas o bloqueos

- No existen bloqueos técnicos activos.

### Próximo trabajo

- Revisar las tareas pendientes de Beta 0 y comenzar la corrección de navegación.


## 2026-07-17 — FIX-001 y FIX-002 — Navegación e índice de Ensayos completados

### Completado

- Se normalizó la navegación principal.
- Se eliminaron enlaces hacia rutas inexistentes.
- Se incorporaron Inicio, Directorio y Ensayos.
- Se convirtió la marca en enlace al inicio.
- Se implementó el índice funcional de /ensayos/.
- Se incorporaron tarjetas editoriales y paginación.

### Validación

- La portada carga correctamente.
- MapaGlobal, marcadores y contenidos inferiores funcionan.
- La página /ensayos/ muestra todos los ensayos publicados.
- Los enlaces a ensayos individuales funcionan.
- Astro Check finaliza con 0 errores, 0 advertencias y 0 hints.
- El build de producción finaliza correctamente.

### Problemas o bloqueos

- No existen bloqueos activos.
- La navegación responsive y el menú hamburguesa se implementarán en una fase posterior.


## 2026-07-17 — FIX-003 — Placeholder Indo-Pacífico retirado

### Completado

- Se eliminó la página provisional Indo-Pacífico.
- Se retiraron las referencias documentales obsoletas.
- Se comprobó que friccion.json ya no existía ni estaba rastreado.
- Se confirmó que monitores.json continúa alimentando la columna derecha.

### Validación

- La ruta retirada devuelve 404.
- Las páginas reales de profundidad funcionan correctamente.
- La portada, el mapa y Fricción vs. Narrativa permanecen operativos.
- Astro Check y el build finalizaron correctamente.

### Problemas o bloqueos

- No existen bloqueos.
- Un futuro contenido sobre Indo-Pacífico deberá crearse como contenido editorial real.

### Próximo trabajo

- Localizar y corregir el CTA provisional de Ko-fi.

