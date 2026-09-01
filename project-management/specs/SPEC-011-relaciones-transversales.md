# SPEC-011 — Relaciones transversales y propiedad de señales

## Objetivo

Hacer auditables las relaciones entre macroeventos sin confundir navegación, simultaneidad y causalidad, y garantizar que cada señal tenga un único propietario canónico.

## Fuente de verdad

`centro-local/modules/observatorio/data/macroeventos.json` conserva:

- `relaciones_macroeventos`: colección canónica de relaciones tipadas;
- `senal.propietario_macroevento_id`: propietario único de cada señal;
- `macroevento.referencias_senal`: usos de segundo orden sin copiar la señal.

`macroevento_relacionado_ids` permanece temporalmente como compatibilidad histórica y navegación. No constituye por sí solo evidencia causal. Las proyecciones públicas se regeneran desde la fuente canónica.

## Contrato de relación

Cada relación contiene:

- `id`: identidad estable y única;
- `origen_id` y `destino_id`: extremos existentes y diferentes;
- `tipo`: `subordinada`, `relacionada`, `amplificadora`, `contenedora`, `contextual` o `coincidente`;
- `direccion`: `origen_destino` o `bidireccional`;
- `reciprocidad`: confirma interacción causal recíproca; no equivale a navegación desde ambos extremos;
- `mecanismo`: vínculo causal o funcional que se afirma;
- `evidencia_senal_ids`: señales canónicas que sostienen el vínculo, cuando existen;
- `estado_revision`: `pendiente`, `revisada` o `verificada`;
- `justificacion`: criterio editorial aplicado;
- `condicion_refutacion`: evidencia que obligaría a revisar o retirar la relación.

Las relaciones revisadas deben explicar mecanismo, justificación y condición de refutación. Una relación sin evidencia suficiente debe mantenerse pendiente; la migración no puede inventar causalidad.

## Semántica

- **Subordinada:** el destino forma parte directa del mecanismo rector del origen.
- **Relacionada:** interacción material con causalidad principal propia.
- **Amplificadora:** aumenta alcance, intensidad, persistencia o propagación.
- **Contenedora:** reduce escalada, facilita mediación o desacopla procesos.
- **Contextual:** ayuda a interpretar sin modificar directamente la evaluación.
- **Coincidente:** proximidad temática o temporal sin causalidad suficiente.

## Propiedad de señales

- Cada señal declara exactamente un `propietario_macroevento_id`.
- El propietario debe coincidir con el macroevento que contiene la señal.
- Una señal no puede repetirse en otro proceso.
- Otro macroevento puede usarla mediante `referencias_senal`, indicando `tipo_uso` y `efecto_segundo_orden`.
- Compartir una fuente no convierte dos señales en una sola señal.

## Proyección pública

La proyección expone tipo, dirección, mecanismo, evidencia y referencias transversales. Excluye justificaciones internas, condiciones de refutación y estados editoriales. Los borradores siguen fuera del build público y solo aparecen en la vista editorial local.

## Migración

La migración revisa los vínculos rector–rector heredados, asigna propiedad a todas las señales y genera referencias de segundo orden. Los vínculos entre rectores que no puedan clasificarse con evidencia deben quedar pendientes. El proceso es idempotente sobre el corpus migrado y se valida antes de escribir.

## Validaciones

- IDs únicos y extremos existentes.
- Sin autorrelaciones.
- Tipos, direcciones y estados controlados.
- Reciprocidad coherente con dirección bidireccional.
- Mecanismo, justificación y refutación obligatorios.
- Evidencia referida existente.
- Propietario único y coherente para cada señal.
- Referencias transversales existentes, no propias y justificadas.
- Proyección sin campos editoriales internos.

## Compatibilidad y retiro

`macroevento_relacionado_ids` puede retirarse cuando la interfaz local, importadores, exportadores y consumidores históricos lean exclusivamente `relaciones_macroeventos`. Hasta entonces se considera una vista de compatibilidad no causal y cualquier divergencia debe tratarse como advertencia de migración.

## Criterios de aceptación

- El corpus canónico valida sin errores.
- Los 30 vínculos rector–rector heredados quedan revisados y trazables.
- Todas las señales tienen propietario único.
- La interfaz pública distingue mecanismo y dirección.
- Pruebas, validación de datos, tipos y builds finalizan correctamente.
- La sincronización se integra únicamente en `beta`.
