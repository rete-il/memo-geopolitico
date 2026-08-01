# Importar candidatos y actualizar macroeventos

## Propósito

La función convierte una respuesta estructurada de ChatGPT en decisiones revisables. Puede crear un macroevento o actualizar uno existente sin duplicarlo.

Nada se escribe en `data/macroeventos.json` hasta pulsar **Guardar**.

## Recorrido

1. Entrar en **Macroeventos**.
2. Pulsar **Importar candidatos**.
3. Pegar el JSON o cargar un archivo.
4. Pulsar **Analizar candidatos**.
5. Revisar la clasificación y el macroevento de destino.
6. En las actualizaciones, seleccionar publicaciones, señales y cambios de ficha.
7. Resolver manualmente los casos dudosos.
8. Confirmar la revisión humana.
9. Pulsar **Aplicar decisiones**.
10. Revisar las fichas.
11. Pulsar **Guardar**.

## Contrato recomendado

```json
{
  "formato": "observatorio-candidatos",
  "schema_version": 2,
  "generado_el": "AAAA-MM-DD",
  "consulta": "Síntesis de la búsqueda",
  "candidatos": []
}
```

Cada candidato puede sugerir:

```json
{
  "accion_sugerida": "actualizacion",
  "macroevento_existente_id": "id-estable",
  "tipo_evolucion": "avance",
  "justificacion_tratamiento": "La misma dinámica incorpora evidencia nueva.",
  "cambios_propuestos": {}
}
```

Valores orientativos de `accion_sugerida`:

- `nuevo`;
- `actualizacion`;
- `sin_novedad`;
- `relacionado`;
- `compuesto`.

La sugerencia de la IA no es vinculante. El Observatorio vuelve a comparar localmente el candidato.

También se aceptan lotes v1, una lista JSON directa, un objeto con `macroeventos`, un candidato único y JSON dentro de un bloque Markdown. El límite de entrada es 5.000.000 de caracteres.

## Clasificación local

| Resultado | Tratamiento |
|---|---|
| Proceso nuevo sin coincidencia material | Crear macroevento |
| Mismo proceso con nuevas publicaciones o señales | Actualización |
| Mismo proceso con cambio de fase, alcance o actores | Actualización sustantiva |
| Misma evidencia sin novedad | Bloqueado como sin novedad |
| Dos procesos mezclados | Bloqueado como compuesto |
| Coincidencia insuficiente o contradictoria | Revisión humana |

La comparación considera ID, título, alias, términos distintivos, regiones, temas y URLs compartidas.

## Actualización selectiva

Para una actualización, la vista previa separa:

- publicaciones nuevas;
- señales nuevas;
- campos actuales y propuestos.

Las publicaciones y señales nuevas quedan seleccionadas inicialmente. Los cambios de ficha quedan desmarcados: el editor debe aprobarlos uno por uno.

Los tipos de evolución disponibles son continuidad, avance, aceleración, bloqueo, retraso, desescalamiento, reversión, cambio de alcance, cambio de actores y contradicción.

## Integridad y trazabilidad

Al actualizar:

- se conserva el ID;
- se conserva la fecha de creación;
- se conservan estado editorial y verificación;
- se mantienen las publicaciones y señales anteriores;
- la nueva evidencia ingresa pendiente;
- se registra el lote y el candidato de origen;
- se registra el tipo de evolución;
- se enumeran IDs de publicaciones y señales agregadas;
- se enumeran los campos modificados;
- una evaluación reemplazada guarda la versión anterior.

## Candidatos nuevos

Un candidato nuevo ingresa como:

```json
{
  "estado_editorial": "borrador",
  "estado_verificacion": "pendiente",
  "clasificacion_tematica": {
    "origen": "ia",
    "estado_revision": "pendiente",
    "revisada_el": null
  }
}
```

Sus señales y publicaciones también quedan pendientes.

## Fuentes y temas

Una fuente se vincula al catálogo solo mediante una coincidencia inequívoca por `media_id`, nombre exacto o dominio institucional.

Los nombres de temas solo se convierten a IDs cuando coinciden exactamente con la taxonomía. Los nombres desconocidos producen una advertencia.

Los enlaces Markdown se convierten a URLs HTTPS directas y las localizaciones pueden recibirse como texto u objeto.

## Persistencia

**Aplicar decisiones** modifica solo la memoria de la pestaña. **Guardar**:

1. normaliza la base;
2. ejecuta la validación integral;
3. crea un backup;
4. escribe el JSON de forma atómica.

Antes de guardar, **Recargar** permite descartar el lote completo.
