# Observatorio de macroeventos geopolíticos

Versión local autónoma **0.6.0**. No utiliza APIs externas, no depende de Memo Geopolítico y no modifica GitHub.

La base entregada contiene **17 macroeventos, 35 señales, 31 publicaciones, 92 fuentes catalogadas, 314 temas internos y un expediente editorial**.

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

El formato recomendado de candidatos pasa a `schema_version: 2`. Los lotes v1 siguen siendo compatibles y se clasifican localmente.

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
10. Para cada actualización, elegir publicaciones, señales y, si corresponde, cambios de ficha.
11. Confirmar la revisión humana y pulsar **Aplicar decisiones**.
12. Revisar las fichas y pulsar **Guardar** para validar, crear el backup y persistir.

## Reglas de actualización

- Una coincidencia no se descarta si aporta evidencia nueva.
- Las publicaciones y señales idénticas no vuelven a incorporarse.
- Los campos principales nunca se modifican automáticamente.
- Las diferencias de redacción se presentan para revisión, pero quedan desmarcadas.
- Una ficha verificada no pierde su estado por recibir evidencia pendiente.
- Una evaluación reemplazada conserva la versión anterior en `historial_evaluacion`.
- Cada actualización registra lote, fecha, candidato de origen, tipo de evolución y elementos agregados.

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
- no publica artículos ni modifica Memo Geopolítico;
- no incluye mapa ni integración con GDELT.

## Backups

Cada guardado crea una copia previa de `data/macroeventos.json` en `backups/`. La importación o restauración del catálogo también conserva una copia del archivo anterior.
