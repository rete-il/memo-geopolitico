# Generador del prompt de búsqueda

## Fuentes maestras

El generador utiliza tres catálogos normalizados:

| Origen editorial | Uso local |
|---|---|
| XLSX de medios | `data/catalogo-medios.json`: 93 fuentes |
| `Temas.pdf` | `data/taxonomia-temas.json`: 17 grupos y 314 entradas |
| `temas adecuados.pdf` | `data/configuracion-busqueda.json`: 19 ejes seleccionables y un criterio transversal |

Los archivos originales no se releen en cada consulta.

## Configuración

El usuario puede revisar:

- eje editorial;
- región;
- período de publicaciones;
- horizonte de impacto;
- idiomas;
- máximo de macroeventos;
- subtemas;
- actores;
- señales tempranas;
- cantidad y composición de fuentes.

El eje inicial es **Corredores logísticos e infraestructura estratégica**, porque continúa la búsqueda piloto.

## Recomendación de fuentes

La propuesta usa entre 15 y 25 fuentes; el valor inicial es 20. Considera:

- prioridad editorial;
- afinidad temática;
- región;
- idiomas;
- función epistemológica;
- diversidad del conjunto.

Geopolitical Futures, Chatham House, Le Grand Continent y The Guardian se conservan como prioritarias. No son exclusivas.

Las fuentes añadidas manualmente se etiquetan como externas. La recomendación es una ayuda heurística y puede modificarse antes de generar.

## Tipos de salida

### Investigación analítica

Produce el encargo con matriz y secciones A–E. Es útil para leer y discutir los resultados antes de importarlos.

### JSON para importar

Añade:

- contrato de candidatos v2;
- reglas de fuentes y señales;
- índice compacto de macroeventos existentes;
- solicitud de clasificación como nuevo, actualización, sin novedad, relacionado o compuesto.

El índice orienta a ChatGPT, pero el importador vuelve a comprobar todas las coincidencias.

## Criterio transversal

**Diferencia entre relevancia geopolítica y atención mediática** se aplica a todas las búsquedas. No se ofrece como eje independiente.

## Uso

1. Elegir el eje.
2. Revisar la propuesta temática.
3. Ajustar actores y señales.
4. Revisar las fuentes.
5. Elegir el tipo de salida.
6. Pulsar **Generar prompt**.
7. Copiar o descargar el archivo Markdown.
