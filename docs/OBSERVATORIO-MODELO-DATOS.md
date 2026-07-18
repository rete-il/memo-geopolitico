# Modelo de datos — Observatorio

## Arquitectura transitoria

Durante la migración coexistirán dos fuentes:

```text
src/data/monitores.json
```

Continúa alimentando la portada y el dashboard actual.

```text
src/data/observatorio/*.json
```

Contiene los nuevos casos geopolíticos en estado de borrador.

La coexistencia evita interrumpir el sitio y permite completar los datos antes de cambiar la interfaz pública.

## Archivo por caso

```text
src/data/observatorio/
├── israel-libano.json
├── mar-china-meridional.json
└── ucrania-frente-oriental.json
```

El nombre del archivo debe coincidir con el campo `id`.

## Campos base

| Campo | Función |
|---|---|
| `schema_version` | Versión del formato |
| `id` | Identificador estable y futuro slug |
| `titulo` | Nombre público |
| `categoria` | Taxonomía cerrada |
| `region` | Región principal |
| `estado_publicacion` | Borrador, publicado, destacado o archivado |
| `estado_datos` | Incompleto o completo |
| `orden_portada` | Orden de los casos destacados |
| `resumen` | Explicación breve |
| `fecha_inicio` | Inicio del proceso, cuando se conoce |
| `corte_editorial` | Fecha del último corte |
| `insight` | Interpretación editorial |
| `fuentes` | Fuentes estructuradas |
| `historial` | Cortes anteriores |
| `migracion` | Trazabilidad desde el sistema anterior |

## Borradores incompletos

Los borradores migrados pueden omitir temporalmente:

- `periodo_cobertura`;
- `dimensiones_relevancia`;
- `indices`;
- `atencion_mediatica`;
- `metricas_especificas`.

No se deben completar esos campos con cifras inventadas.

## Casos publicables

Un caso `publicado`, `destacado` o `archivado` necesita:

- `estado_datos: completo`;
- período de cobertura;
- dimensiones de relevancia;
- índices coherentes;
- métricas específicas;
- al menos una fuente;
- al menos un corte histórico.

## Reglas derivadas

1. `brecha = atencion − relevancia`.
2. `subcubierto` cuando la brecha es menor o igual a −20.
3. `cobertura_proporcional` entre −19 y +19.
4. `sobrecubierto` cuando la brecha es mayor o igual a +20.
5. Los índices derivados no deberían editarse manualmente en la versión definitiva.
6. Cada actualización completa debe agregar una entrada en `historial`.
