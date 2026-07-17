# 06. Contenido Markdown

## 6.1 Configuración de colecciones

Las colecciones se definen en `src/content.config.ts` mediante `glob` y Zod.

### Colección `ensayos`

| Campo | Tipo | Obligatorio | Observación |
|---|---|---:|---|
| `title` | string | Sí | Título principal. |
| `description` | string | Sí | Bajada y meta description. |
| `date` | fecha coercionada | Sí | Se usa para orden y visualización. |
| `author` | string | No | Default: `Equipo Editorial`. |
| `tags` | string[] | No | Texto libre. |
| `coverImage` | string | No | Se usa como imagen social; no se valida existencia. |

Ejemplo:

```yaml
---
title: 'África no es un país'
description: 'Regiones, recursos y poder en el continente decisivo del siglo XXI'
date: 2026-07-11
author: 'Equipo Editorial'
tags: ['Africa']
---
```

### Colección `alertas`

| Campo | Tipo | Obligatorio | Observación |
|---|---|---:|---|
| `title` | string | Sí | Titular de la tarjeta. |
| `region` | string | Sí | Texto visible; sin taxonomía cerrada. |
| `date` | fecha | Sí | Alimenta fecha relativa y filtro de mapa. |
| `coordenadas` | par o array de pares | Sí | Formato `[lat, lng]`. |
| `severity` | enum | Sí | `critical`, `high`, `medium`, `low`. |
| `en_mapa` | boolean | No | Si es `false`, no se crea marcador. Default funcional: visible. |
| `vinculo` | string | Sí | ID de página en `profundidad`. |

Ejemplo:

```yaml
---
title: 'Alianza Estratégica India-Nueva Zelanda 2030'
region: 'ASIA-PACÍFICO'
date: 2026-07-15
coordenadas:
  - [-36.85, 174.76]
  - [28.6139, 77.209]
severity: 'medium'
en_mapa: true
vinculo: 'india-nzelandia'
---
```

### Colección `profundidad`

| Campo | Tipo | Obligatorio | Observación |
|---|---|---:|---|
| `title` | string | Sí | Título principal. |
| `date` | fecha | Sí | Fecha absoluta. |
| `severity` | enum | Sí | Mismo vocabulario que alertas. |
| `sources` | array | No | Cada fuente contiene `title`, URL válida y `summary`. |

El template dinámico permite una sección de “Fuentes de Inteligencia”, pero los dos artículos de la colección no incluyen `sources`. La única pieza con ese campo es `src/pages/profundidad/indo-pacifico.md`, que no utiliza el template de la colección; por tanto, esa sección no se aprovecha actualmente.

## 6.2 Cómo publicar un ensayo con el sistema actual

1. Crear `src/content/ensayos/<id>.md`.
2. Completar todos los campos obligatorios.
3. Escribir el cuerpo en Markdown.
4. Ejecutar `npm run dev` y abrir `/ensayos/<id>/`.
5. Ejecutar `npm run build`.
6. Verificar que aparece entre los cinco recientes de la portada si corresponde por fecha.

El `<id>` se conserva en la URL, incluidos guiones bajos.

## 6.3 Cómo publicar una alerta y su profundización

1. Crear primero `src/content/profundidad/<slug>.md`.
2. Crear `src/content/alertas/<id>.md`.
3. Asignar `vinculo: '<slug>'` con coincidencia exacta.
4. Comprobar coordenadas como latitud y longitud.
5. Definir `en_mapa: true` si debe mostrarse.
6. Usar una fecha dentro de los últimos 14 días respecto del build para que aparezca en el mapa.
7. Abrir la portada, pasar el cursor por tarjeta y marcador, y comprobar la sincronización.
8. Abrir el enlace “Para profundizar”.
9. Ejecutar el build.

## 6.4 Comportamientos temporales importantes

- `AlertCard.astro` calcula “Hoy”, “Ayer” o fecha absoluta durante el build.
- `index.astro` filtra alertas del mapa con una ventana de 14 días durante el build.
- En un sitio estático, ambas salidas quedan congeladas hasta el próximo despliegue.
- Las alertas antiguas continúan en la columna lateral; solamente dejan de aparecer en el mapa.

## 6.5 Reglas de calidad recomendadas

- Usar slugs con guiones, sin tildes ni guiones bajos.
- No publicar una alerta si `vinculo` no resuelve.
- Añadir descripción y fuentes estructuradas a profundidad.
- Validar coordenadas: latitud `-90…90`, longitud `-180…180`.
- Añadir un estado `draft` para que un archivo incompleto no se publique automáticamente.
- No usar enlaces Markdown sin URL válida. Se detectó al menos una referencia con destino textual no URL en `nato-ankara2026.md`.
- Sustituir de inmediato las URLs de ejemplo que ya hayan llegado a producción.

## 6.6 Inventario editorial actual

| Colección | Cantidad | Piezas |
|---|---:|---|
| Alertas | 2 | India–Nueva Zelanda; Cumbre OTAN Ankara. |
| Ensayos | 3 | África; Ilustración oscura; Turquía. |
| Profundidad en colección | 2 | India–Nueva Zelanda; OTAN Ankara. |
| Profundidad directa/placeholder | 1 | Indo-Pacífico. |
