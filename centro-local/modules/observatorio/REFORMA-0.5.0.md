# Reforma funcional 0.5.0

## Objetivo

Convertir los resultados del prompt de detección de macroeventos en entradas revisables del Observatorio sin copiar campos manualmente, sin reemplazar la base activa y sin confundir una propuesta de ChatGPT con información verificada.

## 1. Contrato de intercambio

La aplicación define `observatorio-candidatos` versión 1:

- acepta JSON pegado o cargado desde archivo;
- tolera una lista directa, `candidatos`, `macroeventos` o un único candidato;
- acepta un único bloque Markdown JSON;
- rechaza texto no estructurado o JSON inválido;
- ofrece instrucciones para incorporar al prompt y una plantilla descargable.

## 2. Conversión controlada

La importación:

- usa el título para generar un ID cuando falta;
- convierte alias frecuentes del prompt a los campos canónicos;
- resuelve temas por ID o nombre exacto;
- vincula fuentes al catálogo solo por identidad inequívoca;
- conserva vínculos señal–fuente dentro del candidato;
- genera IDs globalmente únicos para señales y publicaciones;
- registra origen, versión de formato, lote y fecha.

Los estados se fuerzan a:

- macroevento: `borrador`;
- verificación general: `pendiente`;
- clasificación temática: `ia` y `pendiente`;
- señales: `pendiente`, origen `ia`;
- publicaciones: `pendiente`.

## 3. Validación y duplicados

Antes de incorporar se comprueban:

- campos esenciales;
- horizonte temporal;
- URLs válidas y HTTPS;
- IDs y títulos exactos existentes;
- repeticiones dentro del lote;
- similitud de títulos;
- publicaciones compartidas por URL.

Los duplicados exactos y los errores estructurales bloquean la selección. Las similitudes y fuentes compartidas se muestran como advertencias revisables.

## 4. Vista previa y confirmación

Cada candidato muestra:

- estado de importación;
- título e ID;
- descripción;
- regiones y categoría;
- temas reconocidos;
- cantidad de publicaciones y señales;
- errores, advertencias y coincidencias;
- estados editoriales que se aplicarán.

El editor debe seleccionar candidatos y confirmar expresamente la revisión antes de incorporarlos.

## 5. Persistencia

**Incorporar seleccionados** solo actualiza la memoria de la pestaña y marca **Cambios sin guardar**. Antes de aplicar, la base completa se envía al validador existente.

El botón general **Guardar** continúa siendo la única acción que:

1. normaliza;
2. valida;
3. crea backup;
4. escribe `data/macroeventos.json`.

## 6. Compatibilidad

- el esquema editorial general continúa en v2;
- los cuatro JSON recibidos de la v0.4.0 permanecen idénticos;
- no se añade ninguna dependencia;
- no se conecta con APIs externas;
- no se modifica Memo Geopolítico ni GitHub.
