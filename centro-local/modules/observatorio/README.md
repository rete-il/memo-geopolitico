# Observatorio de macroeventos geopolíticos

Versión local autónoma **0.6.0**. No utiliza APIs externas y no modifica GitHub. La sincronización pública, cuando el usuario la confirma, escribe únicamente la proyección local de datos del sitio.

La base entregada contiene **17 macroeventos, 35 señales, 31 publicaciones, 92 fuentes catalogadas, 314 temas internos y un expediente editorial**.

## Fase 3 · alimentación automática de advertencias

El modo **JSON importable** del Generador de búsqueda ahora solicita a ChatGPT, dentro de cada candidato:

- publicaciones iniciales;
- señales vinculadas;
- advertencias con identidad estable, descripción, tipo, referencias, prioridad y tratamiento propuesto.

La respuesta sigue copiándose manualmente desde ChatGPT: no se añadió ninguna API externa. Al pegarla en **Macroeventos → Importar candidatos**, la vista previa permite confirmar cada advertencia por separado. Un ID duplicado bloquea sólo la advertencia afectada; una referencia desconocida queda conservada y visible como vínculo pendiente.

Las advertencias importadas entran siempre en estado **Pendiente**. Si ChatGPT omite estado o tratamiento, el ítem no puede aplicarse hasta que una persona complete esa decisión. La respuesta original, el resultado normalizado y las decisiones se guardan por separado en `importaciones_candidatos` para mantener trazabilidad.

## Novedades de la versión 0.6.0

### Generador de prompt de búsqueda

- normaliza los 20 ejes editoriales de `temas adecuados.pdf`;
- separa 19 ejes seleccionables y un criterio transversal permanente;
- vincula cada eje con subtemas de la taxonomía de 314 entradas;
- permite revisar región, período, horizonte, idiomas, actores y señales;
- recomienda entre 15 y 25 fuentes del catálogo de 92 registros;
- mantiene las cuatro fuentes prioritarias, pero no exclusivas;
- permite añadir fuentes externas identificadas como no catalogadas;
- genera una salida analítica o el contrato JSON de importación;
- incluye un índice compacto de los 17 macroeventos existentes para orientar la clasificación.

### Actualización de macroeventos existentes

El importador distingue:

- candidato nuevo;
- actualización de un macroevento existente;
- duplicado sin novedad material;
- candidato compuesto;
- coincidencia que requiere revisión humana.

Para una actualización permite seleccionar individualmente publicaciones, señales y cambios de ficha. Conserva el ID, la fecha de creación, el estado editorial y la verificación del macroevento. Las nuevas evidencias ingresan como pendientes y cada operación queda registrada en `actualizaciones`.

El formato recomendado de candidatos pasa a `schema_version: 3`. Los lotes v1 y v2 siguen siendo compatibles y se clasifican localmente.

## Ejecución

Desde la carpeta del dashboard:

```powershell
npm run check
npm run open
```

URL predeterminada:

```text
http://127.0.0.1:4323
```

No requiere `npm install`: utiliza Node.js, HTML, CSS y JavaScript nativo.

## Flujo recomendado

1. Abrir **Generador de búsqueda**.
2. Elegir el eje editorial y revisar subtemas, región, actores, señales e idiomas.
3. Revisar la selección contextual de fuentes y añadir o quitar registros.
4. Elegir:
   - **Investigación analítica**, para obtener la matriz y las secciones A–E; o
   - **JSON para importar**, para obtener candidatos directamente.
5. Generar, copiar y ejecutar el prompt en ChatGPT.
6. Si se eligió investigación analítica, pedir luego su conversión al contrato JSON.
7. Entrar en **Macroeventos → Importar candidatos**.
8. Analizar el lote completo.
9. Revisar el tratamiento propuesto para cada resultado:
   - crear nuevo;
   - actualizar un existente;
   - bloquear por falta de novedad;
   - separar un compuesto;
   - resolver manualmente una coincidencia.
10. Para cada candidato, revisar publicaciones y señales y confirmar cada advertencia por separado. En las actualizaciones, elegir también los cambios de ficha.
11. Confirmar la revisión humana y pulsar **Aplicar decisiones**.
12. Revisar las fichas y pulsar **Guardar** para validar, crear el backup y persistir.
13. Cuando el sistema detecte macroeventos nuevos, pulsar **Sincronizar _N_ nuevos**, revisar el resumen y confirmar para actualizar la proyección pública local.

## Sincronización del sitio local

El control de sincronización solo funciona con datos previamente guardados y permanece desactivado salvo que detecte uno o más identificadores de macroeventos ausentes de la proyección pública. Las actualizaciones de procesos ya existentes no lo habilitan. Antes de escribir:

- genera una propuesta con la herramienta pública canónica;
- compara los macroeventos guardados con `src/data/public/observatorio.json`;
- bloquea eliminaciones automáticas y las identidades duplicadas;
- conserva estados de publicación, progreso editorial y contenido público independiente;
- muestra cuántos procesos se crearán, actualizarán o conservarán;
- exige confirmación explícita;
- crea un respaldo y un manifiesto en `centro-local/data/backups/sincronizacion-observatorio`;
- escribe de forma atómica, vuelve a validar y restaura el respaldo si falla.

La operación actualiza el sitio servido en `localhost`, pero no ejecuta Git, no sube archivos a GitHub y no despliega Netlify.

## Reglas de actualización

- Una coincidencia no se descarta si aporta evidencia nueva.
- Las publicaciones y señales idénticas no vuelven a incorporarse.
- Los campos principales nunca se modifican automáticamente.
- Las diferencias de redacción se presentan para revisión, pero quedan desmarcadas.
- Una ficha verificada no pierde su estado por recibir evidencia pendiente.
- Una evaluación reemplazada conserva la versión anterior en `historial_evaluacion`.
- Cada actualización registra lote, fecha, candidato de origen, tipo de evolución y elementos agregados.
- Las advertencias no confirmadas se registran como no aplicadas; nunca se incorporan por una selección masiva implícita.
- Los vínculos desconocidos de una advertencia se conservan en `vinculos_pendientes` y no se inventan ni se descartan en silencio.

## Archivos canónicos

```text
data/macroeventos.json             Macroeventos, historial y expedientes
data/catalogo-medios.json          Catálogo normalizado de 93 fuentes
data/taxonomia-temas.json          Taxonomía de 17 grupos y 314 entradas
data/configuracion-busqueda.json   Ejes editoriales y reglas del generador
data/config.json                   Servidor y validación
```

Los documentos originales —el XLSX de medios y los dos PDF temáticos— son las fuentes maestras editoriales. El Observatorio utiliza sus versiones JSON normalizadas para funcionar de forma autónoma.

## Documentación

- `docs/GENERADOR-BUSQUEDA.md`
- `docs/IMPORTAR-CANDIDATOS.md`
- `examples/candidatos-macroeventos.example.json`
- `REFORMA-0.6.0.md`
- `QA-0.6.0.md`

## Límites actuales

- no investiga Internet por sí solo: prepara el prompt para ejecutarlo en ChatGPT;
- no verifica hechos automáticamente;
- no envía prompts directamente;
- la recomendación de fuentes es heurística y siempre revisable;
- la clasificación de un candidato es una ayuda local, no reemplaza la decisión editorial;
- no publica artículos ni modifica GitHub; la sincronización solo actualiza la proyección pública local después de una confirmación explícita;
- no incluye mapa ni integración con GDELT.

## Backups

Cada guardado crea una copia previa de `data/macroeventos.json` en `backups/`. La importación o restauración del catálogo también conserva una copia del archivo anterior.
