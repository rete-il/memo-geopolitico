# QA técnico 0.5.0

Fecha: 2026-07-23

## Resultado automatizado

Comando:

```text
npm run check
```

Resultado:

- 11 pruebas aprobadas;
- 0 pruebas fallidas;
- contrato JSON y bloque Markdown;
- normalización a borrador pendiente;
- vínculos señal–fuente;
- resolución de temas y catálogo;
- duplicados por ID y título;
- similitud de títulos y publicaciones compartidas;
- campos obligatorios y HTTPS;
- IDs globalmente únicos;
- controles, acciones y reglas responsive de la interfaz;
- validación integral de los datos activa.

Datos validados:

- 14 macroeventos;
- 1 expediente;
- 27 señales;
- 22 publicaciones;
- 92 fuentes catalogadas;
- 0 errores;
- 0 advertencias.

## Integración con el servidor

Comprobado en un puerto alternativo:

- `/api/health` devuelve versión `0.5.0`;
- `/candidate-import.js` se sirve correctamente;
- un candidato normalizado puede agregarse a una copia de la base;
- `/api/validate` acepta la base resultante sin errores.

## Persistencia en copia temporal

Se realizó una prueba fuera de la copia entregable:

- incorporación de un candidato;
- guardado mediante `PUT /api/data`;
- crecimiento temporal de 14 a 15 macroeventos;
- creación del backup;
- persistencia de `importacion.origen`, versión, lote y fecha;
- validación posterior correcta.

La copia temporal generó las advertencias esperadas porque el candidato de QA no incluía fuentes ni señales.

## Integridad de los datos entregables

Comparados byte por byte con la v0.4.0:

- `data/macroeventos.json`;
- `data/catalogo-medios.json`;
- `data/taxonomia-temas.json`;
- `data/config.json`.

Resultado: 4 de 4 archivos idénticos.

## QA visual pendiente del usuario

La versión debe revisarse en el navegador real de Windows:

1. abrir Macroeventos;
2. abrir Importar candidatos;
3. copiar instrucciones y descargar plantilla;
4. analizar un lote;
5. revisar bloqueados y coincidencias;
6. seleccionar e incorporar sin guardar;
7. comprobar Cambios sin guardar;
8. recargar para descartar la prueba;
9. revisar el diálogo a 1440 px, 768 × 1024 y 390 × 844.

No se guardó ningún candidato de prueba en la base entregable.
