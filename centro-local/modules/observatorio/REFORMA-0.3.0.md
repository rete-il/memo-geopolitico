# Reforma integral 0.3.0

## Objetivo

Resolver de forma estructural los problemas detectados durante el piloto del expediente del Corredor de Lobito, sin modificar los datos editoriales ni depender de Memo Geopolítico o GitHub.

## Cambios funcionales

### 1. Ayuda contextual reconstruida

La versión anterior combinaba un popover global con hover, foco, clic, temporizadores y devolución de foco. La versión 0.3.0 elimina ese modelo.

- El hover y el foco visible muestran una explicación breve mediante CSS.
- El clic abre una guía completa dentro del mismo diálogo activo.
- El panel completo cierra con su botón ×, Escape, clic fuera o un segundo clic en el icono.
- El panel ya no pertenece a una rama externa al diálogo modal.
- No hay reapertura automática por foco ni temporizadores de hover.

### 2. Notificaciones sin desplazamiento del fondo

- Los mensajes originados dentro de un editor aparecen dentro de ese diálogo.
- Los mensajes globales son flotantes y no ocupan espacio en el layout.
- El estado del encargo permanece visible dentro de **Encargos para ChatGPT**.

### 3. Acciones técnicas separadas del estado editorial

Generar, copiar y descargar un encargo ya no modifican automáticamente el estado del expediente.

Después de una descarga aparece una acción explícita:

`Marcar como “Encargo exportado”`

Ese botón solo prepara el valor del formulario. La persistencia sigue requiriendo:

1. Aplicar expediente.
2. Guardar.

### 4. Prompts con jerarquía de evidencia

Los encargos distinguen:

- evidencia autorizada y verificada;
- señales revisadas vinculadas con esa evidencia;
- hipótesis e insumos analíticos provisionales del Observatorio.

Los actores, intereses, escenarios y descripciones de la ficha ya no se presentan como hechos confirmados. El prompt exige fuente autorizada o marcador `[VERIFICAR]`.

### 5. Versión y ayuda general

- La barra lateral muestra `Observatorio v0.3.0`.
- La barra superior incorpora **Ayuda**.
- El panel informa versión, servidor, esquema, taxonomía, archivos activos, recuentos, flujo editorial y procedimiento de guardado.

## Datos preservados

No se modificaron los archivos:

- `data/macroeventos.json`
- `data/catalogo-medios.json`
- `data/taxonomia-temas.json`
- `data/config.json`

El esquema continúa en v2.

## Validación requerida en Windows

1. `npm run check`
2. `npm run start`
3. Recarga completa con `Ctrl+F5`
4. QA de ayuda contextual en Ficha analítica y Expediente
5. QA de mensajes dentro del diálogo
6. QA de generación, copia y descarga sin cambio automático de estado
7. QA de marcación explícita como Encargo exportado
8. Aplicar expediente, Guardar, cerrar y reabrir
9. Verificación responsive en escritorio, tablet y teléfono
