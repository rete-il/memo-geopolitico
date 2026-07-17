# 07. Datos JSON y Excel

## 7.1 Inventario

| Archivo | Uso actual | Estado |
|---|---|---|
| `src/data/medios.json` | Dataset operativo del directorio | Implementado. |
| `public/data/Medios_Geopolitica.xlsx` | Descarga completa desde el directorio | Implementado. |
| `src/data/monitores.json` | Panel “Fricción vs. narrativa” | Prototipo. |
| `src/data/friccion.json` | Sin importaciones activas | Pendiente. |
| `src/data/catalizadores.json` | Sin importaciones activas | Pendiente. |
| `src/data/escenarios.json` | Sin importaciones activas | Pendiente. |

## 7.2 Contrato de `medios.json`

Estructura raíz:

```json
{
  "metadata": {},
  "columns": [],
  "records": []
}
```

La instantánea contiene **92 registros** y **27 columnas**.

### Metadata

| Campo | Ejemplo | Uso |
|---|---|---|
| `titulo` | Directorio profesional… | Descriptivo. |
| `archivo_fuente` | `Medios_Geopolitica.xlsx` | Trazabilidad. |
| `hoja_fuente` | `Matriz profesional` | Trazabilidad. |
| `total_fuentes` | 92 | Pie del directorio. |
| `generado` | timestamp ISO | No se muestra actualmente. |
| `ultima_revision` | `2026-07-16` | Pie del directorio. |
| `descripcion` | texto | No se muestra actualmente. |

### Campos de cada registro

| Clave | Tipo esperado | Función |
|---|---|---|
| `id` | número/string único | Búsqueda de ficha y atributo `data-id`. |
| `nombre` | string | Nombre de la fuente. |
| `url` | URL | Enlace al sitio. |
| `sede` | string | Alcance institucional. |
| `region` | string | Filtro y gráfico. |
| `idioma` | string | Ficha. |
| `familia` | string | Filtro y gráfico. |
| `funcion` | string | Filtro. |
| `propiedad` | string | Ficha. |
| `control` | string | Ficha. |
| `orientacion` | string | Búsqueda y ficha. |
| `perspectiva` | string | Filtro. |
| `fiabilidad` | número 1–5 | Métrica. |
| `independencia` | número 1–5 | Métrica. |
| `transparencia` | número 1–5 | Métrica. |
| `rigor` | número 1–5 | Métrica. |
| `correcciones` | número 1–5 | Métrica. |
| `separacion` | número 1–5 | Métrica. |
| `puntuacion` | número 1–5 | Filtro, orden, KPI. |
| `confianza` | string categórico | Filtro, donut y badge. |
| `uso` | string | Búsqueda y ficha. |
| `corroboracion` | string | Búsqueda y ficha. |
| `corroborar_con` | string | Ficha. |
| `estado` | string categórico | Filtro, donut y badge. |
| `observaciones` | string/null | Ficha. |
| `referencia` | URL/string | Ficha. |
| `fecha_revision` | fecha ISO/string | Ficha. |

## 7.3 Libro Excel descargable

El libro contiene nueve hojas:

| Hoja | Rango usado | Finalidad inferida |
|---|---|---|
| Dashboard | `A1:H34` | KPIs y reglas de uso. |
| Matriz profesional | `A1:AA96` | Fuente principal de 92 registros y 27 columnas. |
| Metodología | `A1:H29` | Criterios y corroboración. |
| Original | `A1:R67` | Base anterior/original. |
| Cobertura África | `A1:F38` | Vista especializada. |
| Por Región | `A1:AA96` | Vista ordenada/filtrable. |
| Por Función | `A1:AA96` | Vista por función epistemológica. |
| Por Perspectiva | `A1:AA96` | Vista por perspectiva. |
| Consulta rápida | `A1:L96` | Vista compacta de consulta. |

## 7.4 Fuente de verdad y riesgo de divergencia

El sitio **lee el JSON**, mientras el usuario **descarga el Excel**. El repositorio no incluye un script que genere uno a partir del otro. Por tanto:

- cambiar solamente Excel no actualiza la web;
- cambiar solamente JSON no actualiza el archivo descargable;
- la metadata puede afirmar que ambos coinciden aunque se hayan separado.

Debe establecerse una única fuente canónica.

### Alternativa recomendada

1. Mantener Excel como fuente editorial canónica.
2. Crear `scripts/generate-medios.ts`.
3. Leer la hoja `Matriz profesional`.
4. validar IDs, URLs, puntuaciones y categorías;
5. generar `src/data/medios.json`;
6. ejecutar el generador antes de `astro build`;
7. fallar el build si hay discrepancias.

Otra alternativa es mantener CSV/JSON tipado como fuente canónica y generar el Excel de distribución.

## 7.5 Datos prototipo

`monitores.json` contiene tres teatros con:

- `escalada_nivel` de 1 a 5;
- `cobertura_pct` de 0 a 100;
- `alerta_asimetria`;
- `insight`.

Antes de convertirlo en función editorial necesita:

- fecha de corte;
- metodología de cálculo;
- fuentes;
- responsable;
- confianza;
- validación de rangos;
- historial o versión.

## 7.6 Datos no conectados

`friccion.json`, `catalizadores.json` y `escenarios.json` parecen bocetos de módulos futuros. Sus vínculos incluyen rutas que no existen, como `/profundidad/europa-del-este`, `/profundidad/medio-oriente` y `/profundidad/africa`. No deben considerarse API estable.
