# QA de Observatorio v0.3.0

Fecha: 2026-07-21

## Validación estructural

Ejecutado:

```text
node --check server.mjs
node --check public/app.js
node --check public/context-help.js
npm run check
```

Resultado:

```text
schema_version: 2
macroeventos: 14
expedientes: 1
señales: 26
fuentes: 20
catálogo de medios: 92
valid: true
errors: 0
warnings: 0
```

Los cuatro JSON de `data/` son idénticos, byte por byte, a la copia local recibida.

## Prueba del servidor

Se inició el servidor en un puerto temporal y se verificó:

- `GET /api/health` → `version: 0.3.0`;
- `GET /api/bootstrap`;
- carga de `index.html`, `app.js` y `context-help.js`;
- 14 macroeventos, 1 expediente y 92 medios en el bootstrap.

## QA interactivo automatizado

El entorno bloquea por política administrativa la navegación de Chromium a `127.0.0.1`. Para la interacción se cargó la interfaz real en Chromium y se inyectó el mismo payload devuelto por `/api/bootstrap`; el servidor fue comprobado por separado mediante HTTP.

### Ayuda contextual

Comprobado en el campo `ID` de la ficha de Lobito:

- apertura mediante el icono;
- cierre mediante el botón `×`;
- cierre al hacer clic fuera;
- cierre con `Escape` sin cerrar el editor principal;
- panel contenido dentro del mismo diálogo.

### Encargos para ChatGPT

Estado inicial del expediente: `prompt_exportado`.

Resultados comprobados:

```text
Después de generar investigación: prompt_exportado
Después de copiar: prompt_exportado
Después de generar redacción: prompt_exportado
Después de descargar: prompt_exportado
```

El fondo mantuvo la misma coordenada vertical antes y después del mensaje:

```text
Y inicial: 33
Y posterior: 33
```

También se verificó:

- mensaje local visible después de generar, copiar y descargar;
- nombre editable `qa-lobito-v030.md` respetado en la descarga;
- sugerencia explícita para marcar el expediente como `Encargo exportado`;
- la marcación no se realiza automáticamente;
- el prompt contiene `Evidencia autorizada y verificada`;
- el prompt contiene `Hipótesis e insumos analíticos provisionales`.

## QA visual responsive

Se renderizaron escritorio, tableta y teléfono.

Métricas de ancho:

```text
Tableta 768 px:
- scrollWidth documento: 768
- diálogo: 19–749
- panel de ayuda: 37–731

Teléfono 390 px:
- scrollWidth documento: 390
- diálogo: 19–371
- panel de ayuda: 37–353
```

No se detectó desbordamiento horizontal del documento.

## Pendiente de verificación local en Windows

La validación definitiva debe realizarse en la carpeta instalada con:

1. `npm run check`
2. `npm run start`
3. `Ctrl+F5`
4. prueba manual de teclado, foco, Escape, clic fuera y cierre de diálogos;
5. Aplicar expediente → Guardar → cerrar → reabrir;
6. revisión en los navegadores usados habitualmente por el usuario.
