# Reforma funcional 0.2.2

## Alcance

Actualización incremental preparada sobre la copia local `0.2.1` recibida después del piloto del Corredor de Lobito. No modifica GitHub ni Memo Geopolítico y conserva sin cambios los archivos canónicos de datos.

## Ayuda contextual

Se añadió ayuda contextual a los campos y secciones principales de:

- **Ficha analítica**;
- **Editar expediente**.

Cada icono `ⓘ` funciona de dos maneras:

- al pasar el cursor o recibir foco muestra una explicación breve;
- al hacer clic o pulsar Enter/Espacio fija una guía completa.

La guía puede incluir:

- qué significa el campo;
- por qué importa;
- preguntas orientadoras;
- ejemplo;
- errores que conviene evitar.

La interacción contempla teclado, foco visible, Escape, clic fuera, cierre explícito y uso táctil.

## Encargos para ChatGPT

Se reemplazó la terminología ambigua de **Salida asistida**:

```text
Generar encargo de investigación
Generar encargo de redacción
Copiar encargo
Descargar encargo .md
```

El panel explica expresamente que genera instrucciones para ChatGPT y no el artículo final.

También incorpora:

- nombre de archivo autocompletado y editable;
- nombres sugeridos `*-encargo-investigacion.md` y `*-encargo-redaccion.md`;
- botones Copiar y Descargar desactivados hasta que exista un encargo;
- mensaje visible después de generar, copiar y descargar;
- confirmación específica cuando se genera un encargo de redacción con evidencia insuficiente;
- estados visibles “Listo para encargo de redacción” y “Encargo exportado”.

## Datos preservados

No se alteraron:

- `data/macroeventos.json`;
- `data/catalogo-medios.json`;
- `data/taxonomia-temas.json`;
- `data/config.json`.

## Archivos modificados

```text
package.json
server.mjs
public/index.html
public/app.js
public/styles.css
README.md
```

Archivo nuevo:

```text
public/context-help.js
```

## Validación ejecutada

- `node --check server.mjs`;
- `node --check public/app.js`;
- `node --check public/context-help.js`;
- `npm run check`;
- `GET /api/health` con versión `0.2.2`;
- `GET /api/bootstrap` con 14 macroeventos, 1 expediente y validación correcta;
- comprobación de 61 enlaces de ayuda contra controles existentes;
- comprobación de IDs HTML duplicados;
- comparación binaria de los cuatro JSON canónicos con la copia recibida: sin cambios.

La validación visual automatizada no pudo completarse en el contenedor porque Chromium bloqueó el acceso a `127.0.0.1` por una política administrativa del entorno. La revisión visual y táctil debe realizarse localmente antes de reemplazar la versión activa.
