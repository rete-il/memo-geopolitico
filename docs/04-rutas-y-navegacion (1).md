# 04. Rutas y navegación

## 4.1 Rutas verificadas por el build

El build informado generó 9 páginas:

| Ruta | Fuente | Estado |
|---|---|---|
| `/` | `src/pages/index.astro` | Implementada. |
| `/directorio/` | `src/pages/directorio.astro` | Implementada. |
| `/ensayos/` | `src/pages/ensayos/[...page].astro` | Generada, pero sin contenido visible. |
| `/ensayos/africa_primera_nota/` | colección `ensayos` | Implementada. |
| `/ensayos/la_ilustracion_oscura/` | colección `ensayos` | Implementada. |
| `/ensayos/turquia/` | colección `ensayos` | Implementada. |
| `/profundidad/india-nzelandia/` | colección `profundidad` | Implementada. |
| `/profundidad/nato-ankara2026/` | colección `profundidad` | Implementada. |
| `/profundidad/indo-pacifico/` | `src/pages/profundidad/indo-pacifico.md` | Placeholder fuera del layout común. |

## 4.2 Rutas anunciadas pero inexistentes

`Header.astro` enlaza a:

- `/profundizar`
- `/analisis`

No existen archivos ni rutas generadas para esas direcciones. Son enlaces pendientes, no los vínculos de las tarjetas. Los enlaces “Para profundizar” de cada alerta sí apuntan a `/profundidad/<vinculo>` y se comprobaron para las dos alertas actuales.

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

La convención no es uniforme: algunos nombres usan guion y otros guion bajo. Antes de publicar conviene definir una política única, preferentemente slugs con guiones:

```text
africa-no-es-un-pais
la-ilustracion-oscura
nato-ankara-2026
```

Cambiar slugs después de publicar requiere redirecciones permanentes.

## 4.5 Estado activo del header

- Inicio: activo solamente cuando `pathname === '/'`.
- Directorio: activo si la ruta contiene `/directorio`.
- Las dos opciones pendientes buscan `/profundizar` y `/analisis`; por tanto, ninguna página de `/profundidad/` ni `/ensayos/` marca esos elementos como activos.

## 4.6 Recomendación de arquitectura de información

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

## 4.7 Reglas para futuras rutas

- Una etiqueta de navegación debe apuntar a una ruta real antes de llegar a producción.
- Toda colección debe tener página índice.
- No crear páginas Markdown directas dentro de `src/pages` cuando exista una colección equivalente.
- Los slugs públicos deben ser estables y legibles.
- Agregar página 404 y redirecciones para cambios de URL.
