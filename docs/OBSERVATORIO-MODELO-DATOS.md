# Modelo de datos — Observatorio

## Entidad principal

Cada archivo representa un caso geopolítico y se valida con `src/schemas/observatorio.schema.json`.

Ruta futura recomendada:

```text
src/content/observatorio/
├── sudan.json
├── puerto-chancay.json
└── corredor-lobito.json
```

## Campos esenciales

| Campo | Función |
|---|---|
| `id` | Identificador estable y slug |
| `titulo` | Nombre público |
| `categoria` | Taxonomía cerrada |
| `region` | Región principal |
| `estado_publicacion` | Borrador, publicado, destacado o archivado |
| `orden_portada` | Orden de los casos destacados |
| `resumen` | Explicación breve |
| `fecha_inicio` | Inicio del proceso o acontecimiento |
| `corte_editorial` | Fecha del último corte |
| `periodo_cobertura` | Ventana usada para medir atención |
| `dimensiones_relevancia` | Puntuaciones comunes de 0 a 5 |
| `indices` | Relevancia, atención y brecha |
| `metricas_especificas` | Datos propios de la categoría |
| `fuentes` | Fuentes estructuradas |
| `historial` | Cortes anteriores |

## Reglas

1. Los índices derivados no se editan manualmente en la versión definitiva.
2. La clasificación se calcula a partir de la brecha.
3. Cada corte debe conservarse en `historial`.
4. Las fuentes deben indicar qué datos respaldan.
5. `metricas_especificas` admite campos diferentes según la categoría.
6. Los casos publicados necesitan al menos una fuente.
7. Los casos destacados necesitan `orden_portada`.
