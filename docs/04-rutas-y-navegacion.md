# 04. Rutas y navegación

## 4.1 Rutas generadas por el build

El build local y el deploy de Netlify informan 9 páginas generadas:

| Ruta                              | Fuente                              | Estado funcional en la instantánea    |
| --------------------------------- | ----------------------------------- | ------------------------------------- |
| `/`                               | `src/pages/index.astro`             | Implementada.                         |
| `/directorio/`                    | `src/pages/directorio.astro`        | Implementada.                         |
| `/ensayos/`                       | `src/pages/ensayos/[...page].astro` | Generada, pero sin contenido visible. |
| `/ensayos/africa_primera_nota/`   | colección `ensayos`                 | Implementada.                         |
| `/ensayos/la_ilustracion_oscura/` | colección `ensayos`                 | Implementada.                         |
| `/ensayos/turquia/`               | colección `ensayos`                 | Implementada.                         |
| `/profundidad/india-nzelandia/`   | colección `profundidad`             | Implementada.                         |
| `/profundidad/nato-ankara2026/`   | colección `profundidad`             | Implementada.                         |

> **Alcance de la verificación:** la generación se comprobó en local y en el resumen de Netlify. Esta versión documental no incluye todavía un crawler HTTP automatizado que confirme el código de respuesta de cada URL pública.

## 4.2 Rutas anunciadas pero inexistentes

`Header.astro` enlaza a:

- `/profundizar`
- `/analisis`

No existen archivos ni rutas generadas para esas direcciones. Son enlaces pendientes, no los vínculos de las tarjetas. Los enlaces “Para profundizar” de cada alerta sí se construyen como `/profundidad/<vinculo>`.

Como el sitio ya está en producción, estos enlaces deben considerarse una **incidencia visible P0**, no una tarea previa al lanzamiento.

## 4.3 Mapa de navegación actual

```mermaid
flowchart LR
  H[Inicio /] --> D[Directorio /directorio/]
  H --> A1[Profundidad India–Nueva Zelandia]
  H --> A2[Profundidad OTAN Ankara]
  H --> E1[Ensayo África]
  H --> E2[Ensayo Ilustración oscura]
  H --> E3[Ensayo Turquía]
  H -. enlace pendiente .-> P[/profundizar]
  H -. enlace pendiente .-> AN[/analisis]
  EARCH[Archivo /ensayos/] -. no visible desde el header .-> E1
```

## 4.4 Generación de slugs

Los IDs provienen del nombre de archivo:

- `africa_primera_nota.md` → `africa_primera_nota`
- `nato-ankara2026.md` → `nato-ankara2026`

La convención no es uniforme: algunos nombres usan guion y otros guion bajo. Como estas URLs ya fueron publicadas, cualquier cambio exige redirecciones `301` antes de renombrar archivos.

Convención futura recomendada:

```text
africa-no-es-un-pais
la-ilustracion-oscura
nato-ankara-2026
```

## 4.5 Estado activo del header

- Inicio: activo solamente cuando `pathname === '/'`.
- Directorio: activo si la ruta contiene `/directorio`.
- Las dos opciones pendientes buscan `/profundizar` y `/analisis`; ninguna página de `/profundidad/` ni `/ensayos/` marca esos elementos como activos.

## 4.6 Dominio y normalización

- Dominio canónico operativo: `https://memogeopolitico.com`.
- `www.memogeopolitico.com` redirige automáticamente al dominio principal.
- Netlify Pretty URLs suele normalizar páginas estáticas hacia rutas con slash final; debe verificarse con una prueba HTTP y registrar el resultado.
- El dominio técnico `memo-geopolitico.netlify.app` debe evitarse en enlaces públicos y canonical.

## 4.7 Recomendación de arquitectura de información

Una estructura coherente podría ser:

```text
/
/directorio/
/alertas/                 opcional, archivo de alertas
/profundidad/             índice de artículos vinculados a alertas
/profundidad/<slug>/
/ensayos/                 archivo paginado
/ensayos/<slug>/
/metodologia/             explicación del modelo de fuentes y severidad
/acerca-de/
```

El nombre visible “Análisis a fondo” debería corresponder a una única ruta y un único tipo editorial. Actualmente el mismo concepto se usa para la lista de ensayos en portada, mientras los artículos vinculados a alertas se llaman “Alerta en profundidad”.

## 4.8 Reglas para futuras rutas

- Una etiqueta de navegación debe apuntar a una ruta real antes de publicarse.
- Toda colección debe tener página índice.
- No crear páginas Markdown directas dentro de `src/pages` cuando exista una colección equivalente.
- Los slugs públicos deben ser estables y legibles.
- Agregar página 404.
- Crear redirecciones antes de cambiar cualquier URL ya publicada.
- Ejecutar un smoke test del published deploy tras cada cambio de rutas.
