# 18. Anexo — Inventario de archivos

## 18.1 Alcance

Este inventario describe la instantánea enviada antes del deploy de producción documentado. El commit publicado `9b2b70d` puede contener cambios posteriores —especialmente configuración de Node 24— que deben reconciliarse cuando se entregue una copia más reciente del repositorio.

## Raíz

| Archivo | Tamaño/líneas aproximadas | Responsabilidad | Estado |
|---|---:|---|---|
| `package.json` | 448 B | dependencias, engines y scripts | Activo |
| `package-lock.json` | 149 KB / 4206 líneas | resolución reproducible de npm | Activo |
| `astro.config.mjs` | 252 B | site URL y plugin Tailwind/Vite | Activo |
| `tailwind.config.mjs` | 573 B | config Tailwind paralela/legacy | Revisar |
| `tsconfig.json` | 109 B | strict config de Astro | Activo |
| `README.md` | 44 líneas | README del starter | Obsoleto |
| `robots.txt` | 2 líneas | contiene `Disallow: /`, pero está fuera de `public/` | No asumir publicado |
| `index.html` | 537 líneas | prototipo previo estático | Huérfano/archivo histórico |
| `.nvmrc` o equivalente | no presente en la instantánea | versión de Node | Confirmar en repositorio actual |
| `netlify.toml` | ausente | configuración reproducible Netlify | Recomendado |

## Layout y estilos

| Archivo | Líneas | Responsabilidad |
|---|---:|---|
| `src/layouts/Layout.astro` | 65 | HTML base y metadata |
| `src/styles/global.css` | 30 | Tailwind, Typography, severidad y links prose |

## Componentes

| Archivo | Líneas | Responsabilidad |
|---|---:|---|
| `Header.astro` | 49 | marca y navegación |
| `SidebarAlertas.astro` | 27 | contenedor de alertas |
| `AlertCard.astro` | 117 | tarjeta, fecha y sincronización |
| `MapaGlobal.astro` | 166 | mapa, clusters y marcadores |
| `ListaEnsayos.astro` | 29 | ensayos recientes |
| `PanelDerecho.astro` | 75 | monitor prototipo |

## Páginas

| Archivo | Líneas | Responsabilidad |
|---|---:|---|
| `src/pages/index.astro` | 147 | portada y preparación de datos |
| `src/pages/directorio.astro` | 985 | dashboard del directorio |
| `src/pages/ensayos/[id].astro` | 99 | ensayo individual |
| `src/pages/ensayos/[...page].astro` | 23 | paginación sin UI |
| `src/pages/profundidad/[slug].astro` | 143 | profundidad individual |
| `src/pages/profundidad/indo-pacifico.md` | 11 | placeholder directo |

## Estado y utilidades

| Archivo | Líneas | Uso |
|---|---:|---|
| `src/store/mapStore.ts` | 5 | usado por mapa y tarjetas |
| `src/utils/time.ts` | 22 | sin referencias actuales |

## Datos

| Archivo | Tamaño/líneas | Uso |
|---|---:|---|
| `src/data/medios.json` | 99 KB / 2791 | directorio |
| `src/data/monitores.json` | 793 B | panel prototipo |
| `src/data/friccion.json` | 757 B | no conectado |
| `src/data/catalizadores.json` | 450 B | no conectado |
| `src/data/escenarios.json` | 646 B | no conectado |
| `public/data/Medios_Geopolitica.xlsx` | 139 KB | descarga y posible fuente editorial |

## Cliente

| Archivo | Líneas | Responsabilidad |
|---|---:|---|
| `public/js/directorio.js` | 602 | filtros, KPIs, charts, tabla, modal, CSV, tema |

## Contenido

| Archivo | Líneas aprox. | Tipo |
|---|---:|---|
| `alertas/india_new_zealand.md` | breve | alerta |
| `alertas/resumen-cumbre-nato-2026.md` | breve | alerta |
| `ensayos/africa_primera_nota.md` | 317 | ensayo |
| `ensayos/la_ilustracion_oscura.md` | 46 | ensayo |
| `ensayos/turquia.md` | 39 | ensayo |
| `profundidad/india-nzelandia.md` | 29 | profundidad |
| `profundidad/nato-ankara2026.md` | 54 | profundidad |

## Assets públicos

- `favicon.ico` y `favicon.svg`: existen, pero no están declarados explícitamente en Layout.
- `default-og.png`: referenciado, pero ausente.
- `/js/directorio.js`: se sirve sin procesamiento de TypeScript.
- `/data/Medios_Geopolitica.xlsx`: descarga directa.
- `robots.txt`: no está en `public/`; debe corregirse y trasladarse intencionalmente.

## Evidencia documental añadida

```text
docs/assets/netlify-build-settings.png
docs/assets/netlify-published-deploy.png
docs/assets/netlify-production-domains.png
docs/assets/netlify-https-certificate.png
```

Estas imágenes son evidencia operativa, no recursos del sitio público.
